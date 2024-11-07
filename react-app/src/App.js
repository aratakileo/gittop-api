import './App.scss';
import { getApiUrlTo } from './utils/constants';
import { RepoCard } from './components/repo-card';
import React, { useState, useEffect } from 'react';
import { applyVisibility } from './utils/utils';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SelectableButton } from './components/selectable-btn';

const getDefaultApiRequestParams = (method = 'GET') => ({
  method,
  headers: {
    'Accept': 'aplication/json'
  }
});

const filteredLanguages = [];

var bufferedPages = {};
var syncnowCooldown = false;

function App() {
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [languageOptions, setLanguageOptions] = useState({});
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [order, setOrder] = useState('desc');

  const goNextPage = () => {
    if (hasNextPage)
      setPage(page + 1);
  };

  const goPrevPage = () => {
    if (hasPrevPage)
      setPage(page - 1);
  };

  const updatePaginationControls = () => {
    setHasPrevPage(page > 0);
    setHasNextPage(page < totalPages - 1);
  };

  const clearLangFilters = () => {
    filteredLanguages.splice(0, filteredLanguages.length);
    processLoading(true);
  }

  const processLoading = async (override=false) => {
    if (override) {
      setPage(0);
      bufferedPages = {};
    }

    if (page in bufferedPages) {
      setRepos(bufferedPages[page]);
      updatePaginationControls();
      return;
    }

    setIsLoading(true);

    await fetch(getApiUrlTo('/v2/repos/pages', getDefaultApiRequestParams()))
    .then(res => res.json())
    .then(body => setLanguageOptions(body.langs))
    .catch(setError);
  
    await fetch(getApiUrlTo(`/v2/repos/page/${page}?langs=${encodeURIComponent(JSON.stringify(filteredLanguages))}&order=${order}`), getDefaultApiRequestParams())
    .then(res => res.json())
    .then(body => {
      bufferedPages[page] = body.repos;
      setRepos(body.repos);

      setTotalPages(body.pages);
    })
    .catch(setError);

    updatePaginationControls();
  
    setIsLoading(false);
  };

  const syncnowServerDatabase = async () => {
    if (syncnowCooldown) {
      toast.error('Wait for the cooldown to end');
      return;
    }

    setIsLoading(true);

    syncnowCooldown = true;

    setTimeout(() => syncnowCooldown = false, 10000);

    await fetch(getApiUrlTo('/v1/syncnow'), getDefaultApiRequestParams('POST')).then(async res => {
      const body = await res.json();

      if (res.ok) {
        toast.success(body.message);
        console.info(body.message);
        return;
      }

      setError(body);
    }).catch(setError);

    if (!error)
      await processLoading(true);
  };

  const switchLanguageFilter = (lang) => {
    if (filteredLanguages.includes(lang)) {
      const index = filteredLanguages.indexOf(lang);
      filteredLanguages.splice(index, 1);
    } else filteredLanguages.push(lang);

    processLoading(true);
  };

  const switchOrder = () => {
    setOrder(order === 'asc' ? 'desc' : 'asc');

    processLoading(true);
  };

  const showButtons = () => !error && !isLoading;

  useEffect(() => {
    processLoading();
  }, [page, totalPages, hasNextPage, hasPrevPage, order]);

  let body = (<div>Loading...</div>);

  if (error) {
    // WARNING: never display error details at page body
    body = (<div>Oops, something went wrong... Try to reload page</div>);
    console.error(error);
  } else if (!isLoading && repos)
    body = repos.map(repo => <ul key={repo.owner.username + repo.name}>{RepoCard({repo})}</ul>);

  return (
    <>
      <ToastContainer/>
      <div className='page-container'>
      <h1>The most popular GitHub repositories</h1>
      <div className='filter-options center vertical'>
        <p>Languages: </p>
        {Object.keys(languageOptions).map(lang => <SelectableButton text={`${lang}: ${languageOptions[lang]}`} onClick={() => switchLanguageFilter(lang)} selected={filteredLanguages.includes(lang)} key={`lang-option-${lang}`}/>)}
        <button className={applyVisibility('borderless-btn margin-left', filteredLanguages.length !== 0)} onClick={clearLangFilters}>Clear selection</button>
      </div>
      <div className='filter-options'>
        <p>Order: </p>
        <SelectableButton text='DESC' selected={order === 'desc'} onClick={switchOrder}/> 
        <SelectableButton text='ASC' selected={order === 'asc'} onClick={switchOrder}/>
      </div>
      <div className='repos-container'>
          {body}
      </div>
      <div className='center horizontal'>
        <button onClick={goPrevPage} className={applyVisibility('prev-btn', hasPrevPage && showButtons())}>Prev</button>
        <button onClick={syncnowServerDatabase} className={applyVisibility('borderless-btn', showButtons())}>sync now</button>
        <button onClick={goNextPage} className={applyVisibility('next-btn', hasNextPage && showButtons())}>Next</button>
      </div>
    </div>
    </>
  );
}

export default App;

import './App.scss';
import { getApiUrlTo } from './utils/constants';
import { RepoCard } from './components/repo-card';
import React, { useState, useEffect } from 'react';
import { applyVisibility } from './utils/utils';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getDefaultApiRequestParams = (method = 'GET') => ({
  method,
  headers: {
    'Accept': 'aplication/json'
  }
});

var bufferedPages = {};
var syncnowCooldown = false;

function App() {
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const goNextPage = () => {
    if (hasNextPage)
      setPage(page + 1);
  };

  const goPrevPage = () => {
    if (hasPrevPage)
      setPage(page - 1);
  };

  const updateState = () => {
    setHasPrevPage(page > 0);
    setHasNextPage(page < totalPages - 1);
  };

  const processLoading = async (override=false) => {
    if (override) {
      setPage(0);
      bufferedPages = {};
    }

    if (page in bufferedPages) {
      setRepos(bufferedPages[page]);
      updateState();
      return;
    }

    setIsLoading(true);
  
    await fetch(getApiUrlTo('/v2/repos/page/' + page), getDefaultApiRequestParams())
    .then(res => res.json())
    .then(body => {
      bufferedPages[page] = body.repos;
      setRepos(body.repos);
    })
    .catch(setError);

    await fetch(getApiUrlTo('/v2/repos/pages'), getDefaultApiRequestParams())
    .then(res => res.json())
    .then(body => {
      setTotalPages(body.pages);
    })
    .catch(setError);

    updateState();
  
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

  const showButtons = () => !error && !isLoading;

  useEffect(() => {
    processLoading();
  }, [page, totalPages, hasNextPage, hasPrevPage]);

  let body = (<div>Loading...</div>);

  if (error) {
    // WARNING: never display error details at page body
    body = (<div>Oops, something went wrong... Try to reload page</div>);
    console.error(error);
  } else if (!isLoading)
    body = repos.map(repo => <ul key={repo.owner.username + repo.name}>{RepoCard({repo})}</ul>);

  return (
    <>
      <ToastContainer/>
      <div className='page-container'>
      <h1>The most popular GitHub repositories</h1>
      <div className='repos-container'>
          {body}
      </div>
      <div className='center horizontal'>
        <button onClick={goPrevPage} className={applyVisibility('prev-btn', hasPrevPage && showButtons())}>Prev</button>
        <button onClick={syncnowServerDatabase} className={applyVisibility('syncnow-btn', showButtons())}>sync now</button>
        <button onClick={goNextPage} className={applyVisibility('next-btn', hasNextPage && showButtons())}>Next</button>
      </div>
    </div>
    </>
  );
}

export default App;

import './App.scss';
import { getApiUrlTo } from './utils/constants';
import { RepoCard } from './components/repo-card';
import React, { useState, useEffect } from 'react';
import { setVisibility } from './utils/utils';

const defaultApiRequestParams = {
  method: 'GET',
  headers: {
    'Accept': 'aplication/json'
  }
};

const bufferedPages = {};

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

  const processLoading = async () => {
    if (page in bufferedPages) {
      setRepos(bufferedPages[page]);
      updateState();
      return;
    }

    setIsLoading(true);
  
    await fetch(getApiUrlTo('/v2/repos/page/' + page), defaultApiRequestParams)
    .then(response => response.json())
    .then(async body => {
      bufferedPages[page] = body.repos;
      setRepos(body.repos);
    })
    .catch(setError);

    await fetch(getApiUrlTo('/v2/repos/pages'), defaultApiRequestParams)
    .then(response => response.json())
    .then(body => {
      setTotalPages(body.pages);
    })
    .catch(setError);

    updateState();
  
    setIsLoading(false);
  };

  useEffect(() => {
    processLoading();
  }, [page, totalPages, hasNextPage, hasPrevPage]);

  let body = (<div>Loading...</div>);

  if (error) {
    console.error(error);
  }

  if (error) {
    body = (<div>Oops, something went wrong... Try to reload page</div>);
    console.error(error);
  }
  else if (!isLoading)
    body = repos.map(repo => <ul key={repo.owner.username + repo.name}>{RepoCard({repo})}</ul>);

  return (
    <div className='page-container'>
      <h1>The most popular GitHub repositories</h1>
      <div className='repos-container'>
          {body}
      </div>
      <div className='center horizontal'>
        <button onClick={goPrevPage} className={`${setVisibility(hasPrevPage)} prev-btn`}>Prev</button>
        <button onClick={goNextPage} className={`${setVisibility(hasNextPage)} next-btn`}>Next</button>
      </div>
    </div>
  );
}

export default App;

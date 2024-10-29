import './App.css';
import { getApiUrlTo } from './utils/constants';
import { RepoCard } from './components/repo-card';
import React, { useState, useEffect } from 'react';

function App() {
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const processLoading = async () => {
    setIsLoading(true);
  
    await fetch(getApiUrlTo('/v2/repos/page/0'), {
      method: 'GET',
      headers: {
        'Accept': 'aplication/json'
      }
    }).then(response => response.json()).then(body => setRepos(body.repos)).catch(setError);
  
    setIsLoading(false);
  };

  useEffect(() => {
    processLoading();
  }, []);

  let body = (<div>Loading...</div>);

  if (error) {
    console.error(error);
  }

  if (error)
    body = (<div>Oh no, something went wrong: {error.toString()}</div>);
  else if (!isLoading)
    body = repos.map(repo => <ul key={repo.owner.username + repo.name}>{RepoCard({repo})}</ul>);

  return (
    <div className="App">
      <body className="App-header">
        {body}
      </body>
    </div>
  );
}

export default App;

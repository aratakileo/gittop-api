cd api-and-cli-client

echo "1. Syncronize now all database data with github:"
npm run start_cli_client:sync_now

echo "2. Get information about 'gitignore' repository:"
npm run start_cli_client:get_gitignore_repo

echo "3. Get information about 'linux' repository:"
npm run start_cli_client:get_linux_repo

echo "4. Get information about a non-existent 'invalid' repository:"
npm run start_cli_client:get_invalid_repo

echo "5. Get information about all repositories on the second page with default filters:"
npm run start_cli_client:get_repos_second_page

echo "6. Get information about all repositories on the first page written on JavaScript and TypeScript with default descending order:"
npm run start_cli_client:get_js_ts_repos_first_page

echo "7. Get information about all repositories on the first page written on Python with the ascending order:"
npm run start_cli_client:get_py_repos_first_page_asc

echo "8. Get information about all repositories on the out of bounds 999th page with default filters:"
npm run start_cli_client:get_repos_out_of_bounds_page

echo "8. Get repositories statistic:"
npm run start_cli_client:get_repo_stats

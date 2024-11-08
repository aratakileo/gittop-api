# GitHub top repositories API
Easy to use API and React app for getting information about the most popular repositories on GitHub
![React app preview](./react-app-preview.png)

### How to run project
> [!CAUTION]
> Docs below for UNIX systems only

> [!CAUTION]
> Make sure that you run all the commands listed below from the `gittop-api` directory

Write the following command to build a Docker container:

> [!IMPORTANT]
> Run this command only once

```sh
docker-compose -f ./mysql-db-docker-compose.yml up --build -d
```

After successfully executing this command, you need to install Node.js if you still don't have it installed. After that, you should write the following command to init default settings:
```sh
bash init-default.sh
```

> [!NOTE]
> This server will be available at the following address: `127.0.0.1:3000` (`localhost:3000`)

Now you can start the API server. To do this, write the following commands:
```sh
cd api-and-cli-client
npm run start_server
```

> [!CAUTION]
> Run the commands below only after API server is running

> [!NOTE]
> This server will be available at the following address: [`127.0.0.1:3001`](http://127.0.0.1:3001) ([`localhost:3001`](http://localhost:3001))

To start React app, write the following commands:
```sh
cd react-app
npm run start:unix
```

If you want to test CLI client interactions you can easily run them all using this command:
```sh
bash run-all-cli-interactions.sh
```

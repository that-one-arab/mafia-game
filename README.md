# Mafia

### _An online multiplayer version of the popular party game_

Mafia is an online multiplayer game that mimics the Mafia/Werewolf social games.

## Features

-   Online hosted, no account creation necessary. Create a game to get a game code, then share that game code with people you want them to join.
-   No players cap. A minimum of 4 players are required (anything below 4 players would end the game in seconds) and you can play with as many players as you want (preferably 16 but this number depends on the capacity of the server)
-   Teams and roles are distributed with a carefully written algorithm that balances teams according to players and ensures every game is unique and different.
-   Total of 11 roles were implemented with 7 belonging to Town and 4 belonging to Mafia.
-   Responsive mobile friendly design.
-   And much more!

## Dependencies

The project was built using the following stack:

-   [ReactJS](https://reactjs.org/) - A frontend library/framework for building UI
-   [NodeJS](https://nodejs.org/en/) - A javascript runtime environment
-   [ExpressJS](https://expressjs.com/) - A back end web application framework for Node.js
-   [SocketIO](https://socket.io/) - a library that enables real-time, bidirectional and event-based communication between the browser and the server
-   [MongoDB](https://www.mongodb.com/) - cross-platform document-oriented database

## Philosophy

Even though the game is playable online, the game was designed with a local setting in mind, keeping the players in close proximity to each other to replicate the original feeling of playing the game sitting in the same table with friends!
The game accomplishes that in a couple ways

-   Creating and joining an online room is very easy and quick, allowing players to initialize a game without too much steps
-   The game has no built in chat, forcing the players to resort to other ways to communicate with each other (locally or a 3rd party VC)

## Installation

Dillinger requires [Node.js](https://nodejs.org/) v10+ to run.

From the root directory, Install the dependencies and devDependencies.

```sh
npm i
```

Then also in the root directory, create a .env file

```sh
touch .env
```

This .env file needs one key, `MONGODB_CONNECTION_STRING`

```sh
MONGODB_CONNECTION_STRING=mongodb+srv://USERNAME:PASSWORD@DATABASE_URL
```

The nice folks at [MongoDB Atlas](https://www.mongodb.com/atlas/database) supplied us with a cloud hosted MongoDB (Thank you!) and that's where we got our connection string from.
If you want an easy and quick way to initialize a MongoDB I recommend signing up to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and getting started with their free tier

After setting up your connection string, you're done! The client is pre-built and is set to make connections with localhost port 8080, so all you need to do is:

```sh
npm start
```

Go to [port 8080](http://localhost:8080) and play around!
But wait, you can't really play around if the game requires a minimum of 3 more players...

That's where I recommend online hosting!
A few more extra steps are needed here...

The project comes with a Dockerfile, it could be deployed to your remote server (as long as it can run docker containers) and you can access the game online from there.

We start with switching directories to client, and install it's dependencies:

```sh
cd client
npm i
```

then we find `src/global.js` file
In that file, the `WEBSOCKET_ENDPOINT` needs to be changed to the url that your remote server will handle.

```sh
export const WEBSOCKET_ENDPOINT = 'https://MY_URL_THAT_WILL_HOST_MY_GAME.com';
```

After that, re-build the client files

```sh
npm run build
```

Clean the `/public` folder in the root directory (SERVER DIRECTORY ONE, DO NOT CLEAN `client/public`)
Then copy the newly built files in `/client/src/build` to `/public`
After that you deploy your new changes to your server, run a docker container in the root directory and everything should be A Okay! You should be able to access the game from the URL that you changed in the global.js file

require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');
const lobbyHandler = require('./src/events/lobbyHandler');
const gameHandler = require('./src/events/gameHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const connectToDB = async () => {
    const db = await new Promise((resolve, reject) => {
        try {
            mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                // useCreateIndex: true,
                // useFindAndModify: false,
            });

            mongoose.connection.once('open', () => {
                console.log('Database connection has been made');
                resolve(mongoose);
            });
        } catch (error) {
            reject(error);
        }
    });
    return db;
};

const initializeServer = async (port = undefined) => {
    const PORT = process.env.PORT || port;

    const server = await new Promise((resolve, reject) => {
        try {
            const serverr = app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
            resolve(serverr);
        } catch (error) {
            reject(error);
        }
    });

    return server;
};

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);

        const io = socketIO(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        const lobbyNps = io.of('/lobby');
        const gameNps = io.of('/game');

        const onLobbyConnection = (socket) => {
            lobbyHandler(lobbyNps, socket);
        };

        const onGameConnection = (socket) => {
            gameHandler(gameNps, socket);
        };

        lobbyNps.on('connection', onLobbyConnection);
        gameNps.on('connection', onGameConnection);
    } catch (error) {
        console.error(error);
    }
})();

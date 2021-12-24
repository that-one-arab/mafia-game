require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');
const lobbyHandler = require('./src/events/lobbyHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

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
            const serverr = app.listen(PORT, () =>
                console.log(`Server is listening on port ${PORT}`)
            );
            resolve(serverr);
        } catch (error) {
            reject(error);
        }
    });

    return server;
};

const startServer = () => {};

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);

        const io = socketIO(server);

        const lobbyNps = io.of('/lobby');

        const onLobbyConnection = (socket) => {
            lobbyHandler(lobbyNps, socket);
        };

        lobbyNps.on('connection', onLobbyConnection);
    } catch (error) {
        console.error(error);
    }
})();

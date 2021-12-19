require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();

app.use('/api', routes);

app.use(cors());
app.use(express.json());

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

const initializeSocketConn = async (server) => {
    const io = await new Promise((resolve, reject) => {
        try {
            const io = socket(server);

            io.on('connection', function (socket) {
                console.log('Made socket connection');
                socket.on('disconnect', () => {
                    console.log('user disconnected');
                });
            });
            resolve(io);
        } catch (error) {
            reject(error);
        }
    });
    return io;
};

const startServer = () => {};

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);
        const io = await initializeSocketConn(server);
    } catch (error) {
        console.error(error);
    }
})();

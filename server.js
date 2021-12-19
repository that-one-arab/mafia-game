const mongoose = require('mongoose');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();

app.use('/api', routes);

app.use(cors());
app.use(express.json());

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

module.exports = app;

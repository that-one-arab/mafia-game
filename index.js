const express = require('express');
const socket = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors());

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () =>
    console.log(`Server is listening on port ${PORT}`)
);

const io = socket(server);

io.on('connection', function (socket) {
    console.log('Made socket connection');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

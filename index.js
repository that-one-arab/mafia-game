require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors());

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

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);
        const io = await initializeSocketConn(server);

        const kittySchema = new mongoose.Schema({
            name: String,
        });

        kittySchema.methods.speak = function speak() {
            const greeting = this.name
                ? 'Meow name is ' + this.name
                : "I don't have a name";
            console.log(greeting);
        };

        const Kitten = mongoose.model('Kitten', kittySchema);

        const silence = new Kitten({ name: 'Silence' });

        const fluffy = new Kitten({ name: 'fluffy' });
        fluffy.speak(); // "Meow name is fluffy"
        // await fluffy.save();

        const kittens = await Kitten.find();
        console.log(kittens);

        console.log(silence.name); // 'Silence'
    } catch (error) {
        console.error(error);
    }
})();

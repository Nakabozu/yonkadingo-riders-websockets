const express = require("express");
const http = require("http");
const socket = require("socket.io");
const cors = require("cors");
const moment = require("moment");

console.log("Starting Express Server");

const PORT = process.env.PORT || 5174;
const app = express();
app.use(cors());
const server = http.createServer(app);
let compareDate = moment();

const io = new socket.Server(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    },
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    socket.emit("welcomeEventFromServer", compareDate)

    socket.on("reset_timer", () => {
        compareDate = moment();
        console.log("Timer was reset by user to", compareDate);
        io.emit("timer_updated", compareDate);
    });

    socket.on("adjust_timer", (amount, unit) => {
        compareDate.add(amount, unit);
        console.log("Timer was updated by user to", compareDate);
        io.emit("timer_updated", compareDate);
    });

});

server.listen(PORT, () => {
    console.log(`Server is hosting`);
});

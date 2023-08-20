/* *
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const cors = require("cors");
const moment = require("moment");
const Game = require("./game");
const User = require("./user");
/* */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Game, { GameActions, GameTurnInputs } from "./game";
import User, { Classes } from "./user";

console.log("Starting Express Server");

const PORT = process.env.PORT || 5100;
const app = express();
app.use(cors());
const server = http.createServer(app);

let currentUniqueRoomId = 0;
const getUniqueRoomId = () => {
    currentUniqueRoomId += 1;
    return currentUniqueRoomId;
}

const activeUsers: User[] = [];
const activeGames: Game[] = [];

const getRoomCode = (roomId) => {
    return('Room' + roomId);
}

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket: any) => {    
    console.log(`User Connected: ${socket.id}`);
    socket.emit("client_gives_user_id", socket.id);

    activeUsers.push(new User(socket.id));

    socket.on("create_room", () => {
        const uniqueRoomId = getUniqueRoomId();

        activeGames.push(new Game(uniqueRoomId));
        
        socket.join(getRoomCode(uniqueRoomId));
        socket.emit('server_send_room_code', uniqueRoomId);
    });

    socket.on("client_connect_to_room", (requestedRoomCode) => {
        if(activeGames.some(game => game.getGameId === requestedRoomCode)){
            socket.join(getRoomCode(requestedRoomCode));
        }else{
            socket.emit('client_says_room_doesn\'t_exist');
        }
    });

    socket.on("client_send_chat_message", (msg: string) => {
        // NOTE: This regex removes all non-ASCII characters
        socket.to(Array.from(socket.rooms)).emit('server_send_msg', msg.replace(/[^\x00-\x7F]/g, ""));
    });

    socket.on("client_perform_action", (input: GameTurnInputs) => {
        const currentUser = activeUsers.find((user) => user.getUserId === socket.id)
        const usersGame = activeGames.find((game) => game.getGameId === currentUser?.getUserRoomId)
        if(input.action === GameActions.Pass){
            return;
        }

        if(currentUser?.getClass === Classes.Steward && input.action === GameActions.Buff){
            
        }else if(currentUser?.getClass === Classes.Bosun && input.action >= GameActions.Detect && input.action <= GameActions.ReducePellets){
            
        }else if(currentUser?.getClass === Classes.Topman && input.action === GameActions.Reveal){

        }else if(currentUser?.getClass === Classes.Helmsman && input.action === GameActions.Move){

        }else if(currentUser?.getClass === Classes.Gunner && input.action >= GameActions.Mine && input.action <= GameActions.Dodge){

        }
    })

    socket.on("disconnect", () => {
        const indexOfUserToRemove = activeUsers.findIndex((user) => user.getUserId === socket.id);
        if(indexOfUserToRemove >= 0){
            activeUsers.splice(indexOfUserToRemove, 1);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is hosting`);
});


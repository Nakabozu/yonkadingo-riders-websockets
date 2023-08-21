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

let activeUsers: User[] = [];
let activeGames: Game[] = [];
let currentTurn: number = 0;

const getRoomCode = (roomId) => {
    return('Room' + roomId);
}

const isCurrentUsersTurn = (currentUsersClass: Classes) => {
    return(currentUsersClass &&
        (currentTurn === Classes.Steward && currentUsersClass === Classes.Steward)
    || (currentTurn === Classes.Bosun && currentUsersClass === Classes.Bosun)
    || (currentTurn === Classes.Topman && currentUsersClass === Classes.Topman)
    || (currentTurn === Classes.Helmsman && currentUsersClass === Classes.Helmsman)
    || (currentTurn === Classes.Gunner && currentUsersClass === Classes.Gunner))
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
        if(activeGames.some(game => game.gameId === requestedRoomCode)){
            socket.join(getRoomCode(requestedRoomCode));
        }else{
            socket.emit('client_says_room_doesn\'t_exist');
        }
    });

    socket.on("client_send_chat_message", (msg: string) => {
        console.log(`${socket.id} said ${msg}`);
        // NOTE: This regex removes all non-ASCII characters
        socket.to(Array.from(socket.rooms)).emit('server_send_msg', msg.replace(/[^\x00-\x7F]/g, ""));
    });

    socket.on("client_perform_action", (input: GameTurnInputs) => {
        const currentUser = activeUsers.find((user) => user.userId === socket.id);
        const usersGame = activeGames.find((game) => game.gameId === currentUser?.userRoomId);
        if(input.action === GameActions.Pass){
            return;
        }
        if(isCurrentUsersTurn(currentUser?.class)){
            if(currentUser?.class === Classes.Steward && input.action === GameActions.Buff){
                usersGame.buffClass(input.class);
                currentTurn++;
            }else if(currentUser?.class === Classes.Bosun && input.action >= GameActions.Detect && input.action <= GameActions.ReducePellets){
                if(input.action === GameActions.Detect){
                    usersGame.detect();
                }else if(input.action === GameActions.ReduceFood){
                    usersGame.reduceFood();
                }else if(input.action === GameActions.ReducePellets){
                    usersGame.reducePellets();
                }
            }else if(currentUser?.class === Classes.Topman && input.action === GameActions.Reveal){
                usersGame.reveal(input.coordinates);
            }else if(currentUser?.class === Classes.Helmsman && input.action === GameActions.Move){
                usersGame.move(true, input.coordinates);
            }else if(currentUser?.class === Classes.Gunner && input.action >= GameActions.Mine && input.action <= GameActions.Dodge){
                if(input.action === GameActions.Mine){
                    usersGame.mine(input.coordinates);
                }else if(input.action === GameActions.Fire){
                    usersGame.fire(input.coordinates);
                }else if(input.action === GameActions.Dodge){
                    usersGame.dodge(true);
                }
                
            }else{
                throw `You can't perform that action as a ${Classes[currentUser.class]}!`
            }
        }else{
            throw `It's not your turn!  Chill out!`;
        }
    })

    socket.on("disconnect", () => {
        const indexOfUserToRemove = activeUsers.findIndex((user) => user.userId === socket.id);
        if(indexOfUserToRemove >= 0){
            activeUsers.splice(indexOfUserToRemove, 1);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is hosting`);
});


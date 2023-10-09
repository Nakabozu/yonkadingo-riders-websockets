import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Game, { Classes, GameActions, GameTurnInputs } from "./game";
import User from "./user";
import { 
    getRoomCode,
    getActiveUserFromSocketId,
    getActiveUsersInGameFromGameId,
    getActiveUsersClassFromSocketId,
    getAvailableClassesForGame,
    getIndexOfActiveUserFromSocketId,
    getActiveUsersInSameGameAsUserFromSocketId,
    getGameFromSocketId,
    isCurrentUsersTurn
} from "./helper";

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

export let activeUsers: User[] = [];
export let activeGames: Game[] = [];

/**
 * SOCKET LOGIC
 */
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket: any) => {    
    console.log(`User Connected: ${socket.id}`);
    socket.emit("client_gives_user_id", socket.id);

    /* Chat Functionality */
    socket.on("user_joins_title_page", ()=>{
        console.log(`${socket.id} joined the title lobby`);
        socket.join("title-lobby");
    })

    socket.on("user_leaves_title_page", ()=>{
        console.log(`${socket.id} left the title lobby`);
        socket.leave("title-lobby");
    })

    socket.on("client_sends_chat_message", (userName: string, msg: string) => {
        const usersRooms: string[] = Array.from(socket.rooms);

        if(usersRooms.length > 0){
            usersRooms.forEach((room: string) => {
                if(room !== socket.id){
                    // NOTE: This regex removes all non-ASCII characters
                    io.to(room).emit('server_broadcasts_msg', userName, msg.replace(/[^\x00-\x7F]/g, ""));
                }
            });
        }
        else{
            io.to("title-lobby").emit('server_broadcasts_msg', userName, msg.replace(/[^\x00-\x7F]/g, ""));
        }
        console.log(`${socket.id}(${userName}) said ${msg} to ${Array.from(socket.rooms)}`);
    });

    /* Users joining Lobbies */
    socket.on("client_creates_room", (userName, callback) => {
        if(activeUsers.some(user => user.userId === socket.id))
        {
            socket.emit("server_says_error_client_already_in_room");
        }else{
            const uniqueRoomId = getUniqueRoomId();

            activeGames.push(new Game(uniqueRoomId));
            activeUsers.push(new User(socket.id, userName, uniqueRoomId));
            console.log(`${socket.id}(${userName}) created room ${uniqueRoomId}`);
            
            socket.join(getRoomCode(uniqueRoomId));
            callback(uniqueRoomId);
        }
    });

    socket.on("client_connects_to_room", (userName, requestedRoomCode, callback) => {
        let requestedGame: Game = null;
        activeGames.some(game => {
            if(game.gameId === requestedRoomCode){
                requestedGame = game;
                return true;
            }
            return false;
        })

        if(requestedGame !== null){
            const availableRoles: Classes[] = getAvailableClassesForGame(requestedGame.gameId);

            if(availableRoles.length > 0){
                console.log(`${socket.id} successfully joined ${getRoomCode(requestedRoomCode)}`);
                socket.join(getRoomCode(requestedRoomCode));
                const newUser = new User(socket.id, userName, requestedRoomCode)
                activeUsers.push(newUser);
                callback(newUser);
            }else{
                console.log(`${socket.id} tried to join ${getRoomCode(requestedRoomCode)} but it was full`);
                io.to(socket.id).emit('server_says_no_room');
            }
        }else{
            console.log(`${socket.id} tried to join ${getRoomCode(requestedRoomCode)} but it doesn't exist`);
            io.to(socket.id).emit('server_says_no_room');
        }
    });

    /* Game setup */
    socket.on("client_requests_class_details", (callback) => {
        let classDetailsArray = [];
        let currentUser = getActiveUserFromSocketId(socket.id);
        activeUsers.forEach(user => {
            if(user.userRoomId === currentUser.userRoomId){
                classDetailsArray.push()
            }
        });
        callback(classDetailsArray); 
    });

    socket.on("client_selects_a_class", (desiredClass) => {
        let game: Game = getGameFromSocketId(socket.id);
        const openClasses = getAvailableClassesForGame(game.gameId);
        if(openClasses.some((classToCheck) => classToCheck === desiredClass)){
            
        }
    });

    /* Running games */
    socket.on("client_perform_action", (input: GameTurnInputs) => {
        const currentUsersGame = getGameFromSocketId(socket.id);
        const currentUsersClass = getActiveUsersClassFromSocketId(socket.id);
        if(input.action === GameActions.Pass){
            return;
        }
        if(isCurrentUsersTurn(currentUsersClass, currentUsersGame)){
            if(currentUsersClass === Classes.Steward && input.action === GameActions.Buff){
                currentUsersGame.buffClass(input.class);
            }else if(currentUsersClass === Classes.Bosun && input.action >= GameActions.Detect && input.action <= GameActions.ReducePellets){
                if(input.action === GameActions.Detect){
                    currentUsersGame.detect();
                }else if(input.action === GameActions.ReduceFood){
                    currentUsersGame.reduceFood();
                }else if(input.action === GameActions.ReducePellets){
                    currentUsersGame.reducePellets();
                }
            }else if(currentUsersClass === Classes.Topman && input.action === GameActions.Reveal){
                currentUsersGame.reveal(input.coordinates);
            }else if(currentUsersClass === Classes.Helmsman && input.action === GameActions.Move){
                currentUsersGame.move(true, input.coordinates);
            }else if(currentUsersClass === Classes.Gunner && input.action >= GameActions.Mine && input.action <= GameActions.Dodge){
                if(input.action === GameActions.Mine){
                    currentUsersGame.mine(input.coordinates);
                }else if(input.action === GameActions.Fire){
                    currentUsersGame.fire(input.coordinates);
                }else if(input.action === GameActions.Dodge){
                    currentUsersGame.dodge(true);
                }
                
            }else{
                throw `You can't perform that action as a ${Classes[currentUsersClass]}!`
            }
        }else{
            throw `It's not your turn!  Chill out!`;
        }
    })

    /* oopsies */
    socket.on("disconnect", () => {
        const indexOfUserToRemove = getIndexOfActiveUserFromSocketId(socket.id);
        if(indexOfUserToRemove >= 0){
            activeUsers.splice(indexOfUserToRemove, 1);
        }
    });

    /* Admin Debugs */
    socket.on("print_users", (callback) => {
        console.log(activeUsers);
        callback(activeUsers);
    });
});

server.listen(PORT, () => {
    console.log(`Server is hosting`);
});


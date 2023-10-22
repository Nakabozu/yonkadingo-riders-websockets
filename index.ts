import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Game, { Classes, GameActions, GameTurnInputs } from "./game";
import User from "./user";
import { 
    getActiveUserFromSocketId,
    getActiveUsersInGameFromGameId,
    getActiveUsersClassFromSocketId,
    getAvailableClassesForGame,
    getIndexOfActiveUserFromSocketId,
    getActiveUsersInSameGameAsUserFromSocketId,
    isCurrentUsersTurn,
    getUserNameForClassesFromClassDetails,
    getActiveGameFromUsersSocketId,
    doesNameAlreadyExist
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


/*
 * API LOGIC
 */
app.get("/oldDetails", (request, response) => {
    console.log("Request", request);
    response.send("TESTING");
});

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

    /* Remembering Previous Users by Socket Id */
    socket.on("client_says_user_already_has_id", (oldSocketId, callback)=>{
        const oldUser = getActiveUserFromSocketId(oldSocketId);
        if(oldUser){
            socket.emit("server_gives_client_old_user_details", socket.id);
        }
        socket.emit("server_gives_client_id", socket.id);
    });

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
        }else if(doesNameAlreadyExist(userName)){
            socket.emit("server_says_someone_has_that_name");
        }else{
            const uniqueRoomId = getUniqueRoomId();
            const newUser = new User(socket.id, userName, uniqueRoomId);
            const newGame = new Game(uniqueRoomId);
            
            activeUsers.push(newUser);
            activeGames.push(newGame);
            const usersNewClass = newGame.setToFirstAvailableClass(newUser.userId);
            
            socket.join(uniqueRoomId);
            callback(uniqueRoomId, usersNewClass);
            console.log(`${socket.id}(${userName}) created room ${uniqueRoomId} and became a ${Classes[usersNewClass]}`);
        }
    });

    socket.on("client_connects_to_room", (userName: string, requestedRoomCode: number, callback: (newClass: Classes) => void) => {
        let requestedGame: Game = activeGames.find(game => game.gameId === requestedRoomCode);
        if(doesNameAlreadyExist(userName)){
            socket.emit("server_says_someone_has_that_name");
        }else if(requestedGame !== null){
            const usersNewClass = requestedGame.setToFirstAvailableClass(socket.id);

            if(usersNewClass){
                socket.join(requestedRoomCode);
                const newUser = new User(socket.id, userName, requestedRoomCode);
                activeUsers.push(newUser);

                // assign user's class
                callback(usersNewClass);
                console.log(`Assigned ${socket.id}(${userName}) to ${usersNewClass} in game ${requestedGame.gameId}`);
            }else{
                console.log(`${socket.id} tried to join ${requestedRoomCode} but it was full`);
                io.to(socket.id).emit('server_says_no_room');
            }
        }else{
            console.log(`${socket.id} tried to join ${requestedRoomCode} but it doesn't exist`);
            io.to(socket.id).emit('server_says_no_room');
        }
    });

    /* Game setup */
    socket.on("client_requests_class_details", (callback) => {
        const classDetailsToDeliver = getUserNameForClassesFromClassDetails(getActiveGameFromUsersSocketId(socket.id)?.giveClassesForGame());
        console.log("Serving up some fresh class details that the client ordered", classDetailsToDeliver);
        callback(classDetailsToDeliver); 
    });

    socket.on("client_selects_a_class", (desiredClass: Classes, callback) => {
        try{
            let game: Game = getActiveGameFromUsersSocketId(socket.id);
            const allClasses = Object.keys(Classes).filter((x) => !isNaN(Number(x))).map((n)=>Number(n));
            // @ts-ignore
            if(game && allClasses.some((classToCheck) => classToCheck === desiredClass)){
                const wasSet = game?.setClass(socket.id, desiredClass);
                if(wasSet){
                    io.to(Array.from(socket.rooms)).emit("server_gives_class_updates", getUserNameForClassesFromClassDetails(game?.giveClassesForGame()));
                    console.log(`YAR!  ${socket.id} became a ${Classes[desiredClass]}`);    
                }else{
                    console.log(`yar... ${socket.id} couldn't become a ${Classes[desiredClass]}...`)
                    callback("Huh, seems like that class isn't available.  Bummer.");
                }
            }else{
                console.log(`yar... ${socket.id} couldn't become a ${Classes[desiredClass]}...`)
                callback("Huh, seems like that class isn't available.  Bummer.");
            }
        }
        catch(e){
            console.error(e);
            callback("IF'N YEE WANT BE FARMER OR BARON THEN WALK THE GANGPLANK TO SHORE! PIRATE CLASSES ONLY!");
        }
    });

    /* Running games */
    socket.on("client_starts_game", () => {
        const gameToStart = getActiveGameFromUsersSocketId(socket.id);
        
        console.log("Serving up a fresh game!", gameToStart.yonkadingo, gameToStart.gameboard);
        io.to(String(gameToStart.gameId)).emit("server_says_game_starting", gameToStart);
    });

    socket.on("client_perform_action", (input: GameTurnInputs) => {
        const currentUsersGame = getActiveGameFromUsersSocketId(socket.id);
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

    socket.on("print_games", (callback) => {
        console.log(activeGames);
        callback(activeGames);
    });

    socket.on("solo_game", (userName, callback) => {
        if(activeUsers.some(user => user.userId === socket.id))
        {
            socket.emit("server_says_error_client_already_in_room");
        }else if(doesNameAlreadyExist(userName)){
            socket.emit("server_says_someone_has_that_name");
        }else{
            const uniqueRoomId = getUniqueRoomId();
            const newUser = new User(socket.id, userName, uniqueRoomId);
            const newGame = new Game(uniqueRoomId);
            
            newGame.setToAllClasses(socket.id);

            activeUsers.push(newUser);
            activeGames.push(newGame);
            
            socket.join(uniqueRoomId);
            console.log(`${socket.id}(${userName}) created a solo game with the id of ${uniqueRoomId}`);
            callback(newGame.yonkadingo, newGame.gameboard.getRevealedBoard());
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is hosting`);
});


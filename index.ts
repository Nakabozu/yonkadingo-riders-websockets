////////////////////////////////////////////////////////////////////////////////////////////////////
// TODOS
// - Add a "Log Message" action to the game that logs the results of the last action performed
//   to the chat.
//     - As an added bonus, this could also be used to pop up decorated toast modals to keep
//       the user informed of what is happening in the game.
// - Add an element of randomness to the user's actions.  They should roll to see how
//   effective what they do is. For example, a good role for a helmsman makes them move more,
//   a good role for a Steward buffs a character more.
// - Add a class action to scan the enemy for their stats?
// - Get the "Drop Mines" action to work.
// - Fix issues with being on the same tile as the enemy ai
// - Some extra logic to only have pellet/food weathers on their respective tiles
////////////////////////////////////////////////////////////////////////////////////////////////////
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
    doesNameAlreadyExist,
    wT,
    bB,
    ansiR,
    mT,
    bT,
    wB,
    rT,
    gT,
    gB,
    yT,
    buT,
    isActionForThisTurn,
} from "./helper";

// #region Initialization
console.log("Starting Express Server");

const PORT = process.env.PORT || 5100;
const app = express();
app.use(cors());
const server = http.createServer(app);
const loggingLevel = 2;

let currentUniqueRoomId = 0;
const getUniqueRoomId = (): number => {
    currentUniqueRoomId += 1;
    return currentUniqueRoomId;
};

export let activeUsers: User[] = [];
export let activeGames: Game[] = [];

// #endregion
// #region API Logic
app.get("/oldDetails", (request, response) => {
    console.log("Request", request);
    response.send("TESTING");
});
// #endregion
// #region Socket Logic
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket: any) => {
    console.log(`User Connected: ${socket.id}`);

    /* Remembering Previous Users by Socket Id */
    socket.on("client_says_user_already_has_id", (oldSocketId, callback) => {
        const oldUser = getActiveUserFromSocketId(oldSocketId);
        if (oldUser) {
            socket.emit("server_gives_client_old_user_details", socket.id);
        }
        socket.emit("server_gives_client_id", socket.id);
    });
    // #region
    // #region Chat Functionality
    socket.on("user_joins_title_page", () => {
        console.log(`${socket.id} joined the title lobby`);
        socket.join("title-lobby");
    });

    socket.on("user_leaves_title_page", () => {
        console.log(`${socket.id} left the title lobby`);
        socket.leave("title-lobby");
    });

    socket.on("client_sends_chat_message", (userName: string, msg: string) => {
        const usersRooms: string[] = Array.from(socket.rooms);

        if (usersRooms.length > 0) {
            usersRooms.forEach((room: string) => {
                if (room !== socket.id) {
                    // NOTE: This regex removes all non-ASCII characters
                    io.to(room).emit(
                        "server_broadcasts_msg",
                        userName,
                        msg.replace(/[^\x00-\x7F]/g, "")
                    );
                }
            });
        } else {
            io.to("title-lobby").emit(
                "server_broadcasts_msg",
                userName,
                msg.replace(/[^\x00-\x7F]/g, "")
            );
        }
        console.log(
            `${socket.id}(${userName}) said ${msg} to ${Array.from(
                socket.rooms
            )}`
        );
    });
    // #endregion
    // #region Users joining Lobbies
    socket.on("client_creates_room", (userName, callback) => {
        if (activeUsers.some((user) => user.userId === socket.id)) {
            socket.emit("server_says_error_client_already_in_room");
        } else if (doesNameAlreadyExist(userName)) {
            socket.emit("server_says_someone_has_that_name");
        } else {
            const uniqueRoomId = getUniqueRoomId();
            const newUser = new User(socket.id, userName, uniqueRoomId);
            const newGame = new Game(uniqueRoomId);

            activeUsers.push(newUser);
            activeGames.push(newGame);
            const usersNewClass = newGame.setToFirstAvailableClass(
                newUser.userId
            );

            socket.join(`${uniqueRoomId}`);
            callback(uniqueRoomId, usersNewClass);
            console.log(
                `${socket.id}(${userName}) created room ${uniqueRoomId} and became a ${Classes[usersNewClass]}`
            );
        }
    });

    socket.on(
        "client_connects_to_room",
        (
            userName: string,
            requestedRoomCode: number,
            callback: (newClass: Classes) => void
        ) => {
            let requestedGame: Game = activeGames.find(
                (game) => game.gameId === requestedRoomCode
            );
            if (doesNameAlreadyExist(userName)) {
                socket.emit("server_says_someone_has_that_name");
            } else if (requestedGame !== null) {
                const usersNewClass = requestedGame?.setToFirstAvailableClass(
                    socket.id
                );

                if (usersNewClass) {
                    socket.join(`${requestedRoomCode}`);
                    const newUser = new User(
                        socket.id,
                        userName,
                        requestedRoomCode
                    );
                    activeUsers.push(newUser);

                    // assign user's class
                    callback(usersNewClass);
                    console.log(
                        `Assigned ${socket.id}(${userName}) to ${usersNewClass} in game ${requestedGame.gameId}`
                    );
                } else {
                    console.log(
                        `${socket.id} tried to join ${requestedRoomCode} but it was full`
                    );
                    io.to(socket.id).emit("server_says_no_room");
                }
            } else {
                console.log(
                    `${socket.id} tried to join ${requestedRoomCode} but it doesn't exist`
                );
                io.to(socket.id).emit("server_says_no_room");
            }
        }
    );
    // #endregion
    // #region Game setup
    socket.on("client_requests_class_details", (callback) => {
        const classDetailsToDeliver = getUserNameForClassesFromClassDetails(
            getActiveGameFromUsersSocketId(socket.id)?.giveClassesForGame()
        );
        console.log(
            "Serving up some fresh class details that the client ordered",
            classDetailsToDeliver
        );
        callback(classDetailsToDeliver);
    });

    socket.on("client_selects_a_class", (desiredClass: Classes, callback) => {
        try {
            let game: Game = getActiveGameFromUsersSocketId(socket.id);
            const allClasses = Object.keys(Classes)
                .filter((x) => !isNaN(Number(x)))
                .map((n) => Number(n));
            // @ts-ignore
            if (
                game &&
                allClasses.some((classToCheck) => classToCheck === desiredClass)
            ) {
                const wasSet = game?.setClass(socket.id, desiredClass);
                if (wasSet) {
                    io.to(Array.from(socket.rooms)).emit(
                        "server_gives_class_updates",
                        getUserNameForClassesFromClassDetails(
                            game?.giveClassesForGame()
                        )
                    );
                    console.log(
                        `YAR!  ${socket.id} became a ${Classes[desiredClass]}`
                    );
                } else {
                    console.log(
                        `yar... ${socket.id} couldn't become a ${Classes[desiredClass]}...`
                    );
                    callback(
                        "Huh, seems like that class isn't available.  Bummer."
                    );
                }
            } else {
                console.log(
                    `yar... ${socket.id} couldn't become a ${Classes[desiredClass]}...`
                );
                callback(
                    "Huh, seems like that class isn't available.  Bummer."
                );
            }
        } catch (e) {
            console.error(e);
            callback(
                "IF'N YEE WANT BE FARMER OR BARON THEN WALK THE GANGPLANK TO SHORE! PIRATE CLASSES ONLY!"
            );
        }
    });
    // #endregion
    // #region Running games
    socket.on("client_starts_game", () => {
        const gameToStart = getActiveGameFromUsersSocketId(socket.id);

        console.log(
            `${gB}${wT}Serving up a fresh game!${ansiR}`,
            gameToStart.yonkadingo,
            gameToStart.gameboard
        );
        io.to(String(gameToStart.gameId)).emit(
            "server_says_game_starting",
            gameToStart,
            gameToStart.yonkadingo.shipSummary
        ); // TODO: I think the io.to() isn't targeting the room properly?
    });

    socket.on("client_requests_current_turn", () => {
        const currentUsersGame = getActiveGameFromUsersSocketId(socket.id);
        return currentUsersGame.currentTurn;
    });
    //#endregion
    socket.on("client_performs_action", (input: GameTurnInputs) => {
        const currentUsersGame = getActiveGameFromUsersSocketId(socket.id);
        const currentUsersClasses = getActiveUsersClassFromSocketId(socket.id);
        /**
         * These are additional details required for the shipmate to perform
         * their action.  For example, a Topman must know how many tiles
         * they are revealing, an helmsman must know how many tiles they
         * can move over, etc.
         */
        const turnDetails = {};
        /** True if the user performed a valid action.
         * If a valid action is performed, the turn order should progress. */
        let progressTurn = true;
        if (
            isCurrentUsersTurn(currentUsersClasses, currentUsersGame) &&
            isActionForThisTurn(currentUsersGame.currentTurn, input.action)
        ) {
            //#region Pass
            // PASS
            if (input.action === GameActions.GlobalPass) {
                if (loggingLevel > 1)
                    console.log(
                        `${socket.id}:${currentUsersGame.gameId} passed their turn :(`
                    );
            }
            //#endregion
            //#region Steward Actions
            else if (
                currentUsersClasses.some(
                    (classes) => classes === Classes.Steward
                ) &&
                input.action === GameActions.StewardBuff
            ) {
                if (loggingLevel > 1)
                    console.log(
                        `${socket.id}:${currentUsersGame.gameId} buffed the ${
                            Classes[input.class]
                        }.`
                    );
                currentUsersGame.buffClass(input.class);
                io.to(`${currentUsersGame.gameId}`).emit(
                    "server_says_steward_buffs_class",
                    input.class
                );
            }
            //#endregion
            //#region Bosun Actions
            else if (
                currentUsersClasses.some(
                    (classes) => classes === Classes.Bosun
                ) &&
                input.action >= GameActions.BosunDetect &&
                input.action <= GameActions.BosunReduceFood
            ) {
                if (input.action === GameActions.BosunDetect) {
                    if (loggingLevel > 1)
                        console.log(
                            `${socket.id}:${currentUsersGame.gameId} used detect.`
                        );
                    currentUsersGame.detect();
                } else if (input.action === GameActions.BosunReduceFood) {
                    if (loggingLevel > 1)
                        console.log(
                            `${socket.id}:${currentUsersGame.gameId} used reduceFood.`
                        );
                    currentUsersGame.reduceFood();
                } else if (input.action === GameActions.BosunReducePellets) {
                    if (loggingLevel > 1)
                        console.log(
                            `${socket.id}:${currentUsersGame.gameId} used reducePellets.`
                        );
                    currentUsersGame.reducePellets();
                }
            }
            //#endregion
            //#region Topman Actions
            else if (
                currentUsersClasses.some(
                    (classes) => classes === Classes.Topman
                ) &&
                input.action === GameActions.TopmanReveal
            ) {
                currentUsersGame.reveal(input.coordinates);
                io.to(`${currentUsersGame.gameId}`).emit(
                    "server_updates_grid",
                    currentUsersGame.gameboard.getRevealedBoard(
                        currentUsersGame.yonkadingo.location,
                        currentUsersGame.aiShip.location
                    )
                );
            }
            //#endregion
            //#region Helmsman Actions
            else if (
                currentUsersClasses.some(
                    (classes) => classes === Classes.Helmsman
                ) &&
                input.action === GameActions.HelmsmanMove
            ) {
                if (input.coordinates.length > 3) {
                    console.error(
                        `You little snake!  You can't move more than 3 tiles at once!`
                    );
                }
                currentUsersGame.move(true, input.coordinates);
                io.to(`${currentUsersGame.gameId}`).emit(
                    "server_updates_grid",
                    currentUsersGame.gameboard.getRevealedBoard(
                        currentUsersGame.yonkadingo.location,
                        currentUsersGame.aiShip.location
                    )
                );
                io.to(`${currentUsersGame.gameId}`).emit(
                    "server_updates_stats",
                    currentUsersGame.yonkadingo.shipSummary
                );
            }
            //#endregion
            //#region Gunner Actions
            else if (
                currentUsersClasses.some(
                    (classes) => classes === Classes.Gunner
                ) &&
                input.action >= GameActions.GunnerMine &&
                input.action <= GameActions.GunnerDodge
            ) {
                if (input.action === GameActions.GunnerMine) {
                    currentUsersGame.mine(input.coordinates);
                } else if (input.action === GameActions.GunnerFire) {
                    currentUsersGame.fire(input.direction);
                } else if (input.action === GameActions.GunnerDodge) {
                    currentUsersGame.dodge(true);
                }
            } else {
                console.log(
                    `${yT}You can't ${buT}${
                        GameActions[input.action]
                    }${yT} as a ${buT}${currentUsersClasses.map(
                        (classes) => Classes[classes]
                    )}${yT}!${ansiR}`
                );
                // throw `You can't perform that action as a ${Classes[currentUsersClass]}!`
                progressTurn = false;
            }
            //#region Progress Turn Logic
            if (progressTurn) {
                if (loggingLevel > 1)
                    console.log(
                        `Server telling client it's the ${gT}${
                            Classes[currentUsersGame.currentTurn]
                        }${ansiR}'s turn`
                    );
                io.to(`${currentUsersGame.gameId}`).emit(
                    "server_updates_class_turn",
                    currentUsersGame.currentTurn,
                    turnDetails
                );
            }
            //#endregion
        } else {
            console.log(
                `Ain't your turn ${rT}${currentUsersClasses.map(
                    (classes) => Classes[classes]
                )}${ansiR}.  ` +
                    `It's ${gT}${
                        Classes[currentUsersGame.currentTurn]
                    }'s${ansiR}.  Chill.`
            );
            // throw `It's not your turn!  Chill out!`;
        }
    });
    // #endregion

    // #region oopsies
    socket.on("disconnect", () => {
        const indexOfUserToRemove = getIndexOfActiveUserFromSocketId(socket.id);
        const gameUserIsLeaving = getActiveGameFromUsersSocketId(socket.id);
        if (indexOfUserToRemove >= 0) {
            activeUsers.splice(indexOfUserToRemove, 1);
        }
        gameUserIsLeaving?.removeUserFromGame(socket.id);
        if (gameUserIsLeaving?.isEmpty()) {
            activeGames.splice(activeGames.indexOf(gameUserIsLeaving), 1);
        }
    });
    //#endregion
    //#region Admin Debugs
    socket.on("print_users", (callback) => {
        console.log(activeUsers);
        callback(activeUsers);
    });

    socket.on("print_games", (callback) => {
        console.log(activeGames);
        callback(activeGames);
    });

    socket.on("solo_game", (userName, callback) => {
        if (activeUsers.some((user) => user.userId === socket.id)) {
            socket.emit("server_says_error_client_already_in_room");
        } else if (doesNameAlreadyExist(userName)) {
            socket.emit("server_says_someone_has_that_name");
        } else {
            const uniqueRoomId = getUniqueRoomId();
            const newUser = new User(socket.id, userName, uniqueRoomId);
            const newGame = new Game(uniqueRoomId);

            newGame.setToAllClasses(socket.id);

            activeUsers.push(newUser);
            activeGames.push(newGame);

            socket.join(`${uniqueRoomId}`);
            console.log(
                `${buT}${socket.id}${mT}(${buT}${userName}${mT}) created a solo game with the id of ${buT}${uniqueRoomId}${ansiR}`
            );
            callback(
                newGame.yonkadingo.shipSummary,
                newGame.gameboard.getRevealedBoard(
                    newGame.yonkadingo.location,
                    newGame.aiShip.location
                )
            );
        }
    });

    socket.onAny((event, args) => {
        let stringArgs: any;
        try {
            stringArgs = JSON.stringify(args);
        } catch (e) {
            console.error("Oop...", e);
        }
        console.log(
            `Got a ${bT}${wB}${event}${ansiR} with ${mT}${bB}${stringArgs}${ansiR}`
        );
    });
});
// #endregion
// #region Run Server
server.listen(PORT, () => {
    console.log(`Server is hosting`);
});
// #endregion

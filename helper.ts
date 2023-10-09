import { activeUsers, activeGames } from "./index";
import Game, { Classes, GameActions, GameTurnInputs } from "./game";
import User from "./user";

/*****
 * HELPER FUNCTIONS
 */
export const getRoomCode = (roomId) => {
    return('Room' + roomId);
}

/* ******************************** *
 * OBTAINING USERS AND USER DETAILS *
 * ******************************** */
export const getIndexOfActiveUserFromSocketId = (socketId): number | null => {
    return activeUsers.findIndex((user) => user.userId === socketId);
}

export const getActiveUserFromSocketId = (socketId): User | null => {
    return activeUsers[getIndexOfActiveUserFromSocketId(socketId)];
}

export const getActiveUsersInGameFromGameId = (gameId): User[] => {
    let resultUsers = [];
    activeUsers.forEach(user => {
        if(user.userRoomId === gameId){
            resultUsers.push(user);
        }
    });
    return resultUsers;
}

export const getActiveUsersInSameGameAsUserFromSocketId = (socketId): User[] => {
    return(getActiveUsersInGameFromGameId(getActiveUserFromSocketId(socketId)?.userRoomId) || []);
}

export const getActiveUsersClassFromSocketId = (socketId): Classes => {
    const usersGame = getActiveGameFromUsersSocketId(socketId);
    if(usersGame.bosun === socketId){
        return Classes.Bosun;
    }else if(usersGame.gunner === socketId){
        return Classes.Gunner;
    }else if(usersGame.helmsman === socketId){
        return Classes.Helmsman;
    }else if(usersGame.steward === socketId){
        return Classes.Steward;
    }else if(usersGame.topman === socketId){
        return Classes.Topman;
    }
}

/* **************** *
 * OBTAINING GAMES  *
 * **************** */
export const getActiveGameFromUsersSocketId = (socketId): Game | null => {
    let gameIdToSearchFor = getActiveUserFromSocketId(socketId)?.userRoomId;
    if(gameIdToSearchFor){
        return activeGames.find((game) => game.gameId === gameIdToSearchFor) ?? null;
    }
    return null;
}

export const getGameFromSocketId = (socketId): Game | null => {
    return activeGames.find((game) => game.gameId === getActiveUserFromSocketId(socketId).userRoomId) ?? null;
}

/* ****************** *
 * GAME LOGIC HELPERS *
 * ****************** */
export const isCurrentUsersTurn = (currentUsersClass: Classes, currentUsersGame: Game) => {
    return(currentUsersClass && currentUsersGame.currentTurn === currentUsersClass)
}

export const getAvailableClassesForGame = (gameId: number): Classes[] => {
    let availableClasses: Classes[] = [];
    let gameToCheck = activeGames.find(game => game.gameId === gameId);
    if(gameToCheck){
        // Probably a better way to structure this, but I'm not going to waste my time finding it
        if(gameToCheck.bosun === null){
            availableClasses.push(Classes.Bosun);
        }
        if(gameToCheck.gunner === null){
            availableClasses.push(Classes.Gunner);
        }
        if(gameToCheck.helmsman === null){
            availableClasses.push(Classes.Helmsman);
        }
        if(gameToCheck.steward === null){
            availableClasses.push(Classes.Steward);
        }
        if(gameToCheck.topman === null){
            availableClasses.push(Classes.Topman);
        }
    }else{
        return [];
    }

    return availableClasses;
}
import { activeUsers, activeGames } from "./index";
import Game, { Classes, GameActions, GameTurnInputs } from "./game";
import User from "./user";

/*****
 * HELPER FUNCTIONS
 */
export const isKindaFalsy = (valueToCheck) => {
    if(valueToCheck === undefined || valueToCheck === null || Number.isNaN(valueToCheck)){
        return true;
    }else{
        return false;
    }
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

export const doesNameAlreadyExist = (name: string): boolean => {
    const trimmedLowerName = name.trim().toLocaleLowerCase();
    return activeUsers.some(user => user.userName.trim().toLocaleLowerCase() === trimmedLowerName);
}


/* ********************************* *
 * OBTAINING GAMES AND GAME DETAILS  *
 * ********************************* */
export const getActiveGameFromUsersSocketId = (socketId): Game | null => {
    let gameIdToSearchFor = getActiveUserFromSocketId(socketId)?.userRoomId;
    if(gameIdToSearchFor){
        return activeGames.find((game) => game.gameId === gameIdToSearchFor) ?? null;
    }
    return null;
}

/* **************************** *
 * OBTAINING INFO ABOUT CLASSES *
 * **************************** */ 
export const lowercaseArrayOfClasses = (): string[] => {
    return Object.keys(Classes).filter((v) => isNaN(Number(v))).map((className)=> String(className).toLocaleLowerCase());
}


export const getUserNameForClassesFromClassDetails = (classIdDetails: any) => {
    // console.log( "getUserNameForClassesFromClassDetails was given the following classIdDetails to work with", classIdDetails);
    const resultClassDetails = {
        steward: "",
        bosun: "",
        topman: "",
        helmsman: "",
        gunner: ""
    }

    Object.keys(classIdDetails).forEach(classKey => {
        if(lowercaseArrayOfClasses().includes(classKey)){
            const socketIdOfClass: string = classIdDetails[classKey];
            if(socketIdOfClass.length > 0){
                resultClassDetails[classKey] = getActiveUserFromSocketId(socketIdOfClass).userName;
            }
        }
    })

    return resultClassDetails;
}

export const getAvailableClassesForGame = (gameId: number): Classes[] => {
    let availableClasses: Classes[] = [];
    let gameToCheck = activeGames.find(game => game.gameId === gameId);
    if(gameToCheck){
        // Probably a better way to structure this, but I'm not going to waste my time finding it
        if(isKindaFalsy(gameToCheck.bosun) || gameToCheck.bosun === ""){
            availableClasses.push(Classes.Bosun);
        }
        if(isKindaFalsy(gameToCheck.gunner) || gameToCheck.gunner === ""){
            availableClasses.push(Classes.Gunner);
        }
        if(isKindaFalsy(gameToCheck.helmsman) || gameToCheck.helmsman === ""){
            availableClasses.push(Classes.Helmsman);
        }
        if(isKindaFalsy(gameToCheck.steward) || gameToCheck.steward === ""){
            availableClasses.push(Classes.Steward);
        }
        if(isKindaFalsy(gameToCheck.topman) || gameToCheck.topman === ""){
            availableClasses.push(Classes.Topman);
        }
    }else{
        console.log(`Game ${gameId} doesn't exist so you're not getting any available classes. >:c`)
        return [];
    }

    return availableClasses;
}

/* ****************** *
 * GAME LOGIC HELPERS *
 * ****************** */
export const isCurrentUsersTurn = (currentUsersClass: Classes, currentUsersGame: Game) => {
    return(currentUsersClass && currentUsersGame.currentTurn === currentUsersClass)
}
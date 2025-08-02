import { activeUsers, activeGames } from "./index";
import Game, { Classes, GameActions, GameTurnInputs } from "./game";
import User from "./user";

// #region CONSTANTS
export const bT = "\x1b[30m";
export const rT = "\x1b[31m";
export const gT = "\x1b[32m";
export const yT = "\x1b[33m";
export const buT = "\x1b[34m";
export const mT = "\x1b[35m";
export const cT = "\x1b[36m";
export const wT = "\x1b[37m";
export const bbT = "\x1b[90m";
export const brT = "\x1b[91m";
export const bgT = "\x1b[92m";
export const byT = "\x1b[93m";
export const bbuT = "\x1b[94m";
export const bmT = "\x1b[95m";
export const bcT = "\x1b[96m";
export const bwT = "\x1b[7m";
export const bB = "\x1b[40m";
export const rB = "\x1b[41m";
export const gB = "\x1b[42m";
export const yB = "\x1b[43m";
export const buB = "\x1b[44m";
export const mB = "\x1b[45m";
export const cB = "\x1b[46m";
export const wB = "\x1b[47m";
export const bbB = "\x1b[100m";
export const brB = "\x1b[101m";
export const bgB = "\x1b[102m";
export const byB = "\x1b[103m";
export const bbuB = "\x1b[104m";
export const bmB = "\x1b[105m";
export const bcB = "\x1b[106m";
export const bwB = "\x1b[107m";
export const bD = "\x1b[1m";
export const iD = "\x1b[3m";
export const uD = "\x1b[4m";
export const ansiR = "\x1b[00m";
export const letterLookup = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
];
// #endregion
/*****
 // #region HELPER FUNCTIONS
 */
export const isKindaFalsy = (valueToCheck) => {
    if (
        valueToCheck === undefined ||
        valueToCheck === null ||
        Number.isNaN(valueToCheck)
    ) {
        return true;
    } else {
        return false;
    }
};
// #endregion
/* ******************************** *
 // #region OBTAINING USERS AND USER DETAILS *
 * ******************************** */
export const getIndexOfActiveUserFromSocketId = (socketId): number | null => {
    return activeUsers.findIndex((user) => user.userId === socketId);
};

export const getActiveUserFromSocketId = (socketId): User | null => {
    return activeUsers[getIndexOfActiveUserFromSocketId(socketId)];
};

export const getActiveUsersInGameFromGameId = (gameId): User[] => {
    let resultUsers = [];
    activeUsers.forEach((user) => {
        if (user.userRoomId === gameId) {
            resultUsers.push(user);
        }
    });
    return resultUsers;
};

export const getActiveUsersInSameGameAsUserFromSocketId = (
    socketId
): User[] => {
    return (
        getActiveUsersInGameFromGameId(
            getActiveUserFromSocketId(socketId)?.userRoomId
        ) || []
    );
};

export const getActiveUsersClassFromSocketId = (socketId): Classes[] => {
    const usersGame = getActiveGameFromUsersSocketId(socketId);
    const usersClasses = [];
    if (usersGame.bosun === socketId) {
        usersClasses.push(Classes.Bosun);
    }
    if (usersGame.gunner === socketId) {
        usersClasses.push(Classes.Gunner);
    }
    if (usersGame.helmsman === socketId) {
        usersClasses.push(Classes.Helmsman);
    }
    if (usersGame.steward === socketId) {
        usersClasses.push(Classes.Steward);
    }
    if (usersGame.topman === socketId) {
        usersClasses.push(Classes.Topman);
    }
    return usersClasses;
};

export const doesNameAlreadyExist = (name: string): boolean => {
    const trimmedLowerName = name.trim().toLocaleLowerCase();
    return activeUsers.some(
        (user) => user.userName.trim().toLocaleLowerCase() === trimmedLowerName
    );
};

// #endregion
/* ********************************* *
 // #region OBTAINING GAMES AND GAME DETAILS  *
 * ********************************* */
export const getActiveGameFromUsersSocketId = (socketId): Game | null => {
    let gameIdToSearchFor = getActiveUserFromSocketId(socketId)?.userRoomId;
    if (gameIdToSearchFor) {
        return (
            activeGames.find((game) => game.gameId === gameIdToSearchFor) ??
            null
        );
    }
    return null;
};
// #endregion
/* **************************** *
 // #region OBTAINING INFO ABOUT CLASSES *
 * **************************** */
export const lowercaseArrayOfClasses = (): string[] => {
    return Object.keys(Classes)
        .filter((v) => isNaN(Number(v)))
        .map((className) => String(className).toLocaleLowerCase());
};

export const getUserNameForClassesFromClassDetails = (classIdDetails: any) => {
    // console.log( "getUserNameForClassesFromClassDetails was given the following classIdDetails to work with", classIdDetails);
    const resultClassDetails = {
        steward: "",
        bosun: "",
        topman: "",
        helmsman: "",
        gunner: "",
    };

    Object.keys(classIdDetails).forEach((classKey) => {
        if (lowercaseArrayOfClasses().includes(classKey)) {
            const socketIdOfClass: string = classIdDetails[classKey];
            if (socketIdOfClass.length > 0) {
                resultClassDetails[classKey] =
                    getActiveUserFromSocketId(socketIdOfClass).userName;
            }
        }
    });

    return resultClassDetails;
};

export const getAvailableClassesForGame = (gameId: number): Classes[] => {
    let availableClasses: Classes[] = [];
    let gameToCheck = activeGames.find((game) => game.gameId === gameId);
    if (gameToCheck) {
        // Probably a better way to structure this, but I'm not going to waste my time finding it
        if (isKindaFalsy(gameToCheck.bosun) || gameToCheck.bosun === "") {
            availableClasses.push(Classes.Bosun);
        }
        if (isKindaFalsy(gameToCheck.gunner) || gameToCheck.gunner === "") {
            availableClasses.push(Classes.Gunner);
        }
        if (isKindaFalsy(gameToCheck.helmsman) || gameToCheck.helmsman === "") {
            availableClasses.push(Classes.Helmsman);
        }
        if (isKindaFalsy(gameToCheck.steward) || gameToCheck.steward === "") {
            availableClasses.push(Classes.Steward);
        }
        if (isKindaFalsy(gameToCheck.topman) || gameToCheck.topman === "") {
            availableClasses.push(Classes.Topman);
        }
    } else {
        console.log(
            `${yT}Game ${gameId} doesn't exist so you're not getting any available classes. >:c${ansiR}`
        );
        return [];
    }

    return availableClasses;
};
// #endregion
/* *************************** *
 // #region GAME LOGIC HELPERS *
 * *************************** */
export const isCurrentUsersTurn = (
    currentUsersClasses: Classes[],
    currentUsersGame: Game
) => {
    return (
        currentUsersClasses &&
        currentUsersClasses.some(
            (userClass) => currentUsersGame.currentTurn === userClass
        )
    );
};

/**
 * Checks if the Class that is currently acting and the action the user is attempting to performed both match.
 *
 * For example, if the `currentTurn` class is `Steward` and the `currentAction` is `StewardBuff`, returns `true`.
 * If the `currentTurn` is `Helmsman` and the `currentAction` is `TopmanReveal`, returns `false`.
 * @param currentTurn The current turn for the given game
 * @param currentAction The current action for the given user
 * @returns `true` if the `currentAction` can be performed by the `currentTurn`'s role.  Otherwise, `false`.
 */
export const isActionForThisTurn = (
    currentTurn: Classes,
    currentAction: GameActions
): boolean => {
    return GameActions[currentAction]
        .toLocaleLowerCase()
        .includes(Classes[currentTurn].toLocaleLowerCase());
};
// #endregion

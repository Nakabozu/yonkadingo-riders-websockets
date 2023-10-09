export type UserSummary = {
    userId: number;
    userRoomId: number;
}

export interface IUser {
    userId: string;
    userName: string;
    userRoomId: number;
}

export default class User implements IUser{
    // Attributes
    private _userId: string = "";
    private _userName: string = "";
    private _userRoomId: number = -1;

    public constructor(userId: string, userName: string, userRoomId: number){
        this._userId = userId;
        this._userName = userName;
        this._userRoomId = userRoomId;
    }

    // Getters
    public get userId(){
        return this._userId;
    }
    public get userName(){
        return this._userName;
    }
    /** This is the socket.room the user is in. It should match the Game.gameId of the game the user is in as well. */
    public get userRoomId(){
        return this._userRoomId;
    }

    // Setters
    public set userName(newUserName: string){
        // NOTE: This regex removes all non-ASCII characters
        this._userName = newUserName.replace(/[^\x00-\x7F]/g, "");
    }
    public set userRoomId(newUserRoomId: number){
        this._userRoomId = newUserRoomId;
    }
};
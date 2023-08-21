/**
 * THESE MUST BE KEPT IN THE SAME ORDER AS THE TURN ORDER
 */
export enum Classes {
    Steward = 1,
    Bosun,
    Topman,
    Helmsman,
    Gunner,
}

export type UserSummary = {
    userId: number;
    userRoomId: number;
    class: null | Classes;
}

export interface IUser {
    userId: string;
    userName: string;
    userRoomId: number;
    class: null | Classes;
}

export default class User implements IUser{
    // Attributes
    private _userId: string = "";
    private _userName: string = "";
    private _userRoomId: number = -1;
    private _class: null | Classes = null;

    public constructor(userId: string){
        this._userId = userId;
    }

    // Getters
    public get userId(){
        return this._userId;
    }
    public get userName(){
        return this._userName;
    }
    public get userRoomId(){
        return this._userRoomId;
    }
    public get class(){
        return this._class;
    }

    // Setters
    public set userName(newUserName: string){
        // NOTE: This regex removes all non-ASCII characters
        this._userName = newUserName.replace(/[^\x00-\x7F]/g, "");
    }
    public set userRoomId(newUserRoomId: number){
        this._userRoomId = newUserRoomId;
    }
    public set userClass(newUserClass: Classes){
        this._class = newUserClass;
    }
};
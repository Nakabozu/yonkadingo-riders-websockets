export enum Classes {
    Helmsman = 1,
    Bosun,
    Topman,
    Gunner,
    Steward
}

export type UserSummary = {
    userId: number;
    userRoomId: number;
    class: null | Classes;
}

export interface IUser {
    getUserId: string;
    getUserName: string;
    getUserRoomId: number;
    getClass: null | Classes;
}

export default class User implements IUser{
    // Attributes
    private userId: string = "";
    private userName: string = "";
    private userRoomId: number = -1;
    private class: null | Classes = null;

    public constructor(userId: string){
        this.userId = userId;
    }

    // Getters
    public get getUserId(){
        return this.userId;
    }
    public get getUserName(){
        return this.userName;
    }
    public get getUserRoomId(){
        return this.userRoomId;
    }
    public get getClass(){
        return this.class;
    }

    // Setters
    public set setUserName(newUserName: string){
        // NOTE: This regex removes all non-ASCII characters
        this.userName = newUserName.replace(/[^\x00-\x7F]/g, "");
    }
    public set setUserRoomId(newUserRoomId: number){
        this.userRoomId = newUserRoomId;
    }
    public set setUserClass(newUserClass: Classes){
        this.class = newUserClass;
    }
};
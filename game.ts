import GameBoard from "./gameboard";
import Yonkadingo from "./yonkadingo";
import AIShip from "./ai";
import { Coordinate } from "./gameboard";
import { ansiR, buT, rT } from "./helper";

// #region Constants and Enums

const COLUMN_COUNT = 8;
const ROW_COUNT = 8;
const CANNON_DAMAGE = 10;

/**
 * THESE MUST BE KEPT IN THE SAME ORDER AS THE TURN ORDER AND MUST MATCH THE SVELTEKIT APPLICATION
 * 
 * Current order: Steward (1) -> Bosun (2) -> Topman (3) -> Helmsman (4) -> Gunner (5)
 */
export enum Classes {
    Steward = 1,
    Bosun,
    Topman,
    Helmsman,
    Gunner,
}

export enum ResourcesToReduce {
    None = 1,
    Food,
    Pellets
}

/**
 * Actions that users can perform in the game.  
 * 
 * They **MUST** contain the name of the class that can perform the action 
 * or the word "Global" to indicate that all classes can perform the action.
 */
export enum GameActions {
    // Global Actions
    GlobalPass = 1,
    // Helmsman Actions
    HelmsmanMove,
    // Bosun Actions
    BosunDetect,
    BosunReduceFood,
    BosunReducePellets,
    // Topman Actions
    TopmanReveal,
    // Gunner Actions
    GunnerMine,
    GunnerFire,
    GunnerDodge,
    // Steward Actions
    StewardBuff
}

export type GameTurnInputs = 
// Passive Actions
{action: GameActions.GlobalPass | GameActions.BosunDetect | GameActions.BosunReduceFood | GameActions.BosunReducePellets | GameActions.GunnerDodge}
// Map Actions
| {action: GameActions.HelmsmanMove | GameActions.TopmanReveal | GameActions.GunnerMine | GameActions.GunnerFire, coordinates: Coordinate[]}
// Player Actions
| {action: GameActions.StewardBuff, class: Classes};


export interface IGame {
    gameboard: GameBoard;
    yonkadingo: Yonkadingo;
    aiShip: AIShip;
}
// #endregion
export default class Game implements IGame {
    // #region Attributes
    private _id: number;
    private _gameboard: GameBoard;
    private _yonka: Yonkadingo;
    private _ai: AIShip;

    // socket.id values of whoever is assigned to these classes for this game
    /** User.userId of the steward for this game. Empty string when nobody has this role. */
    private _steward: string;
    /** User.userId of the bosun for this game. Empty string when nobody has this role. */
    private _bosun: string;
    /** User.userId of the topman for this game. Empty string when nobody has this role. */
    private _topman: string;
    /** User.userId of the helmsman for this game. Empty string when nobody has this role. */
    private _helmsman: string;
    /** User.userId of the gunner for this game. Empty string when nobody has this role. */
    private _gunner: string;

    // Track Player Actions
    private _currentTurn: Classes;
    private _classToBuff: Classes;
    private _tilesRevealed: Coordinate[] = [];
    private _lastTilesMoved: Coordinate[] = [];
    private _resourceToReduce: ResourcesToReduce;
    // #endregion
    // #region Initialization
    constructor(gameId: number){
        const yonkaStartRow: number = Math.floor(Math.random()*ROW_COUNT);
        const yonkaStartColumn: number = Math.floor(Math.random()*COLUMN_COUNT);

        let aiStartRow: number, aiStartColumn: number;
        do{
            aiStartRow = Math.floor(Math.random() * ROW_COUNT);
        }while(aiStartRow === yonkaStartRow)
        do{
            aiStartColumn = Math.floor(Math.random() * COLUMN_COUNT);    
        }while(aiStartColumn === yonkaStartColumn)
    
        this._id = gameId;
        this._gameboard = new GameBoard(ROW_COUNT, COLUMN_COUNT);
        this._yonka = new Yonkadingo({row: yonkaStartRow, column: yonkaStartColumn});
        this._ai = new AIShip({row: aiStartRow, column: aiStartColumn});

        this._currentTurn = Classes.Steward;

        this._steward = "";
        this._bosun = "";
        this._topman = "";
        this._helmsman = "";
        this._gunner = "";
    }
    // #endregion
    // #region Getters
    public get currentTurn(){
        return this._currentTurn;
    }
    
    /** This is the same as the socket's RoomId */
    public get gameId(){
        return this._id;
    }
    public get gameboard(){
        return this._gameboard;
    }
    public get yonkadingo(){
        return this._yonka;
    }
    public get aiShip(){
        return this._ai;
    }
    /** `User.userId` of the steward for this game. Empty string when nobody has this role. */
    public get steward(){
        return this._steward;
    }
    /** `User.userId` of the bosun for this game. Empty string when nobody has this role. */
    public get bosun(){
        return this._bosun;
    }
    /** `User.userId` of the topman for this game. Empty string when nobody has this role. */
    public get topman(){
        return this._topman;
    }
    /** `User.userId` of the helmsman for this game. Empty string when nobody has this role. */
    public get helmsman(){
        return this._helmsman;
    }
    /** `User.userId` of the gunner for this game. Empty string when nobody has this role. */
    public get gunner(){
        return this._gunner;
    }
    // #endregion
    // #region Setters
    public setToFirstAvailableClass(socketId){
        if(this._steward === ""){
            this._steward = socketId;
            return Classes.Steward;
        }else if(this._bosun === ""){
            this._bosun = socketId;
            return Classes.Bosun;
        }else if(this._topman === ""){
            this._topman = socketId;
            return Classes.Topman;
        }else if(this._helmsman === ""){
            this._helmsman = socketId;
            return Classes.Helmsman;
        }else if(this._gunner === ""){
            this._gunner = socketId;
            return Classes.Gunner;
        }
        return null;
    }

    public setClass(socketId: string, classToSet: Classes): boolean{
        let isUserSetToNewClass = false;
        let usersPreviousClass = null;

        if(this._bosun === socketId){
            usersPreviousClass = Classes.Bosun;
            // console.log(`${socketId} was a Bosun`);
        }else if(this._gunner === socketId){
            usersPreviousClass = Classes.Gunner;
            // console.log(`${socketId} was a Gunner`);
        }else if(this._helmsman === socketId){
            usersPreviousClass = Classes.Helmsman;
            // console.log(`${socketId} was a Helmsman`);
        }else if(this._steward === socketId){
            usersPreviousClass = Classes.Steward;
            // console.log(`${socketId} was a Steward`);
        }else if(this._topman === socketId){
            usersPreviousClass = Classes.Topman;
            // console.log(`${socketId} was a Topman`);
        }

        // Had an bug caused by lack of parenthesis around the or statement.  
        // If the user was a class, it would set them to that class even if it wasn't their desired class.
        if(classToSet === Classes.Bosun && (this._bosun === "" || this._bosun === socketId)){
            // console.log("Setting user to bosun");
            this._bosun = socketId;
            isUserSetToNewClass = true;
        }else if(classToSet === Classes.Gunner && (this._gunner === "" || this._gunner === socketId)){
            // console.log("Setting user to gunner");
            this._gunner = socketId;
            isUserSetToNewClass = true;
        }else if(classToSet === Classes.Helmsman && (this._helmsman === "" || this._helmsman === socketId)){
            // console.log("Setting user to helmsman");
            this._helmsman = socketId;
            isUserSetToNewClass = true;
        }else if(classToSet === Classes.Steward && (this._steward === "" || this._steward === socketId)){
            // console.log("Setting user to steward");
            this._steward = socketId;
            isUserSetToNewClass = true;
        }else if(classToSet === Classes.Topman && (this._topman === "" || this._topman === socketId)){
            // console.log("Setting user to topman");
            this._topman = socketId;
            isUserSetToNewClass = true;
        }

        if(isUserSetToNewClass){
            if(usersPreviousClass === Classes.Bosun){
                this._bosun = "";
                // console.log(`${socketId} is no longer a Bosun`);
            }else if(usersPreviousClass === Classes.Gunner){
                this._gunner = "";
                // console.log(`${socketId} is no longer a Gunner`);
            }else if(usersPreviousClass === Classes.Helmsman){
                this._helmsman = "";
                // console.log(`${socketId} is no longer a Helmsman`);
            }else if(usersPreviousClass === Classes.Steward){
                this._steward = "";
                // console.log(`${socketId} is no longer a Steward`);
            }else if(usersPreviousClass === Classes.Topman){
                this._topman = "";
                // console.log(`${socketId} is no longer a Topman`);
            }
        }
        return isUserSetToNewClass;
    }
    // #endregion
    // #region USER HELPERS 
    /**
     * Checks every roll to see if the given socketId matches the role's socketId.  If it does, sets the role's socketId to an empty string.
     * @param socketId Id of user to remove from the roles of the game
     */
    public removeUserFromGame(socketId: string){
        if(this._bosun === socketId){
            this._bosun = "";
            console.log(`${rT}${socketId} Left!  Game ${this._id} lost their ${buT}Bosun${rT}!${ansiR}`);
        }
        if(this._gunner === socketId){
            this._gunner = "";
            console.log(`${rT}${socketId} Left!  Game ${this._id} lost their ${buT}Gunner${rT}!${ansiR}`);
        }
        if(this._helmsman === socketId){
            this._helmsman = "";
            console.log(`${rT}${socketId} Left!  Game ${this._id} lost their ${buT}Helmsman${rT}!${ansiR}`);
        }
        if(this._steward === socketId){
            this._steward = "";
            console.log(`${rT}${socketId} Left!  Game ${this._id} lost their ${buT}Steward${rT}!${ansiR}`);
        }
        if(this._topman === socketId){
            this._topman = "";
            console.log(`${rT}${socketId} Left!  Game ${this._id} lost their ${buT}Topman${rT}!${ansiR}`);
        }
    }

    public isEmpty = () => {
        return !(this._bosun || this._topman || this._gunner || this._helmsman || this._steward)
    }

    /** NOTE: THIS IS ONLY USED FOR THE ADMIN solo_game COMMAND!  DO NOT USE THIS FOR ANYTHING ELSE! */
    public setToAllClasses(socketId: string){
        this._steward = socketId;
        this._bosun = socketId;
        this._topman = socketId;
        this._helmsman = socketId;
        this._gunner = socketId;
    }

    public giveClassesForGame(){
        return({
            "steward": this._steward,
            "bosun": this._bosun,
            "topman": this._topman,
            "helmsman": this._helmsman,
            "gunner": this._gunner,
        });
    }
    // #endregion
    // #region TURN ORDER

    public progressTurn(){
        const turnOrder: Classes[] = [];
        // Check to see if the class has been assigned a user
        // If it has, then add the Class' enum value to the turnOrder array so we can advance properly.
        // This works even if people drop out and reenter
        const classKeys = Object.keys(Classes).filter(x => isNaN(Number(x)));
        classKeys.forEach((nameOfClass) => {
            // Check if a user is assigned to this class
            if(this[`_${nameOfClass.toLocaleLowerCase()}`]){
                // If so, put the class enum in the turn order
                turnOrder.push(Classes[nameOfClass]);
            }
        });
        // TODO OPTIMIZATION: Simply store the turn order and update as players enter and leave.
        const indexOfCurrentTurn = turnOrder.indexOf(this._currentTurn);
        let i = indexOfCurrentTurn + 1;
        if(i >= turnOrder.length){
            i = 0;
        }
        this._currentTurn = turnOrder[i];
        console.log("turnOrder advanced to", Classes[turnOrder[i]]);
    }
    // #endregion

    // #region Actions
    // STEWARD ACTION
    public buffClass(newClassToBuff: Classes){
        this._classToBuff = newClassToBuff;
        this.progressTurn();
    }

    // BOSUN ACTIONS
    public reduceFood(){
        this._resourceToReduce = ResourcesToReduce.Food;
        this.progressTurn();
    }

    public reducePellets(){
        this._resourceToReduce = ResourcesToReduce.Pellets;
        this.progressTurn();
    }
    
    public detectFood(){
        
    }

    public detectPellets(){

    }

    public detect(): string{
        this._resourceToReduce = ResourcesToReduce.None;
        if(this._ai.location.row > this._yonka.location.row){
            this.progressTurn();
            return "SHIP DETECTED SOUTH EAST OF YOU";
        }else if(this._ai.location.row < this._yonka.location.row){
            this.progressTurn();
            return "SHIP DETECTED NORTH EAST OF YOU";
        }else{
            this.progressTurn();
            return "SHIP DETECTED DIRECTLY EAST OF YOU";
        }
    }

    // TOPMAN ACTIONS
    public reveal(tilesToReveal: Coordinate[]){
        this._tilesRevealed = [...this._tilesRevealed, ...tilesToReveal];
        tilesToReveal.forEach(tileCoordinate => {
            this.gameboard.revealTile(tileCoordinate);
        });
        this.progressTurn();
    }

    // HELMSMAN ACTIONS
    public move(isYonkaMove: boolean, pathToMove: Coordinate[]) {
        this._lastTilesMoved = pathToMove;
        pathToMove.forEach(coordinate => {
            this.gameboard.moveShip(isYonkaMove ? this._yonka : this._ai, coordinate);
        });
        this._yonka.location = pathToMove[pathToMove.length - 1];
        this.progressTurn();
    }

    // GUNNER ACTIONS
    public mine(mineLocations: Coordinate[]){
        const areLocationsValid  = mineLocations.every(mineLocation => this._lastTilesMoved.find((tileMoved) => mineLocation.column === tileMoved.column && mineLocation.row === tileMoved.row) !== null)
        if(areLocationsValid){
            mineLocations.forEach(mineLocation => {this.gameboard.layMine(mineLocation);});
            this.progressTurn();
        }else{
            throw "The helmsman must have traveled over the tiles you wish to lay a mine on.";
        }
    }

    public fire(targets: Coordinate[]){
        if(targets.includes(this._ai.location)){
            this._ai.takeDamage(CANNON_DAMAGE);
        }
        if(targets.includes(this._yonka.location)){
            this._yonka.takeDamage(CANNON_DAMAGE);
        }
        this.progressTurn();
    }

    public dodge(isYonkaDodging: boolean){
        if(isYonkaDodging){
            this._yonka.dodge();
        }else{
            this._ai.dodge();
        }
        this.progressTurn();
    }

    // #endregion
}
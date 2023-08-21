import GameBoard from "./gameboard";
import Yonkadingo from "./yonkadingo";
import AIShip from "./ai";
import { Classes } from "./user";
import { Coordinate } from "./gameboard";

// Let players roll their die
// Let players take their actions
// Let AI take its turn

const COLUMN_COUNT = 14;
const ROW_COUNT = 7;
const CANNON_DAMAGE = 10;

export enum ResourcesToReduce {
    None = 1,
    Food,
    Pellets
}

export enum GameActions {
    // Global Actions
    Pass = 1,
    // Helmsman Actions
    Move,
    // Bosun Actions
    Detect,
    ReduceFood,
    ReducePellets,
    // Topman Actions
    Reveal,
    // Gunner Actions
    Mine,
    Fire,
    Dodge,
    // Steward Actions
    Buff
}

export type GameTurnInputs = 
// Passive Actions
{action: GameActions.Pass | GameActions.Detect | GameActions.ReduceFood | GameActions.ReducePellets | GameActions.Dodge}
// Map Actions
| {action: GameActions.Move | GameActions.Reveal | GameActions.Mine | GameActions.Fire, coordinates: Coordinate[]}
// Player Actions
| {action: GameActions.Buff, class: Classes};


export interface IGame {
    gameboard: GameBoard;
    yonkadingo: Yonkadingo;
    aiShip: AIShip;
}

export default class Game implements IGame {
    // Attributes
    private _id: number;
    private _gameboard: GameBoard;
    private _yonka: Yonkadingo;
    private _ai: AIShip;
    // Track Player Actions
    private _classToBuff: Classes;
    private _tilesRevealed: Coordinate[];
    private _lastTilesMoved: Coordinate[];
    private _resourceToReduce: ResourcesToReduce;

    constructor(gameId: number){
        this._id = gameId;
        this._gameboard = new GameBoard(ROW_COUNT, COLUMN_COUNT);
        this._yonka = new Yonkadingo({row: 0, column:3});
        this._ai = new AIShip({row: Math.floor(Math.random()*3), column: 2});
    }

    // Getters
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

    // STEWARD ACTION
    public buffClass(newClassToBuff: Classes){
        this._classToBuff = newClassToBuff;
    }

    // BOSUN ACTIONS
    public reduceFood(){
        this._resourceToReduce = ResourcesToReduce.Food;
    }

    public reducePellets(){
        this._resourceToReduce = ResourcesToReduce.Pellets;
    }

    public detect(): string{
        this._resourceToReduce = ResourcesToReduce.None;
        if(this._ai.location.row > this._yonka.location.row){
            return "SHIP DETECTED SOUTH EAST OF YOU";
        }else if(this._ai.location.row < this._yonka.location.row){
            return "SHIP DETECTED NORTH EAST OF YOU";
        }else{
            return "SHIP DETECTED DIRECTLY EAST OF YOU";
        }
    }

    // TOPMAN ACTIONS
    public reveal(tilesToReveal: Coordinate[]){
        this._tilesRevealed = [...this._tilesRevealed, ...tilesToReveal];
        tilesToReveal.forEach(tileCoordinate => {
            this.gameboard.revealTile(tileCoordinate);
        });
    }

    // HELMSMAN ACTIONS
    public move(isYonkaMove: boolean, pathToMove: Coordinate[]) {
        this._lastTilesMoved = pathToMove;
        pathToMove.forEach(coordinate => {
            this.gameboard.moveShip(isYonkaMove ? this._yonka : this._ai, coordinate);
        });
        this._yonka.location = pathToMove[pathToMove.length - 1];
    }

    // GUNNER ACTIONS
    public mine(mineLocations: Coordinate[]){
        const areLocationsValid  = mineLocations.every(mineLocation => this._lastTilesMoved.find((tileMoved) => mineLocation.column === tileMoved.column && mineLocation.row === tileMoved.row) !== null)
        if(areLocationsValid){
            mineLocations.forEach(mineLocation => {this.gameboard.layMine(mineLocation);});
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
    }

    public dodge(isYonkaDodging: boolean){
        if(isYonkaDodging){
            this._yonka.dodge();
        }else{
            this._ai.dodge();
        }
    }
}
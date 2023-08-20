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
| {action: GameActions.Move | GameActions.Reveal | GameActions.Mine | GameActions.Fire, Coordinate: Coordinate[]}
// Player Actions
| {action: GameActions.Buff, class: Classes};


export interface IGame {
    getGameboard: GameBoard;
    getYonkadingo: Yonkadingo;
    getAIShip: AIShip;
}

export default class Game implements IGame {
    // Attributes
    private id: number;
    private gameboard: GameBoard;
    private yonka: Yonkadingo;
    private ai: AIShip;
    // Track Player Actions
    private _classToBuff: Classes;
    private _tilesRevealed: Coordinate[];
    private _lastTilesMoved: Coordinate[];
    private _resourceToReduce: ResourcesToReduce;

    constructor(gameId: number){
        this.id = gameId;
        this.gameboard = new GameBoard(ROW_COUNT, COLUMN_COUNT);
        this.yonka = new Yonkadingo({row: 0, column:3});
        this.ai = new AIShip({row: Math.floor(Math.random()*3), column: 2});
    }

    // Getters
    /** This is the same as the socket's RoomId */
    public get getGameId(){
        return this.id;
    }
    public get getGameboard(){
        return this.gameboard;
    }
    public get getYonkadingo(){
        return this.yonka;
    }
    public get getAIShip(){
        return this.ai;
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
        if(this.ai.location.row > this.yonka.location.row){
            return "SHIP DETECTED SOUTH EAST OF YOU";
        }else if(this.ai.location.row < this.yonka.location.row){
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
            this.gameboard.moveShip(isYonkaMove ? this.yonka : this.ai, coordinate);
        });
        this.yonka.location = pathToMove[pathToMove.length - 1];
    }

    // GUNNER ACTIONS
    public mine(mineLocation: Coordinate){
        if(this._lastTilesMoved.find((tileMoved) => mineLocation.column === tileMoved.column && mineLocation.row === tileMoved.row) !== null){
            this.gameboard.layMine(mineLocation);
        }else{
            throw "The helmsman must have traveled over the tile you wish to lay a mine on.";
        }
    }
    
}
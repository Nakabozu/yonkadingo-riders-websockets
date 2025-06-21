import { Coordinate } from "./gameboard";
import { ansiR, buT, gT, rT, yT } from "./helper";
import Yonkadingo from "./yonkadingo";

export type ShipSummary = {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
    isDodging: boolean;
}

// The parent of the yonkadingo and ai class
export interface IShip {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
    isDodging: boolean;
    lastTilesMoved: Coordinate[];
    move(moveTo: Coordinate[]): void;
    heal(healingAmount: number): void;
    takeDamage(amountOfDamage: number): void;
    addFood(foodToAdd: number): void;
    addPellets(pelletsToAdd: number): void;
    dodge(): void;
}

export default class Ship implements IShip {
    private _location: Coordinate;
    private _hp: number;
    private _food: number;
    private _pellets: number;
    private _isDodging: boolean;
    private _lastTilesMoved: Coordinate[] = [];

    constructor(startingLocation: Coordinate){
        this._location = startingLocation;
        this._hp = 50;
        this._food = 10;
        this._pellets = 10;
        this._isDodging = false;
    }

    // GETTERS
    get this() : ShipSummary {
        return {
            location: this._location,
            hp: this._hp,
            food: this._food,
            pellets: this._pellets,
            isDodging: this._isDodging,
        }
    }

    get location(): Coordinate{
        return this._location;
    }

    get hp(): number{
        return this._hp;
    }

    get food(): number{
        return this._food;
    }

    get pellets(): number{
        return this._pellets;
    }

    get isDodging(): boolean{
        return this._isDodging;
    }

    public get lastTilesMoved(): Coordinate[] {
        return this._lastTilesMoved;
    }

    // FUNCTIONS
    move(moveOver: Coordinate[]): void {
        if(!moveOver || !moveOver?.length || moveOver.length <= 0){
            console.error(`${rT}Cannot move to an empty array of coordinates.${ansiR}`);
            return;
        }
        this._lastTilesMoved = moveOver.slice(0, moveOver.length - 1); // Store all but the last tile moved
        this._location = moveOver[moveOver.length - 1];
    }

    heal(healingAmount: number): void{
        console.log(`Healing for ${gT}${healingAmount}${ansiR} HP.`);
        this._hp += healingAmount;
    }

    takeDamage(amountOfDamage: number): void{
        console.log(`Taking ${rT}${amountOfDamage}${ansiR} damage.`);
        this._hp = Math.max(this._hp - amountOfDamage, 0);
    }

    addFood(foodToAdd: number): void{
        if(foodToAdd < 0){
            console.log(`Removing ${rT}${Math.abs(foodToAdd)}${ansiR} food.`);
        } else {
            console.log(`Adding ${gT}${foodToAdd}${ansiR} food.`);
        }
        this._food = Math.max(this._food + foodToAdd, 0);
    }

    addPellets(pelletsToAdd: number): void{
        if(pelletsToAdd < 0){
            console.log(`Removing ${yT}${Math.abs(pelletsToAdd)}${ansiR} pellets.`);
        } else {
            console.log(`Adding ${buT}${pelletsToAdd}${ansiR} pellets.`);
        }
        this._pellets = Math.max(this._pellets + pelletsToAdd, 0);
    }

    dodge(): void{
        this._isDodging = true;
    }
}
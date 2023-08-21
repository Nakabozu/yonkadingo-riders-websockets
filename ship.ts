import { Coordinate } from "./gameboard";

// The parent of the yonkadingo and ai class
export interface IShip {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
}

export default class Ship{
    private _location: Coordinate;
    private _hp: number;
    private _food: number;
    private _pellets: number;
    private _isDodging: boolean;

    constructor(startingLocation: Coordinate){
        this._location = startingLocation;
        this._hp = 50;
        this._food = 10;
        this._pellets = 10;
    }

    // GETTERS
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

    // SETTERS
    set location(newCoordinates: Coordinate){
        this._location = newCoordinates;
    }

    // FUNCTIONS
    move(moveTo: Coordinate): void {
        this._location = moveTo;
    }

    heal(healingAmount: number): void{
        this._hp += healingAmount;
    }

    takeDamage(amountOfDamage: number): void{
        this._hp = Math.max(this._hp - amountOfDamage, 0);
    }

    addFood(foodToAdd: number): void{
        this._food = Math.max(this._food + foodToAdd, 0);
    }

    addPellets(pelletsToAdd: number): void{
        this._pellets = Math.max(this._pellets + pelletsToAdd, 0);
    }

    dodge(): void{
        this._isDodging = true;
    }
}
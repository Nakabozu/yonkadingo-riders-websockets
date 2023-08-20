import { Coordinate } from "./gameboard";

// The parent of the yonkadingo and ai class
export interface IShip {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
}

export default class Ship{
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;

    constructor(startingLocation: Coordinate){
        this.location = startingLocation;
        this.hp = 50;
        this.food = 10;
        this.pellets = 10;
    }

    move(moveTo: Coordinate): void {
        this.location = moveTo;
    }
}
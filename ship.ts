import { Coordinate } from "./gameboard";
import GameBoardTile, {
    ResourceTypes,
    TileSummary,
    Weathers,
} from "./gameboardtile";
import { ansiR, buT, gT, mT, rB, rT, wT, yT } from "./helper";
import Yonkadingo from "./yonkadingo";

export type ShipSummary = {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
    isDodging: boolean;
    extraMoves: number;
    lastTilesMoved: Coordinate[];
};

// The parent of the yonkadingo and ai class
export interface IShip {
    location: Coordinate;
    hp: number;
    food: number;
    pellets: number;
    isDodging: boolean;
    lastTilesMoved: Coordinate[];
    move(moveTo: (TileSummary & { location: Coordinate })[]): void;
    heal(healingAmount: number): void;
    takeDamage(amountOfDamage: number): void;
    addFood(foodToAdd: number): void;
    addPellets(pelletsToAdd: number): void;
    dodge(): void;
}

export default class Ship implements IShip {
    private _hp: number;
    private _food: number;
    private _pellets: number;
    private _isDodging: boolean;
    private _extraMoves: number;
    private _lastTilesMoved: Coordinate[] = [];

    constructor(startingLocation: Coordinate) {
        this._lastTilesMoved = [startingLocation];
        this._hp = 50;
        this._food = 10;
        this._pellets = 10;
        this._extraMoves = 0;
        this._isDodging = false;
    }

    // GETTERS
    get shipSummary(): ShipSummary {
        return {
            location: this.location,
            hp: this._hp,
            food: this._food,
            pellets: this._pellets,
            isDodging: this._isDodging,
            extraMoves: this._extraMoves,
            lastTilesMoved: this._lastTilesMoved,
        };
    }

    get location(): Coordinate {
        return this._lastTilesMoved[this._lastTilesMoved.length - 1];
    }

    get hp(): number {
        return this._hp;
    }

    get food(): number {
        return this._food;
    }

    get pellets(): number {
        return this._pellets;
    }

    get isDodging(): boolean {
        return this._isDodging;
    }

    get extraMoves(): number {
        return this._extraMoves;
    }

    public get lastTilesMoved(): Coordinate[] {
        return this._lastTilesMoved;
    }

    // FUNCTIONS
    //#region SHIP MOVE
    /**
     * The logic for moving the ship.  This does a lot of things, including:
     * - Taking damage if the ship moves over a mine
     * - Collecting resources if the ship moves over a tile with resources
     * - Adding a tailwind counter to the ship for tailwind tiles.
     * @param tilesToMoveOver The details of the tiles that the ship will move over
     * AND the coordinates of those tiles.
     * This function **DOES NOT ACCOUNT FOR HEADWIND** so factor this in before passing
     * the `tilesToMoveOver` argument.
     */
    move(tilesToMoveOver: (TileSummary & { location: Coordinate })[]): void {
        ////////////////////
        // ERROR HANDLING //
        ////////////////////
        if (
            !tilesToMoveOver ||
            !tilesToMoveOver?.length ||
            tilesToMoveOver.length <= 0
        ) {
            console.error(
                `${rT}Cannot move to an empty array of coordinates.${ansiR}`
            );
            return;
        }

        //////////////////////////////////
        // SETUP SHIP STATE BEFORE MOVE //
        //////////////////////////////////
        this._lastTilesMoved = [this.location];

        tilesToMoveOver.forEach((tileMovedOver) => {
            ///////////////////
            // TAKING DAMAGE //
            ///////////////////
            if (tileMovedOver.hasMine) {
                if (this._isDodging) {
                    console.log(`${gT}Ship dodged the mine!${ansiR}`);
                    this._isDodging = false; // Reset dodging state after successful dodge
                } else {
                    this.takeDamage(10);
                }
                console.log(`${rT}Ship hit a mine!${ansiR}`);
                if (this._hp <= 0) {
                    console.log(`${rB}${wT}GAME OVER!${ansiR}`);
                    return;
                }
            }
            ///////////////////////
            // GETTING RESOURCES //
            ///////////////////////
            if (tileMovedOver.resourceType === ResourceTypes.Food) {
                let foodToAdd = tileMovedOver.resourceCount;
                if (
                    tileMovedOver.weather === Weathers.Famine &&
                    tileMovedOver.resourceCount > 0
                ) {
                    foodToAdd = 0;
                    console.log(
                        `Ship moved over tile with ${rT}${
                            Weathers[tileMovedOver.weather]
                        }${ansiR}, collecting no food!`
                    );
                }
                if (tileMovedOver.weather === Weathers.FeedingFrenzy) {
                    if (tileMovedOver.resourceCount < 0) {
                        foodToAdd = Math.abs(tileMovedOver.resourceCount);
                    } else {
                        foodToAdd = tileMovedOver.resourceCount * 2;
                    }
                    console.log(
                        `Ship moved over tile with ${gT}${
                            Weathers[tileMovedOver.weather]
                        }${ansiR}, collecting bonus food!`
                    );
                }
                this.addFood(foodToAdd);
            }
            if (tileMovedOver.resourceType === ResourceTypes.Pellets) {
                let pelletsToAdd = tileMovedOver.resourceCount;
                if (
                    tileMovedOver.weather === Weathers.NewMoon &&
                    tileMovedOver.resourceCount > 0
                ) {
                    pelletsToAdd = 0;
                    console.log(
                        `Ship moved over tile with ${yT}${
                            Weathers[tileMovedOver.weather]
                        }${ansiR}, collecting no pellets!`
                    );
                }
                if (tileMovedOver.weather === Weathers.FullMoon) {
                    if (tileMovedOver.resourceCount < 0) {
                        pelletsToAdd = Math.abs(tileMovedOver.resourceCount);
                    } else {
                        pelletsToAdd = tileMovedOver.resourceCount * 2;
                    }
                    console.log(
                        `Ship moved over tile with ${buT}${
                            Weathers[tileMovedOver.weather]
                        }${ansiR}, collecting bonus pellets!`
                    );
                }
                this.addPellets(pelletsToAdd);
            }
            //////////////
            // MOVEMENT //
            //////////////
            if (tileMovedOver.weather === Weathers.Tailwind) {
                console.log(
                    `Ship moved over tile with ${rT}${
                        Weathers[tileMovedOver.weather]
                    }${ansiR}, gaining a free move next turn!`
                );
                this._extraMoves++;
            }
            this._lastTilesMoved.push(tileMovedOver.location);
            // HEADWIND EFFECTS ARE ACCOUNTED FOR IN THE `moveShip` GAMEBOARD FUNCTION
        });
    }
    //#endregion
    heal(healingAmount: number): void {
        console.log(`Healing for ${gT}${healingAmount}${ansiR} HP.`);
        this._hp += healingAmount;
    }

    takeDamage(amountOfDamage: number): void {
        console.log(`Taking ${rT}${amountOfDamage}${ansiR} damage.`);
        this._hp = Math.max(this._hp - amountOfDamage, 0);
    }

    addFood(foodToAdd: number): void {
        if (foodToAdd < 0) {
            console.log(`Removing ${rT}${Math.abs(foodToAdd)}${ansiR} food.`);
        } else if (foodToAdd > 0) {
            console.log(`Adding ${gT}${foodToAdd}${ansiR} food.`);
        }
        this._food = Math.max(this._food + foodToAdd, 0);
    }

    addPellets(pelletsToAdd: number): void {
        if (pelletsToAdd < 0) {
            console.log(
                `Removing ${yT}${Math.abs(pelletsToAdd)}${ansiR} pellets.`
            );
        } else if (pelletsToAdd > 0) {
            console.log(`Adding ${buT}${pelletsToAdd}${ansiR} pellets.`);
        }
        this._pellets = Math.max(this._pellets + pelletsToAdd, 0);
    }

    dodge(): void {
        this._isDodging = true;
    }
}

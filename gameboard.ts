import GameBoardTile, {
    ResourceTypes,
    TileSummary,
    Weathers,
} from "./gameboardtile";
import { IShip } from "./ship";
import {
    ansiR,
    bB,
    bT,
    buT,
    cB,
    cT,
    gT,
    letterLookup,
    mT,
    rT,
    yT,
} from "./helper";

export type Coordinate = {
    row: number;
    column: number;
};

export type Direction = "up" | "right" | "down" | "left";

export default class GameBoard {
    private _totalColumns: number;
    private _totalRows: number;
    private _tiles: GameBoardTile[][] = [];
    private _mostFood: string = "";
    private _mostPellets: string = "";
    /** The tiles the helmsman moved over this turn */
    private _helmsmanMoveTiles: Coordinate[];

    public constructor(
        rowCount: number,
        columnCount: number,
        yonkaCoords: Coordinate
    ) {
        this._totalRows = rowCount;
        this._totalColumns = columnCount;

        this.initializeNewBoard(yonkaCoords);
    }

    // //////////////// //
    // #region  GETTERS //
    // //////////////// //

    public getTile = (tileLocation: Coordinate): GameBoardTile => {
        return this._tiles[tileLocation?.row][tileLocation?.column];
    };

    public getRevealedBoard = (
        yonkadingoLocation: Coordinate,
        aiLocation: Coordinate
    ): ((TileSummary & { hasYonka: boolean; hasAI: boolean }) | null)[][] => {
        let resultBoard: (
            | (TileSummary & { hasYonka: boolean; hasAI: boolean })
            | null
        )[][] = [];

        console.log(`${cB}${bT}REVEALING THE BOARD${ansiR}`);
        console.log(
            `${cT}Yonkadingo is at ${bB}${mT}${yonkadingoLocation.row + 1}, ${
                letterLookup[yonkadingoLocation.column]
            }${ansiR}`
        );
        console.log(
            `${cT}AI is at ${bB}${mT}${aiLocation.row + 1}, ${
                letterLookup[aiLocation.column]
            }${ansiR}`
        );

        this._tiles.forEach((row: GameBoardTile[], rowIndex: number) => {
            row.forEach((tile: GameBoardTile, colIndex: number) => {
                if (colIndex === 0) {
                    resultBoard.push([]);
                }
                // if (tile.isRevealed || tile.isVisited) {
                resultBoard[rowIndex].push({
                    isRevealed: true, //tile.isRevealed,
                    isVisited: true, //tile.isVisited,
                    hasMine: tile.hasMine,
                    weather: tile.visibleWeather,
                    resourceType: tile.tileSummary.resourceType,
                    resourceCount: tile.tileSummary.resourceCount,
                    hasYonka:
                        rowIndex === yonkadingoLocation.row &&
                        colIndex === yonkadingoLocation.column,
                    hasAI:
                        rowIndex === aiLocation.row &&
                        colIndex === aiLocation.column,
                });
                // } else {
                //     resultBoard[rowIndex].push(null);
                // }
            });
        });

        // console.log("Here be the tiles yee can see", resultBoard);
        return resultBoard;
    };

    public get rowCount() {
        return this._tiles.length;
    }

    public get columnCount() {
        return this._tiles.at(0)?.length;
    }

    public get mostFood() {
        this.calculateMostFoodAndPellets();
        return this._mostFood;
    }

    public get mostPellets() {
        this.calculateMostFoodAndPellets();
        return this._mostPellets;
    }

    // //////////////////////// //
    // #region HELPER FUNCTIONS //
    // //////////////////////// //

    private initializeNewBoard = (yonkaCoords: Coordinate): void => {
        for (let r = 0; r < this._totalRows; r++) {
            for (let c = 0; c < this._totalColumns; c++) {
                if (!this._tiles[r]) {
                    this._tiles[r] = [];
                }
                this._tiles[r].push(new GameBoardTile());
            }
        }
        this.calculateMostFoodAndPellets();
        // Reveal the row that contains the Yonkadingo
        this._tiles[yonkaCoords.row][yonkaCoords.column].isRevealed = true;
        // These two functions guarantee that the tile the Yonkadingo is on is clear
        this._tiles[yonkaCoords.row][yonkaCoords.column].clearWeather();
        this._tiles[yonkaCoords.row][yonkaCoords.column].moveOverTile();
    };

    /**
     * Assigns `this._mostFood` and `this._mostPellets` to a string
     * indicating which row or column on the gameboard has the most of the respective resource
     */
    private calculateMostFoodAndPellets = () => {
        let rowFoodCount = new Array(this._totalRows);
        let rowPelletCount = new Array(this._totalRows);
        let columnFoodCount = new Array(this._totalColumns);
        let columnPelletCount = new Array(this._totalColumns);

        for (let r = 0; r < this._totalRows; r++) {
            rowFoodCount[r] = 0;
            rowPelletCount[r] = 0;
        }
        for (let c = 0; c < this._totalColumns; c++) {
            columnFoodCount[c] = 0;
            columnPelletCount[c] = 0;
        }

        for (let r = 0; r < this._totalRows; r++) {
            for (let c = 0; c < this._totalColumns; c++) {
                if (
                    this._tiles[r][c].tileSummary.resourceType ===
                    ResourceTypes.Food
                ) {
                    rowFoodCount[r] +=
                        this._tiles[r][c].tileSummary.resourceCount;
                    columnFoodCount[c] +=
                        this._tiles[r][c].tileSummary.resourceCount;
                } else if (
                    this._tiles[r][c].tileSummary.resourceType ===
                    ResourceTypes.Pellets
                ) {
                    rowPelletCount[r] +=
                        this._tiles[r][c].tileSummary.resourceCount;
                    columnPelletCount[c] +=
                        this._tiles[r][c].tileSummary.resourceCount;
                }
            }
        }

        let biggest = 0;
        rowFoodCount.forEach((r, i) => {
            if (r > biggest) {
                biggest = r;
                this._mostFood = `Row ${i + 1}`;
            }
        });
        columnFoodCount.forEach((c, i) => {
            if (c > biggest) {
                biggest = c;
                this._mostFood = `Column ${i + 1}`;
            }
        });
        biggest = 0;
        rowPelletCount.forEach((r, i) => {
            if (r > biggest) {
                biggest = r;
                this._mostPellets = `Row ${letterLookup[i]}`;
            }
        });
        columnPelletCount.forEach((c, i) => {
            if (c > biggest) {
                biggest = c;
                this._mostPellets = `Column ${letterLookup[i]}`;
            }
        });

        console.log(
            `${cT}MOST FOOD: ${bB}${mT}${this._mostFood}${ansiR} ${cT}MOST PELLETS: ${bB}${mT}${this._mostPellets}${ansiR}`
        );
    };

    // TODO: Refresh board doesn't... ya know... reset the board?
    public refreshBoard = (): void => {
        this._tiles.forEach((row: GameBoardTile[]) => {
            row.forEach((tile: GameBoardTile) => {
                const wasTileMined = tile.hasMine;
            });
        });
    };

    // ////////////// //
    // #region PLAYER ACTIONS //
    // ////////////// //
    public revealTile = (locationToReveal: Coordinate) => {
        this._tiles[locationToReveal.row][locationToReveal.column].isRevealed =
            true;
    };

    public revealTiles = (locationsToReveal: Coordinate[]) => {
        locationsToReveal.forEach((locationToReveal: Coordinate) => {
            this.revealTile(locationToReveal);
        });
    };

    public moveShip = (shipToMove: IShip, newLocations: Coordinate[]): void => {
        // For each tile that the ship moves over, if that tile is a tailwind tile,
        // they will lose the last move on the stack.
        const finalCoordsAfterTailwind = [...newLocations];
        const finalTilesAfterTailwind = [];
        for (let i = 0; i < finalCoordsAfterTailwind.length; i++) {
            const location = finalCoordsAfterTailwind[i];
            console.log(
                `Moving to ${letterLookup[location.column]},${location.row}`
            );

            const tile = this._tiles[location.row][location.column];

            finalTilesAfterTailwind.push({
                ...tile.tileSummary,
                location: finalCoordsAfterTailwind[i],
            });

            if (tile.visibleWeather === Weathers.Headwind) {
                finalCoordsAfterTailwind.pop();
                console.log(
                    `${rT}Headwind!${ansiR} The ship won't move to this tile!`,
                    tile.tileSummary
                );
            }

            // Clear tile of certain effects and hazards when moved over
            tile.moveOverTile();
        }

        // Lots of ship logic like taking damage and collecting resources
        shipToMove.move(finalTilesAfterTailwind);
    };

    public layMine = (locationToLayMine: Coordinate) => {
        this._tiles[locationToLayMine.row][
            locationToLayMine.column
        ].placeHazard();
    };
}

import GameBoardTile from "./gameboardtile";
import { IShip } from "./ship";

export type Coordinate = {
    row: number;
    column: number;
}

export default class GameBoard {
    private totalColumns: number;
    private totalRows: number;
    private tiles: GameBoardTile[][] = [];

    public constructor(rowCount: number, columnCount: number){
        this.totalRows = rowCount;
        this.totalColumns = columnCount;

        for(let r = 0; r < this.totalColumns; r++){
            for(let c = 0; c < this.totalRows; c++){
                if(!this.tiles[r]){
                    this.tiles[r] = [];
                }
                this.tiles[r].push(new GameBoardTile());
            }
        }
    }

    public resetBoard = (): void => {
        this.tiles.forEach((row: GameBoardTile[]) => {
            row.forEach((tile: GameBoardTile) => {
                const wasTileMined = tile.hasMine;
            });
        });
    }

    public moveShip = (shipToMove: IShip, newLocation: Coordinate): void => {
        // Simply setting to the respectiveShip to last location in the travel
        shipToMove.location = newLocation;
    }

    public layMine = (locationToLayMine: Coordinate) => {
        this.tiles[locationToLayMine.row][locationToLayMine.column].placeHazard();
    }

    public revealTile = (locationToReveal: Coordinate) => {
        this.tiles[locationToReveal.row][locationToReveal.column].isRevealed = true;
    }
}
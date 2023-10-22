import GameBoardTile from "./gameboardtile";
import { IShip } from "./ship";

export type Coordinate = {
    row: number;
    column: number;
}

export default class GameBoard {
    private _totalColumns: number;
    private _totalRows: number;
    private _tiles: GameBoardTile[][] = [];

    public constructor(rowCount: number, columnCount: number){
        this._totalRows = rowCount;
        this._totalColumns = columnCount;

        this.initializeNewBoard();
    }

    // /////// //
    // GETTERS //
    // /////// //
    public getRevealedBoard = (): (GameBoardTile | null)[][] => {
        let resultBoard: (GameBoardTile | null)[][] = [];

        this._tiles.forEach((row: GameBoardTile[], rowIndex: number) => {
            row.forEach((tile: GameBoardTile, colIndex: number) => {
                if(colIndex === 0){
                    resultBoard.push([]);
                }if(tile.isRevealed){
                    resultBoard[rowIndex].push(tile);
                }else{
                    resultBoard[rowIndex].push(null);
                }
            });
        });

        console.log("Here be the tiles yee can see", resultBoard);
        return resultBoard;
    }

    // //////////////// //
    // HELPER FUNCTIONS //
    // //////////////// //

    private initializeNewBoard = (): void => {
        for(let r = 0; r < this._totalColumns; r++){
            for(let c = 0; c < this._totalRows; c++){
                if(!this._tiles[r]){
                    this._tiles[r] = [];
                }
                this._tiles[r].push(new GameBoardTile());
            }
        }
    }

    // TODO: Refresh board doesn't... ya know... reset the board?
    public refreshBoard = (): void => {
        this._tiles.forEach((row: GameBoardTile[]) => {
            row.forEach((tile: GameBoardTile) => {
                const wasTileMined = tile.hasMine;
            });
        });
    }

    // ////////////// //
    // PLAYER ACTIONS //
    // ////////////// //
    public moveShip = (shipToMove: IShip, newLocation: Coordinate): void => {
        // Simply setting to the respectiveShip to last location in the travel
        shipToMove.location = newLocation;
    }

    public layMine = (locationToLayMine: Coordinate) => {
        this._tiles[locationToLayMine.row][locationToLayMine.column].placeHazard();
    }

    public revealTile = (locationToReveal: Coordinate) => {
        this._tiles[locationToReveal.row][locationToReveal.column].isRevealed = true;
    }
}
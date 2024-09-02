import GameBoardTile, { ResourceTypes, TileSummary } from "./gameboardtile";
import { IShip } from "./ship";
import { ansiR, bB, bT, cT, letterLookup, mT, yT } from "./helper";

export type Coordinate = {
    row: number;
    column: number;
}

export default class GameBoard {
    private _totalColumns: number;
    private _totalRows: number;
    private _tiles: GameBoardTile[][] = [];
    private _mostFood: string = "";
    private _mostPellets: string = "";

    public constructor(rowCount: number, columnCount: number){
        this._totalRows = rowCount;
        this._totalColumns = columnCount;

        this.initializeNewBoard();
    }

    // /////// //
    // GETTERS //
    // /////// //
    public getTile = (tileLocation: Coordinate): GameBoardTile => {
        return this._tiles[tileLocation?.row][tileLocation?.column];
    }

    public getRevealedBoard = (yonkadingoLocation: Coordinate, aiLocation: Coordinate): ((TileSummary & {hasYonka: boolean, hasAI: boolean}) | null)[][] => {
        let resultBoard: ((TileSummary & {hasYonka: boolean, hasAI: boolean}) | null)[][] = [];

        this._tiles.forEach((row: GameBoardTile[], rowIndex: number) => {
            row.forEach((tile: GameBoardTile, colIndex: number) => {
                if(colIndex === 0){
                    resultBoard.push([]);
                }if(tile.isRevealed){
                    resultBoard[rowIndex].push({
                        isRevealed: tile.isRevealed,
                        hasMine: tile.hasMine,
                        weather: tile.tileSummary.weather,
                        resourceType: tile.tileSummary.resourceType,
                        resourceCount: tile.tileSummary.resourceCount,
                        hasYonka: rowIndex === yonkadingoLocation.row && colIndex === yonkadingoLocation.column,
                        hasAI: rowIndex === aiLocation.row && colIndex === aiLocation.column,
                    });
                }else{
                    resultBoard[rowIndex].push(null);
                }
            });
        });

        // console.log("Here be the tiles yee can see", resultBoard);
        return resultBoard;
    }

    public get mostFood(){
        return this._mostFood;
    }

    public get mostPellets(){
        return this._mostPellets;
    }

    // //////////////// //
    // HELPER FUNCTIONS //
    // //////////////// //

    private initializeNewBoard = (): void => {
        for(let r = 0; r < this._totalRows; r++){
            for(let c = 0; c < this._totalColumns; c++){
                if(!this._tiles[r]){
                    this._tiles[r] = [];
                }
                this._tiles[r].push(new GameBoardTile());
            }
        }
        this.calculateMostFoodAndPellets();
    }

    /**
     * Assigns `this._mostFood` and `this._mostPellets` to a string 
     * indicating which row or column on the gameboard has the most of the respective resource
     */
    private calculateMostFoodAndPellets = () => {
        let rowFoodCount = new Array(this._totalRows);
        let rowPelletCount = new Array(this._totalRows);
        let columnFoodCount = new Array(this._totalColumns);
        let columnPelletCount = new Array(this._totalColumns);

        for(let r = 0; r < this._totalRows; r++){
            rowFoodCount[r] = 0;
            rowPelletCount[r] = 0;
        }
        for(let c = 0; c < this._totalColumns; c++){
            columnFoodCount[c] = 0;
            columnPelletCount[c] = 0;
        }

        for(let r = 0; r < this._totalRows; r++){
            for(let c = 0; c < this._totalColumns; c++){
                if(this._tiles[r][c].tileSummary.resourceType === ResourceTypes.Food){
                    rowFoodCount[r] += this._tiles[r][c].tileSummary.resourceCount;
                    columnFoodCount[c] += this._tiles[r][c].tileSummary.resourceCount;
                }
                else if(this._tiles[r][c].tileSummary.resourceType === ResourceTypes.Pellets){
                    rowPelletCount[r] += this._tiles[r][c].tileSummary.resourceCount;
                    columnPelletCount[c] += this._tiles[r][c].tileSummary.resourceCount;
                }
            }
        }

        let biggest = 0;
        rowFoodCount.forEach((r, i)=>{
            if(r > biggest){
                biggest = r;
                this._mostFood = `Row ${i+1}`
            }
        });
        columnFoodCount.forEach((c, i)=>{
            if(c > biggest){
                biggest = c;
                this._mostFood = `Column ${i+1}`
            }
        })
        biggest = 0;
        rowPelletCount.forEach((r, i)=>{
            if(r > biggest){
                biggest = r;
                this._mostPellets = `Row ${letterLookup[i]}`
            }
        });
        columnPelletCount.forEach((c, i)=>{
            if(c > biggest){
                biggest = c;
                this._mostPellets = `Column ${letterLookup[i]}`
            }
        });

        console.log(`${cT}MOST FOOD: ${bB}${mT}${this._mostFood}${ansiR} ${cT}MOST PELLETS: ${bB}${mT}${this._mostPellets}${ansiR}`)

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
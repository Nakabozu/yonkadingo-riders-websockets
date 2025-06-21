import GameBoardTile, { ResourceTypes, TileSummary, Weathers } from "./gameboardtile";
import { IShip } from "./ship";
import { ansiR, bB, bT, buT, cT, gT, letterLookup, mT, rT, yT } from "./helper";

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
    /** The tiles the helmsman moved over this turn */
    private _helmsmanMoveTiles: Coordinate[];

    public constructor(rowCount: number, columnCount: number, yonkaCoords: Coordinate){
        this._totalRows = rowCount;
        this._totalColumns = columnCount;

        this.initializeNewBoard(yonkaCoords);
    }

    // //////////////// //
    // #region  GETTERS //
    // //////////////// //
    public getTile = (tileLocation: Coordinate): GameBoardTile => {
        return this._tiles[tileLocation?.row][tileLocation?.column];
    }

    public getRevealedBoard = (yonkadingoLocation: Coordinate, aiLocation: Coordinate): ((TileSummary & {hasYonka: boolean, hasAI: boolean}) | null)[][] => {
        let resultBoard: ((TileSummary & {hasYonka: boolean, hasAI: boolean}) | null)[][] = [];

        this._tiles.forEach((row: GameBoardTile[], rowIndex: number) => {
            row.forEach((tile: GameBoardTile, colIndex: number) => {
                if(colIndex === 0){
                    resultBoard.push([]);
                }if(tile.isRevealed || tile.isPassedOver){
                    resultBoard[rowIndex].push({
                        isRevealed: tile.isRevealed,
                        isPassedOver: tile.isPassedOver,
                        hasMine: tile.hasMine,
                        weather: tile.visibleWeather,
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

    // //////////////////////// //
    // #region HELPER FUNCTIONS //
    // //////////////////////// //

    private initializeNewBoard = (yonkaCoords: Coordinate): void => {
        for(let r = 0; r < this._totalRows; r++){
            for(let c = 0; c < this._totalColumns; c++){
                if(!this._tiles[r]){
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
    // #region PLAYER ACTIONS //
    // ////////////// //
    public revealTile = (locationToReveal: Coordinate) => {
        this._tiles[locationToReveal.row][locationToReveal.column].isRevealed = true;
    }

    public revealTiles = (locationsToReveal: Coordinate[]) => {
        locationsToReveal.forEach((locationToReveal: Coordinate) => {
            this.revealTile(locationToReveal);
        });
    }

    public moveShip = (shipToMove: IShip, newLocation: Coordinate): void => {
        const tileMovedOver = this._tiles[newLocation.row][newLocation.column].this;
        if(tileMovedOver.hasMine){
            shipToMove.takeDamage(10);
            console.log(`${rT}Ship hit a mine!${ansiR}`);
        }
        if(tileMovedOver.resourceType === ResourceTypes.Food){
            let foodToAdd = tileMovedOver.resourceCount;
            if(tileMovedOver.weather === Weathers.Famine && tileMovedOver.resourceCount > 0){
                foodToAdd = 0;
                console.log(`Ship moved over tile with ${rT}${tileMovedOver.weather}${ansiR}, collecting no food!`);
            }
            if(tileMovedOver.weather === Weathers.FeedingFrenzy){
                if(tileMovedOver.resourceCount < 0){
                    foodToAdd = Math.abs(tileMovedOver.resourceCount);
                }else{
                    foodToAdd = tileMovedOver.resourceCount * 2;
                }
                console.log(`Ship moved over tile with ${gT}${tileMovedOver.weather}${ansiR}, collecting bonus food!`);
            }
            shipToMove.addFood(foodToAdd);
        }
        if(tileMovedOver.resourceType === ResourceTypes.Pellets){
            let pelletsToAdd = tileMovedOver.resourceCount;
            if(tileMovedOver.weather === Weathers.NewMoon && tileMovedOver.resourceCount > 0){
                pelletsToAdd = 0;
                console.log(`Ship moved over tile with ${yT}${tileMovedOver.weather}${ansiR}, collecting no pellets!`);
            }
            if(tileMovedOver.weather === Weathers.FullMoon){
                if(tileMovedOver.resourceCount < 0){
                    pelletsToAdd = Math.abs(tileMovedOver.resourceCount);
                }else{
                    pelletsToAdd = tileMovedOver.resourceCount * 2;
                }
                console.log(`Ship moved over tile with ${buT}${tileMovedOver.weather}${ansiR}, collecting bonus pellets!`);
            }
            shipToMove.addPellets(pelletsToAdd);
        }
    }

    public layMine = (locationToLayMine: Coordinate) => {
        this._tiles[locationToLayMine.row][locationToLayMine.column].placeHazard();
    }
}
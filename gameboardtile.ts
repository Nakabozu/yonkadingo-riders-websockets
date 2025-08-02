export enum Weathers {
    Nothing = 1,
    Tailwind,
    Headwind,
    TuckedAway,
    WideOpen,
    ClearSkies,
    DenseFog,
    CalmWaters,
    RoughSeas,
    AmpleTime,
    RushJob,
    FeedingFrenzy,
    Famine,
    FullMoon,
    NewMoon,
    NiceSprites,
    ScaryMonsters,
}

export enum ResourceTypes {
    Food = 0,
    Pellets,
}

const getRandomPercent = (): number => {
    return Math.floor(Math.random() * 100 + 1);
};

const resourceCounts: number[] = [-8, -3, -1, 0, 1, 3, 8];

export type TileSummary = {
    isRevealed: boolean;
    isVisited: boolean;
    hasMine: boolean;
    weather: Weathers | null;
    resourceType: ResourceTypes;
    resourceCount: number;
};

export default class GameBoardTile {
    private _isRevealed: boolean;
    private _isVisited: boolean;
    private _hasMine: boolean;
    private _weather: Weathers | null;
    private _resourceType: ResourceTypes;
    private _resourceCount: number;

    public constructor() {
        this._isRevealed = false;
        this._isVisited = false;
        this._hasMine = false;
        this._resourceType = Math.floor(Math.random() * 2);
        const randomResourceRoll: number = getRandomPercent();
        const isWeatherPositive: boolean = Math.floor(Math.random() * 2) === 1;
        const randomWeatherRoll: number = getRandomPercent();

        if (randomResourceRoll <= 2) {
            this._resourceCount = resourceCounts[0]; // -8
        } else if (randomResourceRoll <= 8) {
            this._resourceCount = resourceCounts[1]; // -3
        } else if (randomResourceRoll <= 15) {
            this._resourceCount = resourceCounts[2]; // -1
        } else if (randomResourceRoll <= 40) {
            this._resourceCount = resourceCounts[3]; // 0
        } else if (randomResourceRoll <= 70) {
            this._resourceCount = resourceCounts[4]; // 1
        } else if (randomResourceRoll <= 94) {
            this._resourceCount = resourceCounts[5]; // 3
        } else {
            this._resourceCount = resourceCounts[6]; // 8
        }

        if (randomWeatherRoll <= 35) {
            this._weather = Weathers[Weathers[1]];
        } else if (randomWeatherRoll <= 45) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[2]]
                : Weathers[Weathers[3]];
        } else if (randomWeatherRoll <= 55) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[4]]
                : Weathers[Weathers[5]];
        } else if (randomWeatherRoll <= 65) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[6]]
                : Weathers[Weathers[7]];
        } else if (randomWeatherRoll <= 75) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[8]]
                : Weathers[Weathers[9]];
        } else if (randomWeatherRoll <= 85) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[10]]
                : Weathers[Weathers[11]];
        } else if (randomWeatherRoll <= 95) {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[12]]
                : Weathers[Weathers[13]];
        } else {
            this._weather = isWeatherPositive
                ? Weathers[Weathers[14]]
                : Weathers[Weathers[15]];
        }

        // console.log(`A ${Weathers[this._weather]} tile was generated with ${this._resourceCount} ${ResourceTypes[this._resourceType]}.`)
    }

    // GETTERS
    public get isRevealed() {
        return this._isRevealed;
    }

    public get isVisited() {
        return this._isVisited;
    }

    public get weather() {
        return this._weather;
    }

    public get visibleWeather() {
        return this._weather;
        const visitedOnlyWeathers: Weathers[] = [
            Weathers.Famine,
            Weathers.FeedingFrenzy,
            Weathers.FullMoon,
            Weathers.NewMoon,
        ];
        // These weathers can only be revealed by passing over the tile
        return visitedOnlyWeathers.includes(this._weather)
            ? this._isVisited
                ? this._weather
                : Weathers.Nothing
            : this._isRevealed
            ? this._weather
            : Weathers?.Nothing;
    }

    public get hasMine() {
        return this._hasMine;
    }

    // SETTERS
    public set isRevealed(newIsRevealed: boolean) {
        this._isRevealed = !!newIsRevealed;
    }

    public get tileSummary() {
        return {
            isRevealed: this._isRevealed,
            isVisited: this._isVisited,
            hasMine: this._hasMine,
            weather: this._weather,
            resourceType: this._resourceType,
            resourceCount: this._resourceCount,
        };
    }

    public clearWeather = (): void => {
        this._weather = Weathers.Nothing;
    };

    public moveOverTile = (): TileSummary => {
        this._hasMine = false;
        this._resourceCount = 0;
        this._isVisited = true;
        return this.tileSummary;
    };

    public placeHazard = (): void => {
        this._hasMine = true;
    };
}

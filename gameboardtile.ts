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
    ScaryMonsters
}

export enum ResourceTypes {
    Food = 0,
    Pellets
}

const getRandomPercent = (): number => {
    return Math.floor((Math.random() * 100) + 1);
}

const resourceCounts: number[] = [-8, -3, -1, 0, 1, 3, 8];

export type TileSummary = {
    isRevealed: boolean;
    hasMine: boolean;
    weather: Weathers | null;
    resourceType: ResourceTypes;
    resourceCount: number;
}

export default class GameBoardTile {
    private isRevealedVal: boolean;
    private hasMineVal: boolean;
    private weatherVal: Weathers | null;
    private resourceTypeVal: ResourceTypes;
    private resourceCountVal: number;

    public constructor(){
        this.isRevealedVal = false;
        this.hasMineVal = false;
        this.resourceTypeVal = Math.floor(Math.random() * 2);
        const randomResourceRoll: number = getRandomPercent();
        const isWeatherPositive: boolean =  Math.floor(Math.random() * 2) === 1;
        const randomWeatherRoll: number = getRandomPercent();

        if(randomResourceRoll <= 5){
            this.resourceCountVal = resourceCounts[0];
        }else if(randomResourceRoll <= 15){
            this.resourceCountVal = resourceCounts[1];
        }else if(randomResourceRoll <= 30){
            this.resourceCountVal = resourceCounts[2];
        }else if(randomResourceRoll <= 70){
            this.resourceCountVal = resourceCounts[3];
        }else if(randomResourceRoll <= 85){
            this.resourceCountVal = resourceCounts[4];
        }else if(randomResourceRoll <= 95){
            this.resourceCountVal = resourceCounts[5];
        }else{
            this.resourceCountVal = resourceCounts[6];
        }

        if(randomWeatherRoll <= 45){
            this.weatherVal = Weathers[Weathers[1]];
        }else if(randomWeatherRoll <= 55){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[2]] : Weathers[Weathers[3]];
        }else if(randomWeatherRoll <= 65){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[4]] : Weathers[Weathers[5]];
        }else if(randomWeatherRoll <= 75){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[6]] : Weathers[Weathers[7]];
        }else if(randomWeatherRoll <= 85){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[8]] : Weathers[Weathers[9]];
        }else if(randomWeatherRoll <= 90){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[10]] : Weathers[Weathers[11]];
        }else if(randomWeatherRoll <= 95){
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[12]] : Weathers[Weathers[13]];
        }else{
            this.weatherVal = isWeatherPositive ? Weathers[Weathers[14]] : Weathers[Weathers[15]];
        }

        // console.log(`A ${Weathers[this.weatherVal]} tile was generated with ${this.resourceCountVal} ${ResourceTypes[this.resourceTypeVal]}.`)
    }

    // GETTERS
    public get isRevealed(){
        return this.isRevealedVal;
    }

    public get hasMine(){
        return this.hasMineVal;
    }

    // SETTERS
    public set isRevealed(newIsRevealed: boolean){
        this.isRevealedVal = newIsRevealed;
    }

    public get tileSummary(){
        return({
            isRevealed: this.isRevealedVal,
            hasMine: this.hasMineVal,
            weather: this.weatherVal,
            resourceType: this.resourceTypeVal,
            resourceCount: this.resourceCountVal
        });
    }

    public moveOverTile = (): TileSummary => {
        this.hasMineVal = false;
        this.resourceCountVal = 0;
        return this.tileSummary;
    }

    public placeHazard = (): void => {
        this.hasMineVal = true;
    }    
}
import { AlgorithmPrediction } from 'model/AlgorithmPrediction';

export class RlPrediction implements AlgorithmPrediction {
    private data: Array<number>;
    private options: Object;
    private timeData: Array<number>;

    constructor() {

    }

    private setOptions = (option: Object): void => {

    }

    private setCoefficients = (value: number): void => {
        
    }

    predict = (data: Array<number>, json: Object): Object => {
        return {}
    }


}
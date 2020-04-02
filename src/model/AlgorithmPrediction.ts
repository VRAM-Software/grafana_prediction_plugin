export interface AlgorithmPrediction {
    predict(data: Array<number>, json: Object): Object;
}
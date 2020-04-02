import { PerformPrediction } from "../model/PerformPrediction";

export class ProcessData {
    private strategy: PerformPrediction;
    private data: Map<string, number>;
    constructor(strategy: PerformPrediction) {
        this.strategy = strategy;
    }

    private setStrategy = (algorithm: PerformPrediction): void => {
        this.strategy = algorithm;
    }

    setData = (datalist: Map<string, Array<number>>, configuration: Object, nodeMap: Map<string, string>): void => {
        
    }
}
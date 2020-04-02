import { PerformPrediction } from 'model/PerformPrediction';

export class ProcessSvm implements PerformPrediction {
    private result: Array<Number>;

    constructor() {

    }

    public performPrediction(datalist: Map<string, Array<number>>, configuration: Object, nodeMap: Map<string, string>, timeData: Array<number>): void {
        let res: Array<Number> = [];
        this.result = res;
    }
}
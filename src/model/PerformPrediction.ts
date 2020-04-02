export interface PerformPrediction {
    performPrediction(datalist: Map<string, Array<number>>, configuration: Object, nodeMap: Map<string, string>, timeData: Array<number>): void;
}
export interface PerformPrediction {
  performPrediction(datalist: Map<string, number[]>, configuration: Object, nodeMap: Map<string, string>, timeData: number[]): void;
}

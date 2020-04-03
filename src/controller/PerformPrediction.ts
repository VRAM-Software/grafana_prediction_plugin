export interface PerformPrediction {
  performPrediction(datalist: Map<string, number[]>, configuration: {}, nodeMap: Map<string, string>, timeData: number[]): void;
}

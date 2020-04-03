export interface PerformPrediction {
  performPrediction(datalist: {}, configuration: {}, nodeMap: Map<string, string>, timeData: number[]): void;
}

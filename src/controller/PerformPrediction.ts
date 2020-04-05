import { DataSet } from '../types/DataSet';

export interface PerformPrediction {
  performPrediction(data: DataSet, configuration: {}, nodeMap: Map<string, string>): void;
}

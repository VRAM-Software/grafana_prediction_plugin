import { DataSet, WriteInfluxParameters } from '../types/types';

export interface PerformPrediction {
  performPrediction(data: DataSet, configuration: {}, parameters: WriteInfluxParameters): void;
}

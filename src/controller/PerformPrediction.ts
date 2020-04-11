import { DataSet, WriteInfluxParameters, JsonConfiguration } from '../types/types';

export interface PerformPrediction {
  performPrediction(data: DataSet, configuration: JsonConfiguration, parameters: WriteInfluxParameters): number[][];
}

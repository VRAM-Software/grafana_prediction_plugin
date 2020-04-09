import { DataSet, JsonConfiguration, WriteInfluxParameters } from 'types/types';
export interface AlgorithmPrediction {
  predict(data: DataSet, json: JsonConfiguration, parameters: WriteInfluxParameters): {};
}

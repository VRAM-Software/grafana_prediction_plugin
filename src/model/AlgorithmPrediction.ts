import { DataSet } from 'types/DataSet';

export interface AlgorithmPrediction {
  predict(data: DataSet, json: {}): {};
}

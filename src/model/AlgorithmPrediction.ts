import { DataSet } from 'types/DataSet';
import { JsonConfiguration } from 'types/JsonConfiguration';
export interface AlgorithmPrediction {
  predict(data: DataSet, json: JsonConfiguration): {};
}

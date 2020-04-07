import { DataSet } from 'types/DataSet';
import { WriteInfluxParameters } from 'types/writeInfluxParameters';
import { JsonConfiguration } from 'types/JsonConfiguration';
export interface AlgorithmPrediction {
  predict(data: DataSet, json: JsonConfiguration, influxParams: WriteInfluxParameters): {};
}

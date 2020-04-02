import { AlgorithmPrediction } from 'model/AlgorithmPrediction';
import { SVM } from 'ml-modules';

export class SvmPrediction implements AlgorithmPrediction {
  private options: {};
  private timeData: number[];

  constructor() {}

  predict = (data: number[], json: {}): {} => {
    const svm: any = new SVM();
    svm.setData(data, json);
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      result.push(svm.predict(data[i]));
    }

    return {
      result,
    };
  };
}
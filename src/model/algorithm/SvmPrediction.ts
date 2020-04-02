import { AlgorithmPrediction } from 'model/AlgorithmPrediction';
import { SVM } from "ml-modules";

export class SvmPrediction implements AlgorithmPrediction {
    private data: Array<number>;
    private options: Object;
    private timeData: Array<number>;
    
    constructor() {

    }

    predict = (data: Array<number>, json: Object): Object => {
        const svm: any = new SVM();
        svm.setData(data, json);
        const result: Array<number> = [];
        for (let i: number = 0; i < data.length; i++) {
            result.push(svm.predict(data[i]));
        }
        
        return {
            result
        }
    }
}

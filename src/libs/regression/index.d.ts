/* istanbul ignore file */
/* istanbul ignore next */
export default class Regression {
  hypothesize(options: {}): number[];
  calculateCoefficients(): number[];
  inverse(matrix: number[], identity: number[]): number[];
  multiply(lhs: {}, rhs: number[]): number[];
  rectMatrix(options: {}): number[];
  addRowAndColumn(product: number[], options: {}): void;
  rref(A: number[]): number[];
  predict(x: number): number[];
}

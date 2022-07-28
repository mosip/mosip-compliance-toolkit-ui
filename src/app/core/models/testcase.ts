import { OtherAttributesModel } from "./other-attributes";
import { ValidatorModel } from "./validatordef";

export class TestCaseModel {
  constructor(
    public testCaseType: string,
    public testName: string,
    public testId: string,
    public specVersion: string,
    public testDescription: string,
    public testOrderSequence: number,
    public methodName: string,
    public requestSchema: string,
    public responseSchema: string,
    public validatorDefs: ValidatorModel[],
    public otherAttributes: OtherAttributesModel
  ) {}
}

import { OtherAttributesModel } from "./other-attributes";
import { ValidatorModel } from "./validatordef";

export class TestCaseModel {
  constructor(
    public testCaseType: string,
    public testName: string,
    public testId: string,
    public specVersion: string,
    public testDescription: string,
    public androidTestDescription: string,
    public isNegativeTestcase: boolean,
    public inactiveForAndroid: boolean,
    public methodName: any,
    public requestSchema: any,
    public responseSchema: any,
    public validatorDefs: ValidatorModel[],
    public otherAttributes: OtherAttributesModel
  ) {}
}

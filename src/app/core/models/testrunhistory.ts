import { OtherAttributesModel } from "./other-attributes";
import { ValidatorModel } from "./validatordef";

export class TestRunHistoryModel {
  constructor(
    public runId: string,
    public lastRunTime: string,
    public testCaseCount: string,
    public passCaseCount: string,
    public failCaseCount: string
  ) {}
}

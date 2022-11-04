
export class TestRunModel {
  constructor(
    public testCaseType: string,
    public testName: string,
    public testId: string,
    public testDescription: string,
    public methodName: any,
    public methodRequest: string,
    public methodResponse: string,
    public resultStatus: string,
    public resultDescription: string,
    public testDataSource: string
  ) {}
}

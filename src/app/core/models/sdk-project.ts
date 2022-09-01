export class SdkProjectModel {
    constructor(
      public id: string,
      public name: string,
      public projectType: string,
      public sdkVersion: string,
      public url: string,
      public purpose: string,
      public bioTestDataFileName: string
    ) {}
  }
  
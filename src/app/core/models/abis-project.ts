export class AbisProjectModel {
    constructor(
      public id: string,
      public name: string,
      public projectType: string,
      public abisVersion: string,
      public url: string,
      public username: string,
      public password: string,
      public outboundQueueName: string,
      public inboundQueueName: string,
      public bioTestDataFileName: string
    ) {}
  }
  
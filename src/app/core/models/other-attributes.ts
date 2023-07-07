export class OtherAttributesModel {
    constructor(
      public purpose: any,
      public biometricTypes: any,
      public deviceSubTypes: any,
      public segments: any,
      public exceptions: any,
      public requestedScore: any,
      public bioCount: any,
      public deviceSubId: any,
      public modalities: any,
      public convertSourceFormat: any,
      public convertTargetFormat: any,
      public timeout: any,
      public resumeBtn: boolean,
      public resumeAgainBtn: boolean,
      public keyRotationTestCase: boolean,
      public hashValidationTestCase: boolean,
      public transactionId: any,
      public invalidRequestAttribute: any,
      public bulkInsert: boolean,
      public insertCount: any,
      public insertReferenceId: any,
      public identifyReferenceId: any,
      public identifyGalleryIds: any,
      public expectedDuplicateCount: any,
      public expectedFailureReason: any
    ) {}
  }
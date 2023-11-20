export interface ReportModel {
  partnerId: string;
  orgName: String;
  projectType: String;
  collectionId: string;
  projectId: string;
  reviewDtimes: Date;
  approveRejectDtimes: Date;
  reportStatus: string;
  adminComments: string;
  partnerComments: string;
  collectionName: String;
  projectName: String;
}

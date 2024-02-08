export interface ReportModel {
  partnerId: string;
  orgName: string;
  projectType: string;
  collectionId: string;
  projectId: string;
  reviewDtimes: Date;
  approveRejectDtimes: Date;
  reportStatus: string;
  adminComments: string;
  partnerComments: string;
  collectionName: string;
  collectionType: string;
  projectName: string;
  updDtimes: Date;
  updBy: string;
}

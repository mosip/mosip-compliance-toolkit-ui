export interface ReportModel {
  partnerName: string;
  orgName: String;
  projectType: String;
  collectionName: String;
  projectName: String;
  updDtimes: Date;
  downloadButton: any;
  approveOrRejectButton: any;
  isApproved: boolean;
  isRejected: boolean;
}

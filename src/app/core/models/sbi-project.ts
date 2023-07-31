export class SbiProjectModel {
  constructor(
    public id: string,
    public name: string,
    public projectType: string,
    public sbiVersion: string,
    public purpose: string,
    public deviceType: string,
    public deviceSubType: string,
    public deviceImage1: string,
    public deviceImage2: string,
    public deviceImage3: string,
    public deviceImage4: string,
    public deviceImage5: string,
    public sbiHash: string,
    public websiteUrl: string
  ) {}
}

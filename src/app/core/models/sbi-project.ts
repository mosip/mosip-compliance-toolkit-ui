export class SbiProjectModel {
  constructor(
    public id: string,
    public name: string,
    public projectType: string,
    public sbiVersion: string,
    public purpose: string,
    public deviceType: string,
    public deviceSubType: string,
    public deviceImages: string,
    public sbiHash: string,
    public websiteUrl: string
  ) {}
}

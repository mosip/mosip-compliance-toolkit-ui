export class SbiProjectModel {
  constructor(
    public name: string,
    public projectType: string,
    public sbiVersion: string,
    public purpose: string,
    public deviceType: string,
    public deviceSubType: string
  ) {}
}

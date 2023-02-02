export class SbiDiscoverResponseModel {
    constructor(
        public deviceId: any, 
        public purpose: any, 
        public deviceSubId: any, 
        public digitalId: any, 
        public digitalIdDecoded: any, 
        public deviceStatus: any, 
        public deviceCode: any,
        public error: any, 
        public certification: any, 
        public specVersion: any, 
        public callbackId: any, 
        public serviceVersion: any,
        public firmware?: any,
        public env?: any
  ) { }
}


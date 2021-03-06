import { VERSION } from 'src/app/app.constants';
import Utils from '../../app.utils';

export class RequestModel {
    version = VERSION;
    requesttime = Utils.getCurrentDate();
    constructor(
        public id: string,
        public metadata: null,
        public request: any,
    ) {}
}

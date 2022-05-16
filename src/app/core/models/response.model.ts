export class ResponseModel<T> {
    constructor(
        public id: string,
        public responsetime: string,
        public response: T,
        public version: string
    ) { }
}

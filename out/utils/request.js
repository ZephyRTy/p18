import request from 'request';
export class Request {
    constructor() { }
    static get(targetURL, options) {
        return new Promise((resolve, reject) => {
            let req = {};
            let { url, ...data } = typeof targetURL === 'string'
                ? { url: targetURL }
                : targetURL;
            request.get({ url, ...options }, (err, res, body) => {
                if (err) {
                    console.error(err);
                }
                else {
                    resolve({ body, ...data });
                }
            });
        });
    }
}

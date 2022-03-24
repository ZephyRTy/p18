import request from 'request';
import { midType } from '../types/types.js';

export type body<T> = T & {
	body: unknown;
};
export class Request {
	static options: any = undefined;
	private constructor() {}
	static get<T>(targetURL: midType<T>, options?: any) {
		let netOptions = options ?? Request.options;
		return new Promise((resolve, reject) => {
			let req = {} as any;
			let { url, ...data } =
				typeof targetURL === 'string'
					? { url: targetURL }
					: (targetURL as any);
			request.get(
				{ url, ...netOptions },
				(err: any, res: any, body: any) => {
					if (res?.statusCode !== 200) {
						console.log(res?.statusCode);
					}
					if (err) {
						reject(err);
					} else {
						resolve({ body, ...data });
					}
				}
			);
		});
	}
}

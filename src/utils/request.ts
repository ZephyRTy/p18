import request from 'request';
import { HasProperty } from '../types/types.js';

export type body<T> = T & {
	body: unknown;
};
export class Request {
	private constructor() {}
	static get<T>(targetURL: HasProperty<T, 'url'> | string, options?: any) {
		return new Promise((resolve, reject) => {
			let req = {} as any;
			let { url, ...data } =
				typeof targetURL === 'string'
					? { url: targetURL }
					: (targetURL as any);
			request.get(
				{ url, ...options },
				(err: any, res: any, body: any) => {
					if (err) {
						console.error(err);
					} else {
						resolve({ body, ...data });
					}
				}
			);
		});
	}
}

import { HasProperty } from '../types/types.js';
import { Request } from './request.js';
import { Stream } from './stream.js';

export class Circuit<IN, MID, OUT> extends Stream<IN, MID, OUT> {
	private urlPool: string[] = [];
	private urlParser: (body: unknown) => string[] | string;
	constructor(
		urlParser: (body: unknown) => string[] | string,
		parser?: (body: unknown, data: MID) => OUT[],
		options?: any
	) {
		super(parser, options);
		this.urlParser = urlParser;
	}
	async get(url: string) {
		this.pending(Request.get(url, this.netOptions));
	}
	private getNewUrl(body: unknown) {
		let url = this.urlParser(body);
		if (!url || url.length === 0) {
			console.log('url is empty');
			this.finish();
			return;
		}
		if (Array.isArray(url)) {
			this.urlPool.push(...url);
		} else {
			this.urlPool.push(url);
		}
		this.get(this.urlPool.shift() as string);
	}
	protected inject(res: HasProperty<MID, 'body'>) {
		let { body, ...data } = res as any;
		if (!this.parser) {
			throw Error('parser is not defined');
		}
		let result = this.parser(body, data);
		if (Array.isArray(result)) {
			this.push(...result);
		} else {
			this.push(result);
		}
		let count = result.length ?? 1;
		for (let i = 0; i < count; i++) {
			this.pipe.target?.extract();
		}
	}
	protected pending(req: Promise<any>) {
		this.pendingQueue.push(req);
		req.then((res: HasProperty<MID, 'body'>) => {
			this.getNewUrl((res as any).body);
			this.inject(res);
		});
	}
	finish(): void {}
}

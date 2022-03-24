import { HasProperty } from '../types/types.js';
import { Request } from './request.js';
import { Stream } from './stream.js';

export class Circuit<IN, MID, OUT> extends Stream<IN, MID, OUT> {
	private urlPool: string[] = [];
	private urlParser: (body: unknown) => string[] | string;
	private max = 0;
	private count = 0;
	constructor(
		urlParser: (body: unknown) => string[] | string,
		parser?: (body: unknown, data: MID) => OUT[],
		options?: any
	) {
		super(parser, options);
		this.max = options['max'] ?? 0;
		this.urlParser = urlParser;
	}
	async collect(url: string) {
		this.pending(Request.get(url, this.netOptions));
	}
	private getNewUrl(body: unknown) {
		if (this.max && this.count >= this.max) {
			this.readyToClose();
			return;
		}
		++this.count;
		let url = this.urlParser(body);
		if (!url || url.length === 0) {
			this.readyToClose();
			return;
		}
		if (Array.isArray(url)) {
			this.urlPool.push(...url);
		} else {
			this.urlPool.push(url);
		}
		this.collect(this.urlPool.shift() as string);
	}
	protected inject(res: HasProperty<MID, 'body'>) {
		let { body, ...data } = res as any;
		if (!this.parser) {
			throw Error('parser is not defined');
		}
		let result = this.parser(body, data);
		let count = 1;
		if (Array.isArray(result)) {
			if (result.length === 0) {
				return;
			}
			count = result.length;
			this.push(...result);
		} else {
			this.push(result);
		}
		for (let i = 0; i < count; i++) {
			this.pipe.target?.extract();
		}
	}

	protected pending(req: Promise<any>) {
		this.pendingQueue.push(req);
		req.then((res: HasProperty<MID, 'body'>) => {
			this.inject(res);
			this.getNewUrl((res as any).body);
		});
	}
}

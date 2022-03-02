import { DONE_SIG_OF_PIPE, Pipe } from '../types/pipe.js';
import { HasProperty } from '../types/types.js';
import { sleep } from '../utils/sleep.js';
import { Request } from './request.js';

export class Stream<IN, MID, OUT> {
	// T 输出数据类型，K为接收数据类型
	status = true;
	protected pool: OUT[] = []; //输出结果池

	//输出结果池
	protected connection!: Pipe<IN> | null; //外部管道
	protected pendingQueue: Promise<any>[] = [];
	private endProcessor: null | ((data: IN) => void) = null;
	protected option: any = {};
	protected netOptions: any = {};
	protected pipe: Pipe<OUT> = (function* (pool: OUT[]) {
		while (true) {
			let el = pool.shift();
			if (!el) {
				continue;
			}
			if (el === (DONE_SIG_OF_PIPE as any)) {
				return;
			}
			yield el;
		}
	})(this.pool) as any;
	preprocessor:
		| null
		| ((
				data?: IN
		  ) =>
				| string
				| string[]
				| HasProperty<MID, 'url'>
				| HasProperty<MID, 'url'>[]) = null; // 处理输入数据
	parser: ((body: unknown, data: MID) => OUT[]) | null; // 处理HTML数据,并输出
	constructor(parser?: (body: unknown, data: MID) => OUT[], options?: any) {
		this.parser = parser ?? null;
		this.connection = null;
		this.pipe.target = null;
		this.option = options;
	}

	setParser(parser: (body: any, data: MID) => OUT[]) {
		this.parser = parser;
	}
	setEnd(end: (data: IN) => void) {
		this.endProcessor = end;
	}
	setPreprocessor(
		preprocessor: (
			data?: IN
		) =>
			| string
			| string[]
			| HasProperty<MID, 'url'>
			| HasProperty<MID, 'url'>[]
	) {
		this.preprocessor = preprocessor;
	}
	setNetOptions(options: any) {
		this.netOptions = options;
		return this;
	}
	setOption(option: any) {
		this.option = option;
	}
	/**
	 * 将内部管道连接至下一个工作流
	 * @param nextStream 下一个工作流
	 * @returns 下一个工作流
	 */
	next<T, K>(
		nextStream: Stream<OUT, any, any> | ((body: unknown, data: K) => T[]),
		option?: any
	): Stream<OUT, K, T> {
		if (!(nextStream instanceof Stream)) {
			let n = new Stream<OUT, K, T>(nextStream, option);
			this.pipe.target = n;
			n.connection = this.pipe;
			return n;
		}
		this.pipe.target = nextStream;
		nextStream.connection = this.pipe;
		return nextStream;
	}

	/**
	 * 从外部管道中抽取数据
	 */
	extract() {
		let { value, done } =
			(this.connection?.next() as { value: IN; done: boolean }) || {};
		if (done) {
			this.connection = null;
			console.log('done');
			this.finish();
			return;
		}
		type Check<T> = T extends
			| string
			| string[]
			| HasProperty<MID, 'url'>
			| HasProperty<MID, 'url'>[]
			? T
			: never;
		if ((typeof value as Check<IN>) === 'never' && !this.preprocessor) {
			throw new Error('preprocessor is not defined');
		}
		if (!this.parser && !this.preprocessor) {
			if (!this.endProcessor) {
				throw new Error('preprocessor is not defined');
			} else {
				this.endProcessor(value);
				return;
			}
		}
		this.get(this.preprocessor ? this.preprocessor(value) : (value as any));
	}

	async get(
		url:
			| string
			| string[]
			| HasProperty<MID, 'url'>
			| HasProperty<MID, 'url'>[],
		options?: any
	) {
		if (url instanceof Array) {
			url.forEach(async (url) => {
				await sleep(this.option.delay ? this.option.delay : 0).then(
					() => {
						if (typeof url === 'string') {
							this.pending(
								Request.get({ url }, options ?? this.netOptions)
							);
						} else {
							this.pending(
								Request.get(url, options ?? this.netOptions)
							);
						}
					}
				);
				//this.pending(Request.get(url as unknown as  Url<url>, options));
			});
		} else {
			await sleep(this.option.delay ? this.option.delay : 0).then(() => {
				if (typeof url === 'string') {
					this.pending(
						Request.get({ url }, options ?? this.netOptions)
					);
				} else {
					this.pending(Request.get(url, options ?? this.netOptions));
				}
			});
		}
	}

	/**
	 * 往数据池中注入数据
	 * @param data 输入的数据
	 */
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
		req.then((res) => {
			this.inject(res);
		});
	}
	/**
	 *
	 * @param req 输入的网络请求
	 * @param processor 对输出结果的处理
	 */

	/**
	 * 所有输入结束时，调用此方法，往池中传入DONE_SIG
	 */
	finish() {
		Promise.all(this.pendingQueue).then(() => {
			console.log('done');
			this.pool.push(DONE_SIG_OF_PIPE as any);
		});
	}
	protected push(...data: OUT[]) {
		this.pool.push(...data);
	}
	async break() {
		await Promise.all(this.pendingQueue).then(() => {
			this.status = false;
		});
		return this.pool;
	}

	output(endFunction: (data: OUT) => void) {
		let stream = new Stream<OUT, any, any>();
		stream.setEnd(endFunction);
		this.pipe.target = stream;
		stream.connection = this.pipe;
		return stream;
	}
}
// const proxyIP = '127.0.0.1';
// const proxyPort = '10809';
// const proxy = 'http://' + proxyIP + ':' + proxyPort;
// let domain = 'https://eyefakes.com/';
// let main = new Stream((body: any, data: { name: string }) => {
// 	let $ = cheerio.load(body);
// 	let articleLinks: { src: string; title: string }[] = [];
// 	$('tr.inline_row span[class^=" subject"] a').each((i, elem) => {
// 		articleLinks.push({
// 			src: `${domain}${elem.attribs['href']}`,
// 			title: (elem.children[0] as any).data
// 		});
// 	});
// 	return articleLinks;
// });

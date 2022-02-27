import { Request } from './request.js';
const DONE_SIG_OF_PIPE = -1;
function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
export class Stream {
    // T 输出数据类型，K为接收数据类型
    status = true;
    end = null;
    option = {};
    netOptions = {};
    pendingQueue = [];
    pool = []; //输出结果池
    connection = null; //外部管道
    pipe = (function* (pool) {
        while (true) {
            let el = pool.shift();
            if (!el) {
                continue;
            }
            if (el === DONE_SIG_OF_PIPE) {
                return;
            }
            yield el;
        }
    })(this.pool);
    preprocessor = null; // 处理输入数据
    parser; // 处理HTML数据,并输出
    constructor(parser, options) {
        this.pipe.target = null;
        this.parser = parser ?? null;
    }
    setParser(parser) {
        this.parser = parser;
    }
    setEnd(end) {
        this.end = end;
    }
    setPreprocessor(preprocessor) {
        this.preprocessor = preprocessor;
    }
    setNetOptions(options) {
        this.netOptions = options;
        return this;
    }
    setOption(option) {
        this.option = option;
    }
    /**
     * 将内部管道连接至下一个工作流
     * @param nextStream 下一个工作流
     * @returns 下一个工作流
     */
    next(nextStream, option) {
        if (!(nextStream instanceof Stream)) {
            let n = new Stream(nextStream, option);
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
        let { value, done } = this.connection?.next() || {};
        if (done) {
            this.connection = null;
            console.log('done');
            this.finish();
            return;
        }
        if (typeof value === 'never' && !this.preprocessor) {
            throw new Error('preprocessor is not defined');
        }
        if (!this.parser && !this.preprocessor) {
            if (!this.end) {
                throw new Error('preprocessor is not defined');
            }
            else {
                this.end(value);
                return;
            }
        }
        this.get(this.preprocessor ? this.preprocessor(value) : value);
    }
    async get(url, options) {
        if (url instanceof Array) {
            url.forEach(async (url) => {
                await sleep(this.option.delay ? this.option.delay : 0).then(() => {
                    if (typeof url === 'string') {
                        this.pending(Request.get({ url }, options ?? this.netOptions));
                    }
                    else {
                        this.pending(Request.get(url, options ?? this.netOptions));
                    }
                });
                //this.pending(Request.get(url as unknown as  Url<url>, options));
            });
        }
        else {
            await sleep(this.option.delay ? this.option.delay : 0).then(() => {
                if (typeof url === 'string') {
                    this.pending(Request.get({ url }, options ?? this.netOptions));
                }
                else {
                    this.pending(Request.get(url, options ?? this.netOptions));
                }
            });
        }
    }
    /**
     * 往数据池中注入数据
     * @param data 输入的数据
     */
    inject(res) {
        let { body, ...data } = res;
        if (!this.parser) {
            throw Error('parser is not defined');
        }
        let result = this.parser(body, data);
        if (Array.isArray(result)) {
            this.pool.push(...result);
        }
        else {
            this.pool.push(result);
        }
        let count = result.length ?? 1;
        for (let i = 0; i < count; i++) {
            this.pipe.target?.extract();
        }
    }
    /**
     *
     * @param req 输入的网络请求
     * @param processor 对输出结果的处理
     */
    pending(req) {
        this.pendingQueue.push(req);
        req.then((res) => {
            this.inject(res);
        });
    }
    /**
     * 所有输入结束时，调用此方法，往池中传入DONE_SIG
     */
    finish() {
        Promise.all(this.pendingQueue).then(() => {
            console.log('done');
            this.status = false;
            this.pool.push(DONE_SIG_OF_PIPE);
        });
    }
    async break() {
        await Promise.all(this.pendingQueue).then(() => {
            this.status = false;
        });
        return this.pool;
    }
    output(endFunction) {
        let stream = new Stream();
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

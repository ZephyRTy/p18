export type DONE_SIG = -1;
export const DONE_SIG_OF_PIPE = -1;
export type Pipe<T> = {
	target: StreamEntry<any, any, any> | null;
} & Generator<T, undefined, unknown>;
export abstract class StreamEntry<IN, MID, OUT> {
	protected pool: (OUT | DONE_SIG)[] = []; //输出结果池
	protected parser: ((body: any, data: MID) => OUT[]) | null = null; //解析器
	//输出结果池
	public connection!: Pipe<IN> | null; //外部管道
	abstract extract(): void;
}

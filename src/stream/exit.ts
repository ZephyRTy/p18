import { StreamEntry } from '../types/pipe';

export class Exit<IN, MID = any, OUT = any> extends StreamEntry<IN, any, any> {
	private endProcessor: (data: IN) => void;
	private closeFunction: (() => void) | null = null;
	private awaitedQueue: IN[] = [];
	private destroyFlag = false;
	private id: any = null;
	constructor(endProcessor: (data: IN) => void, options?: any) {
		super();
		this.endProcessor = endProcessor;
		if (options?.delay) {
			this.id = setInterval(() => {
				if (this.awaitedQueue.length === 0 && this.destroyFlag) {
					clearInterval(this.id);
					this.connection = null;
					this.closeFunction?.();
					return;
				}
				if (this.awaitedQueue.length === 0) return;
				let data = this.awaitedQueue.shift();
				if (!data) return;
				this.endProcessor(data);
			}, options.delay);
		}
	}
	extract(): void {
		let { value, done } = (this.connection?.next() as {
			value: IN;
			done: boolean;
		}) || { value: null, done: true };
		if (done) {
			this.destroy();
			return;
		}
		if (this.id) {
			this.awaitedQueue.push(value);
		} else {
			this.endProcessor(value);
		}
	}

	private destroy() {
		this.destroyFlag = true;
	}

	close(closeFunction: () => void) {
		this.closeFunction = closeFunction;
	}
}

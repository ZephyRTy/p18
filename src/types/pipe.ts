import { Stream } from '../object/stream.js';

type DONE_SIG = -1;
export const DONE_SIG_OF_PIPE = -1;
export type Pipe<T> = { target: Stream<any, any, any> | null } & Generator<
	T,
	undefined,
	unknown
>;

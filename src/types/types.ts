export type HasProperty<
	T,
	K extends keyof any,
	U = undefined
> = K extends keyof T
	? T
	: T & {
			[P in K]: U extends undefined ? any : U;
	  };
let a: HasProperty<{ b: 2 }, 'a'> = { a: 1, b: 2 };
export type Url<T> = T extends string ? { url: T } : T;

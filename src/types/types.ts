export type HasProperty<
	T,
	K extends keyof any,
	U = undefined
> = K extends keyof T
	? T
	: T & {
			[P in K]: U extends undefined ? any : U;
	  };
let a: HasProperty<{ name: string }, 'name'> = { name: 'yoon' };
export type Url<T> = T extends string ? { url: T } : T;

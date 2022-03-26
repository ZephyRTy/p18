export type HasProperty<
	T,
	K extends keyof any,
	U = undefined
> = K extends keyof T
	? T
	: T & {
			[P in K]: U extends undefined ? any : U;
	  };
export type Url<T> = T extends string ? { url: T } : T;
export type midType<T> = T extends string ? string : HasProperty<T, 'url'>;

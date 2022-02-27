let count = 0;

let a = (function* () {
	yield 1;
	yield 2;
	return 3;
})();
let { value, done } = a.next();
console.log(value, done);
console.log(a.next());
console.log(a.next());
console.log(a.next());

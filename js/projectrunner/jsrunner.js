//Runtime functions (practically copy-pasted from Scratch code)
function castToNumber(x) {
	if (typeof x === 'number') {
		if (Number.isNaN(x)) {
			return 0;
		}
		return x;
	}
	const n = Number(x);
	if (Number.isNaN(n)) {
		return 0;
	}
	return n;
}

function castToBoolean(x) {
	if (typeof x === 'boolean') {
		return x;
	}
	if (typeof x === 'string') {
		return !((x === '') || (x === '0') || (x.toLowerCase() === 'false'));
	}
	return Boolean(x);
}

function castToString(x) {
	return String(x);
}

//Run JS
function runJS(js) {
	let f = new Function(js);
	f();
}
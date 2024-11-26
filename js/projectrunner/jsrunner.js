//Runtime functions (practically copy-pasted from Scratch code)
function isNotActuallyZero(x) {
	if (typeof x !== 'string') {
		return false;
	}
	for (let i = 0; i < x.length; i++) {
		let code = x.charCodeAt(i);
		if (code === 48 || code === 9) {
			return false;
		}
	}
	return true;
}

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

function castCompare(x1, x2) {
	let n1 = Number(x1);
	let n2 = Number(x2);
	if (n1 === 0 && isNotActuallyZero(x1)) {
		n1 = NaN;
	} else if (n2 === 0 && isNotActuallyZero(x2)) {
		n2 = NaN;
	}
	if (isNaN(n1) || isNaN(n2)) {
		const s1 = String(x1).toLowerCase();
		const s2 = String(x2).toLowerCase();
		if (s1 < s2) {
			return -1;
		}
		if (s1 > s2) {
			return 1;
		}
		return 0;
	}

	if (n1 === n2) {
		return 0;
	}
	return n1 - n2;
}

//Run JS
function runJS(js) {
	let f = new Function(js);
	f();
}
//Basically copied from scratch-vm cast.

function isNotActuallyZero(val) {
	if (typeof val !== 'string') return false;
	
	for (let i = 0; i < val.length; i++) {
		const code = val.charCodeAt(i);
		if (code === 48 || code === 9) return false;
	}
	return true;
}

function castToNumber(val) {
	if (typeof val === 'number') {
		// Scratch treats NaN as 0, when needed as a number.
		// E.g., 0 + NaN -> 0.
		if (Number.isNaN(val)) {
			return 0;
		}
		return val;
	}
	const n = Number(val);
	if (Number.isNaN(n)) return 0;
	return n;
}

function castToBoolean(val) {
	if (typeof val === 'boolean') return val;

	if (typeof val === 'string')
		return ((val !== '') && (val !== '0') && (val.toLowerCase() !== 'false'));

	return Boolean(val);
}

function castToString(val) {
	return String(val);
}

function castCompare(v1, v2) {
	let n1 = Number(v1);
	let n2 = Number(v2);
	if (n1 === 0 && isNotActuallyZero(v1)) {
		n1 = NaN;
	} else if (n2 === 0 && isNotActuallyZero(v2)) {
		n2 = NaN;
	}
	if (isNaN(n1) || isNaN(n2)) {
		// At least one argument can't be converted to a number.
		// Scratch compares strings as case insensitive.
		const s1 = String(v1).toLowerCase();
		const s2 = String(v2).toLowerCase();
		if (s1 < s2)
			return -1;
		else if (s1 > s2)
			return 1;
		else
			return 0;
	}
	// Handle the special case of Infinity
	if ((n1 === Infinity && n2 === Infinity) || (n1 === -Infinity && n2 === -Infinity))
		return 0;
	// Compare as numbers.
	return n1 - n2;
}
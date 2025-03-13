//Basically copied from scratch-vm cast.

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
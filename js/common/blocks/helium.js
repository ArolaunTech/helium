//All the helium-added blocks will be defined here.
//Reporters
function helium_log(x) {
	return Math.log(x) / Math.LN10;
}

function helium_pow10(x) {
	return Math.pow(10, x);
}

function helium_ternary(condition, a, b) {
	return condition ? a : b;
}

//Stack

//Helium Map
let heliumMap = new Map([
	["helium_cos", Math.cos],
	["helium_sin", Math.sin],
	["helium_tan", Math.tan],
	["helium_asin", Math.asin],
	["helium_acos", Math.acos],
	["helium_atan", Math.atan],
	["helium_abs", Math.abs],
	["helium_floor", Math.floor],
	["helium_ceiling", Math.ceil],
	["helium_sqrt", Math.sqrt],
	["helium_ln", Math.log],
	["helium_log", helium_log],
	["helium_e ^", Math.exp],
	["helium_10 ^", helium_pow10],
	["helium_ternary", helium_ternary],
	["helium_min", Math.min],
	["helium_max", Math.max],
	["helium_number", castToNumber],
	["helium_isint", isInt],
]);
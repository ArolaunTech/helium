//All operators will be defined here.
//Reporters
function operator_multiply(a, b) {
	return castToNumber(a) * castToNumber(b);
}

function operator_gt(a, b) {
	return castCompare(a, b) > 0;
}

function operator_lt(a, b) {
	return castCompare(a, b) < 0;
}

function operator_equals(a, b) {
	return castCompare(a, b) === 0;
}

function operator_add(a, b) {
	return castToNumber(a) + castToNumber(b);
}

function operator_not(a) {
	return !castToBoolean(a);
}

function operator_or(a, b) {
	return castToBoolean(a) || castToBoolean(b);
}

function operator_and(a, b) {
	return castToBoolean(a) && castToBoolean(b);
}

let operatorMap = new Map([
	["operator_add", operator_add],
	["operator_multiply", operator_multiply],
	["operator_gt", operator_gt],
	["operator_lt", operator_lt],
	["operator_equals", operator_equals],
	["operator_not", operator_not],
	["operator_or", operator_or],
	["operator_and", operator_add],
]);
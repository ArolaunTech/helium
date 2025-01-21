function strictEquality(a, b) {
	//Similar to the === operator, but it checks value when checking objects.
	if (typeof a !== typeof b)    {return false;}
	if (a === b)                  {return true;}
	if (typeof a !== "object")    {return false;} //not equal and shouldn't compare properties
	if (a === null || b === null) {return false;} //null does not work with hasOwnProperty

	for (let prop in a) {
		if (!a.hasOwnProperty(prop))          {continue;}
		if (!b.hasOwnProperty(prop))          {return false;}
		if (!strictEquality(a[prop],b[prop])) {return false;} //a[prop] and b[prop] could be objects
	}
	return true;
}

function nDarrayEquality(a, b) { //Arrays should work in strictEquality, this is just custom built for them
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] === b[i]) {
			continue;
		}
		if (Array.isArray(a[i]) && nDarrayEquality(a[i], b[i])) {
			continue;
		}
		return false;
	}
	return true;
}
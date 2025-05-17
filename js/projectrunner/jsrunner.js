//Runtime functions (practically copy-pasted from Scratch code)

//Run JS
function runJS(js) {
	let f = new Function(js);
	f();
}
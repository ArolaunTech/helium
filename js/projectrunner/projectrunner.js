// Runs JS created by the compiler
class Project {
	constructor() {
		this.renderer = null;
	}

	loadIR(ir) {
		this.renderer.loadIR(ir);
	}
}

function runJS(js) {
	let f = new Function(js);
	f();
}
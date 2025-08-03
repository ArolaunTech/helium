// Runs JS created by the compiler
class Project {
	constructor() {
		this.renderer = null;
	}

	loadIR(ir) {
		this.renderer.loadIR(ir);
	}

	runJS(js) {
		(new Function("project", js))(this);
	}
}

var globalProjectRunner = new Project();
globalProjectRunner.renderer = globalRenderer;
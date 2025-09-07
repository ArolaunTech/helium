// Runs JS created by the compiler
class Project {
	constructor() {
		this.renderer = null;
	}

	loadIR(ir) {
		this.renderer.loadIR(ir);
	}

	runJS(js) {
		//Run JS. The project that is running the JS can be accessed with "project".
		(new Function("project", js))(this);
	}

	handleKeyInput(key, keydown) {
		//Update project state in response to a key event.
		//key = key pressed               [string]
		//keydown = is key down currently [boolean]

		console.log(key, keydown);
	}
}

var globalProjectRunner = new Project();
globalProjectRunner.renderer = globalRenderer;
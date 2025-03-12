//Converts the intermediate representation generated in js/compiler/irgen.js into javascript code directly. No optimizations.
class SimpleIRtoJS {
	constructor() {
		this.ir = null;
	}

	loadIR(newIR) {
		this.ir = newIR;
	}

	createJSFromScript(script) {
		//Turns a single script's blocks into javascript code.
	}

	createJS() {
		console.log(structuredClone(this.ir));

		//Convert each script to javascript
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			console.log(structuredClone(script), createJSFromScript(script));
		}

		return "";
	}
}

var simpleGlobalJSEncoder = new SimpleIRtoJS();

function simpleIRtoJS(ir) {
	simpleGlobalJSEncoder.loadIR(ir);
	return simpleGlobalJSEncoder.createJS();
}
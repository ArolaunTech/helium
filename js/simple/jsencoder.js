// Converts the intermediate representation generated in js/compiler/irgen.js 
// into javascript code directly. No optimizations.
class SimpleIRtoJS {
	constructor() {
		this.ir = null;
	}

	loadIR(newIR) {
		this.ir = newIR;
	}

	getSprite(id) {
		return `sprites[${id}]`;
	}

	createJSFromScript(script, id) {
		//Turns a single script's blocks into javascript code.
		let out = `function* script${id}() {`;
		console.log(script);
		for (let i = 1; i < script.script.length; i++) {
			let block = script.script[i];
			let opcode = block[0];

			switch (opcode) {
				case "motion_gotoxy": {
					
				}
				default:
					console.log(block);
			}
		}
		return out;
	}

	createJS() {
		//console.log(structuredClone(this.ir));

		//Convert each script to javascript
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			let opcode = script[0][0];
			let warp = false;
			//console.log(script[0])
			if ((opcode === "procedures_definition") && script[0][script[0].length-1].warp) {
				warp = true;
			}
			this.ir.scripts[i].warp = warp;
			//console.log(this.createJSFromScript(this.ir.scripts[i], i));
		}

		//Construct JS
		let js = `project.renderer=0;`;

		return js;
	}
}

var simpleGlobalJSEncoder = new SimpleIRtoJS();

function simpleIRtoJS(ir) {
	simpleGlobalJSEncoder.loadIR(ir);
	return simpleGlobalJSEncoder.createJS();
}
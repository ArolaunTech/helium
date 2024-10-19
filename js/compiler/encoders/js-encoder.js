//Function
function addQuotes(x) {
	if (typeof x !== 'string') {
		return x;
	}
	return JSON.stringify(x);
}

function listToJS(x) {
	return JSON.stringify(x);
}

function valueToJS(value, owner) {
	if (Array.isArray(value)) {
		return {const: false, value: blockToJS(value, owner)};
	} else {
		return {const: true, value: value};
	}
}

function getValueType(value, owner, ir) {
	if (Array.isArray(value)) {
		return reporterStackType(value, ir.sprites[owner].name, ir);
	} else {
		switch (typeof value) {
			case "boolean":
				return TYPE_BOOLEAN;
			case "number":
				return TYPE_NUMBER;
			case "string":
				return TYPE_STRING;
			default:
				return TYPE_UNKNOWN;
		}
	}
}

function blockToJS(block, owner, ir) {
	let opcode = block[0];
	let ownerID = "this.hs"+owner;
	switch(opcode) { // Lots of cases (sad)
		case "forward:":
		case "motion_movesteps":
			if (getValueType(block[1], owner, ir) === TYPE_STRING) {
				let saveSteps = "let steps=castToNumber(" + valueToJS(block[1]) + ";";
			} else {
				let saveSteps = "let steps=" + valueToJS(block[1]) + ";";
			}
			break;
		default:
			console.warn("Unrecognized block:", block);
			return "";
	}
}

function scriptToJS(ir, owner) {
	for (let i = 0; i < ir.length; i++) {
		console.log(ir[i], owner, blockToJS(ir[i], owner, ir));
	}
}

//Convert IR into JS which can be run.
function constructJS(ir) {
	//Sprite Name Map
	let spriteNameMap = new Map();
	for (let i = 0; i < ir.sprites.length; i++) {
		spriteNameMap.set(ir.sprites[i].name, i);
	}

	//Build project
	let code = "class Project{constructor(){";
	//Global variables
	let globals = "";
	let spriteprops = [
		"costume",
		"draggable",
		"layerOrder",
		"rotationStyle",
		"visible",
		"volume",
		"x",
		"y"
	];
	for (let i = 0; i < ir.sprites.length; i++) {
		if (ir.sprites[i].isStage) {
			continue;
		}
		for (let j = 0; j < spriteprops.length; j++) {
			globals += "this.hs" + i + "_" + spriteprops[j] + "=" + 
				addQuotes(ir.sprites[i][spriteprops[j]]) + ";";
			globals += "this.hs" + i + "_scale=" +
				ir.sprites[i].size*0.01 + ";";
			globals += "this.hs" + i + "_direction=" + 
				(90-ir.sprites[i].direction)*Math.PI/180 + ";";
		}
	}
	for (let i = 0; i < ir.variables.length; i++) {
		globals += "this.hv" + i + "=" + addQuotes(ir.variables[i].value) + ";";
	}
	for (let i = 0; i < ir.lists.length; i++) {
		globals += "this.hl" + i + "=" + listToJS(ir.lists[i].value) + ";";
	}

	code += globals;
	code += "}";
	code += "}";

	//Build scripts
	for (let i = 0; i < ir.scripts.length; i++) {
		//console.log(ir.scripts[i].script);
		//let scriptjs = scriptToJS(ir.scripts[i].script, spriteNameMap.get(ir.scripts[i].owner));
		//console.log(scriptjs);
	}

	return code;
}
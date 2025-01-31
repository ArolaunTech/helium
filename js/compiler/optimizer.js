//Optimizes IR and returns an optimized IR.
//Types
const TYPE_UNKNOWN = 0;
const TYPE_BOOLEAN = 1;
const TYPE_NUMBER = 2;
const TYPE_STRING = 3;
const DEFAULT_TYPE_VALUES = [null, false, 0, ""];

function findVar(name, owner, vars) {
	for (let i = 0; i < vars.length; i++) {
		if (vars[i].name !== name) {
			continue;
		}
		if ((vars[i].owner !== 'Stage') && (vars[i].owner !== owner)) {
			continue;
		}
		return i;
	}
	console.error("Cannot find variable: ", name, owner, vars);
}

function isLoop(block) {
	let opcode = block[0];
	switch (opcode) {
		case "control_forever":
		case "control_repeat_until":
		case "control_for_each":
		case "control_while":
			return true;
	}
	return false;
}

function hasWait(block) {
	if (isLoop(block)) {
		return true;
	}
	let opcode = block[0];
	switch (opcode) {
		case "motion_glideto":
		case "motion_glidesecstoxy":
		case "looks_sayforsecs":
		case "looks_thinkforsecs":
		case "looks_switchbackdroptoandwait":
		case "sound_playuntildone":
		case "event_broadcastandwait":
		case "control_wait":
		case "control_wait_until":
		case "sensing_askandwait":
		case "music_playDrumForBeats":
		case "music_restForBeats":
		case "music_playNoteForBeats":
		case "text2speech_speakAndWait":
		case "ev3_motorTurnClockwise":
		case "ev3_motorTurnCounterClockwise":
		case "ev3_beep":
		case "boost_motorOnFor":
		case "boost_motorOnForRotation":
		case "wedo2_motorOnFor":
		case "music_midiPlayDrumForBeats":
		case "wedo2_playNoteFor":
			return true;
	}
	return false;
}

function replaceVariableNamesBlock(block, vars, lists, owner) {
	//console.log(block, vars);
	let opcode = block[0];
	let newBlock = [opcode];

	for (let i = 1; i < block.length; i++) {
		if (Array.isArray(block[i])) {
			newBlock.push(replaceVariableNamesBlock(block[i], vars, lists, owner));
		} else {
			newBlock.push(block[i]);
		}
	}

	switch (opcode) {
		case "sensing_of": {
			let property = newBlock[1];
			let object = newBlock[2];
			if (object === "_stage_") {
				object = "Stage";
			} else {
				object = "n" + object;
			}
			if ((object === "Stage") && ['background #', 'backdrop #', 'backdrop name', 'volume'].includes(property)) {
				break;
			}
			if ((object !== "Stage") && ['x position', 'y position', 'direction', 'costume #', 'costume name', 'size', 'volume'].includes(property)) {
				break;
			}

			return ["data_variable", findVar(property, object, vars)];
		}
		case "data_setvariableto":
		case "data_changevariableby": {
			return [opcode, findVar(newBlock[1], owner, vars), newBlock[2]];
		}
		case "data_showvariable":
		case "data_hidevariable":
		case "data_variable": {
			return [opcode, findVar(newBlock[1], owner, vars)];
		}
		case "data_listcontents":
		case "data_lengthoflist":
		case "data_deletealloflist":
		case "data_showlist":
		case "data_hidelist": {
			return [opcode, findVar(newBlock[1], owner, lists)];
		}
		case "data_addtolist":
		case "data_itemoflist":
		case "data_deleteoflist": {
			return [opcode, newBlock[1], findVar(newBlock[2], owner, lists)];
		}
		case "data_insertatlist": {
			return [opcode, newBlock[1], newBlock[2], findVar(newBlock[3], owner, lists)];
		}
		case "data_replaceitemoflist": {
			return [opcode, newBlock[1], findVar(newBlock[2], owner, lists), newBlock[3]];
		}
		case "data_itemnumoflist":
		case "data_listcontainsitem": {
			return [opcode, findVar(newBlock[1], owner, lists), newBlock[2]];
		}
	}
	return newBlock;
}

function replaceVariableNames(script, vars, lists, owner) {
	let newScript = [];
	for (let i = 0; i < script.length; i++) {
		newScript.push(replaceVariableNamesBlock(script[i], vars, lists, owner));
	}
	return newScript;
}

function varsUsed(block) {
	let opcode = block[0];
	if ((opcode === "readVariable") || (opcode === "data_variable")) {
		return [block[1]];
	}
	let out = [];
	for (let i = 1; i < block.length; i++) {
		if (Array.isArray(block[i])) {
			out = out.concat(varsUsed(block[i]));
		}
	}
	return out;
}

function addNewTempVar(vars, type) {
	//Gives a new var index for temporary vars.
	let newidx = vars.length;

	vars.push({
		id: newidx,
		name: "t"+newidx,
		owner: "Stage",
		type: type,
		value: DEFAULT_TYPE_VALUES[type]
	});
	return newidx;
}

function reporterStackType(ir, owner, fullIR) {
	let opcode = ir[0];
	switch (opcode) {
		case "motion_xposition":
		case "motion_yposition":
		case "motion_direction":
		case "looks_size":
		case "sound_volume":
		case "sensing_distanceto":
		case "sensing_mousex":
		case "sensing_mousey":
		case "sensing_loudness":
		case "sensing_timer":
		case "sensing_current":
		case "sensing_dayssince2000":
		case "operator_add":
		case "operator_subtract":
		case "operator_multiply":
		case "operator_divide":
		case "operator_random":
		case "operator_length":
		case "operator_mod":
		case "operator_round":
		case "operator_mathop":
		case "data_itemnumoflist":
		case "data_lengthoflist":
		case "music_getTempo":
		case "videoSensing_videoOn":
		case "microbit_getTiltAngle":
		case "ev3_getMotorPosition":
		case "ev3_getDistance":
		case "ev3_getBrightness":
		case "boost_getMotorPosition":
		case "boost_getTiltAngle":
		case "wedo2_getDistance":
		case "wedo2_getTiltAngle":
		case "gdxfor_getForce":
		case "gdxfor_getTilt":
		case "gdxfor_getSpinSpeed":
		case "gdxfor_getAcceleration":
		case "control_get_counter":
		case "senseVideoMotion":
			return TYPE_NUMBER;
		case "sensing_answer":
		case "sensing_username":
		case "operator_join":
		case "operator_letter_of":
		case "translate_getTranslate":
		case "translate_getViewerLanguage":
		case "motion_xscroll":
		case "motion_yscroll":
		case "sensing_userid":
		case "coreExample_exampleOpcode":
		case "data_listcontents":
		case "argument_reporter_string_number":
			return TYPE_STRING; //Unknown type
		case "sensing_touchingobject":
		case "sensing_touchingcolor":
		case "sensing_coloristouchingcolor":
		case "sensing_keypressed":
		case "sensing_mousedown":
		case "operator_gt":
		case "operator_lt":
		case "operator_equals":
		case "operator_and":
		case "operator_or":
		case "operator_not":
		case "operator_contains":
		case "data_listcontainsitem":
		case "argument_reporter_boolean":
		case "microbit_isButtonPressed":
		case "microbit_isTilted":
		case "ev3_buttonPressed":
		case "boost_seeingColor":
		case "wedo2_isTilted":
		case "gdxfor_isTilted":
		case "gdxfor_isFreeFalling":
		case "sensing_loud":
			return TYPE_BOOLEAN;
		case "looks_costumenumbername":
		case "looks_backdropnumbername":
			if (ir[1] === 'number') {
				return TYPE_NUMBER;
			} else {
				return TYPE_STRING;
			}
		case "sensing_of":
			switch (ir[1]) {
				case "backdrop #":
				case "x position":
				case "y position":
				case "direction":
				case "costume #":
				case "size":
				case "volume":
					return TYPE_NUMBER;
				case "backdrop name":
				case "costume name":
					return TYPE_STRING;
				default:
					return fullIR.variables[ir[1]].type;
			}
		case "data_variable":
			return fullIR.variables[ir[1]].type;
		case "data_itemoflist":
			let listName = ir[2];
			return fullIR.lists[listName].type;
		default:
			console.error("Unrecognized reporter block:", ir);
			return TYPE_UNKNOWN;
	}
}

function removeSpecialVarBlock(block, vars, sounds, owner) {
	let opcode = block[0];

	let newBlock = [opcode];
	for (let i = 1; i < block.length; i++) {
		if (Array.isArray(block[i])) {
			newBlock.push(removeSpecialVarBlock(block[i], vars, sounds, owner)[0]);
		} else {
			newBlock.push(block[i]);
		}
	}

	let timervar = vars[0];
	if (opcode === "sensing_timer") {
		return [[
			"operator_subtract", 
			["helium_time"], 
			["data_variable", timervar]
		]];
	}
	if (opcode === "sensing_resettimer") {
		return [[
			"data_setvariableto", 
			timervar.name, 
			["helium_time"]
		]];
	}

	let answered = vars[1];
	if (opcode === "sensing_askandwait") {
		return [
			["data_setvariableto", answered, false],
			["helium_ask", newBlock[1]],
			["control_wait_until", ["data_variable", answered]]
		];
	}

	if (opcode === "sound_playuntildone") {
		for (let i = 0; i < sounds.length; i++) {
			if (sounds[i].owner !== owner) {
				continue;
			}
			if (sounds[i].obj.name !== newBlock[1]) {
				continue;
			}
			return [
				["sound_play", newBlock[1]],
				["control_wait", sounds[i].obj.sampleCount/sounds[i].obj.rate]
			];
		}
	}
	return [newBlock];
}

function removeSpecialVarScript(script, vars, sounds, owner) {
	let newScript = [];
	for (let i = 0; i < script.length; i++) {
		newScript = newScript.concat(removeSpecialVarBlock(script[i], vars, sounds, owner));
	}
	return newScript;
}

function countOpcodesBlock(block) {
	let opcodes = [];
	if (block[0].slice(0,7) !== "helium_") {//(true) {
		opcodes = [block[0]];
	}

	//if (block[0] === "procedures_definition") {
	//	console.log(block);
	//}

	for (let i = 1; i < block.length; i++) {
		if (Array.isArray(block[i])) {
			opcodes = opcodes.concat(countOpcodesBlock(block[i]));
		}
	}
	return opcodes;
}

function countOpcodesScript(script) {
	let opcodes = [];
	for (let i = 0; i < script.length; i++) {
		opcodes = opcodes.concat(countOpcodesBlock(script[i]));
	}
	return opcodes;
}

function reporterStackToSSA(ir, numvars) {
	let block = [ir[0]];
	let newNumVars = numvars;
	let ssa = [];
	for (let i = 1; i < ir.length; i++) {
		if (Array.isArray(ir[i])) {
			let childSSA = reporterStackToSSA(ir[i], newNumVars);
			ssa = ssa.concat(childSSA.ssa);
			newNumVars = childSSA.numvars;
			block.push({type:"var", val:newNumVars-1});
		} else {
			block.push({type:"value", val:ir[i]});
		}
	}

	ssa.push(["helium_val", newNumVars, block]);
	return {ssa: ssa, numvars: newNumVars + 1};
}

function scriptToSSA(ir, numvars) {
	let ssa = [];
	let newNumVars = numvars;
	//console.log(ir);
	for (let i = 0; i < ir.length; i++) {
		let block = ir[i];
		if (block[0] === 'procedures_definition') {
			ssa.push(block);
			continue;
		}
		let newBlock = [block[0]];
		//console.log(block);
		for (let j = 1; j < block.length; j++) {
			if (Array.isArray(block[j])) {
				//Reporter stack
				let childSSA = reporterStackToSSA(block[j], newNumVars);
				ssa = ssa.concat(childSSA.ssa);
				newNumVars = childSSA.numvars;
				newBlock.push({type:"var", val:newNumVars-1});
			} else {
				newBlock.push({type:"value", val:block[j]});
			}
		}
		ssa.push(newBlock);
	}
	return {
		ssa: ssa,
		numvars: newNumVars
	};
}

function setVarType(varidx, type, vartypemap) {
	//console.log(varidx, type, vartypemap);
	if (type <= vartypemap[varidx].type) { //Don't set type if it wouldn't do anything
		return;
	}
	vartypemap[varidx].type = type;
	for (let i = 0; i < vartypemap[varidx].children.length; i++) {
		setVarType(vartypemap[varidx].children[i], type, vartypemap);
	}
}

function addChild(parent, child, vartypemap) {
	if (!vartypemap[parent].childSet.has(child)) {
		vartypemap[parent].children.push(child);
		vartypemap[parent].childSet.add(child);
		setVarType(child, vartypemap[parent].type, vartypemap);
	}
}

function optimisticType(obj) {
	if ((typeof obj === 'boolean') || (castToString(castToBoolean(obj)) === obj)) {
		return TYPE_BOOLEAN;
	}
	if ((typeof obj === 'number') || (castToString(castToNumber(obj)) === obj)) {
		return TYPE_NUMBER;
	}
	return TYPE_STRING;
}

function optimizeIR(ir) {
	console.log(structuredClone(ir));
	for (let i = 0; i < ir.scripts.length; i++) {
		console.log(structuredClone(ir.scripts[i].script));
		//console.log(JSON.stringify(ir.scripts[i].script));
	}

	//"Fix" internal scripts
	let internalscriptmap = new Map();
	let internalscriptset = new Set();
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		for (let j = 0; j < script.length; j++) {
			let block = script[j];
			//if (block[0].slice(0, 7) === "control") {
			//	console.log(JSON.stringify(block));
			//}
			for (let k = 1; k < block.length; k++) {
				if (!(Array.isArray(block[k]) && Array.isArray(block[k][0]))) {
					continue;
				}
				if (internalscriptset.has(block[k])) {
					ir.scripts[i].script[j][k] = {script: internalscriptmap.get(block[k])};
				} else {
					ir.scripts.push({owner: ir.scripts[i].owner, parent: i, script: block[k]});
					ir.scripts[i].script[j][k] = {script: ir.scripts.length - 1};
					internalscriptset.add(block[k]);
					internalscriptmap.set(block[k], ir.scripts.length - 1);
				}
			}
		}
	}
	console.log(JSON.stringify(ir.scripts));

	//Replace variable names with IDs
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		ir.scripts[i].script = replaceVariableNames(script, ir.variables, ir.lists, ir.scripts[i].owner);
	}

	//Determine variable+list types
	let variableListMatrix = [];
	for (let i = 0; i < ir.variables.length + ir.lists.length; i++) {
		variableListMatrix.push({
			type: TYPE_UNKNOWN,
			children: [],
			childSet: new Set()
		});
	}
	for (let i = 0; i < ir.variables.length; i++) {
		variableListMatrix[i].type = optimisticType(ir.variables[i].value);
	}
	let numVars = ir.variables.length;
	for (let i = 0; i < ir.lists.length; i++) {
		for (let j = 0; j < ir.lists[i].value.length; j++) {
			let newType = optimisticType(ir.lists[i].value[j]);
			if (variableListMatrix[i + numVars].type < newType) {
				variableListMatrix[i + numVars].type = newType;
			}
		}
	}
	for (let i = 0; i < ir.monitors.length; i++) {
		let monitor = ir.monitors[i];
		if (monitor.opcode !== 'data_variable') {
			continue;
		}
		if (monitor.mode !== 'slider') {
			continue;
		}
		let readVar = findVar(monitor.params.VARIABLE, monitor.spriteName, ir.variables);
		if (variableListMatrix[readVar].type >= TYPE_NUMBER) {
			continue;
		}
		variableListMatrix[readVar].type = TYPE_NUMBER;
	}
	console.log(JSON.stringify(variableListMatrix));
	console.log(JSON.stringify(ir.variables));
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		let owner = ir.scripts[i].owner;
		for (let j = 0; j < script.length; j++) {
			let block = script[j];
			let opcode = block[0];
			if (
				(opcode !== 'data_setvariableto') &&
				(opcode !== 'data_changevariableby') &&
				(opcode !== 'data_addtolist') &&
				(opcode !== 'data_insertatlist') &&
				(opcode !== 'data_replaceitemoflist')
			) {continue;}
			//console.log(JSON.stringify(block));

			//Set types
			if (opcode === 'data_setvariableto') {
				//console.log(script, block, block[1], owner, ir.variables);
				let currVar = block[1];
				if (Array.isArray(block[2])) {
					let reporterOpcode = block[2][0];
					if (reporterOpcode === 'data_variable') {
						console.log(block[2]);
						let readVar = block[2][1];
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'data_itemoflist') {
						let readVar = block[2][2] + ir.variables.length;
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'sensing_of') {
						let reporterType = TYPE_UNKNOWN;
						let reporterVar = false;
						switch (block[2][1]) {
							case "backdrop #":
							case "x position":
							case "y position":
							case "direction":
							case "costume #":
							case "size":
							case "volume":
								reporterType = TYPE_NUMBER;
								break;
							case "backdrop name":
							case "costume name":
								reporterType = TYPE_STRING;
								break;
							default:
								let readVar = block[2][1];
								addChild(readVar, currVar, variableListMatrix);
								reporterVar = true;
								break;
						}
						if (reporterVar) {
							continue;
						}
						setVarType(currVar, reporterType, variableListMatrix);
					}
				} else {
					let type = optimisticType(block[2]);
					if (type === TYPE_BOOLEAN) {
						block[2] = castToBoolean(block[2]);
					}
					if (type === TYPE_NUMBER) {
						block[2] = castToNumber(block[2]);
					}
					console.log(currVar);
					setVarType(currVar, type, variableListMatrix);
				}
			} else if (opcode === 'data_changevariableby') {
				//change variable casts the variable to a number
				setVarType(block[1], TYPE_NUMBER, variableListMatrix);
			} else {
				//list operations - lists are treated as having one type (remember this works because strings are the universal type)
				//console.log(block, owner, ir.lists);
				let varName = block[2];
				let valueName = block[1];
				if (opcode === 'data_replaceitemoflist') {
					valueName = block[3];
				}
				if (opcode === 'data_insertatlist') {
					varName = block[3];
				}
				let currVar = varName + ir.variables.length;
				if (Array.isArray(valueName)) {
					let reporterOpcode = valueName[0];
					if (reporterOpcode === 'data_variable') {
						let readVar = valueName[1];
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'data_itemoflist') {
						let readVar = valueName[2] + ir.variables.length;
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'sensing_of') {
						let reporterType = TYPE_UNKNOWN;
						let reporterVar = false;
						switch (valueName[1]) {
							case "backdrop #":
							case "x position":
							case "y position":
							case "direction":
							case "costume #":
							case "size":
							case "volume":
								reporterType = TYPE_NUMBER;
								break;
							case "backdrop name":
							case "costume name":
								reporterType = TYPE_STRING;
								break;
							default:
								let readVar = valueName[1];
								addChild(readVar, currVar, variableListMatrix);
								reporterVar = true;
								break;
						}
						if (reporterVar) {
							continue;
						}
						setVarType(currVar, reporterType, variableListMatrix);
					}
				} else {
					let type = optimisticType(valueName);
					setVarType(currVar, type, variableListMatrix);
				}
			}
			//console.log(block);
		}
	}
	for (let i = 0; i < variableListMatrix.length; i++) {
		if (variableListMatrix[i].type === TYPE_UNKNOWN) {
			variableListMatrix[i].type = TYPE_STRING;
		}
	}
	for (let i = 0; i < ir.variables.length; i++) {
		ir.variables[i].type = variableListMatrix[i].type;
	}
	for (let i = 0; i < ir.lists.length; i++) {
		ir.lists[i].type = variableListMatrix[i + numVars].type;
	}
	ir.variableListMatrix = variableListMatrix;

	//Remove timer blocks
	const timervar = addNewTempVar(ir.variables, TYPE_NUMBER);
	const answered = addNewTempVar(ir.variables, TYPE_BOOLEAN);
	for (let i = 0; i < ir.scripts.length; i++) {
		ir.scripts[i].script = removeSpecialVarScript(ir.scripts[i].script, [timervar, answered], ir.sounds, ir.scripts[i].owner);
	}

	//Remove wait blocks
	//console.log(JSON.stringify(ir.scripts));
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		ir.scripts[i].script = simplifyScript(script, ir.scripts, i, ir.variables, ir.scripts[i].owner);
	}

	let opcodes = [];
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		//console.log(i, script);
		opcodes = opcodes.concat(countOpcodesScript(script));
	}
	opcodes = [...new Set(opcodes)];
	console.log(JSON.stringify(opcodes), opcodes.length);
	console.log(JSON.stringify(ir.scripts));

	//SSA (not really)
	numVars = 0;
	ir.ssa = [];
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		let ssa = scriptToSSA(script, numVars);
		numVars = ssa.numvars;
		ir.ssa.push(ssa.ssa);
	}

	//highlight start/end of basic blocks
	console.log(JSON.stringify(ir.ssa));
	for (let i = 0; i < ir.ssa.length; i++) {
		let script = ir.ssa[i];
		for (let j = 0; j < script.length; j++) {
			if (!hasWait(script[j])) {
				continue;
			}
			if (isLoop(script[j])) {
				console.log(script[j]);
				let k = 0;
				for (; k < script[j].length; k++) {
					if (!script[j][k].val) {
						continue;
					}
					if (script[j][k].val.script) {
						break;
					}
				}
				ir.ssa[script[j][k].val.script].push(["helium_end"]);
				ir.ssa[script[j][k].val.script].push(["helium_start"]);
			} else {
				console.log(script[j]);
				ir.ssa[i].splice(j, 0, ["helium_end"]);
				ir.ssa[i].splice(j+2, 0, ["helium_start"]);
				j++;
			}
			console.log(i, j, script[j]);
		}
		if (doesScriptDoAnything(script)) {
			ir.ssa[i].splice(1,0,["helium_start"]);
			ir.ssa[i].push(["helium_end"]);
		}
	}

	//Remove empty blocks
	for (let i = 0; i < ir.ssa.length; i++) {
		for (let j = 0; j < ir.ssa[i].length-1; j++) {
			if (
				nDarrayEquality(ir.ssa[i][j],["helium_start"]) && 
				nDarrayEquality(ir.ssa[i][j+1],["helium_end"])
			) {
				ir.ssa[i].splice(j,2);
				j--;
			}
		}
	}
	console.log(JSON.stringify(ir.ssa));

	//Turn variables to values
	let valIndexes = [];
	for (let i = 0; i < variableListMatrix.length; i++) {
		valIndexes.push(-1);
	}
	console.log(valIndexes);
	for (let i = 0; i < ir.ssa.length; i++) {
		let script = ir.ssa[i];
		for (let j = 0; j < script.length; j++) {
			if (nDarrayEquality(script[j], ["helium_start"])) {
				console.log(j, script[j]);

				let insert = [];
				for (let k = 0; k < valIndexes.length; k++) {
					
				}
			}
		}
	}

	//Optimization passes
	for (let i = 0; i < 10; i++) {

	}

	return ir;
}
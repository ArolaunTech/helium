//Optimizes IR and returns an optimized IR.
//Types
const TYPE_UNKNOWN = 0;
const TYPE_BOOLEAN = 1;
const TYPE_NUMBER = 2;
const TYPE_STRING = 3;

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
}

function blockToStacks(ir) {
	let out = [];
	for (let i = 1; i < ir.length; i++) {
		if (Array.isArray(ir[i])) {
			out = out.concat(blockToStacks(ir[i]));
		} else {
			out.push(ir[i]);
		}
	}
	out.push(ir[0]);
	return out;
}

function scriptToStacks(ir) {
	let out = [];
	for (let i = 0; i < ir.length; i++) {
		out = out.concat(blockToStacks(ir[i]));
	}
	return out;
}

function optimizeReporterStack(ir) {
	let opcode = ir[0];
	console.log(opcode);
}

function optimizeReporterBlock(ir) {
	if (Array.isArray(ir[0])) {
		return optimizeBlockStack(ir);
	}
	return optimizeReporterStack(ir);
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
		case "xpos":
		case "ypos":
		case "heading":
		case "costumeIndex":
		case "backgroundIndex":
		case "scale":
		case "volume":
		case "tempo":
		case "distanceTo:":
		case "mouseX":
		case "mouseY":
		case "soundLevel":
		case "senseVideoMotion":
		case "timer":
		case "timeAndDate":
		case "timestamp":
		case "+":
		case "-":
		case "*":
		case "/":
		case "randomFrom:to:":
		case "stringLength:":
		case "%":
		case "rounded":
		case "computeFunction:of:":
		case "lineCountOfList:":
		case "COUNT":
			return TYPE_NUMBER;
		case "sensing_answer":
		case "sensing_usename":
		case "operator_join":
		case "operator_letter_of":
		case "translate_getTranslate":
		case "translate_getViewerLanguage":
		case "motion_xscroll":
		case "motion_yscroll":
		case "sensing_userid":
		case "coreExample_exampleOpcode":
		case "data_listcontents":
		case "sceneName":
		case "answer":
		case "getUserName":
		case "concatenate:with:":
		case "letter:of:":
		case "contentsOfList:":
		case "getParam":
		case "xScroll":
		case "yScroll":
		case "getUserId":
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
		case "touching:":
		case "touchingColor:":
		case "color:sees:":
		case "keyPressed:":
		case "mousePressed":
		case "<":
		case "=":
		case ">":
		case "&":
		case "|":
		case "not":
		case "list:contains:":
		case "isLoud":
			return TYPE_BOOLEAN;
		case "looks_costumenumbername":
		case "looks_backdropnumbername":
			if (ir[1] === 'number') {
				return TYPE_NUMBER;
			} else {
				return TYPE_STRING;
			}
		case "sensing_of":
		case "getAttribute:of:":
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
					let readVar = findVar(
						ir[1], 
						(ir[2] === "_stage_" ? "Stage" : ("n" + ir[2])), 
						fullIR.variables
					);
					return fullIR.variables[readVar].type;
			}
		case "data_variable":
		case "readVariable":
			let variableName = ir[1];
			return fullIR.variables[findVar(variableName, owner, fullIR.variables)].type;
		case "data_itemoflist":
		case "getLine:ofList:": //IDK for this one
			let listName = (opcode === "getLine:ofList:") ? ir[2] : ir[1];
			return fullIR.lists[findVar(listName, owner, fullIR.lists)].type;
		default:
			console.error("Unrecognized reporter block:", ir);
			return TYPE_UNKNOWN;
	}
}

function optimizeBlock(ir) {
	if (ir.length === 1) {
		return ir; //Skip blocks with no arguments
	}
	let newIR = structuredClone(ir);
	for (let i = 1; i < ir.length; i++) {
		if (Array.isArray(ir[i])) {
			newIR[i] = optimizeReporterBlock(ir[i]);
		}
	}
	return newIR;
}

function optimizeBlockStack(ir) {
	for (let i = 0; i < ir.length; i++) {
		let block = ir[i];
		console.log(block, optimizeBlock(block));
	}
}

function setVarType(varidx, type, vartypemap) {
	if (type <= vartypemap[varidx].type) { //Don't set type if it wouldn't dp anything
		return;
	}
	vartypemap[varidx].type = type;
	for (let i = 0; i < vartypemap[varidx].children; i++) {
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
	console.log(ir);
	let scripts = [];

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
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		let owner = ir.scripts[i].owner;
		for (let j = 0; j < script.length; j++) {
			let block = script[j];
			let opcode = block[0];
			if (
				(opcode !== 'setVar:to:') &&
				(opcode !== 'changeVar:by:') &&
				(opcode !== 'append:toList:') &&
				(opcode !== 'insert:at:ofList:') &&
				(opcode !== 'setLine:ofList:to:') &&
				(opcode !== 'data_setvariableto') &&
				(opcode !== 'data_changevariableby') &&
				(opcode !== 'data_addtolist') &&
				(opcode !== 'data_insertatlist') &&
				(opcode !== 'data_replaceitemoflist')
			) {continue;}

			//Set types
			if ((opcode === 'setVar:to:') || (opcode === 'data_setvariableto')) {
				let currVar = findVar(block[1], owner, ir.variables);
				if (Array.isArray(block[2])) {
					let reporterOpcode = block[2][0];
					if (
						(reporterOpcode === 'readVariable') ||
						(reporterOpcode === 'data_variable')
					) {
						let readVar = findVar(block[2][1], owner, ir.variables);
						addChild(readVar, currVar, variableListMatrix);
					}
					if (
						(reporterOpcode === 'getLine:ofList:') ||
						(reporterOpcode === 'data_itemoflist')
					) {
						let readVar = findVar(block[2][1], owner, ir.lists) + ir.variables.length;
						addChild(readVar, currVar, variableListMatrix);
					}
					if (
						(reporterOpcode === 'getAttribute:of:') ||
						(reporterOpcode === 'sensing_of')
					) {
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
								let readVar = findVar(
									block[2][1], 
									(block[2][2] === "_stage_" ? "Stage" : ("n" + block[2][2])), 
									ir.variables
								);
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
					setVarType(currVar, type, variableListMatrix);
				}
			} else if ((opcode === 'changeVar:by:') || (opcode === 'data_changevariableby')) {
				//change variable casts the variable to a number
				setVarType(findVar(block[1], owner, ir.variables), TYPE_NUMBER, variableListMatrix);
			} else {
				//list operations - lists are treated as having one type (remember this works because strings are the universal type)
				//console.log(block, owner, ir.lists);
				let varName = block[1];
				let valueName = block[2];
				if (opcode === 'append:toList:') {
					varName = block[2];
					valueName = block[1];
				} else if (opcode === 'insert:at:ofList:') {
					varName = block[3];
					valueName = block[1];
				} else if (opcode === 'setLine:ofList:to:') {
					varName = block[2];
					valueName = block[3];
				} else if (opcode === 'data_replaceitemoflist') {
					valueName = block[3];
				}
				let currVar = findVar(varName, owner, ir.lists) + ir.variables.length;
				if (Array.isArray(valueName)) {
					let reporterOpcode = valueName[0];
					if (
						(reporterOpcode === 'readVariable') ||
						(reporterOpcode === 'data_variable')
					) {
						let readVar = findVar(valueName[1], owner, ir.variables);
						addChild(readVar, currVar, variableListMatrix);
					}
					if (
						(reporterOpcode === 'getLine:ofList:') ||
						(reporterOpcode === 'data_itemoflist')
					) {
						let readVar = findVar(valueName[1], owner, ir.lists) + ir.variables.length;
						addChild(readVar, currVar, variableListMatrix);
					}
					if (
						(reporterOpcode === 'getAttribute:of:') ||
						(reporterOpcode === 'sensing_of')
					) {
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
								let readVar = findVar(
									valueName[1], 
									(valueName[2] === "_stage_" ? "Stage" : ("n" + valueName[2])), 
									ir.variables
								);
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

	//Optimize blocks
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		console.log(script, scriptToStacks(script));
	}

	//ir.scripts = scripts;
	//Delete unused variables + lists

	return ir;
}
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
}

function isLoop(block) {
	let opcode = block[0];
	switch (opcode) {
		case "doRepeat":
		case "doForever":
		case "doUntil":
		case "doForLoop":
		case "doWhile":
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
		case "glideSecs:toX:y:elapsed:from:":
		case "doBroadcastAndWait":
		case "say:duration:elapsed:from:":
		case "think:duration:elapsed:from:":
		case "startSceneAndWait":
		case "wait:elapsed:from:":
		case "doWaitUntil":
		case "doPlaySoundAndWait":
		case "playDrum":
		case "rest:elapsed:from:":
		case "doAsk":
		case "drum:duration:elapsed:from:":
		case "motion_glideto":
		case "motion_glidesecstoxy":
		case "looks_sayforsecs":
		case "looks_thinkforsecs":
		case "looks_switchbackdroptoandwait":
		case "sound_playuntildone":
		case "event_broadcastandwait":
		case "control_wait":
		case "motion_turnright":
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
	return {idx: newidx, name: "t"+newidx};
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

function constEvalReporterStack(ir) {
	let newIR = [ir[0]];
	for (let i = 1; i < ir.length; i++) {
		if (Array.isArray(ir[i])) {
			newIR.push(constEvalReporterStack(ir[i]));
		} else {
			newIR.push(ir[i]);
		}
	}

	for (let i = 1; i < newIR.length; i++) {
		if (Array.isArray(newIR[i])) {
			return newIR;
		}
	}
	//Const evaluation
	let opcode = newIR[0];
	switch (opcode) {
		case "operator_add":
		case "+":
			return castToNumber(newIR[1]) + castToNumber(newIR[2]);
		case "operator_subtract":
		case "-":
			return castToNumber(newIR[1]) - castToNumber(newIR[2]);
		case "operator_multiply":
		case "*":
			return castToNumber(newIR[1]) * castToNumber(newIR[2]);
		case "operator_divide":
		case "/":
			return castToNumber(newIR[1]) / castToNumber(newIR[2]);
		case "operator_gt":
		case ">":
			return castCompare(newIR[1], newIR[2]) > 0;
		case "operator_lt":
		case "<":
			return castCompare(newIR[1], newIR[2]) < 0;
		case "operator_equals":
		case "=":
			return castCompare(newIR[1], newIR[2]) === 0;
		case "operator_and":
		case "&":
			return castToBoolean(newIR[1]) && castToBoolean(newIR[2]);
		case "operator_or":
		case "|":
			return castToBoolean(newIR[1]) || castToBoolean(newIR[2]);
		case "operator_not":
		case "not":
			return !castToBoolean(newIR[1]);
		case "operator_join":
		case "concatenate:with:":
			return castToString(newIR[1]) + castToString(newIR[2]);
		case "operator_letter_of":
		case "letter:of:":
			const index = newIR[1];
			const str = newIR[2];
			if (index < 1 || index > str.length) {
				return "";
			}
			return str.charAt(index - 1);
		case "operator_length":
		case "stringLength:":
			return castToString(newIR[1]).length;
		case "operator_contains":
			return castToString(newIR[1])
				.toLowerCase()
				.includes(
					castToString(newIR[2])
					.toLowerCase()
				);
		case "operator_mod":
		case "%":
			const mn = castToNumber(newIR[1]);
			const modulus = castToNumber(newIR[2]);
			let result = mn % modulus;
			if (result / modulus < 0) {
				result += modulus;
			}
			return result;
		case "operator_round":
		case "rounded":
			return Math.round(castToNumber(newIR[1]));
		case "operator_mathop":
		case "computeFunction:of:":
			const mathop = castToString(newIR[1]).toLowerCase();
			let n = castToNumber(newIR[2]);
			switch (operator) {
				case "abs":
					return Math.abs(n);
				case "floor":
					return Math.floor(n);
				case "ceiling":
					return Math.ceil(n);
				case "sqrt":
					return Math.sqrt(n);
				case "sin":
					return Math.round(Math.sin((Math.PI * n) / 180) * 1e10) / 1e10;
				case "cos":
					return Math.round(Math.cos((Math.PI * n) / 180) * 1e10) / 1e10;
				case "tan":
					n = n % 360;
					if (n === 90 || n === -270) {
						return Infinity;
					}
					if (n === 270 || n === -90) {
						return -Infinity;
					}
					return Math.round(Math.tan((Math.PI * n) / 180) * 1e10) / 1e10;
				case "asin":
					return (Math.asin(n) * 180) / Math.PI;
				case "acos":
					return (Math.acos(n) * 180) / Math.PI;
				case "atan":
					return (Math.atan(n) * 180) / Math.PI;
				case "ln":
					return Math.log(n);
				case "log":
					return Math.log(n)/Math.log(10);
				case "e ^":
					return Math.exp(n);
				case "10 ^":
					return Math.pow(10, n);
			}
	}
	return newIR;
}

function constEvalScript(ir) {
	let out = [ir[0]];
	for (let i = 1; i < ir.length; i++) {
		let block = ir[i];
		let newBlock = [block[0]];
		for (let j = 1; j < block.length; j++) {
			if (Array.isArray(block[j])) {
				newBlock.push(constEvalReporterStack(block[j]));
			} else {
				newBlock.push(block[j]);
			}
		}
		out.push(newBlock);
	}
	return out;
}

function simplifyReporterStack(ir, scripts, vars, owner) {
	return ir;
}

function simplifyBlock(ir, scripts, vars, owner) {
	//Turns a block into a simpler form.
	let opcode = ir[0];
	let block = [opcode];
	for (let i = 1; i < ir.length; i++) {
		block.push(simplifyReporterStack(ir[i], scripts, vars, owner));
	}
	switch (opcode) {
		case "motion_movesteps":
		case "forward:":
			return simplifyScript([[
				"motion_gotoxy",
				[
					"operator_add",
					["motion_xposition"],
					[
						"operator_multiply",
						block[1],
						[
							"helium_sin",
							["motion_direction"]
						]
					]
				],
				[
					"operator_add",
					["motion_yposition"],
					[
						"operator_multiply",
						block[1],
						[
							"helium_cos",
							["motion_direction"]
						]
					]
				]
			]], scripts, vars, owner);
		case "motion_turnleft":
		case "turnLeft:":
			return simplifyScript([[
				"motion_turnright", 
				["operator_subtract", 0, block[1]]
			]], scripts, vars, owner);
		case "motion_turnright":
		case "turnRight:":
			return simplifyScript([[
				"motion_pointindirection", 
				["operator_add", ["motion_direction"], block[1]]
			]], scripts, vars, owner);
		case "motion_goto":
		case "gotoSpriteOrMouse:":
			if (block[1] === "_mouse_") {
				//Goto mouse
				return simplifyScript([[
					"motion_gotoxy",
					["sensing_mousex"],
					["sensing_mousey"]
				]], scripts, vars, owner);
			} else if (block[1] === "_random_") {
				return simplifyScript([[
					"motion_gotoxy",
					[
						"operator_multiply",
						["helium_stagewidth"],
						["operator_random", -0.5, 0.5]
					],
					[
						"operator_multiply", 
						["helium_stageheight"], 
						["operator_random", -0.5, 0.5]
					],
				]], scripts, vars, owner);
			} else {
				return simplifyScript([[
					"motion_gotoxy",
					["sensing_of", "x position", block[1]],
					["sensing_of", "y position", block[1]]
				]], scripts, vars, owner);
			}
		case "motion_gotoxy":
		case "gotoX:y:":
			return simplifyScript([
				["motion_setx", block[1]],
				["motion_sety", block[2]]
			], scripts, vars, owner);
		case "motion_glideto":
			if (block[2] === "_mouse_") {
				//Goto mouse
				return simplifyScript([[
					"motion_glidesecstoxy",
					block[1],
					["sensing_mousex"],
					["sensing_mousey"]
				]], scripts, vars, owner);
			} else if (block[2] === "_random_") {
				return simplifyScript([[
					"motion_glidesecstoxy",
					block[1],
					[
						"operator_multiply",
						["helium_stagewidth"],
						["operator_random", -0.5, 0.5]
					],
					[
						"operator_multiply", 
						["helium_stageheight"], 
						["operator_random", -0.5, 0.5]
					],
				]], scripts, vars, owner);
			} else {
				return simplifyScript([[
					"motion_glidesecstoxy",
					block[1],
					["sensing_of", "x position", block[2]],
					["sensing_of", "y position", block[2]]
				]], scripts, vars, owner);
			}
		case "motion_glidesecstoxy":
		case "glideSecs:toX:y:elapsed:from:": {
			//Secs, X, Y
			let x1 = addNewTempVar(vars, TYPE_NUMBER);
			let y1 = addNewTempVar(vars, TYPE_NUMBER);
			let time = addNewTempVar(vars, TYPE_NUMBER);
			let dx = addNewTempVar(vars, TYPE_NUMBER);
			let dy = addNewTempVar(vars, TYPE_NUMBER);
			let travelSpeed = addNewTempVar(vars, TYPE_NUMBER);
			let endTime = addNewTempVar(vars, TYPE_NUMBER);

			scripts.push({owner: owner, script: [[
				"motion_gotoxy", //Add goto logic here
				[
					"operator_add",
					["data_variable", x1.name],
					[
						"operator_multiply",
						["data_variable", dx.name],
						[
							"operator_multiply",
							["operator_subtract", ["helium_time"], ["data_variable", time.name]],
							["data_variable", travelSpeed.name]
						]
					]
				],
				[
					"operator_add",
					["data_variable", y1.name],
					[
						"operator_multiply",
						["data_variable", dy.name],
						[
							"operator_multiply",
							["operator_subtract", ["helium_time"], ["data_variable", time.name]],
							["data_variable", travelSpeed.name]
						]
					]
				]
			]]});
			return simplifyScript([
				["data_setvariableto", x1.name, ["motion_xposition"]],
				["data_setvariableto", y1.name, ["motion_yposition"]],
				["data_setvariableto", time.name, ["helium_time"]],
				["data_setvariableto", dx.name, ["operator_subtract", block[2], ["motion_xposition"]]],
				["data_setvariableto", dy.name, ["operator_subtract", block[3], ["motion_yposition"]]],
				["data_setvariableto", travelSpeed.name, ["operator_divide", 1, block[1]]],
				["data_setvariableto", endTime.name, ["operator_add", block[1], ["helium_time"]]],
				[
					"control_repeat_until", 
					["operator_gt", ["helium_time"], ["data_variable", endTime.name]],
					{script: scripts.length-1}
				]
			], scripts, vars, owner);
		}
		case "motion_pointtowards":
		case "motion_pointTowards:":
			if (block[1] === '_random_') {
				return simplifyScript([[
					"motion_pointindirection",
					["operator_random", -180.0, 180.0]
				]], scripts, vars, owner);
			}
			if (block[1] === '_mouse_') {
				return simplifyScript([[
					"motion_pointindirection",
					[
						"operator_subtract", 
						90, 
						[
							"helium_scratch_atan2",
							["operator_subtract", ["sensing_mousex"], ["motion_xposition"]],
							["operator_subtract", ["sensing_mousey"], ["motion_yposition"]]
						]
					]
				]], scripts, vars, owner);
			}
			return simplifyScript([[
				"motion_pointindirection",
				[
					"operator_subtract", 
					90, 
					[
						"helium_scratch_atan2",
						["operator_subtract", ["sensing_of", "x position", block[1]], ["motion_xposition"]],
						["operator_subtract", ["sensing_of", "y position", block[1]], ["motion_yposition"]]
					]
				]
			]], scripts, vars, owner);
		case "motion_changexby":
		case "changeXposBy:":
			return simplifyScript([[
				"motion_setx",
				["operator_add", ["motion_xposition"], block[1]]
			]], scripts, vars, owner);
		case "motion_changeyby":
		case "changeYposBy:":
			return simplifyScript([[
				"motion_sety",
				["operator_add", ["motion_yposition"], block[1]]
			]], scripts, vars, owner);
		case "motion_ifonedgebounce":
		case "bounceOffEdge":
			//Very complicated block
			let boundsLeft = addNewTempVar(vars, TYPE_NUMBER);
			let boundsTop = addNewTempVar(vars, TYPE_NUMBER);
			let boundsRight = addNewTempVar(vars, TYPE_NUMBER);
			let boundsBottom = addNewTempVar(vars, TYPE_NUMBER);

			let distLeft = addNewTempVar(vars, TYPE_NUMBER);
			let distTop = addNewTempVar(vars, TYPE_NUMBER);
			let distRight = addNewTempVar(vars, TYPE_NUMBER);
			let distBottom = addNewTempVar(vars, TYPE_NUMBER);
			let minDist = addNewTempVar(vars, TYPE_NUMBER);

			let radians = addNewTempVar(vars, TYPE_NUMBER);
			let dx = addNewTempVar(vars, TYPE_NUMBER);
			let dy = addNewTempVar(vars, TYPE_NUMBER);

			scripts.push({owner: owner, script: [[
				"data_setvariableto", 
				dx.name, 
				[
					"helium_max", 
					0.2, 
					[
						"operator_mathop", 
						"abs", 
						["data_variable", dx.name]
					]
				]
			]]});
			scripts.push({owner: owner, script: [[
				"data_setvariableto", 
				dy.name, 
				[
					"helium_max", 
					0.2, 
					[
						"operator_mathop", 
						"abs", 
						["data_variable", dy.name]
					]
				]
			]]});
			scripts.push({owner: owner, script: [[
				"data_setvariableto", 
				dx.name, ["operator_subtract", 0, 
				[
					"helium_max", 
					0.2, 
					[
						"operator_mathop", 
						"abs", 
						["data_variable", dx.name]
					]
				]]
			]]});
			scripts.push({owner: owner, script: [[
				"data_setvariableto", 
				dy.name, ["operator_subtract", 0, 
				[
					"helium_max", 
					0.2, 
					[
						"operator_mathop", 
						"abs", 
						["data_variable", dy.name]
					]
				]]
			]]});
			scripts.push({owner:owner, script: [
				[
					"data_setvariableto", 
					radians.name, 
					[
						"operator_multiply", 
						Math.PI/180, 
						["operator_subtract", 90, ["motion_direction"]]
					]
				],
				["data_setvariableto", dx.name, ["helium_cos", ["data_variable", radians.name]]],
				["data_setvariableto", dy.name, ["operator_subtract", 0, ["helium_sin", ["data_variable", radians.name]]]],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist.name],
						["data_variable", distLeft.name]
					],
					{script: scripts.length-4}
				],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist.name],
						["data_variable", distTop.name]
					],
					{script: scripts.length-3}
				],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist.name],
						["data_variable", distRight.name]
					],
					{script: scripts.length-2}
				],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist.name],
						["data_variable", distBottom.name]
					],
					{script: scripts.length-1}
				],
				[
					"motion_pointindirection", 
					["operator_add", 90, ["helium_scratch_atan2", ["data_variable", dy.name], ["data_variable", dx.name]]]
				],
				[
					"motion_changexby",
					[
						"operator_add",
						[
							"helium_max", 
							0, 
							[
								"operator_subtract", 
								["operator_multiply", -0.5, ["helium_stagewidth"]],
								["data_variable", boundsLeft.name]
							]
						],
						[
							"helium_min", 
							0, 
							[
								"operator_subtract", 
								["operator_multiply", 0.5, ["helium_stagewidth"]],
								["data_variable", boundsRight.name]
							]
						]
					]
				],
				[
					"motion_changeyby",
					[
						"operator_add",
						[
							"helium_max", 
							0, 
							[
								"operator_subtract", 
								["operator_multiply", -0.5, ["helium_stageheight"]],
								["data_variable", boundsBottom.name]
							]
						],
						[
							"helium_min", 
							0, 
							[
								"operator_subtract", 
								["operator_multiply", 0.5, ["helium_stageheight"]],
								["data_variable", boundsTop.name]
							]
						]
					]
				]
			]});

			return simplifyScript([
				[
					"data_setvariableto",
					boundsLeft.name,
					["helium_boundsleft"]
				],
				[
					"data_setvariableto",
					boundsTop.name,
					["helium_boundstop"]
				],
				[
					"data_setvariableto",
					boundsRight.name,
					["helium_boundsright"]
				],
				[
					"data_setvariableto",
					boundsBottom.name,
					["helium_boundsbottom"]
				],
				[
					"data_setvariableto", 
					distLeft.name, 
					[
						"helium_max", 
						0, 
						[
							"operator_add",
							["operator_multiply", 0.5, ["helium_stagewidth"]],
							["data_variable", boundsLeft.name]
						]
					]
				],
				[
					"data_setvariableto", 
					distTop.name, 
					[
						"helium_max", 
						0, 
						[
							"operator_subtract",
							["operator_multiply", 0.5, ["helium_stageheight"]],
							["data_variable", boundsTop.name]
						]
					]
				],
				[
					"data_setvariableto", 
					distRight.name, 
					[
						"helium_max", 
						0, 
						[
							"operator_subtract",
							["operator_multiply", 0.5, ["helium_stagewidth"]],
							["data_variable", boundsRight.name]
						]
					]
				],
				[
					"data_setvariableto", 
					distBottom.name, 
					[
						"helium_max", 
						0, 
						[
							"operator_add",
							["operator_multiply", 0.5, ["helium_stageheight"]],
							["data_variable", boundsBottom.name]
						]
					]
				],
				[
					"data_setvariableto",
					minDist.name,
					["helium_min", ["helium_min", distLeft.name, distTop.name], ["helium_min", distRight.name, distBottom.name]]
				],
				["control_if", ["operator_equals", ["data_variable", minDist.name], 0], {script: scripts.length-1}]
			], scripts, vars, owner);
		case "looks_sayforsecs":
		case "say:duration:elapsed:from:":
			return simplifyScript([
				["looks_say", block[1]],
				["control_wait", block[2]],
				["looks_say", ""]
			], scripts, vars, owner);
		case "looks_thinkforsecs":
		case "think:duration:elapsed:from:":
			return simplifyScript([
				["looks_think", block[1]],
				["control_wait", block[2]],
				["looks_think", ""]
			], scripts, vars, owner);
		case "looks_nextcostume":
		case "nextCostume":
			return simplifyScript([[
				"looks_switchcostumeto",
				["operator_add", ["helium_costumenumber"], 1]
			]], scripts, vars, owner);
		case "looks_nextbackdrop":
		case "nextScene":
			return simplifyScript([[
				"looks_switchbackdropto",
				["operator_add", ["helium_backdropnumber"], 1]
			]], scripts, vars, owner);
		case "looks_changesizeby":
		case "changeSizeBy:":
			return simplifyScript([[
				"looks_setsizeto",
				["operator_add", ["looks_size"], block[1]]
			]], scripts, vars, owner);
		case "looks_cleargraphiceffects":
		case "filterReset":
			return simplifyScript([
				["looks_seteffectto", "color", 0],
				["looks_seteffectto", "fisheye", 0],
				["looks_seteffectto", "whirl", 0],
				["looks_seteffectto", "pixelate", 0],
				["looks_seteffectto", "mosaic", 0],
				["looks_seteffectto", "brightness", 0],
				["looks_seteffectto", "ghost", 0]
			], scripts, vars, owner);
	}
	if (opcode === "motion_glideto") {
		console.log(ir);
	}
	return ir;
}

function simplifyScript(script, scripts, vars, owner) {
	for (let i = 0; i < script.length; i++) {
		let block = script[i];
		let simplifiedBlock = simplifyBlock(block, scripts, vars, owner);
		if (block != simplifiedBlock) {
			script.splice(i, 1, ...simplifiedBlock);
		}
	}
	return script;
}

function countOpcodesBlock(block) {
	let opcodes = [block[0]];
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
		if ((block[0] === 'procDef') || (block[0] === 'procedures_definition')) {
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
	console.log(JSON.stringify(ir.scripts));
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

	//"Fix" internal scripts
	console.log(JSON.stringify(ir.scripts));
	let internalscriptmap = new Map();
	let internalscriptset = new Set();
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		for (let j = 0; j < script.length; j++) {
			let block = script[j];
			for (let k = 1; k < block.length; k++) {
				if (!(Array.isArray(block[k]) && Array.isArray(block[k][0]))) {
					continue;
				}
				if (internalscriptset.has(block[k])) {
					ir.scripts[i].script[j][k] = {script: internalscriptmap.get(block[k])};
				} else {
					ir.scripts.push({owner: ir.scripts[i].owner, script: block[k]});
					ir.scripts[i].script[j][k] = {script: ir.scripts.length - 1};
					internalscriptset.add(block[k]);
					internalscriptmap.set(block[k], ir.scripts.length - 1);
				}
			}
		}
	}
	console.log(JSON.stringify(ir.scripts));

	//Remove wait blocks
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		ir.scripts[i].script = simplifyScript(script, ir.scripts, ir.variables, ir.scripts[i].owner);
	}

	let opcodes = [];
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		console.log(i, script);
		opcodes = opcodes.concat(countOpcodesScript(script));
	}
	console.log([...new Set(opcodes)]);

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
	for (let i = 0; i < ir.ssa.length; i++) {
		let script = ir.ssa[i];
		for (let j = 0; j < script.length; j++) {
			if (!hasWait(script[j])) {
				continue;
			}
			if (isLoop(script[j])) {
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
			if ((ir.ssa[i][j] === ["helium_start"]) && (ir.ssa[i][j+1] === ["helium_end"])) {
				ir.ssa[i].splice(j,2);
				j--;
			}
		}
	}

	//ir.scripts = scripts;
	//Delete unused variables + lists

	return ir;
}
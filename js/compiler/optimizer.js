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
					let readVar = findVar(
						ir[1], 
						(ir[2] === "_stage_" ? "Stage" : ("n" + ir[2])), 
						fullIR.variables
					);
					return fullIR.variables[readVar].type;
			}
		case "data_variable":
			let variableName = ir[1];
			return fullIR.variables[findVar(variableName, owner, fullIR.variables)].type;
		case "data_itemoflist":
			let listName = ir[2];
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
			return castToNumber(newIR[1]) + castToNumber(newIR[2]);
		case "operator_subtract":
			return castToNumber(newIR[1]) - castToNumber(newIR[2]);
		case "operator_multiply":
			return castToNumber(newIR[1]) * castToNumber(newIR[2]);
		case "operator_divide":
			return castToNumber(newIR[1]) / castToNumber(newIR[2]);
		case "operator_gt":
			return castCompare(newIR[1], newIR[2]) > 0;
		case "operator_lt":
			return castCompare(newIR[1], newIR[2]) < 0;
		case "operator_equals":
			return castCompare(newIR[1], newIR[2]) === 0;
		case "operator_and":
			return castToBoolean(newIR[1]) && castToBoolean(newIR[2]);
		case "operator_or":
			return castToBoolean(newIR[1]) || castToBoolean(newIR[2]);
		case "operator_not":
			return !castToBoolean(newIR[1]);
		case "operator_join":
			return castToString(newIR[1]) + castToString(newIR[2]);
		case "operator_letter_of":
			const index = newIR[1];
			const str = newIR[2];
			if (index < 1 || index > str.length) {
				return "";
			}
			return str.charAt(index - 1);
		case "operator_length":
			return castToString(newIR[1]).length;
		case "operator_contains":
			return castToString(newIR[1])
				.toLowerCase()
				.includes(
					castToString(newIR[2])
					.toLowerCase()
				);
		case "operator_mod":
			const mn = castToNumber(newIR[1]);
			const modulus = castToNumber(newIR[2]);
			let result = mn % modulus;
			if (result / modulus < 0) {
				result += modulus;
			}
			return result;
		case "operator_round":
			return Math.round(castToNumber(newIR[1]));
		case "operator_mathop":
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
	if (!Array.isArray(ir)) {
		return ir;
	}
	let opcode = ir[0];
	let block = [opcode];
	for (let i = 1; i < ir.length; i++) {
		let simplifiedInput = simplifyReporterStack(ir[i], scripts, vars, owner);
		block.push(simplifiedInput);

		//if (!Array.isArray(ir[i])) {
		//	continue;
		//}
		//console.log(ir[i], simplifiedInput);
	}
	//console.log((opcode==="operator_mathop")?"hi":0,ir, block);
	switch (opcode) {
		case "operator_mathop": {
			switch (block[1]) {
				case "cos":
				case "sin":
					return simplifyReporterStack([
						"operator_multiply",
						1e-10,
						[
							"operator_round",
							[
								"operator_multiply",
								1e10,
								[
									"helium_"+block[1], 
									["operator_multiply", block[2], Math.PI/180]
								]
							]
						]
					], scripts, vars, owner);
				case "asin":
				case "acos":
				case "atan":
					//console.log(block, block[1], block[2]);
					return simplifyReporterStack([
						"operator_multiply",
						180/Math.PI,
						["helium_"+block[1],block[2]]
					], scripts, vars, owner);
				default:
					return ["helium_"+block[1]].concat(block.slice(2));
			}
		}
		case "sensing_distanceto": {
			if (block[1] == "_mouse_") {
				return simplifyReporterStack([
					"operator_mathop", 
					"sqrt",
					[
						"operator_add",
						[
							"operator_multiply",
							[
								"operator_subtract",
								["sensing_mousex"],
								["helium_xposition"]
							],
							[
								"operator_subtract",
								["sensing_mousex"],
								["helium_xposition"]
							]
						],
						[
							"operator_multiply",
							[
								"operator_subtract",
								["sensing_mousey"],
								["helium_yposition"]
							],
							[
								"operator_subtract",
								["sensing_mousey"],
								["helium_yposition"]
							]
						]
					]
				], scripts, vars, owner);
			} else {
				return simplifyReporterStack([
					"operator_mathop", 
					"sqrt",
					[
						"operator_add",
						[
							"operator_multiply",
							[
								"operator_subtract",
								["sensing_of", "x position", block[1]],
								["helium_xposition"]
							],
							[
								"operator_subtract",
								["sensing_of", "x position", block[1]],
								["helium_xposition"]
							]
						],
						[
							"operator_multiply",
							[
								"operator_subtract",
								["sensing_of", "y position", block[1]],
								["helium_yposition"]
							],
							[
								"operator_subtract",
								["sensing_of", "y position", block[1]],
								["helium_yposition"]
							]
						]
					]
				], scripts, vars, owner);
			} 
		}
		case "sensing_loud": {
			return simplifyReporterStack([
				"operator_gt",
				["sensing_loudness"],
				10
			], scripts, vars, owner);
		}
		case "motion_direction": {
			return simplifyReporterStack([
				"operator_subtract",
				[
					"operator_mod",
					[
						"operator_subtract", 
						270, 
						[
							"operator_multiply", 
							180/Math.PI, 
							["helium_direction"]
						]
					],
					360
				],
				180
			], scripts, vars, owner);
		}
		case "looks_size": {
			return simplifyReporterStack([
				"operator_multiply",
				100,
				["helium_scale"]
			], scripts, vars, owner);
		}
		case "looks_costumenumbername": {
			if (block[1] === 'number') {
				return simplifyReporterStack([
					"operator_add",
					1,
					["helium_costumenumber"]
				], scripts, vars, owner);
			}
			return simplifyReporterStack([
				"helium_costumename",
				["helium_costumenumber"]
			], scripts, vars, owner);
		}
		case "looks_backdropnumbername": {
			if (block[1] === 'number') {
				return simplifyReporterStack([
					"operator_add",
					1,
					["helium_backdropnumber"]
				], scripts, vars, owner);
			}
			return simplifyReporterStack([
				"helium_backdropname",
				["helium_backdropnumber"]
			], scripts, vars, owner);
		}
		case "operator_random": {
			return simplifyReporterStack([
				"operator_add",
				block[1],
				[
					"operator_multiply", 
					["operator_subtract", block[2], block[1]], 
					["helium_random"]
				]
			], scripts, vars, owner);
		}
		case "motion_xposition": {
			return simplifyReporterStack([
				"helium_ternary",
				[
					"operator_lt", 
					[
						"helium_abs", 
						[
							"operator_subtract", 
							["helium_xposition"],
							["operator_round", ["helium_xposition"]]
						]
					],
					1e-9
				],
				["operator_round", ["helium_xposition"]],
				["helium_xposition"]
			], scripts, vars, owner);
		}
		case "motion_yposition": {
			return simplifyReporterStack([
				"helium_ternary",
				[
					"operator_lt", 
					[
						"helium_abs", 
						[
							"operator_subtract", 
							["helium_yposition"],
							["operator_round", ["helium_yposition"]]
						]
					],
					1e-9
				],
				["operator_round", ["helium_yposition"]],
				["helium_yposition"]
			], scripts, vars, owner);
		}
		case "operator_subtract": {
			return simplifyReporterStack([
				"operator_add",
				block[1],
				["operator_multiply", block[2], -1]
			], scripts, vars, owner);
		}
		default:
			return block;
	}
}

function simplifyBlock(ir, scripts, vars, owner) {
	//Turns a block into a simpler form.
	let opcode = ir[0];
	let block = [opcode];
	for (let i = 1; i < ir.length; i++) {
		let simplifiedInput = simplifyReporterStack(ir[i], scripts, vars, owner);
		block.push(simplifiedInput);

		//if (!Array.isArray(ir[i])) {
		//	continue;
		//}
		//console.log(ir[i], simplifiedInput);
	}
	switch (opcode) {
		case "motion_gotoxy": {
			return simplifyScript([
				["motion_setx", block[1]],
				["motion_sety", block[2]]
			], scripts, vars, owner);
		}
		case "motion_turnleft": {
			return simplifyScript([
				["motion_turnright", ["operator_subtract", 0, block[1]]]
			], scripts, vars, owner);
		}
		case "motion_turnright": {
			return simplifyScript([
				["motion_pointindirection", ["operator_add", ["motion_direction"], block[1]]]
			], scripts, vars, owner);
		}
		case "motion_pointindirection": {
			return simplifyScript([
				[
					"helium_pointindirection",
					[
						"operator_subtract",
						Math.PI/2,
						["operator_multiply", Math.PI/180, block[1]]
					]
				]
			], scripts, vars, owner);
		}
		case "motion_changexby": {
			return simplifyScript([
				["motion_setx", ["operator_add", ["helium_xposition"], block[1]]]
			], scripts, vars, owner);
		}
		case "motion_changeyby": {
			return simplifyScript([
				["motion_sety", ["operator_add", ["helium_yposition"], block[1]]]
			], scripts, vars, owner);
		}
		case "motion_movesteps": {
			return simplifyScript([
				[
					"motion_changexby",
					[
						"operator_multiply",
						block[1],
						["helium_cos", ["helium_direction"]]
					]
				],
				[
					"motion_changeyby",
					[
						"operator_multiply",
						block[1],
						["helium_sin", ["helium_direction"]]
					]
				]
			], scripts, vars, owner);
		}
		case "control_forever": {
			return simplifyScript([
				["control_while", true, block[1]]
			], scripts, vars, owner);
		}
		case "control_repeat_until": {
			return simplifyScript([
				["control_while", ["operator_not", block[1]], block[2]]
			], scripts, vars, owner);
		}
		case "sound_changevolumeby": {
			return simplifyScript([
				["sound_setvolumeto", ["operator_add", ["sound_volume"], block[1]]]
			], scripts, vars, owner);
		}
		case "motion_goto": {
			let targetX = [];
			let targetY = [];
			if (block[1] === '_mouse_') {
				targetX = ["sensing_mousex"];
				targetY = ["sensing_mousey"];
			} else if (block[1] === '_random_') {
				targetX = [
					"operator_round",
					[
						"operator_multiply",
						["operator_random", -0.5, 0.5],
						["helium_stagewidth"]
					]
				];
				targetY = [
					"operator_round",
					[
						"operator_multiply",
						["operator_random", -0.5, 0.5],
						["helium_stageheight"]
					]
				];
			} else {
				targetX = ["sensing_of", "x position", block[1]];
				targetY = ["sensing_of", "y position", block[1]];
			}
			return simplifyScript([
				["motion_gotoxy", targetX, targetY]
			], scripts, vars, owner);
		}
		case "music_changeTempo": {
			return simplifyScript([
				["music_setTempo", ["operator_add", ["music_getTempo"], block[1]]]
			], scripts, vars, owner);
		}
		case "control_wait_until": {
			scripts.push({owner: owner, script:[["helium_nop"]]});
			return simplifyScript([
				["control_repeat_until", block[1], {script:scripts.length-1}]
			], scripts, vars, owner);
		}
		case "control_wait": {
			let endTime = addNewTempVar(vars, TYPE_NUMBER);
			return simplifyScript([
				[
					"data_setvariableto", 
					endTime.name, 
					[
						"operator_add", 
						["helium_time"], 
						block[1]
					]
				],
				[
					"control_wait_until", 
					[
						"operator_gt", 
						["helium_time"], 
						["data_variable", endTime.name]
					]
				]
			], scripts, vars, owner);
		}
		case "looks_nextcostume": {
			return simplifyScript([
				["looks_switchcostumeto", ["operator_add", 2, ["helium_costumenumber"]]]
			], scripts, vars, owner);
		}
		case "looks_sayforsecs": {
			return simplifyScript([
				["looks_say", block[1]],
				["control_wait", block[2]],
				["looks_say", ""]
			], scripts, vars, owner);
		}
		case "looks_thinkforsecs": {
			return simplifyScript([
				["looks_think", block[1]],
				["control_wait", block[2]],
				["looks_think", ""]
			], scripts, vars, owner);
		}
		case "looks_cleargraphiceffects": {
			return simplifyScript([
				["looks_seteffectto", "COLOR", 0],
				["looks_seteffectto", "FISHEYE", 0],
				["looks_seteffectto", "WHIRL", 0],
				["looks_seteffectto", "PIXELATE", 0],
				["looks_seteffectto", "MOSAIC", 0],
				["looks_seteffectto", "BRIGHTNESS", 0],
				["looks_seteffectto", "GHOST", 0]
			], scripts, vars, owner);
		}
		case "looks_changesizeby": {
			return simplifyScript([
				["looks_setsizeto", ["operator_add", ["looks_size"], block[1]]]
			], scripts, vars, owner);
		}
		case "motion_pointtowards": {
			if (block[1] === '_random_') {
				return simplifyScript([
					[
						"motion_pointindirection",
						["operator_round", ["operator_random", -180.0, 180.0]],
					]
				], scripts, vars, owner);
			}

			let targetX = ["sensing_of", "x position", block[1]];
			let targetY = ["sensing_of", "y position", block[1]];
			if (block[1] === '_mouse_') {
				targetX = ["sensing_mousex"];
				targetY = ["sensing_mousey"];
			}
			return simplifyScript([
				[
					"helium_pointindirection", 
					[
						"helium_atan2", 
						["operator_subtract", targetY, ["helium_yposition"]],
						["operator_subtract", targetX, ["helium_xposition"]]
					]
				]
			], scripts, vars, owner);
		}
		case "motion_glidesecstoxy": {
			let duration = addNewTempVar(vars, TYPE_NUMBER);
			let start = addNewTempVar(vars, TYPE_NUMBER);
			let x = addNewTempVar(vars, TYPE_NUMBER);
			let y = addNewTempVar(vars, TYPE_NUMBER);
			let dx = addNewTempVar(vars, TYPE_NUMBER);
			let dy = addNewTempVar(vars, TYPE_NUMBER);
			scripts.push({owner: owner, script:[
				[
					"motion_gotoxy",
					[
						"operator_add",
						["data_variable", x.name],
						[
							"operator_multiply",
							["data_variable", dx.name],
							[
								"operator_divide", 
								[
									"operator_subtract", 
									["helium_time"], 
									["data_variable", start.name]
								], 
								["data_variable", duration.name]
							]
						]
					],
					[
						"operator_add",
						["data_variable", y.name],
						[
							"operator_multiply",
							["data_variable", dy.name],
							[
								"operator_divide", 
								[
									"operator_subtract", 
									["helium_time"], 
									["data_variable", start.name]
								], 
								["data_variable", duration.name]
							]
						]
					]
				]
			]});
			return simplifyScript([
				["data_setvariableto", duration.name, block[1]],
				["data_setvariableto", start.name, ["helium_time"]],
				["data_setvariableto", x.name, ["helium_xposition"]],
				["data_setvariableto", y.name, ["helium_yposition"]],
				["data_setvariableto", dx.name, ["operator_subtract", block[2], ["helium_xposition"]]],
				["data_setvariableto", dy.name, ["operator_subtract", block[3], ["helium_yposition"]]],
				[
					"control_repeat_until", 
					[
						"operator_gt",
						["helium_time"],
						[
							"operator_add", 
							["data_variable", start.name], 
							["data_variable", duration.name]
						]
					],
					{script:scripts.length-1}
				]

			], scripts, vars, owner);
		}
		case "looks_setsizeto": {
			return simplifyScript([
				["helium_setscaleto", ["operator_multiply", block[1], 0.01]]
			], scripts, vars, owner);
		}
		case "sound_cleareffects": {
			return simplifyScript([
				["sound_seteffectto", "PITCH", 0],
				["sound_seteffectto", "PAN", 0]
			], scripts, vars, owner);
		}
		case "motion_glideto": {
			//console.log(block);
			if (block[1] === "_mouse_") {
				return simplifyScript([
					["motion_glidesecstoxy", block[2], ["sensing_mousex"], ["sensing_mousey"]]
				], scripts, vars, owner);
			} else if (block[1] === "_random_") {
				return simplifyScript([
					[
						"motion_glidesecstoxy", 
						block[2], 
						["operator_round", ["operator_random", -0.5, 0.5], ["helium_stagewidth"]],
						["operator_round", ["operator_random", -0.5, 0.5], ["helium_stageheight"]]
					]
				], scripts, vars, owner);
			} else {
				return simplifyScript([
					[
						"motion_glidesecstoxy", 
						block[2], 
						["sensing_of", "x position", block[1]],
						["sensing_of", "y position", block[1]]
					]
				], scripts, vars, owner);
			}
		}
		case "data_changevariableby": {
			return simplifyScript([
				[
					"data_setvariableto", 
					block[1], 
					[
						"operator_add", 
						["data_variable", block[1]],
						block[2]
					]
				]
			], scripts, vars, owner);
		}
		case "motion_ifonedgebounce": {
			//Vars
			let boundsLeft = addNewTempVar(vars, TYPE_NUMBER);
			let boundsTop = addNewTempVar(vars, TYPE_NUMBER);
			let boundsRight = addNewTempVar(vars, TYPE_NUMBER);
			let boundsBottom = addNewTempVar(vars, TYPE_NUMBER);

			let distLeft = addNewTempVar(vars, TYPE_NUMBER);
			let distTop = addNewTempVar(vars, TYPE_NUMBER);
			let distRight = addNewTempVar(vars, TYPE_NUMBER);
			let distBottom = addNewTempVar(vars, TYPE_NUMBER);

			let minDist = addNewTempVar(vars, TYPE_NUMBER);
			let nearestEdge = addNewTempVar(vars, TYPE_NUMBER);

			let dx = addNewTempVar(vars, TYPE_NUMBER);
			let dy = addNewTempVar(vars, TYPE_NUMBER);

			scripts.push({owner:owner, script:[[
				"data_setvariableto",
				dx.name,
				[
					"helium_max", 
					0.2, 
					[
						"helium_abs", 
						["data_variable", dx.name]
					]
				]
			]]});
			scripts.push({owner:owner, script:[[
				"data_setvariableto",
				dy.name,
				[
					"operator_subtract", 
					0, 
					[
						"helium_max", 
						0.2, 
						[
							"helium_abs", 
							["data_variable", dy.name]
						]
					]
				]
			]]});
			scripts.push({owner:owner, script:[[
				"data_setvariableto",
				dx.name,
				[
					"operator_subtract", 
					0, 
					[
						"helium_max", 
						0.2, 
						[
							"helium_abs", 
							["data_variable", dx.name]
						]
					]
				]
			]]});
			scripts.push({owner:owner, script:[[
				"data_setvariableto",
				dy.name,
				[
					"helium_max", 
					0.2, 
					[
						"helium_abs", 
						["data_variable", dy.name]
					]
				]
			]]});

			scripts.push({owner:owner, script:[
				["data_setvariableto", nearestEdge.name, 2]
			]});
			scripts.push({owner:owner, script:[
				["data_setvariableto", nearestEdge.name, 1]
			]});
			scripts.push({owner:owner, script:[
				["data_setvariableto", nearestEdge.name, 0]
			]});
			scripts.push({owner:owner, script:[
				["data_setvariableto", dx.name, ["helium_cos", ["helium_direction"]]],
				["data_setvariableto", dy.name, ["helium_sin", ["helium_direction"]]],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge.name], 0],
					{script: scripts.length-8}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge.name], 1],
					{script: scripts.length-7}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge.name], 2],
					{script: scripts.length-6}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge.name], 3],
					{script: scripts.length-5}
				],
				[
					"helium_pointindirection", 
					[
						"helium_atan2", 
						["data_variable", dy.name],
						["data_variable", dx.name]
					]
				],
				[
					"motion_changexby",
					[
						"operator_subtract",
						[
							"helium_min",
							0,
							[
								"operator_subtract",
								["operator_multiply", ["helium_stagewidth"], 0.5],
								["data_variable", boundsRight.name]
							]
						],
						[
							"helium_min",
							0,
							[
								"operator_add",
								["operator_multiply", ["helium_stagewidth"], 0.5],
								["data_variable", boundsLeft.name]
							]
						]
					]
				],
				[
					"motion_changeyby",
					[
						"operator_subtract",
						[
							"helium_min",
							0,
							[
								"operator_subtract",
								["operator_multiply", ["helium_stageheight"], 0.5],
								["data_variable", boundsTop.name]
							]
						],
						[
							"helium_min",
							0,
							[
								"operator_add",
								["operator_multiply", ["helium_stageheight"], 0.5],
								["data_variable", boundsBottom.name]
							]
						]
					]
				]
			]});

			return simplifyScript([
				["data_setvariableto", boundsLeft.name, ["helium_boundsleft"]],
				["data_setvariableto", boundsTop.name, ["helium_boundstop"]],
				["data_setvariableto", boundsRight.name, ["helium_boundsright"]],
				["data_setvariableto", boundsBottom.name, ["helium_boundsbottom"]],

				[
					"data_setvariableto", 
					distLeft.name, 
					[
						"helium_max", 
						0,
						[
							"operator_add", 
							["operator_multiply", ["helium_stagewidth"], 0.5],
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
							["operator_multiply", ["helium_stageheight"], 0.5],
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
							["operator_multiply", ["helium_stagewidth"], 0.5],
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
							["operator_multiply", ["helium_stageheight"], 0.5],
							["data_variable", boundsBottom.name]
						] 
					]
				],

				[
					"data_setvariableto", 
					minDist.name, 
					[
						"helium_min", 
						["helium_min", ["data_variable", distLeft.name], ["data_variable", distRight.name]], 
						["helium_min", ["data_variable", distTop.name], ["data_variable", distBottom.name]]
					]
				],
				["data_setvariableto", nearestEdge.name, 3],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist.name],
						["data_variable", distRight.name]
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
						["data_variable", distLeft.name]
					],
					{script: scripts.length-2}
				],
				[
					"control_if", 
					[
						"operator_not", 
						[
							"operator_gt", 
							["data_variable", minDist.name],
							0
						]
					],
					{script: scripts.length-1}
				]
			], scripts, vars, owner);
		}
		default:
			return [block];
	}
}

function simplifyScript(script, scripts, vars, owner) {
	for (let i = 0; i < script.length; i++) {
		let block = script[i];
		let simplifiedBlock = simplifyBlock(block, scripts, vars, owner);
		if (block !== simplifiedBlock) {
			script.splice(i, 1, ...simplifiedBlock);
		}
	}
	return script;
}

function removeTimerBlock(block, timervar) {
	let opcode = block[0];
	if (opcode === "sensing_timer") {
		return ["operator_subtract", ["helium_time"], ["data_variable", timervar.name]];
	}
	if (opcode === "sensing_resettimer") {
		return ["data_setvariableto", timervar.name, ["helium_time"]];
	}
	let newBlock = [opcode];
	for (let i = 1; i < block.length; i++) {
		if (Array.isArray(block[i])) {
			newBlock.push(removeTimerBlock(block[i], timervar));
		} else {
			newBlock.push(block[i]);
		}
	}
	return newBlock;
}

function removeTimerScript(script, timervar) {
	let newScript = [];
	for (let i = 0; i < script.length; i++) {
		newScript.push(removeTimerBlock(script[i], timervar));
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
	for (let i = 0; i < ir.scripts.length; i++) {
		console.log(structuredClone(ir.scripts[i].script));
		console.log(JSON.stringify(ir.scripts[i].script));
	}

	//"Fix" internal scripts
	let internalscriptmap = new Map();
	let internalscriptset = new Set();
	for (let i = 0; i < ir.scripts.length; i++) {
		let script = ir.scripts[i].script;
		for (let j = 0; j < script.length; j++) {
			let block = script[j];
			if (block[0].slice(0, 7) === "control") {
				console.log(JSON.stringify(block));
			}
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
				let currVar = findVar(block[1], owner, ir.variables);
				if (Array.isArray(block[2])) {
					let reporterOpcode = block[2][0];
					if (reporterOpcode === 'data_variable') {
						let readVar = findVar(block[2][1], owner, ir.variables);
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'data_itemoflist') {
						let readVar = findVar(block[2][2], owner, ir.lists) + ir.variables.length;
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
			} else if (opcode === 'data_changevariableby') {
				//change variable casts the variable to a number
				setVarType(findVar(block[1], owner, ir.variables), TYPE_NUMBER, variableListMatrix);
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
				let currVar = findVar(varName, owner, ir.lists) + ir.variables.length;
				if (Array.isArray(valueName)) {
					let reporterOpcode = valueName[0];
					if (reporterOpcode === 'data_variable') {
						let readVar = findVar(valueName[1], owner, ir.variables);
						addChild(readVar, currVar, variableListMatrix);
					}
					if (reporterOpcode === 'data_itemoflist') {
						let readVar = findVar(valueName[2], owner, ir.lists) + ir.variables.length;
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

	//Remove timer blocks
	const timervar = addNewTempVar(ir.variables, TYPE_NUMBER);
	for (let i = 0; i < ir.scripts.length; i++) {
		ir.scripts[i].script = removeTimerScript(ir.scripts[i].script, timervar);
	}

	//Remove wait blocks
	//console.log(JSON.stringify(ir.scripts));
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
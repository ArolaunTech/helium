//Optimizes IR and returns an optimized IR.
//Types
const TYPE_UNKNOWN = 0;
const TYPE_BOOLEAN = 1;
const TYPE_NUMBER = 2;
const TYPE_STRING = 3;
const DEFAULT_TYPE_VALUES = [null, false, 0, ""];

class Optimizer {
	constructor() {
		this.ir = null;
		this.numVars = 0;
		this.timervar = -1;
		this.answered = -1;
	}

	loadIR(load) {
		this.ir = load;
		this.numVars = 0;
		this.timervar = -1;
		this.answered = -1;
	}

	findVar(name, owner, vars) {
		for (let i = 0; i < vars.length; i++) {
			if (vars[i].name !== name) continue;
			if ((vars[i].owner !== this.ir.stageIndex) && (vars[i].owner !== owner)) continue;
			return i;
		}
		console.error("Cannot find variable: ", name, owner, vars, structuredClone(this.ir));
	}

	isLoop(block) {
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

	hasWait(block) {
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
		return this.isLoop(block);
	}

	replaceVariableNamesBlock(block, owner) {
		let opcode = block[0];
		let newBlock = [opcode];

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.replaceVariableNamesBlock(block[i], owner));
			} else {
				newBlock.push(block[i]);
			}
		}

		switch (opcode) {
			case "sensing_of": {
				let property = newBlock[1];
				let object = newBlock[2];
				if (object === "_stage_") {
					object = this.ir.stageIndex;
				} else {
					let k = 0;
					for (; k < this.ir.sprites.length; k++) {
						if (this.ir.sprites[k].isStage) continue;
						if (this.ir.sprites[k].name === object) break;
					}
					object = k;
				}
				if (
					(object === this.ir.stageIndex) && 
					[
						'background #', 
						'backdrop #', 
						'backdrop name', 
						'volume'
					].includes(property)
				) {
					break;
				}
				if (
					(object !== this.ir.stageIndex) && 
					[
						'x position', 
						'y position', 
						'direction', 
						'costume #', 
						'costume name', 
						'size', 
						'volume'
					].includes(property)
				) {
					break;
				}

				return ["data_variable", this.findVar(property, object, this.ir.variables)];
			}
			case "data_setvariableto":
			case "data_changevariableby": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.variables), newBlock[2]];
			}
			case "data_showvariable":
			case "data_hidevariable":
			case "data_variable": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.variables)];
			}
			case "data_listcontents":
			case "data_lengthoflist":
			case "data_deletealloflist":
			case "data_showlist":
			case "data_hidelist": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.lists)];
			}
			case "data_addtolist":
			case "data_itemoflist":
			case "data_deleteoflist": {
				return [opcode, newBlock[1], this.findVar(newBlock[2], owner, this.ir.lists)];
			}
			case "data_insertatlist": {
				return [opcode, newBlock[1], newBlock[2], this.findVar(newBlock[3], owner, this.ir.lists)];
			}
			case "data_replaceitemoflist": {
				return [opcode, newBlock[1], this.findVar(newBlock[2], owner, this.ir.lists), newBlock[3]];
			}
			case "data_itemnumoflist":
			case "data_listcontainsitem": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.lists), newBlock[2]];
			}
		}
		return newBlock;
	}

	replaceVariableNames(script, owner) {
		let newScript = [];
		for (let i = 0; i < script.length; i++) {
			newScript.push(this.replaceVariableNamesBlock(script[i], owner));
		}
		return newScript;
	}

	addNewTempVar() {
		//Gives a new var index for temporary vars.
		let newidx = this.ir.variables.length;

		this.ir.variables.push({
			id: newidx,
			name: "t"+newidx,
			owner: "Stage",
			value: DEFAULT_TYPE_VALUES[TYPE_BOOLEAN]
		});
		return newidx;
	}

	removeSpecialVarBlock(block, owner) {
		let opcode = block[0];

		let newBlock = [opcode];
		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.removeSpecialVarBlock(block[i], owner)[0]);
			} else {
				newBlock.push(block[i]);
			}
		}

		if (opcode === "sensing_timer") {
			return [[
				"operator_subtract", 
				["helium_time"], 
				["data_variable", this.timervar]
			]];
		}
		if (opcode === "sensing_resettimer") {
			return [[
				"data_setvariableto", 
				this.timervar, 
				["helium_time"]
			]];
		}

		if (opcode === "sensing_askandwait") {
			return [
				["data_setvariableto", this.answered, false],
				["helium_ask", newBlock[1]],
				["control_wait_until", ["data_variable", this.answered]]
			];
		}

		if (opcode === "sound_playuntildone") {
			for (let i = 0; i < this.ir.sounds.length; i++) {
				if (this.ir.sounds[i].owner !== owner) {
					continue;
				}
				if (this.ir.sounds[i].obj.name !== newBlock[1]) {
					continue;
				}
				return [
					["sound_play", newBlock[1]],
					["control_wait", this.ir.sounds[i].obj.sampleCount/this.ir.sounds[i].obj.rate]
				];
			}
			return [
				["sound_play", newBlock[1]],
				["control_wait", ["helium_soundlength", newBlock[1]]]
			];
		}
		return [newBlock];
	}

	removeSpecialVarScript(script, owner) {
		let newScript = [];
		for (let i = 0; i < script.length; i++) {
			newScript = newScript.concat(this.removeSpecialVarBlock(script[i], owner));
		}
		return newScript;
	}

	simplifyReporterStack(ir, owner) {
		if (!Array.isArray(ir)) {
			return ir;
		}
		let opcode = ir[0];
		let block = [opcode];
		for (let i = 1; i < ir.length; i++) {
			block.push(this.simplifyReporterStack(ir[i], owner));
		}
		switch (opcode) {
			case "operator_mathop": {
				switch (block[1]) {
					case "cos":
					case "sin":
					case "tan":
						return this.simplifyReporterStack([
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
						], owner);
					case "asin":
					case "acos":
					case "atan":
						//console.log(block, block[1], block[2]);
						return this.simplifyReporterStack([
							"operator_multiply",
							180/Math.PI,
							["helium_"+block[1],block[2]]
						], owner);
					default:
						return ["helium_"+block[1]].concat(block.slice(2));
				}
			}
			case "sensing_distanceto": {
				if (block[1] == "_mouse_") {
					return this.simplifyReporterStack([
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
					], owner);
				} else {
					return this.simplifyReporterStack([
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
					], owner);
				} 
			}
			case "sensing_loud": {
				return this.simplifyReporterStack([
					"operator_gt",
					["sensing_loudness"],
					10
				], owner);
			}
			case "motion_direction": {
				return this.simplifyReporterStack([
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
				], owner);
			}
			case "looks_size": {
				return this.simplifyReporterStack([
					"operator_multiply",
					100,
					["helium_scale"]
				], owner);
			}
			case "looks_costumenumbername": {
				if (block[1] === 'number') {
					return this.simplifyReporterStack([
						"operator_add",
						1,
						["helium_costumenumber"]
					], owner);
				}
				return this.simplifyReporterStack([
					"helium_costume",
					["helium_costumenumber"]
				], owner);
			}
			case "looks_backdropnumbername": {
				if (block[1] === 'number') {
					return this.simplifyReporterStack([
						"operator_add",
						1,
						["helium_backdropnumber"]
					], owner);
				}
				return this.simplifyReporterStack([
					"helium_backdrop",
					["helium_backdropnumber"]
				], owner);
			}
			case "operator_random": { //TODO: FIX THIS
				return this.simplifyReporterStack([
					"operator_add",
					["helium_min", block[1], block[2]],
					[
						"helium_ternary",
						["operator_and", ["helium_isint", block[1]], ["helium_isint", block[2]]],
						[
							"helium_floor",
							[
								"operator_multiply", 
								["helium_random"], 
								[
									"operator_subtract",
									["operator_add", ["helium_max", block[1], block[2]], 1],
									["helium_min", block[1], block[2]],
								]
							]
						],
						[
							"operator_multiply", 
							["helium_random"], 
							[
								"operator_subtract",
								["helium_max", block[1], block[2]],
								["helium_min", block[1], block[2]],
							]
						]
					]
				], owner);
			}
			case "motion_xposition": {
				return this.simplifyReporterStack([
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
				], owner);
			}
			case "motion_yposition": {
				return this.simplifyReporterStack([
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
				], owner);
			}
			case "operator_subtract": {
				return this.simplifyReporterStack([
					"operator_add",
					block[1],
					["operator_multiply", block[2], -1]
				], owner);
			}
			default:
				return block;
		}
	}

	simplifyBlock(ir, owner) {
		//Turns a block into a simpler form.
		let opcode = ir[0];
		let block = [opcode];
		for	(let i = 1; i < ir.length; i++) {
			block.push(this.simplifyReporterStack(ir[i], owner));
		}
		switch (opcode) {
			case "motion_turnleft": {
				return this.simplifyScript([
					["motion_turnright", ["operator_subtract", 0, block[1]]]
				], owner);
			}
			case "motion_turnright": {
				return this.simplifyScript([
					["motion_pointindirection", ["operator_add", ["motion_direction"], block[1]]]
				], owner);
			}
			case "motion_pointindirection": {
				return this.simplifyScript([
					[
						"helium_pointindirection",
						[
							"operator_subtract",
							Math.PI/2,
							["operator_multiply", Math.PI/180, block[1]]
						]
					]
				], owner);
			}
			case "motion_changexby": {
				return this.simplifyScript([
					["motion_setx", ["operator_add", ["helium_xposition"], block[1]]]
				], owner);
			}
			case "motion_changeyby": {
				return this.simplifyScript([
					["motion_sety", ["operator_add", ["helium_yposition"], block[1]]]
				], owner);
			}
			case "motion_movesteps": {
				return this.simplifyScript([
					[
						"motion_gotoxy",
						[
							"operator_add",
							["motion_xposition"],
							[
								"operator_multiply",
								block[1],
								["helium_cos", ["helium_direction"]]
							]
						],
						[
							"operator_add",
							["motion_yposition"],
							[
								"operator_multiply",
								block[1],
								["helium_sin", ["helium_direction"]]
							]
						],
					]
				], owner);
			}
			case "control_forever": {
				return this.simplifyScript([
					["control_while", true, block[1]]
				], owner);
			}
			case "control_repeat_until": {
				return this.simplifyScript([
					["control_while", ["operator_not", block[1]], block[2]]
				], owner);
			}
			case "sound_changevolumeby": {
				return this.simplifyScript([
					["sound_setvolumeto", ["operator_add", ["sound_volume"], block[1]]]
				], owner);
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
				return this.simplifyScript([
					["motion_gotoxy", targetX, targetY]
				], owner);
			}
			case "music_changeTempo": {
				return this.simplifyScript([
					["music_setTempo", ["operator_add", ["music_getTempo"], block[1]]]
				], owner);
			}
			case "control_wait_until": {
				this.ir.scripts.push({owner: owner, script:[["helium_nop"]]});
				return this.simplifyScript([
					["control_repeat_until", block[1], {script:this.ir.scripts.length-1}]
				], owner);
			}
			case "control_wait": {
				let endTime = this.addNewTempVar();
				return this.simplifyScript([
					[
						"data_setvariableto", 
						endTime, 
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
							["data_variable", endTime]
						]
					]
				], owner);
			}
			case "looks_nextcostume": {
				return this.simplifyScript([
					["looks_switchcostumeto", ["operator_add", 2, ["helium_costumenumber"]]]
				], owner);
			}
			case "looks_sayforsecs": {
				return this.simplifyScript([
					["looks_say", block[1]],
					["control_wait", block[2]],
					["looks_say", ""]
				], owner);
			}
			case "looks_thinkforsecs": {
				return this.simplifyScript([
					["looks_think", block[1]],
					["control_wait", block[2]],
					["looks_think", ""]
				], owner);
			}
			case "looks_cleargraphiceffects": {
				return this.simplifyScript([
					["looks_seteffectto", "COLOR", 0],
					["looks_seteffectto", "FISHEYE", 0],
					["looks_seteffectto", "WHIRL", 0],
					["looks_seteffectto", "PIXELATE", 0],
					["looks_seteffectto", "MOSAIC", 0],
					["looks_seteffectto", "BRIGHTNESS", 0],
					["looks_seteffectto", "GHOST", 0]
				], owner);
			}
			case "looks_changesizeby": {
				return this.simplifyScript([
					["looks_setsizeto", ["operator_add", ["looks_size"], block[1]]]
				], owner);
			}
			case "motion_pointtowards": {
				if (block[1] === '_random_') {
					return this.simplifyScript([
						[
							"motion_pointindirection",
							["operator_round", ["operator_random", -180.0, 180.0]],
						]
					], owner);
				}

				let targetX = ["sensing_of", "x position", block[1]];
				let targetY = ["sensing_of", "y position", block[1]];
				if (block[1] === '_mouse_') {
					targetX = ["sensing_mousex"];
					targetY = ["sensing_mousey"];
				}
				return this.simplifyScript([
					[
						"helium_pointindirection", 
						[
							"helium_atan2", 
							["operator_subtract", targetY, ["helium_yposition"]],
							["operator_subtract", targetX, ["helium_xposition"]]
						]
					]
				], owner);
			}
			case "motion_glidesecstoxy": {
				let duration = this.addNewTempVar();
				let start = this.addNewTempVar();
				let x = this.addNewTempVar();
				let y = this.addNewTempVar();
				let dx = this.addNewTempVar();
				let dy = this.addNewTempVar();
				this.ir.scripts.push({owner: owner, script:[
					[
						"motion_gotoxy",
						[
							"operator_add",
							["data_variable", x],
							[
								"operator_multiply",
								["data_variable", dx],
								[
									"operator_divide", 
									[
										"operator_subtract", 
										["helium_time"], 
										["data_variable", start]
									], 
									["data_variable", duration]
								]
							]
						],
						[
							"operator_add",
							["data_variable", y],
							[
								"operator_multiply",
								["data_variable", dy],
								[
									"operator_divide", 
									[
										"operator_subtract", 
										["helium_time"], 
										["data_variable", start]
									], 
									["data_variable", duration]
								]
							]
						]
					]
				]});
				return this.simplifyScript([
					["data_setvariableto", duration, block[1]],
					["data_setvariableto", start, ["helium_time"]],
					["data_setvariableto", x, ["helium_xposition"]],
					["data_setvariableto", y, ["helium_yposition"]],
					["data_setvariableto", dx, ["operator_subtract", block[2], ["helium_xposition"]]],
					["data_setvariableto", dy, ["operator_subtract", block[3], ["helium_yposition"]]],
					[
						"control_repeat_until", 
						[
							"operator_gt",
							["helium_time"],
							[
								"operator_add", 
								["data_variable", start], 
								["data_variable", duration]
							]
						],
						{script:this.ir.scripts.length-1}
					]

				], owner);
			}
			case "looks_setsizeto": {
				return this.simplifyScript([
					["helium_setscaleto", ["operator_multiply", block[1], 0.01]]
				], owner);
			}
			case "sound_cleareffects": {
				return this.simplifyScript([
					["sound_seteffectto", "PITCH", 0],
					["sound_seteffectto", "PAN", 0]
				], owner);
			}
			case "motion_glideto": {
				//console.log(block);
				if (block[2] === "_mouse_") {
					return this.simplifyScript([
						["motion_glidesecstoxy", block[1], ["sensing_mousex"], ["sensing_mousey"]]
					], owner);
				} else if (block[2] === "_random_") {
					return this.simplifyScript([
						[
							"motion_glidesecstoxy", 
							block[1], 
							["operator_round", ["operator_random", -0.5, 0.5], ["helium_stagewidth"]],
							["operator_round", ["operator_random", -0.5, 0.5], ["helium_stageheight"]]
						]
					], owner);
				} else {
					return this.simplifyScript([
						[
							"motion_glidesecstoxy", 
							block[1], 
							["sensing_of", "x position", block[1]],
							["sensing_of", "y position", block[1]]
						]
					], owner);
				}
			}
			case "data_changevariableby": {
				return this.simplifyScript([
					[
						"data_setvariableto", 
						block[1], 
						[
							"operator_add", 
							["data_variable", block[1]],
							block[2]
						]
					]
				], owner);
			}
			case "motion_ifonedgebounce": {
				//Vars
				let boundsLeft = this.addNewTempVar();
				let boundsTop = this.addNewTempVar();
				let boundsRight = this.addNewTempVar();
				let boundsBottom = this.addNewTempVar();

				let distLeft = this.addNewTempVar();
				let distTop = this.addNewTempVar();
				let distRight = this.addNewTempVar();
				let distBottom = this.addNewTempVar();

				let minDist = this.addNewTempVar();
				let nearestEdge = this.addNewTempVar();

				let dx = this.addNewTempVar();
				let dy = this.addNewTempVar();

				this.ir.scripts.push({owner:owner, script:[[
					"data_setvariableto",
					dx,
					[
						"helium_max", 
						0.2, 
						[
							"helium_abs", 
							["data_variable", dx]
						]
					]
				]]});
				this.ir.scripts.push({owner:owner, script:[[
					"data_setvariableto",
					dy,
					[
						"operator_subtract", 
						0, 
						[
							"helium_max", 
							0.2, 
							[
								"helium_abs", 
								["data_variable", dy]
							]
						]
					]
				]]});
				this.ir.scripts.push({owner:owner, script:[[
					"data_setvariableto",
					dx,
					[
						"operator_subtract", 
						0, 
						[
							"helium_max", 
							0.2, 
							[
								"helium_abs", 
								["data_variable", dx]
							]
						]
					]
				]]});
				this.ir.scripts.push({owner:owner, script:[[
					"data_setvariableto",
					dy,
					[
						"helium_max", 
						0.2, 
						[
							"helium_abs", 
							["data_variable", dy]
						]
					]
				]]});

				this.ir.scripts.push({owner:owner, script:[
					["data_setvariableto", nearestEdge, 2]
				]});
				this.ir.scripts.push({owner:owner, script:[
					["data_setvariableto", nearestEdge, 1]
				]});
				this.ir.scripts.push({owner:owner, script:[
					["data_setvariableto", nearestEdge, 0]
				]});
				this.ir.scripts.push({owner:owner, script:[
					["data_setvariableto", dx, ["helium_cos", ["helium_direction"]]],
					["data_setvariableto", dy, ["helium_sin", ["helium_direction"]]],
					[
						"control_if",
						["operator_equals", ["data_variable", nearestEdge], 0],
						{script: this.ir.scripts.length-8}
					],
					[
						"control_if",
						["operator_equals", ["data_variable", nearestEdge], 1],
						{script: this.ir.scripts.length-7}
					],
					[
						"control_if",
						["operator_equals", ["data_variable", nearestEdge], 2],
						{script: this.ir.scripts.length-6}
					],
					[
						"control_if",
						["operator_equals", ["data_variable", nearestEdge], 3],
						{script: this.ir.scripts.length-5}
					],
					[
						"helium_pointindirection", 
						[
							"helium_atan2", 
							["data_variable", dy],
							["data_variable", dx]
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
									["data_variable", boundsRight]
								]
							],
							[
								"helium_min",
								0,
								[
									"operator_add",
									["operator_multiply", ["helium_stagewidth"], 0.5],
									["data_variable", boundsLeft]
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
									["data_variable", boundsTop]
								]
							],
							[
								"helium_min",
								0,
								[
									"operator_add",
									["operator_multiply", ["helium_stageheight"], 0.5],
									["data_variable", boundsBottom]
								]
							]
						]
					]
				]});

				return this.simplifyScript([
					["data_setvariableto", boundsLeft, ["helium_boundsleft"]],
					["data_setvariableto", boundsTop, ["helium_boundstop"]],
					["data_setvariableto", boundsRight, ["helium_boundsright"]],
					["data_setvariableto", boundsBottom, ["helium_boundsbottom"]],

					[
						"data_setvariableto", 
						distLeft, 
						[
							"helium_max", 
							0,
							[
								"operator_add", 
								["operator_multiply", ["helium_stagewidth"], 0.5],
								["data_variable", boundsLeft]
							] 
						]
					],
					[
						"data_setvariableto", 
						distTop, 
						[
							"helium_max", 
							0,
							[
								"operator_subtract", 
								["operator_multiply", ["helium_stageheight"], 0.5],
								["data_variable", boundsTop]
							] 
						]
					],
					[
						"data_setvariableto", 
						distRight, 
						[
							"helium_max", 
							0,
							[
								"operator_subtract", 
								["operator_multiply", ["helium_stagewidth"], 0.5],
								["data_variable", boundsRight]
							] 
						]
					],
					[
						"data_setvariableto", 
						distBottom, 
						[
							"helium_max", 
							0,
							[
								"operator_add", 
								["operator_multiply", ["helium_stageheight"], 0.5],
								["data_variable", boundsBottom]
							] 
						]
					],
	
					[
						"data_setvariableto", 
						minDist, 
						[
							"helium_min", 
							["helium_min", ["data_variable", distLeft], ["data_variable", distRight]], 
							["helium_min", ["data_variable", distTop], ["data_variable", distBottom]]
						]
					],
					["data_setvariableto", nearestEdge, 3],
					[
						"control_if", 
						[
							"operator_equals", 
							["data_variable", minDist],
							["data_variable", distRight]
						],
						{script: this.ir.scripts.length-4}
					],
					[
						"control_if", 
						[
							"operator_equals", 
							["data_variable", minDist], 
							["data_variable", distTop]
						],
						{script: this.ir.scripts.length-3}
					],
					[
						"control_if", 
						[
							"operator_equals", 
							["data_variable", minDist], 
							["data_variable", distLeft]
						],
						{script: this.ir.scripts.length-2}
					],
					[
						"control_if", 
						[
							"operator_not", 
							[
								"operator_gt", 
								["data_variable", minDist],
								0
							]
						],
						{script: this.ir.scripts.length-1}
					]
				], owner);
			}
			case "music_restForBeats": {
				return this.simplifyScript([
					[
						"control_wait",
						[
							"operator_divide",
							[
								"operator_multiply",
								60,
								["helium_min", 100, ["helium_max", 0, ["helium_number", block[1]]]]
							],
							["music_getTempo"]
						]
					]
				], owner);
			}
			case "music_playDrumForBeats": {
				return this.simplifyScript([
					[
						"helium_playDrum",
						[
							"helium_wrapClamp",
							block[1],
							0, 17
						]
					],
					["music_restForBeats", block[2]]
				], owner);
			}
			case "music_playNoteForBeats": {
				let durationSec = this.addNewTempVar();

				this.ir.scripts.push({owner: owner, script:[
					[
						"helium_playNote", 
						[
							"helium_min", 
							130, 
							[
								"helium_max", 
								0, 
								["helium_number", block[1]]
							]
						],
						["data_variable", durationSec]
					],
					["control_wait", ["data_variable", durationSec]]
				]});

				return this.simplifyScript([
					[
						"data_setvariableto",
						durationSec,
						[
							"operator_divide",
							[
								"operator_multiply",
								60,
								["helium_min", 100, ["helium_max", 0, ["helium_number", block[2]]]]
							],
							["music_getTempo"]
						]
					],
					[
						"control_if", 
						["operator_gt", ["data_variable", durationSec], 0],
						{script: this.ir.scripts.length - 1}
					]
				], owner);
			}
			case "control_repeat": {
				let iteration = this.addNewTempVar();

				this.ir.scripts[block[2].script].script.push(["data_changevariableby", iteration, 1]);

				return this.simplifyScript([
					["data_setvariableto", iteration, 0],
					[
						"control_while", 
						["operator_lt", ["data_variable", iteration], block[1]],
						block[2]
					]
				], owner);
			}
			case "data_insertatlist": {
				let list = this.addNewTempVar();

				return this.simplifyScript([
					["procedures_call", block[1], block[2], block[3], {
						argDefaults: [0, 0, ""],
						argNames: ["item", "index", "list"],
						owner: owner,
						proccode: "data_insertatlist %s %s %s",
						warp: true
					}]
				], owner);
			}
			default:
				return [block];
		}
	}

	simplifyScript(script, owner) {
		for (let i = 0; i < script.length; i++) {
			let block = script[i];
			let simplifiedBlock = this.simplifyBlock(block, owner);
			if (block !== simplifiedBlock) {
				script.splice(i, 1, ...simplifiedBlock);
			}
		}
		return script;
	}

	countOpcodesBlock(block) {
		let opcodes = [];
		if (true) {
			opcodes = [block[0]];
		}

		if (block[0] === "procedures_call") {
			console.log(block);
		}

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				opcodes = opcodes.concat(this.countOpcodesBlock(block[i]));
			}
		}
		return opcodes;
	}

	countOpcodesScript(script) {
		let opcodes = [];
		for (let i = 0; i < script.length; i++) {
			opcodes = opcodes.concat(this.countOpcodesBlock(script[i]));
		}
		return opcodes;
	}

	reporterStackToSSA(ir) {
		let block = [ir[0]];
		let ssa = [];
		for (let i = 1; i < ir.length; i++) {
			if (Array.isArray(ir[i])) {
				ssa = ssa.concat(this.reporterStackToSSA(ir[i]));
				block.push({type:"var", val:this.numVars-1});
			} else {
				block.push({type:"value", val:ir[i]});
			}
		}

		ssa.push(["helium_val", this.numVars, block, false]);
		this.numVars++;
		return ssa;
	}

	scriptToSSA(ir) {
		let ssa = [];

		for (let i = 0; i < ir.length; i++) {
			let block = ir[i];
			if (block[0] === 'procedures_definition') {
				ssa.push(block);
				continue;
			}
			let newBlock = [block[0]];

			for (let j = 1; j < block.length; j++) {
				if (Array.isArray(block[j])) {
					//Reporter stack
					ssa = ssa.concat(this.reporterStackToSSA(block[j]));
					newBlock.push({type:"var", val:this.numVars-1});
				} else {
					newBlock.push({type:"value", val:block[j]});
				}
			}
			ssa.push(newBlock);
			//console.log(ssa);
		}
		return ssa;
	}

	replaceVariableCallsBlock(block, variations) {
		if (block[0] === 'data_variable') {
			//Replace with variation
			return [
				"helium_getvariation",
				block[1],
				variations[block[1]]
			];
		}

		if (block[0] === 'helium_updatevar') {
			return [
				"helium_updatevar",
				block[1],
				variations[block[1]]
			];
		}

		let newBlock = [block[0]];
		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.replaceVariableCallsBlock(block[i], variations));
			} else {
				newBlock.push(block[i]);
			}
		}
		return newBlock;
	}

	optimizeIR() {
		console.log(structuredClone(this.ir));
		for (let i = 0; i < this.ir.scripts.length; i++) {
			console.log(structuredClone(this.ir.scripts[i].script));
		}

		//"Fix" internal scripts
		let internalscriptmap = new Map();
		let internalscriptset = new Set();
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
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
						this.ir.scripts[i].script[j][k] = {script: internalscriptmap.get(block[k])};
					} else {
						this.ir.scripts.push({owner: this.ir.scripts[i].owner, script: block[k]});
						this.ir.scripts[i].script[j][k] = {script: this.ir.scripts.length - 1};
						internalscriptset.add(block[k]);
						internalscriptmap.set(block[k], this.ir.scripts.length - 1);
					}
				}
			}
		}
		console.log(JSON.stringify(this.ir.scripts));

		//Replace variable names with IDs
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			this.ir.scripts[i].script = this.replaceVariableNames(script, this.ir.scripts[i].owner);
		}

		//Remove timer blocks
		this.timervar = this.addNewTempVar();
		this.answered = this.addNewTempVar();
		for (let i = 0; i < this.ir.scripts.length; i++) {
			this.ir.scripts[i].script = this.removeSpecialVarScript(
				this.ir.scripts[i].script, 
				this.ir.scripts[i].owner
			);
		}

		//Add insert_atlist dependency
		for (let i = 0; i < this.ir.sprites.length; i++) {
			let iteration = this.addNewTempVar();

			this.ir.scripts.push({owner: i, script: [
				[
					"data_replaceitemoflist", 
					['data_variable', iteration],
					["argument_reporter_string_number", "list"],
					[
						"data_itemoflist",
						["operator_subtract", ["data_variable", iteration], 1],
						["argument_reporter_string_number", "list"]
					]
				],
				["data_changevariableby", iteration, -1]
			]});
	
			this.ir.scripts.push({owner: i, script: [
				[
					"procedures_definition",
					["argument_reporter_string_number", "item"],
					["argument_reporter_string_number", "index"],
					["argument_reporter_string_number", "list"],
					{
						argDefaults: [0, 0, ""],
						argNames: ["item", "index", "list"],
						owner: i,
						proccode: "data_insertatlist %s %s %s",
						warp: true
					}
				],
				[
					"data_addtolist", //Duplicate last item of list
					[
						"data_itemoflist",
						["data_lengthoflist", ["argument_reporter_string_number", "list"]],
						["argument_reporter_string_number", "list"]
					],
					["argument_reporter_string_number", "list"]
				],
				[
					"data_setvariableto", //Loop to set list elements
					iteration, 
					["operator_subtract", ["data_lengthoflist", ["argument_reporter_string_number", "list"], 1]]
				],
				[
					"control_while",
					["operator_gt", ["data_variable", iteration], ["argument_reporter_string_number", "index"]],
					{script: this.ir.scripts.length - 1}
				],
				[
					"data_replaceitemoflist", 
					["argument_reporter_string_number", "index"], 
					["argument_reporter_string_number", "list"], 
					["argument_reporter_string_number", "item"]
				]
			]});
		}

		//Remove wait blocks

		for (let i = 0; i < this.ir.scripts.length; i++) {
			this.ir.scripts[i].script = this.simplifyScript(this.ir.scripts[i].script, this.ir.scripts[i].owner);
		}

		let opcodes = [];
		for (let i = 0; i < this.ir.scripts.length; i++) {
			opcodes = opcodes.concat(this.countOpcodesScript(this.ir.scripts[i].script));
		}
		opcodes = [...new Set(opcodes)];
		console.log(JSON.stringify(opcodes), opcodes.length);
		console.log(structuredClone(this.ir.scripts));

		//SSA (not really)
		this.ir.ssa = [];
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			let ssa = this.scriptToSSA(script);
			this.ir.ssa.push(ssa);
		}

		//highlight start/end of basic blocks
		console.log(JSON.stringify(this.ir.ssa));
		for (let i = 0; i < this.ir.ssa.length; i++) {
			let script = this.ir.ssa[i];
			for (let j = 0; j < script.length; j++) {
				if (!this.hasWait(script[j])) {
					continue;
				}
				//Add helium_start and helium_end to the insides of loops
				let innerScript = -1;
				for (let k = 1; k < script[j].length; k++) {
					if (!script[j][k].val.script) {
						continue;
					}
					innerScript = script[j][k].val.script;
					break;
				}
				if (innerScript !== -1) {
					this.ir.ssa[innerScript].splice(1,0,["helium_start"]);
					this.ir.ssa[innerScript].push(["helium_end"]);
				}

				//Loops/wait blocks can change where script execution happens so insert a end/start pair
				this.ir.ssa[i].splice(j, 0, ["helium_end"]);
				this.ir.ssa[i].splice(j+2, 0, ["helium_start"]);
				j++;
				//console.log(i, j, script[j]);
			}
			if (doesScriptDoAnything(script)) {
				this.ir.ssa[i].splice(1,0,["helium_start"]);
				this.ir.ssa[i].push(["helium_end"]);
			}
		}

		//Remove empty blocks
		for (let i = 0; i < this.ir.ssa.length; i++) {
			for (let j = 0; j < this.ir.ssa[i].length-1; j++) {
				if (
					nDarrayEquality(this.ir.ssa[i][j],["helium_start"]) && 
					nDarrayEquality(this.ir.ssa[i][j+1],["helium_end"])
				) {
					this.ir.ssa[i].splice(j,2);
					j--;
				}
			}
		}
		console.log(structuredClone(this.ir.ssa));

		//Turn variables to values
		let variations = [];
		const totalVariables = this.ir.variables.length + this.ir.lists.length;
		const numIrVariables = this.ir.variables.length;
		for (let i = 0; i < totalVariables; i++) {
			variations.push(0);
		}

		for (let i = this.ir.ssa.length - 1; i >= 0; i--) {
			let script = this.ir.ssa[i];
			//Number definitions
			for (let j = 0; j < script.length; j++) {
				let opcode = script[j][0];
				if (nDarrayEquality(script[j], ["helium_start"])) {
					//console.log(j, script[j]);

					let insert = [];
					for (let k = 0; k < totalVariables; k++) {
						insert.push([
							"helium_variation", 
							[k, variations[k]], 
							["data_variable", k], 
							true
						]);
						variations[k]++;
					}
					//console.log(insert);

					this.ir.ssa[i].splice(j + 1, 0, ...insert);
					j += insert.length;
					continue;
				}
				if (nDarrayEquality(script[j], ["helium_end"])) {
					//console.log(j, script[j]);

					let insert = [];
					for (let k = 0; k < totalVariables; k++) {
						insert.push(["helium_updatevar", k, -1]);
					}

					this.ir.ssa[i].splice(j + 1, 0, ...insert);
					j += insert.length;
					continue;
				}
				if (opcode === "data_setvariableto") {
					//console.log(j, script[j]);

					let newBlock = [
						"helium_variation", 
						[script[j][1].val, variations[script[j][1].val]], 
						script[j][2], 
						false
					];
					variations[script[j][1].val]++;
					this.ir.ssa[i][j] = newBlock;
					//console.log(j, this.ir.ssa[i][j]);
				}
				if ([
					"data_addtolist",
					"data_deleteoflist",
					"data_deletealloflist",
					"data_replaceitemoflist",
				].includes(opcode)) {
					let listIndex = -1;
					switch (opcode) {
						case "data_addtolist":
						case "data_deleteoflist":
						case "data_replaceitemoflist":
							listIndex = script[j][2].val;
							break;
						case "data_deletealloflist":
							listIndex = script[j][1].val;
					}
					listIndex += numIrVariables;

					//TO-DO: SWITCH THESE TO ACTUAL VARIATIONS
					let newBlock = [
						"helium_variation",
						[listIndex, variations[listIndex]]
					];
					switch (opcode) {
						case "data_addtolist":
							newBlock.push(
								[
									"helium_append", 
									["data_variable", listIndex],
									script[j][1]
								]
							);
							break;
						case "data_deleteoflist":
							newBlock.push(
								[
									"helium_delete",
									["data_variable", listIndex],
									script[j][1]
								]
							);
							break;
						case "data_replaceitemoflist":
							newBlock.push(
								[
									"helium_replace",
									["data_variable", listIndex],
									script[j][1],
									script[j][3]
								]
							);
							break;
						case "data_deletealloflist":
							newBlock.push([]);
					}

					newBlock.push(false);
					this.ir.ssa[i][j] = newBlock;
					variations[listIndex]++;
				}
			}

			script = this.ir.ssa[i];

			//Add phi functions
			for (let j = 0; j < script.length; j++) {
				let opcode = script[j][0];

				/*
				//Currently loops will not get merge phi functions as their contents are treated as separate basic blocks.
				//This may change in later versions of Helium.

				if (this.isLoop(script[j])) {
					if (opcode !== "control_while") {
						console.error("Please tell ArolaunTech to add support for this loop:", j, opcode, script[j]);
						continue;
					}

					let innerScript = script[j][2].val.script;
					//Search loop for updates of variables so we can add merge phis
					let innerUpdates = []; //Logs variation number
					for (let i = 0; i < totalVariables; i++) {
						innerUpdates.push(-1);
					}

					for (let j = this.ir.ssa[innerScript].length - 1; j >= 0; j--) {
						let block = this.ir.ssa[innerScript][j];
						if (block[0] !== 'helium_variation') {
							continue;
						}
						console.log(block);
					}

					console.log(j, opcode, script[j], innerScript);
					continue;
				}*/
				if (opcode === "control_if") {
					let innerScript = script[j][2].val.script;
					let innerUpdates = []; //Logs variation number
					for (let k = 0; k < totalVariables; k++) {
						innerUpdates.push(-1);
					}

					let innerScriptLength = this.ir.ssa[innerScript].length;
					for (let k = 0; k < innerScriptLength; k++) {
						let block = this.ir.ssa[innerScript][k];
						if (block[0] !== 'helium_variation') {
							continue;
						}
						innerUpdates[block[1][0]] = block[1][1];
					}

					let insert = [];
					for (let k = 0; k < totalVariables; k++) {
						if (innerUpdates[k] === -1) {
							continue;
						}
						insert.push([
							"helium_variation",
							[k, variations[k]],
							[
								"helium_phi", 
								["data_variable", k], 
								["helium_getvariation", k, innerUpdates[k]]
							],
							false
						]);

						variations[k]++;
					}

					this.ir.ssa[i].splice(j+1, 0, ...insert);

					//console.log(j, opcode, script[j], innerScript, innerUpdates, insert);
					continue;
				}
				if (opcode === "control_if_else") {
					let truthyInnerScript = script[j][2].val.script;
					let falsyInnerScript = script[j][3].val.script;

					let truthyUpdates = [];
					let falsyUpdates = [];
					for (let k = 0; k < totalVariables; k++) {
						truthyUpdates.push(-1);
						falsyUpdates.push(-1);
					}

					let truthyInnerScriptLength = this.ir.ssa[truthyInnerScript].length;
					let falsyInnerScriptLength = this.ir.ssa[falsyInnerScript].length;

					for (let k = 0; k < truthyInnerScriptLength; k++) {
						let block = this.ir.ssa[truthyInnerScript][k];
						if (block[0] !== 'helium_variation') {
							continue;
						}
						truthyUpdates[block[1][0]] = block[1][1];
					}

					for (let k = 0; k < falsyInnerScriptLength; k++) {
						let block = this.ir.ssa[falsyInnerScript][k];
						if (block[0] !== 'helium_variation') {
							continue;
						}
						falsyUpdates[block[1][0]] = block[1][1];
					}

					let insert = [];
					for (let k = 0; k < totalVariables; k++) {
						if ((truthyUpdates[k] === -1) && (falsyUpdates[k] === -1)) {
							continue;
						}
						let phi = [
							"helium_phi",
							(truthyUpdates[k] === -1) ? ["data_variable", k] : ["helium_getvariation", k, truthyUpdates[k]],
							(falsyUpdates[k] === -1) ? ["data_variable", k] : ["helium_getvariation", k, falsyUpdates[k]],
						];

						insert.push([
							"helium_variation",
							[k, variations[k]],
							phi,
							false
						]);

						variations[k]++;
					}

					this.ir.ssa[i].splice(j+1, 0, ...insert);

					//console.log(j, opcode, script[j], truthyUpdates, falsyUpdates);
					continue;
				}
				if (opcode === "helium_variation") {
					if (script[j][3]) {
						continue;
					}

					let varIndex = script[j][1][0];
					if (varIndex < numIrVariables) continue;
					if (script[j][2].length === 0) continue;
					if (script[j][2][0] === "helium_phi") continue;

					let variation1 = script[j][1];
					let variation2 = [];
					for (let k = j-1; k > 0; k--) {
						if (script[k][0] !== 'helium_variation') continue;
						if (script[k][1][0] !== variation1[0]) continue;
						variation2 = script[k][1];
						break;
					}

					let phi = [
						"helium_phi",
						["helium_getvariation", variation1[0], variation1[1]],
						["helium_getvariation", variation2[0], variation2[1]],
					];

					this.ir.ssa[i].splice(j+1, 0, [
						"helium_variation",
						[varIndex, variations[varIndex]],
						phi,
						false
					]);

					variations[varIndex]++;

					//console.log(i, j, opcode, script[j], variation1, variation2);
					continue;
				}
			}

			//Replace data_variable
			let variableSetters = [];
			for (let j = 0; j < totalVariables; j++) variableSetters.push(-1);
			for (let j = 0; j < script.length; j++) { //Replace data_variable with variations
				if (script[j][0] === 'helium_variation') variableSetters[script[j][1][0]] = script[j][1][1];
				this.ir.ssa[i][j] = this.replaceVariableCallsBlock(script[j], variableSetters);

				//console.log(variableSetters);
			}

			//Add @ computation
			for (let j = 0; j < script.length; j++) {
				let opcode = script[j][0];
				if (opcode !== 'helium_variation') continue;

				//console.log(script[j], opcode);

				let insert = ["helium_@", script[j][1]];
				if (script[j][2][0] === 'helium_phi') {
					//Phi node - @ computation is a simple max
				} else {
					//List 
				}
			}
		}

		//Optimization passes
		for (let i = 0; i < 10; i++) {

		}

		return this.ir;
	}
};

var globalOptimizer = new Optimizer();

function optimizeIR(ir) {
	globalOptimizer.loadIR(ir);
	return globalOptimizer.optimizeIR();
}
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
		this.projectVars = {};
	}

	loadIR(load) {
		this.ir = load;
		this.numVars = 0;
		this.projectVars = {};
	}

	findVar(name, owner, vars) {
		for (let i = 0; i < vars.length; i++) {
			if (vars[i].name !== name) continue;
			if ((vars[i].owner !== this.ir.stageIndex) && (vars[i].owner !== owner)) continue;
			return i;
		}
		console.error("Cannot find variable: ", name, owner, this.ir.stageIndex, vars);
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

	replaceListNamesBlock(block, owner) {
		let opcode = block[0];
		let newBlock = [opcode];

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.replaceListNamesBlock(block[i], owner));
			} else {
				newBlock.push(block[i]);
			}
		}

		switch (opcode) {
			case "data_listcontents":
			case "data_lengthoflist":
			case "data_deletealloflist":
			case "data_showlist":
			case "data_hidelist": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.lists) + this.ir.variables.length];
			}
			case "data_addtolist":
			case "data_itemoflist":
			case "data_deleteoflist": {
				return [opcode, newBlock[1], this.findVar(newBlock[2], owner, this.ir.lists) + this.ir.variables.length];
			}
			case "data_insertatlist": {
				return [opcode, newBlock[1], newBlock[2], this.findVar(newBlock[3], owner, this.ir.lists) + this.ir.variables.length];
			}
			case "data_replaceitemoflist": {
				return [opcode, newBlock[1], this.findVar(newBlock[2], owner, this.ir.lists) + this.ir.variables.length, newBlock[3]];
			}
			case "data_itemnumoflist":
			case "data_listcontainsitem": {
				return [opcode, this.findVar(newBlock[1], owner, this.ir.lists) + this.ir.variables.length, newBlock[2]];
			}
		}
		return newBlock;
	}

	replaceListNames(script, owner) {
		let newScript = [];
		for (let i = 0; i < script.length; i++) {
			newScript.push(this.replaceListNamesBlock(script[i], owner));
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
										["operator_multiply", ["helium_number", block[2]], Math.PI/180]
									]
								]
							]
						], owner);
					case "tan":
						return this.simplifyReporterStack([
							"helium_ternary",
							[
								"operator_or",
								["operator_equals", ["helium_mod", ["helium_number", block[2]], 360], 90],
								["operator_equals", ["helium_mod", ["helium_number", block[2]], 360], -270],
							],
							Infinity,
							[
								"helium_ternary",
								[
									"operator_or",
									["operator_equals", ["helium_mod", ["helium_number", block[2]], 360], -90],
									["operator_equals", ["helium_mod", ["helium_number", block[2]], 360], 270],
								],
								-Infinity,
								[
									"operator_multiply",
									1e-10,
									[
										"operator_round",
										[
											"operator_multiply",
											1e10,
											[
												"helium_tan", 
												["operator_multiply", ["helium_mod", ["helium_number", block[2]], 360], Math.PI/180]
											]
										]
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
							["helium_"+block[1], ["helium_number", block[2]]]
						], owner);
					default:
						return ["helium_"+block[1], ["helium_number", block[2]]];
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
			case "helium_scale": {
				return this.simplifyReporterStack([
					"data_variable",
					this.projectVars["spritescale" + owner]
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
			case "sensing_timer": {
				return this.simplifyReporterStack([
					"operator_subtract", 
					["helium_time"], 
					["data_variable", this.projectVars.timervar]
				], owner);
			}
			case "music_getTempo": {
				return this.simplifyReporterStack([
					"data_variable", this.projectVars.tempo
				], owner);
			}
			case "data_lengthoflist": {
				return this.simplifyReporterStack([
					"helium_listlength", ["data_variable", block[1]]
				], owner);
			}
			default:
				return block;
		}
	}

	simplifyScript(script, owner) {
		for (let i = 0; i < script.length; i++) {
			let block = script[i];
			let opcode = block[0];
			for	(let j = 1; j < block.length; j++) {
				block[j] = this.simplifyReporterStack(block[j], owner);
			}

			let newBlocks = [block];

			switch (opcode) {
				case "motion_turnleft": {
					newBlocks = [
						["motion_turnright", ["operator_multiply", -1, block[1]]]
					];
					break;
				}
				case "motion_turnright": {
					newBlocks = [
						["motion_pointindirection", ["operator_add", ["motion_direction"], block[1]]]
					];
					break;
				}
				case "motion_pointindirection": {
					newBlocks = [
						[
							"helium_pointindirection",
							[
								"operator_subtract",
								Math.PI/2,
								["operator_multiply", Math.PI/180, block[1]]
							]
						]
					];
					break;
				}
				case "motion_changexby": {
					newBlocks = [
						["motion_setx", ["operator_add", ["helium_xposition"], block[1]]]
					];
					break;
				}
				case "motion_changeyby": {
					newBlocks = [
						["motion_sety", ["operator_add", ["helium_yposition"], block[1]]]
					];
					break;
				}
				case "motion_movesteps": {
					newBlocks = [
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
					];
					break;
				}
				case "control_forever": {
					newBlocks = [
						["control_while", true, 0]
					];
					break;
				}
				case "control_repeat_until": {
					newBlocks = [
						["control_while", ["operator_not", block[1]], 0]
					];
					break;
				}
				case "sound_changevolumeby": {
					newBlocks = [
						["sound_setvolumeto", ["operator_add", ["sound_volume"], block[1]]]
					];
					break;
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
					newBlocks = [
						["motion_gotoxy", targetX, targetY]
					];
					break;
				}
				case "music_changeTempo": {
					newBlocks = [
						["music_setTempo", ["operator_add", ["music_getTempo"], block[1]]]
					];
					break;
				}
				case "music_setTempo": {
					newBlocks = [
						["data_setvariableto", this.projectVars.tempo, block[1]]
					];
					break;
				}
				case "control_wait_until": {
					newBlocks = [
						["control_repeat_until", block[1], 0],
						["helium_entry"],
						["helium_exit"]
					];
					break;
				}
				case "control_wait": {
					let endTime = this.addNewTempVar();
					newBlocks = [
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
					];
					break;
				}
				case "looks_nextcostume": {
					newBlocks = [
						["looks_switchcostumeto", ["operator_add", 2, ["helium_costumenumber"]]]
					];
					break;
				}
				case "looks_sayforsecs": {
					newBlocks = [
						["looks_say", block[1]],
						["control_wait", block[2]],
						["looks_say", ""]
					];
					break;
				}
				case "looks_thinkforsecs": {
					newBlocks = [
						["looks_think", block[1]],
						["control_wait", block[2]],
						["looks_think", ""]
					];
					break;
				}
				case "looks_cleargraphiceffects": {
					newBlocks = [
						["looks_seteffectto", "COLOR", 0],
						["looks_seteffectto", "FISHEYE", 0],
						["looks_seteffectto", "WHIRL", 0],
						["looks_seteffectto", "PIXELATE", 0],
						["looks_seteffectto", "MOSAIC", 0],
						["looks_seteffectto", "BRIGHTNESS", 0],
						["looks_seteffectto", "GHOST", 0]
					];
					break;
				}
				case "looks_changesizeby": {
					newBlocks = [
						["looks_setsizeto", ["operator_add", ["looks_size"], block[1]]]
					];
					break;
				}
				case "motion_pointtowards": {
					if (block[1] === '_random_') {
						newBlocks = [
							[
								"motion_pointindirection",
								["operator_round", ["operator_random", -180.0, 180.0]],
							]
						];
						break;
					}

					let targetX = ["sensing_of", "x position", block[1]];
					let targetY = ["sensing_of", "y position", block[1]];
					if (block[1] === '_mouse_') {
						targetX = ["sensing_mousex"];
						targetY = ["sensing_mousey"];
					}
					newBlocks = [
						[
							"helium_pointindirection", 
							[
								"helium_atan2", 
								["operator_subtract", targetY, ["helium_yposition"]],
								["operator_subtract", targetX, ["helium_xposition"]]
							]
						]
					];
					break;
				}
				case "motion_glidesecstoxy": {
					let duration = this.addNewTempVar();
					let start = this.addNewTempVar();
					let x = this.addNewTempVar();
					let y = this.addNewTempVar();
					let dx = this.addNewTempVar();
					let dy = this.addNewTempVar();

					newBlocks = [
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
							0
						],
						["helium_entry"],
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
						["helium_exit"]
					];
					break;	
				}
				case "looks_setsizeto": {
					newBlocks = [
						["helium_setscaleto", ["operator_multiply", block[1], 0.01]]
					];
					break;
				}
				case "helium_setscaleto": {
					newBlocks = [
						["data_setvariableto", this.projectVars["spritescale" + owner], block[1]]
					];
					break;
				}
				case "sound_cleareffects": {
					newBlocks = [
						["sound_seteffectto", "PITCH", 0],
						["sound_seteffectto", "PAN", 0]
					];
					break;
				}
				case "motion_glideto": {
					//console.log(block);
					if (block[2] === "_mouse_") {
						newBlocks = [
							["motion_glidesecstoxy", block[1], ["sensing_mousex"], ["sensing_mousey"]]
						];
					} else if (block[2] === "_random_") {
						newBlocks = [
							[
								"motion_glidesecstoxy", 
								block[1], 
								["operator_round", ["operator_random", -0.5, 0.5], ["helium_stagewidth"]],
								["operator_round", ["operator_random", -0.5, 0.5], ["helium_stageheight"]]
							]
						];
					} else {
						newBlocks = [
							[
								"motion_glidesecstoxy", 
								block[1], 
								["sensing_of", "x position", block[1]],
								["sensing_of", "y position", block[1]]
							]
						];
					}
					break;
				}
				case "data_changevariableby": {
					newBlocks = [
						[
							"data_setvariableto", 
							block[1], 
							[
								"operator_add", 
								["data_variable", block[1]],
								block[2]
							]
						]
					];
					break;
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

					newBlocks = [
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
							0
						],
						["helium_entry"],
							["data_setvariableto", nearestEdge, 2],
						["helium_exit"],
						[
							"control_if", 
							[
								"operator_equals", 
								["data_variable", minDist], 
								["data_variable", distTop]
							],
							0
						],
						["helium_entry"],
							["data_setvariableto", nearestEdge, 1],
						["helium_exit"],
						[
							"control_if", 
							[
								"operator_equals", 
								["data_variable", minDist], 
								["data_variable", distLeft]
							],
							0
						],
						["helium_entry"],
							["data_setvariableto", nearestEdge, 0],
						["helium_exit"],
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
							0
						],
						["helium_entry"],
							["data_setvariableto", dx, ["helium_cos", ["helium_direction"]]],
							["data_setvariableto", dy, ["helium_sin", ["helium_direction"]]],
							[
								"control_if",
								["operator_equals", ["data_variable", nearestEdge], 0],
								0
							],
							["helium_entry"],
							[
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
							],
							["helium_exit"],
							[
								"control_if",
								["operator_equals", ["data_variable", nearestEdge], 1],
								0
							],
							["helium_entry"],
							[
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
							],
							["helium_exit"],
							[
								"control_if",
								["operator_equals", ["data_variable", nearestEdge], 2],
								0
							],
							["helium_entry"],
							[
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
							],
							["helium_exit"],
							[
								"control_if",
								["operator_equals", ["data_variable", nearestEdge], 3],
								0
							],
							["helium_entry"],
							[
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
							],
							["helium_exit"],
							[
								"helium_pointindirection", 
								[
									"helium_atan2", 
									["data_variable", dy],
									["data_variable", dx]
								]
							],
							[
								"motion_gotoxy",
								[
									"operator_add",
									["motion_xposition"],
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
									"operator_add",
									["motion_yposition"],
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
							],
						["helium_exit"]
					];
					break;
				}
				case "music_restForBeats": {
					newBlocks = [
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
					];
					break;
				}
				case "music_playDrumForBeats": {
					newBlocks = [
						[
							"helium_playDrum",
							[
								"helium_wrapClamp",
								block[1],
								0, 17
							]
						],
						["music_restForBeats", block[2]]
					];
					break;
				}
				case "music_playNoteForBeats": {
					let durationSec = this.addNewTempVar();

					newBlocks = [
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
							0
						],
						["helium_entry"],
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
						["control_wait", ["data_variable", durationSec]],
						["helium_exit"]
					];
					break;
				}
				case "control_repeat": {
					let iteration = this.addNewTempVar();

					let brackets = 0;
					let j = i;
					while (brackets > 0) {
						j++;
						if (script[j][0] === 'helium_entry') brackets++;
						if (script[j][0] === 'helium_exit') brackets--;
					}

					script.splice(j, 0, ["data_changevariableby", iteration, 1]);

					newBlocks = [
						["data_setvariableto", iteration, 0],
						[
							"control_while", 
							["operator_lt", ["data_variable", iteration], block[1]],
							0
						]
					];
					break;
				}
				case "sensing_resettimer": {
					newBlocks = [[
						"data_setvariableto", 
						this.projectVars.timervar, 
						["helium_time"]
					]];
					break;
				}
				case 'sensing_askandwait': {
					newBlocks = [
						["data_setvariableto", this.projectVars.answered, false],
						["helium_ask", block[1]],
						["control_wait_until", ["data_variable", this.projectVars.answered]]
					];
					break;
				}
				case 'sound_playuntildone': {
					let soundFound = false;
					for (let i = 0; i < this.ir.sounds.length; i++) {
						if (this.ir.sounds[i].owner !== owner) {
							continue;
						}
						if (this.ir.sounds[i].obj.name !== block[1]) {
							continue;
						}
						newBlocks = [
							["sound_play", block[1]],
							["control_wait", this.ir.sounds[i].obj.sampleCount/this.ir.sounds[i].obj.rate]
						];
						soundFound = true;
					}
					if (!soundFound) {
						newBlocks = [
							["sound_play", block[1]],
							["control_wait", ["helium_soundlength", block[1]]]
						];
					}
					break;
				}
			}

			if (!nDarrayEquality(newBlocks, [block])) {
				script.splice(i, 1, ...newBlocks);
				i--;
			}
		}
		return script;
	}

	countOpcodesBlock(block) {
		let opcodes = [];
		if (true) {
			opcodes = [block[0]];
		}

		//if (block[0] === "procedures_call") {
		//	console.log(block);
		//}

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
		if ((block[0] === 'helium_val') && block[3]) return block;

		if (block[0] === 'data_variable') {
			//Replace with variation
			if (variations[block[1].val] === -1) {
				return block;
			}
			//console.log(variations, block[1], variations[block[1].val]);
			return {type: "var", val: variations[block[1].val]};
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

	getUsedVarsBlock(block) {
		let usedVars = [];

		if (block[0] === 'helium_updatevar') return [];

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				usedVars = usedVars.concat(this.getUsedVarsBlock(block[i]));
				continue;
			}

			if (typeof block[i].val === 'undefined') continue;
			if (block[i].type === 'var') {
				usedVars.push(block[i].val);
			} else {
				if (typeof block[i].val.script === 'undefined') continue;

				usedVars = usedVars.concat(this.getUsedVarsScript(this.ir.ssa[block[i].val.script]));
			}
		}

		return usedVars;
	}

	getUsedVarsScript(script) {
		let usedVars = [];

		for (let i = 0; i < script.length; i++) {
			let block = script[i];

			usedVars = usedVars.concat(this.getUsedVarsBlock(block));
		}

		return usedVars;
	}

	replaceConstantValuesBlock(block, constVals) {
		let newBlock = [block[0]];

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.replaceConstantValuesBlock(block[i], constVals));
				continue;
			}
			if ((typeof block[i].val === 'undefined') || (block[i].type === 'value') || (!constVals.has(block[i].val))) {
				newBlock.push(block[i]);
				continue;
			}
			newBlock.push({type: 'value', val: constVals.get(block[i].val)});
		}

		return newBlock;
	}

	replaceRedundantVariablesBlock(block, replaceVars) {
		let newBlock = [block[0]];

		for (let i = 1; i < block.length; i++) {
			if (Array.isArray(block[i])) {
				newBlock.push(this.replaceRedundantVariablesBlock(block[i], replaceVars));
				continue;
			}
			if ((typeof block[i].val === 'undefined') || (block[i].type === 'value') || (!replaceVars.has(block[i].val))) {
				newBlock.push(block[i]);
				continue;
			}
			newBlock.push({type: 'var', val: replaceVars.get(block[i].val)});
		}

		return newBlock;
	}

	optimizeBasicBlock(script) {
		//Compile-time evaluation
		let constantValues = new Map();
		let scriptEvaluated = [];
		for (let i = 0; i < script.length; i++) {
			let block = script[i];
			let opcode = block[0];

			block = this.replaceConstantValuesBlock(block, constantValues);
			
			if ((opcode === 'control_while') && (block[1].type === 'value')) {
				let castCondition = castToBoolean(block[1].val);
				if (castCondition) {
					scriptEvaluated.push(block);
					break;
				}
				continue;
			}

			if (opcode !== 'helium_val') {
				scriptEvaluated.push(block);
				continue;
			}

			if (typeof block[2].val !== 'undefined') {
				//console.log(block);
				if (block[2].type === 'value') {
					constantValues.set(block[1], block[2].val);
				} else {
					scriptEvaluated.push(block);
				}

				continue;
			}

			if (!Array.isArray(block[2])) {
				scriptEvaluated.push(block);
				continue;
			}
			

			//console.log(block);

			let valueOpcode = block[2][0];
			let addBlock = true;

			//All inputs are values
			let variableInputs = false;
			let inputs = [];
			for (let i = 1; i < block[2].length; i++) {
				if (typeof block[2][i].val === 'undefined') continue;
				if (block[2][i].type === 'value') {
					inputs.push(block[2][i].val);
					continue;
				}
				variableInputs = true;
				break;
			}

			//if ((!variableInputs) && (!blockMap.has(valueOpcode))) console.log(valueOpcode, block);

			if ((!variableInputs) && (blockMap.has(valueOpcode))) {
				let blockFunction = blockMap.get(valueOpcode);
				let replaceValue = blockFunction(...inputs);

				//console.log(inputs, valueOpcode, blockFunction, replaceValue, block[1], block);

				constantValues.set(block[1], replaceValue);
				continue;
			}

			switch (valueOpcode) {
				case 'data_variable': //
				case 'helium_time': // This changes over time (duh)
				case 'helium_stagewidth': // This might be able to change in a project but no block is changing them so whatever
				case 'helium_stageheight': //
				case 'helium_xposition': // TODO - Replace positions with variables
				case 'helium_yposition': // TODO - Replace positions with variables
				case 'helium_number': //
				case 'helium_max': //
				case 'helium_min': //
					break;
				case 'helium_ternary':
					if (block[2][2] === block[2][3]) {
						block[2] = block[2][2];
						break;
					}

					if (typeof block[2][1].val === 'undefined') break;
					if (block[2][1].type === 'var') break;
					if (block[2][1].val) {
						block[2] = block[2][2];
					} else {
						block[2] = block[2][3];
					}
					break;
				case 'operator_add':
					if ((typeof block[2][1].val !== 'undefined') && (castToNumber(block[2][1].val) === 0)) {
						block[2] = block[2][2];
						break;
					}
					if ((typeof block[2][2].val !== 'undefined') && (castToNumber(block[2][2].val) === 0))
						block[2] = block[2][1];
					break;
				case 'operator_multiply':
					if (castToNumber(block[2][1].val) === 1) {
						block[2] = block[2][2];
						break;
					}
					if (castToNumber(block[2][2].val) === 1)
						block[2] = block[2][1];
					break;
				default:
					//console.log(i, block, script, valueOpcode);
			}

			if (addBlock) scriptEvaluated.push(block);
		}

		//console.log(constantValues);

		//Removing redundant variables
		let scriptNoRedundantVars = [];
		let replaceVariations = new Map();
		let variationDefinitions = new Map();

		for (let i = 0; i < scriptEvaluated.length; i++) {
			let block = scriptEvaluated[i];
			let opcode = block[0];

			block = this.replaceRedundantVariablesBlock(block, replaceVariations);

			if (opcode !== 'helium_val') {
				scriptNoRedundantVars.push(block);
				continue;
			}
			if (replaceVariations.has(block[1])) continue;
			if (variationDefinitions.has(block[2])) {
				replaceVariations.set(block[1], variationDefinitions.get(block[2]));
				continue;
			}
			if ((typeof block[2].val !== 'undefined') && block[2].type === "var") {
				replaceVariations.set(block[1], block[2].val);
				continue;
			}

			variationDefinitions.set(block[2], block[1]);
			scriptNoRedundantVars.push(block);
		}

		let usedVars = new Set(this.getUsedVarsScript(scriptNoRedundantVars));

		let newScript = [];
		for (let i = 0; i < scriptNoRedundantVars.length; i++) {
			let block = scriptNoRedundantVars[i];
			let opcode = block[0];

			if ((opcode !== 'helium_val') || (block.length > 4)) {
				newScript.push(block);
				continue;
			}

			if (usedVars.has(block[1])) newScript.push(block);
		}
		return newScript;
	}

	optimizeIR() {
		console.log(structuredClone(this.ir));
		//for (let i = 0; i < this.ir.scripts.length; i++) {
		//	console.log(structuredClone(this.ir.scripts[i].script), i, this.ir.scripts[i].owner);
		//}

		//"Fix" internal scripts
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			for (let j = 0; j < script.length; j++) {
				let block = script[j];
				let numBlockScripts = 0;

				for (let k = 1; k < block.length; k++) {
					if (!(Array.isArray(block[k]) && Array.isArray(block[k][0]))) continue;
					let addition = [["helium_entry"]].concat(block[k]);
					addition.push(["helium_exit"]);

					this.ir.scripts[i].script.splice(j+1, 0, ...addition);
					this.ir.scripts[i].script[j][k] = numBlockScripts;
					numBlockScripts++;
				}
			}
		}
		console.log(structuredClone(this.ir.scripts));

		//Replace variable names with IDs
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			//console.log(script, i, this.ir.scripts[i].owner);
			this.ir.scripts[i].script = this.replaceVariableNames(script, this.ir.scripts[i].owner);
		}

		//Remove wait blocks
		this.projectVars.timervar = this.addNewTempVar();
		this.projectVars.answered = this.addNewTempVar();
		this.projectVars.tempo = this.addNewTempVar();
		
		let spriteScales = [];
		for (let i = 0; i < this.ir.sprites.length; i++) {
			let spriteScale = this.addNewTempVar();

			spriteScales.push(spriteScale);
			this.projectVars["spritescale" + i] = spriteScale;
		}

		for (let i = 0; i < this.ir.scripts.length; i++) {
			this.ir.scripts[i].script = this.simplifyScript(this.ir.scripts[i].script, this.ir.scripts[i].owner);
		}

		let opcodes = [];
		for (let i = 0; i < this.ir.scripts.length; i++) {
			opcodes = opcodes.concat(this.countOpcodesScript(this.ir.scripts[i].script));
		}
		opcodes = [...new Set(opcodes)];
		console.log(JSON.stringify(opcodes), opcodes.length);
		//console.log(structuredClone(this.ir.scripts));

		//Replace list names with IDs
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			//console.log(script, i, this.ir.scripts[i].owner);
			this.ir.scripts[i].script = this.replaceListNames(script, this.ir.scripts[i].owner);
		}

		let oldBlocks = 0;
		for (let i = 0; i < this.ir.scripts.length; i++) {
			oldBlocks += this.ir.scripts[i].script.length;
		}

		//Add yield points
		console.log(structuredClone(this.ir.scripts), this.ir);

		let numSprites = this.ir.sprites.length;
		for (let i = 0; i < numSprites; i++) {
			this.ir.scripts.push({
				owner: i,//this.ir.scripts[i].owner,
				script: [
					["helium_end"],
					["helium_yield"],
					["helium_start"],
				]
			});
		}
		for (let i = 0; i < this.ir.scripts.length; i++) {
			let script = this.ir.scripts[i].script;
			for (let j = 0; j < script.length; j++) {
				let block = script[j];

				if (!this.hasWait(block)) continue;

				let innerScriptIndex = this.ir.scripts.length - numSprites + this.ir.scripts[i].owner;

				if (!this.isLoop(block)) {
					this.ir.scripts[i].script.splice(j, 0, ["control_if", ["helium_mustyield"], {script: innerScriptIndex}]);
					this.ir.scripts[i].script.splice(j+2, 0, ["control_if", ["helium_mustyield"], {script: innerScriptIndex}]);
					j++;
					continue;
				}

				let innerscript = -1;
				for (let k = 1; k < block.length; k++) {
					if (typeof block[k].script === 'undefined') continue;
					innerscript = block[k].script;
					break;
				}
				if (innerscript === -1) continue;

				this.ir.scripts[innerscript].script.push(["control_if", ["helium_mustyield"], {script: innerScriptIndex}]);
				//console.log(this.ir.scripts[i].script, script, block, i, j, innerscript);
			}
			//console.log(this.ir.scripts[i].script);
		}
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
		//console.log(structuredClone(this.ir.ssa));

		/*===== Find starting and ending variations for all scripts while generating phi nodes =====*/
		let totalVariables = this.ir.variables.length + this.ir.lists.length;

		let startingVariations = [];
		let endingVariations = [];
		let parents = [];
		for (let i = 0; i < this.ir.ssa.length; i++) {
			startingVariations.push(Array(totalVariables).fill(-1));
			endingVariations.push(Array(totalVariables).fill(-1));
			parents.push(-1);
		}

		//Ending variations are calculated "backwards" while starting variations are calculated "forwards" (TODO)
		for (let i = this.ir.ssa.length - 1; i >= 0; i--) {
			let variations = Array(totalVariables).fill(-1);

			let script = this.ir.ssa[i];
			for (let j = 0; j < script.length; j++) {
				this.ir.ssa[i][j] = this.replaceVariableCallsBlock(this.ir.ssa[i][j], variations);

				let block = script[j];
				let opcode = block[0];

				let newBlocks = [];
				let innerscript = -1;
				let innerscriptendvariations = [];

				let varsSet = new Set();

				switch (opcode) {
					case 'helium_start':
						//Set the values to variable values
						for (let k = 0; k < totalVariables; k++) {
							newBlocks.push(["helium_val", this.numVars, ['data_variable', k], true, k]);
							this.numVars++;
						}

						varsSet.clear();
						//console.log(newBlocks);
						break;
					case 'helium_end':
						//Set the variables to values
						for (const k of varsSet)
							newBlocks.push(["helium_updatevar", k, {type: "var", val: variations[k]}]);
						//console.log(newBlocks);
						break;
					case 'helium_val':
						if (block.length > 4) {
							variations[block[4]] = block[1];

							varsSet.add(block[4]);
							//console.log(block);
						}
						break;
					case 'control_if':
						innerscript = block[2].val.script;
						innerscriptendvariations = endingVariations[innerscript];

						startingVariations[innerscript] = variations;
						
						parents[innerscript] = i;

						//Generate phi nodes
						for (let k = 0; k < innerscriptendvariations.length; k++) {
							if (innerscriptendvariations[k] === -1) continue;
							
							newBlocks.push([
								"helium_val",
								this.numVars,
								[
									"helium_phi",
									{type: 'var', val: innerscriptendvariations[k]},
									//If the variable is not referenced earlier then this will reference var "-1".
									//This reference will be fixed later.
									{type: 'var', val: variations[k]},
								],
								false,
								k
							]);

							this.numVars++;
							//We don't need to set variations here as they will be set once these blocks are processed.
						}
						break;
					case 'control_if_else':
						let truthyscript = block[2].val.script;
						let falsyscript = block[3].val.script;

						let truthyendvariations = endingVariations[truthyscript];
						let falsyendvariations = endingVariations[falsyscript];

						startingVariations[truthyscript] = variations;
						startingVariations[falsyscript] = variations;

						parents[truthyscript] = i;
						parents[falsyscript] = i;

						//Generate phi nodes
						for (let k = 0; k < truthyendvariations.length; k++) {
							let appearsintruthy = (truthyendvariations[k] !== -1);
							let appearsinfalsy = (falsyendvariations[k] !== -1);

							if (!(appearsintruthy || appearsinfalsy)) continue;

							let phiNode = ["helium_val", this.numVars, ["helium_phi"], false, k];

							if (appearsintruthy) phiNode[2].push({type: 'var', val: truthyendvariations[k]});
							if (appearsinfalsy) phiNode[2].push({type: 'var', val: falsyendvariations[k]});
							if (phiNode[2].length < 3) phiNode[2].push({type: 'var', val: variations[k]});

							newBlocks.push(phiNode);
							this.numVars++;
						}
						break;
					case 'control_while':
						innerscript = block[2].val.script;
						innerscriptendvariations = endingVariations[innerscript];

						startingVariations[innerscript] = variations;

						parents[innerscript] = i;

						//Generate phi nodes
						for (let k = 0; k < innerscriptendvariations.length; k++) {
							if (innerscriptendvariations[k] === -1) continue;

							newBlocks.push([
								"helium_val",
								this.numVars,
								[
									"helium_phi",
									{type: 'var', val: innerscriptendvariations[k]},
									{type: 'var', val: variations[k]},
								],
								false,
								k
							]);

							this.numVars++;
						}

						this.ir.ssa[innerscript].splice(0, 0, ...newBlocks);

						//console.log(block, opcode, newBlocks, this.ir.ssa[innerscript], innerscriptendvariations);
						break;
					case 'data_setvariableto':
						//Create a new value
						variations[block[1].val] = this.numVars;

						varsSet.add(block[1].val);

						this.ir.ssa[i][j] = ['helium_val', this.numVars, block[2], false, block[1].val];

						this.numVars++;
						break;
					case 'data_deletealloflist':
						//New value of []
						variations[block[1].val] = this.numVars;

						varsSet.add(block[1].val);

						this.ir.ssa[i][j] = ['helium_val', this.numVars, {type: 'value', val: []}, false, block[1].val];

						this.numVars++;
						break;
					case 'data_deleteoflist':
						//New value of list - element
						this.ir.ssa[i][j] = [
							'helium_val', 
							this.numVars, 
							['helium_listspliceout', {type: 'var', val: variations[block[2].val]}, block[1]], 
							false,
							block[2].val
						];

						variations[block[2].val] = this.numVars;

						varsSet.add(block[2].val);

						this.numVars++;
						break;
					case 'data_addtolist':
						//New value of list + element
						this.ir.ssa[i][j] = [
							'helium_val', 
							this.numVars, 
							['helium_listadd', {type: 'var', val: variations[block[2].val]}, block[1]], 
							false,
							block[2].val
						];

						variations[block[2].val] = this.numVars;

						varsSet.add(block[2].val);

						this.numVars++;
						break;
					case 'data_insertatlist':
						//New value of list + inserted element
						this.ir.ssa[i][j] = [
							'helium_val', 
							this.numVars, 
							['helium_listinsertatindex', {type: 'var', val: variations[block[3].val]}, block[1], block[2]], 
							false,
							block[3].val
						];

						variations[block[3].val] = this.numVars;

						varsSet.add(block[3].val);

						this.numVars++;
						break;
					case 'data_replaceitemoflist':
						//New value of list + changed element
						this.ir.ssa[i][j] = [
							'helium_val', 
							this.numVars, 
							['helium_listreplaceatindex', {type: 'var', val: variations[block[2].val]}, block[3], block[1]], 
							false,
							block[2].val
						];

						variations[block[2].val] = this.numVars;

						varsSet.add(block[2].val);

						this.numVars++;
						break;
					default:
						if (this.isLoop(block)) console.error("Helium does not support this block", block);
				}

				if (newBlocks.length === 0) continue;
				this.ir.ssa[i].splice(j+1, 0, ...newBlocks);
			}

			endingVariations[i] = variations;
		}
		
		//Fill in starting variations
		for (let i = 0; i < this.ir.ssa.length; i++) {
			for (let j = 0; j < totalVariables; j++) {
				let foundscript = i;

				while (startingVariations[foundscript][j] === -1) {
					if (parents[foundscript] === -1) break;
					foundscript = parents[foundscript];
				}

				startingVariations[i][j] = startingVariations[foundscript][j];
			}
		}

		//Combining starting and ending variation data (COMPLETE)
		for (let i = 0; i < this.ir.ssa.length; i++) {
			if (endingVariations[i] === -1) endingVariations[i] = startingVariations[i];
		}

		//Replace data_variable block
		for (let i = 0; i < this.ir.ssa.length; i++) {
			let script = this.ir.ssa[i];

			for (let j = 0; j < script.length; j++) {
				let block = script[j];
				let opcode = block[0];
				if ((opcode === 'helium_val') && block[3]) continue;

				this.ir.ssa[i][j] = this.replaceVariableCallsBlock(block, startingVariations[i]);
			}
		}

		//Fix -1 phi nodes
		for (let i = 0; i < this.ir.ssa.length; i++) {
			let script = this.ir.ssa[i];

			for (let j = 0; j < script.length; j++) {
				let block = script[j];
				let opcode = block[0];
				if (opcode !== 'helium_val') continue;
				if (block[2][0] !== 'helium_phi') continue;

				for (let k = 1; k < block[2].length; k++) {
					if (block[2][k].val === -1) this.ir.ssa[i][j][2][k].val = startingVariations[i][this.ir.ssa[i][j][4]];
				}
			}
		}

		//Optimization passes
		let totalBlocks = 0;
		let newBlocks = 0;
		for (let i = 0; i < 1; i++) {
			//Optimize scripts 
			for (let j = this.ir.ssa.length - 1; j >= 0; j--) {
				let script = this.ir.ssa[j];

				let newScript = this.optimizeBasicBlock(script);
				this.ir.ssa[j] = newScript;

				totalBlocks += script.length;
				newBlocks += newScript.length;

				//console.log(newScript, script);
			}
		}
		
		for (let i = 0; i < this.ir.ssa.length; i++) {
			console.log(i, this.ir.scripts[i].owner, this.ir.scripts[i].script, this.ir.ssa[i]);
		}
		console.log(100 * (1 - newBlocks/totalBlocks), totalBlocks, newBlocks, oldBlocks);

		return this.ir;
	}
};

var globalOptimizer = new Optimizer();

function optimizeIR(ir) {
	globalOptimizer.loadIR(ir);
	return globalOptimizer.optimizeIR();
}
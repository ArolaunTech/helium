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
		case "looks_costumenumbe": {
			if (block[1] === 'number') {
				return simplifyReporterStack([
					"operator_add",
					1,
					["helium_costumenumber"]
				], scripts, vars, owner);
			}
			return simplifyReporterStack([
				"helium_costum",
				["helium_costumenumber"]
			], scripts, vars, owner);
		}
		case "looks_backdropnumbe": {
			if (block[1] === 'number') {
				return simplifyReporterStack([
					"operator_add",
					1,
					["helium_backdropnumber"]
				], scripts, vars, owner);
			}
			return simplifyReporterStack([
				"helium_backdro",
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

function simplifyBlock(ir, scripts, scriptidx, vars, owner) {
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
		case "motion_turnleft": {
			return simplifyScript([
				["motion_turnright", ["operator_subtract", 0, block[1]]]
			], scripts, scriptidx, vars, owner);
		}
		case "motion_turnright": {
			return simplifyScript([
				["motion_pointindirection", ["operator_add", ["motion_direction"], block[1]]]
			], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
		}
		case "motion_changexby": {
			return simplifyScript([
				["motion_setx", ["operator_add", ["helium_xposition"], block[1]]]
			], scripts, scriptidx, vars, owner);
		}
		case "motion_changeyby": {
			return simplifyScript([
				["motion_sety", ["operator_add", ["helium_yposition"], block[1]]]
			], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
		}
		case "control_forever": {
			return simplifyScript([
				["control_while", true, block[1]]
			], scripts, scriptidx, vars, owner);
		}
		case "control_repeat_until": {
			return simplifyScript([
				["control_while", ["operator_not", block[1]], block[2]]
			], scripts, scriptidx, vars, owner);
		}
		case "sound_changevolumeby": {
			return simplifyScript([
				["sound_setvolumeto", ["operator_add", ["sound_volume"], block[1]]]
			], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
		}
		case "music_changeTempo": {
			return simplifyScript([
				["music_setTempo", ["operator_add", ["music_getTempo"], block[1]]]
			], scripts, scriptidx, vars, owner);
		}
		case "control_wait_until": {
			scripts.push({owner: owner, parent: scriptidx, script:[["helium_nop"]]});
			return simplifyScript([
				["control_repeat_until", block[1], {script:scripts.length-1}]
			], scripts, scriptidx, vars, owner);
		}
		case "control_wait": {
			let endTime = addNewTempVar(vars, TYPE_NUMBER);
			return simplifyScript([
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
			], scripts, scriptidx, vars, owner);
		}
		case "looks_nextcostume": {
			return simplifyScript([
				["looks_switchcostumeto", ["operator_add", 2, ["helium_costumenumber"]]]
			], scripts, scriptidx, vars, owner);
		}
		case "looks_sayforsecs": {
			return simplifyScript([
				["looks_say", block[1]],
				["control_wait", block[2]],
				["looks_say", ""]
			], scripts, scriptidx, vars, owner);
		}
		case "looks_thinkforsecs": {
			return simplifyScript([
				["looks_think", block[1]],
				["control_wait", block[2]],
				["looks_think", ""]
			], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
		}
		case "looks_changesizeby": {
			return simplifyScript([
				["looks_setsizeto", ["operator_add", ["looks_size"], block[1]]]
			], scripts, scriptidx, vars, owner);
		}
		case "motion_pointtowards": {
			if (block[1] === '_random_') {
				return simplifyScript([
					[
						"motion_pointindirection",
						["operator_round", ["operator_random", -180.0, 180.0]],
					]
				], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
		}
		case "motion_glidesecstoxy": {
			let duration = addNewTempVar(vars, TYPE_NUMBER);
			let start = addNewTempVar(vars, TYPE_NUMBER);
			let x = addNewTempVar(vars, TYPE_NUMBER);
			let y = addNewTempVar(vars, TYPE_NUMBER);
			let dx = addNewTempVar(vars, TYPE_NUMBER);
			let dy = addNewTempVar(vars, TYPE_NUMBER);
			scripts.push({owner: owner, parent: scriptidx, script:[
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
			return simplifyScript([
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
					{script:scripts.length-1}
				]

			], scripts, scriptidx, vars, owner);
		}
		case "looks_setsizeto": {
			return simplifyScript([
				["helium_setscaleto", ["operator_multiply", block[1], 0.01]]
			], scripts, scriptidx, vars, owner);
		}
		case "sound_cleareffects": {
			return simplifyScript([
				["sound_seteffectto", "PITCH", 0],
				["sound_seteffectto", "PAN", 0]
			], scripts, scriptidx, vars, owner);
		}
		case "motion_glideto": {
			//console.log(block);
			if (block[1] === "_mouse_") {
				return simplifyScript([
					["motion_glidesecstoxy", block[2], ["sensing_mousex"], ["sensing_mousey"]]
				], scripts, scriptidx, vars, owner);
			} else if (block[1] === "_random_") {
				return simplifyScript([
					[
						"motion_glidesecstoxy", 
						block[2], 
						["operator_round", ["operator_random", -0.5, 0.5], ["helium_stagewidth"]],
						["operator_round", ["operator_random", -0.5, 0.5], ["helium_stageheight"]]
					]
				], scripts, scriptidx, vars, owner);
			} else {
				return simplifyScript([
					[
						"motion_glidesecstoxy", 
						block[2], 
						["sensing_of", "x position", block[1]],
						["sensing_of", "y position", block[1]]
					]
				], scripts, scriptidx, vars, owner);
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
			], scripts, scriptidx, vars, owner);
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

			scripts.push({owner:owner, parent: scriptidx, script:[[
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
			scripts.push({owner:owner, parent: scriptidx, script:[[
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
			scripts.push({owner:owner, parent: scriptidx, script:[[
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
			scripts.push({owner:owner, parent: scriptidx, script:[[
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

			scripts.push({owner:owner, parent: scriptidx, script:[
				["data_setvariableto", nearestEdge, 2]
			]});
			scripts.push({owner:owner, parent: scriptidx, script:[
				["data_setvariableto", nearestEdge, 1]
			]});
			scripts.push({owner:owner, parent: scriptidx, script:[
				["data_setvariableto", nearestEdge, 0]
			]});
			scripts.push({owner:owner, parent: scriptidx, script:[
				["data_setvariableto", dx, ["helium_cos", ["helium_direction"]]],
				["data_setvariableto", dy, ["helium_sin", ["helium_direction"]]],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge], 0],
					{script: scripts.length-8}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge], 1],
					{script: scripts.length-7}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge], 2],
					{script: scripts.length-6}
				],
				[
					"control_if",
					["operator_equals", ["data_variable", nearestEdge], 3],
					{script: scripts.length-5}
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

			return simplifyScript([
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
					{script: scripts.length-4}
				],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist], 
						["data_variable", distTop]
					],
					{script: scripts.length-3}
				],
				[
					"control_if", 
					[
						"operator_equals", 
						["data_variable", minDist], 
						["data_variable", distLeft]
					],
					{script: scripts.length-2}
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
					{script: scripts.length-1}
				]
			], scripts, scriptidx, vars, owner);
		}
		case "music_restForBeats": {
			return simplifyScript([
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
			], scripts, scriptidx, vars, owner);
		}
		case "music_playDrumForBeats": {
			return simplifyScript([
				[
					"helium_playDrum",
					[
						"helium_wrapClamp",
						block[1],
						0, 17
					]
				],
				["music_restForBeats", block[2]]
			], scripts, scriptidx, vars, owner);
		}
		case "music_playNoteForBeats": {
			//console.log(block);
			let durationSec = addNewTempVar(vars, TYPE_NUMBER);

			scripts.push({owner: owner, parent: scriptidx, script:[
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

			return simplifyScript([
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
					{script: scripts.length - 1}
				]
			], scripts, scriptidx, vars, owner);
		}
		default:
			return [block];
	}
}

function simplifyScript(script, scripts, scriptidx, vars, owner) {
	for (let i = 0; i < script.length; i++) {
		let block = script[i];
		let simplifiedBlock = simplifyBlock(block, scripts, scriptidx, vars, owner);
		if (block !== simplifiedBlock) {
			script.splice(i, 1, ...simplifiedBlock);
		}
	}
	return script;
}
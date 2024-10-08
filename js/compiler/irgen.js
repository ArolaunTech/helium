//Convert JS to an intermediate representation.
function getScratch2ScriptBroadcasts(obj) {
	let broadcasts = new Set();
	for (let i = 0; i < obj.length; i++) {
		let block = obj[i];
		if (block[0] === "whenIReceive") {
			broadcasts.add(block[1]);
		}
	}
	return broadcasts;
}

function Scratch2toIR(obj) {
	obj.objName = "Stage";
	let hasChildren = (typeof obj.children !== 'undefined');
	//console.log(obj);

	//Variables
	let variables = [];
	let varidx = 0;
	if (typeof obj.variables !== 'undefined') {
		for (let i = 0; i < obj.variables.length; i++) {
			variables.push({
				id: varidx,
				name: obj.variables[i].name,
				value: obj.variables[i].value,
				owner: "Stage"
			});
			varidx++;
		}
	}
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.variables === 'undefined') {
				continue;
			}
			for (let j = 0; j < child.variables.length; j++) {
				variables.push({
					id: varidx,
					name: child.variables[j].name,
					value: child.variables[j].value,
					owner: child.objName
				});
				varidx++;
			}
		}
	}

	//Lists
	let lists = [];
	let listidx = 0;
	if (typeof obj.lists !== 'undefined') {
		for (let i = 0; i < obj.lists.length; i++) {
			lists.push({
				id: listidx,
				name: obj.lists[i].listName,
				value: obj.lists[i].contents,
				owner: "Stage"
			});
			listidx++;
		}
	}
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.lists === 'undefined') {
				continue;
			}
			for (let j = 0; j < child.lists.length; j++) {
				lists.push({
					id: listidx,
					name: child.lists[j].listName,
					value: child.lists[j].contents,
					owner: child.objName
				});
				listidx++;
			}
		}
	}

	//Sounds
	let sounds = [];
	if (typeof obj.sounds !== 'undefined') {
		for (let i = 0; i < obj.sounds.length; i++) {
			sounds.push({owner: "Stage", obj: {
				assetId: obj.sounds[i].md5.slice(0, obj.sounds[i].md5.lastIndexOf(".")),
				data: obj.sounds[i].data,
				dataFormat: obj.sounds[i].md5.slice(obj.sounds[i].md5.lastIndexOf(".") + 1),
				format: obj.sounds[i].format,
				md5ext: obj.sounds[i].md5,
				name: obj.sounds[i].soundName,
				rate: obj.sounds[i].rate,
				sampleCount: obj.sounds[i].sampleCount
			}});
		}
	}
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.sounds === 'undefined') {
				continue; 
			}
			for (let j = 0; j < child.sounds.length; j++) {
				sounds.push({owner: child.objName, obj:{
					assetId: child.sounds[j].md5.slice(0, child.sounds[j].md5.lastIndexOf(".")),
					data: child.sounds[j].data,
					dataFormat: child.sounds[j].md5.slice(child.sounds[j].md5.lastIndexOf(".") + 1),
					format: child.sounds[j].format,
					md5ext: child.sounds[j].md5,
					name: child.sounds[j].soundName,
					rate: child.sounds[j].rate,
					sampleCount: child.sounds[j].sampleCount
				}});
			}
		}
	}

	//Sprites
	let sprites = [{
		costume: obj.currentCostumeIndex,
		costumes: [],
		direction: undefined,
		draggable: undefined,
		isStage: true,
		layerOrder: 0,
		name: "Stage",
		rotationStyle: undefined,
		size: undefined,
		visible: undefined,
		volume: 100,
		x: undefined,
		y: undefined
	}];
	if (typeof obj.costumes !== 'undefined') {
		for (let i = 0; i < obj.costumes.length; i++) {
			sprites[0].costumes.push({
				assetId: obj.costumes[i].baseLayerMD5.slice(0, obj.costumes[i].baseLayerMD5.lastIndexOf(".")),
				bitmapResolution: obj.costumes[i].bitmapResolution,
				data: obj.costumes[i].data,
				dataFormat: obj.costumes[i].baseLayerMD5.slice(obj.costumes[i].baseLayerMD5.lastIndexOf(".") + 1),
				md5ext: obj.costumes[i].baseLayerMD5,
				name: obj.costumes[i].costumeName,
				rotationCenterX: obj.costumes[i].rotationCenterX,
				rotationCenterY: obj.costumes[i].rotationCenterY
			});

			if (sprites[0].costumes[sprites[0].costumes.length - 1].dataFormat === 'svg') {
				sprites[0].costumes[sprites[0].costumes.length - 1].data = new TextDecoder().decode(sprites[0].costumes[sprites[0].costumes.length - 1].data);
			}
		}
	}
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.objName === 'undefined') {
				continue;
			}
			sprites.push({
				costume: child.currentCostumeIndex,
				costumes: [],
				direction: child.direction,
				draggable: child.isDraggable,
				isStage: false,
				layerOrder: child.indexInLibrary,
				name: child.objName,
				rotationStyle: child.rotationStyle,
				size: 100 * child.scale,
				visible: child.visible,
				volume: 100,
				x: child.scratchX,
				y: child.scratchY
			});
			if (typeof child.costumes === 'undefined') {
				continue;
			}
			for (let j = 0; j < child.costumes.length; j++) {
				let costume = child.costumes[j];
				sprites[sprites.length - 1].costumes.push({
					assetId: costume.baseLayerMD5.slice(0, costume.baseLayerMD5.lastIndexOf(".")),
					bitmapResolution: costume.bitmapResolution,
					data: costume.data,
					dataFormat: costume.baseLayerMD5.slice(costume.baseLayerMD5.lastIndexOf(".") + 1),
					md5ext: costume.baseLayerMD5,
					name: costume.costumeName,
					rotationCenterX: costume.rotationCenterX,
					rotationCenterY: costume.rotationCenterY
				});

				if (sprites[sprites.length - 1].costumes[sprites[sprites.length - 1].costumes.length - 1].dataFormat === 'svg') {
					sprites[sprites.length - 1].costumes[sprites[sprites.length - 1].costumes.length - 1].data = new TextDecoder().decode(costume.data);
				}
			}
		}
	}

	//Scripts and Broadcasts
	let scripts = [];
	let broadcasts = new Set();
	if (typeof obj.scripts !== 'undefined') {
		for (let i = 0; i < obj.scripts.length; i++) {
			scripts.push({
				owner: "Stage",
				script: obj.scripts[i][2]
			});
			broadcasts = broadcasts.union(getScratch2ScriptBroadcasts(obj.scripts[i][2]));
		}
	}
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.scripts === 'undefined') {
				continue;
			}
			for (let j = 0; j < child.scripts.length; j++) {
				scripts.push({
					owner: child.objName, 
					script: child.scripts[j][2]
				});
				broadcasts = broadcasts.union(getScratch2ScriptBroadcasts(child.scripts[j][2]));
			}
		}
	}

	let broadcastArray = Array.from(broadcasts);
	for (let i = 0; i < broadcastArray.length; i++) {
		broadcastArray[i] = {
			id: i,
			name: broadcastArray[i]
		};
	}

	//Monitors
	let monitors = [];
	if (hasChildren) {
		for (let i = 0; i < obj.children.length; i++) {
			let child = obj.children[i];
			if (typeof child.cmd !== 'undefined') {
				let newMonitor = {};
				switch (child.cmd) {
					case "answer":
						newMonitor = {
							id: "answer",
							opcode: "sensing_answer",
							params: {},
							value: ""
						};
						break;
					case "backgroundIndex":
						newMonitor = {
							id: "backdropnumbername_number",
							opcode: "looks_backdropnumbername",
							params: {"NUMBER_NAME": "number"},
							value: 0
						};
						break;
					case "costumeIndex":
						newMonitor = {
							id: "_costumenumbername_number",
							opcode: "looks_costumenumbername",
							params: {"NUMBER_NAME": "number"},
							value: 0
						};
						break;
					case "getVar:":
						let varid = 0;
						for (let j = 0; j < variables.length; j++) {
							if (variables[j].name !== child.param) {
								continue;
							}
							if (variables[j].owner !== child.target) {
								continue;
							}
							varid = j;
							break;
						}
						newMonitor = {
							id: varid, 
							opcode: "data_variable",
							params: {VARIABLE: child.param},
							value: variables[varid].value
						};
						break;
					case "heading":
						newMonitor = {
							id: "_direction",
							opcode: "motion_direction",
							params: {},
							value: 0
						};
						break;
					case "scale":
						newMonitor = {
							id: "_size",
							opcode: "looks_size",
							params: {},
							value: 0
						};
						break;
					case "sceneName":
						newMonitor = {
							id: "backdropnumbername_name",
							opcode: "looks_backdropnumbername",
							params: {"NUMBER_NAME": "name"},
							value: 0
						};
						break;
					case "senseVideoMotion":
						newMonitor = {
							id: "helium_videomotion",
							opcode: "helium_video_videomotion",
							params: {
								TYPE: (child.param[0] === "d" ? "direction" : "motion"), 
								THING: (child.param[child.param.length - 2] === "g" ? "Stage" : child.target)
							},
							value: 0
						};
						break;
					case "soundLevel":
						newMonitor = {
							id: "loudness",
							opcode: "sensing_loudness",
							params: {},
							value: 0
						};
						break;
					case "tempo":
						newMonitor = {
							id: "music_getTempo",
							opcode: "music_getTempo",
							params: {},
							value: 60
						};
						break;
					case "timeAndDate":
						newMonitor = {
							id: "current_" + child.param.replace(" ", ""),
							opcode: "sensing_current",
							params: {CURRENTMENU: child.param.replace(" ", "").toUpperCase()},
							value: 0
						};
						break;
					case "timer":
						newMonitor = {
							id: "timer",
							opcode: "sensing_timer",
							params: {},
							value: 0
						};
						break;
					case "volume":
						newMonitor = {
							id: "_volume",
							opcode: "sound_volume",
							params: {},
							value: 0
						};
						break;
					case "xpos":
						newMonitor = {
							id: "_xposition",
							opcode: "motion_xposition",
							params: {},
							value: 0
						};
						break;
					case "ypos":
						newMonitor = {
							id: "_yposition",
							opcode: "motion_yposition",
							params: {},
							value: 0
						};
						break;
					default:
						console.error("Unrecognized monitor type: " + child.cmd);
				}
				newMonitor.spriteName = child.target;
				newMonitor.mode = ["default", "large", "slider"][child.mode-1];
				newMonitor.x = child.x;
				newMonitor.y = child.y;
				newMonitor.visible = child.visible;
				newMonitor.sliderMin = child.sliderMin;
				newMonitor.sliderMax = child.sliderMax;
				newMonitor.isDiscrete = child.isDiscrete;
				newMonitor.width = 0;
				newMonitor.height = 0;
				monitors.push(newMonitor);
			}
			if (typeof child.listName !== 'undefined') {
				let id = 0;
				for (let j = 0; j < lists.length; j++) {
					id = j;
					if (lists[j].name === child.listName) {
						break;
					}
				}
				monitors.push({
					id: id,
					mode: "list",
					opcode: "data_listcontents",
					params: {LIST: child.listName},
					spriteName: lists[id].owner,
					x: child.x,
					y: child.y,
					width: child.width,
					height: child.height,
					visible: child.visible,
					value: child.contents
				});
			}
		}
	}

	return {
		broadcasts: broadcastArray,
		lists: lists,
		monitors: monitors,
		scripts: scripts,
		sprites: sprites,
		sounds: sounds,
		variables: variables,
		v2info: obj.info
	};
}

function cleanScratch3Block(obj, owner, id) {
	let out = {
		id: id,
		owner: owner,
		fields: obj.fields,
		inputs: obj.inputs,
		next: obj.next,
		opcode: obj.opcode,
		parent: obj.parent,
		topLevel: obj.topLevel,
		warp: true,
		proccode: "",
		argDefaults: [],
		argNames: []
	};

	let inputs = [];
	for (let prop in out.inputs) {
		if (out.inputs.hasOwnProperty(prop)) {
			if (Array.isArray(out.inputs[prop][1])) {
				inputs.push({id: prop, isBlock: false, value: out.inputs[prop][1][1]});
			} else {
				inputs.push({id: prop, isBlock: true, value: out.inputs[prop][1]});
			}
		}
	}
	out.inputs = inputs;
	//console.log(out.inputs);

	let fields = [];
	for (let prop in out.fields) {
		if (out.fields.hasOwnProperty(prop)) {
			fields.push({id: prop, value: out.fields[prop][0], fieldID: out.fields[prop][1]});
		}
	}
	out.fields = fields;

	//Mutations
	if (typeof obj.mutation !== 'undefined') {
		let mutation = obj.mutation;
		if (typeof mutation.warp !== 'undefined') {
			out.warp = JSON.parse(mutation.warp);
		}
		if (typeof mutation.proccode !== 'undefined') {
			out.proccode = mutation.proccode;
		}
		if (typeof mutation.argumentdefaults !== 'undefined') {
			out.argDefaults = JSON.parse(mutation.argumentdefaults);
		}
		if (typeof mutation.argumentnames !== 'undefined') {
			out.argNames = JSON.parse(mutation.argumentnames);
		}
	}

	return out;
}

function createScratch3Block(block, blocks, blockmap) {
	//console.log(block);
	let newBlock = [block.opcode];
	for (let i = 0; i < block.fields.length; i++) {
		newBlock.push(block.fields[i].value);
	}
	for (let i = 0; i < block.inputs.length; i++) {
		if (block.inputs[i].isBlock) {
			let inputBlock = blocks[blockmap.get(block.inputs[i].value)];
			newBlock.push(createScratch3Script(inputBlock, blocks, blockmap));
		} else {
			newBlock.push(block.inputs[i].value);
		}
	}

	//Procedures
	if ((block.opcode === "procedures_call") || (block.opcode === "procedures_prototype")) {
		newBlock.push({
			warp: block.warp,
			proccode: block.proccode,
			owner: block.owner,
			argDefaults: block.argDefaults,
			argNames: block.argNames
		});
	}

	if (block.opcode === "procedures_definition") {
		if (Array.isArray(newBlock[1])) {
			newBlock = newBlock[1][0];
			newBlock[0] = "procedures_definition";
		}
	}

	//Menus
	for (let i = 1; i < newBlock.length; i++) {
		if (Array.isArray(newBlock[i])) {
			if (newBlock[i][0][0].slice(-4) === 'menu') {
				newBlock[i] = newBlock[i][0][1];
			}
		}
	}

	return newBlock;
}

function createScratch3Script(block, blocks, blockmap) {
	let script = [createScratch3Block(block, blocks, blockmap)];
	let newBlock = block;
	while (newBlock.next) {
		newBlock = blocks[blockmap.get(newBlock.next)];
		script.push(createScratch3Block(newBlock, blocks, blockmap));
	}
	return script;
}

function createScratch3Scripts(blocks) {
	//Turn blocks into scripts.
	//Generate block idx map
	let blockmap = new Map();
	for (let i = 0; i < blocks.length; i++) {
		blockmap.set(blocks[i].id, i);
	}

	let scripts = [];
	for (let i = 0; i < blocks.length; i++) {
		let block = blocks[i];
		if (block.topLevel) {
			scripts.push({
				owner: block.owner,
				script: createScratch3Script(block, blocks, blockmap)
			})
		}
	}
	return scripts;
}

function Scratch3toIR(obj) {
	//console.log(obj);
	let ir = {};

	let sprites = [];

	let variables = [];
	let lists = [];
	let broadcasts = [];
	let sounds = [];
	let blocks = [];
	for (let i = 0; i < obj.targets.length; i++) {
		let target = obj.targets[i];
		let costumes = [];
		//console.log(target);

		sprites.push({
			isStage: target.isStage,
			name: target.name,
			x: target.x,
			y: target.y,
			direction: target.direction,
			rotationStyle: target.rotationStyle,
			costume: target.currentCostume,
			draggable: target.draggable,
			layerOrder: target.layerOrder,
			size: target.size,
			visible: target.visible,
			volume: target.volume,
			costumes: []
		});

		for (let prop in target.variables) {
			if (target.variables.hasOwnProperty(prop)) {
				variables.push({
					id: prop,
					name: target.variables[prop][0],
					value: target.variables[prop][1],
					owner: target.name,
					cloud: target.variables[prop][0].charCodeAt(0) === 9729
				});
			}
		}

		for (let prop in target.lists) {
			if (target.lists.hasOwnProperty(prop)) {
				lists.push({
					id: prop,
					name: target.lists[prop][0],
					value: target.lists[prop][1],
					owner: target.name
				});
			}
		}

		for (let prop in target.broadcasts) {
			if (target.broadcasts.hasOwnProperty(prop)) {
				broadcasts.push({
					id: prop,
					name: target.broadcasts[prop]
				});
			}
		}

		for (let j in target.sounds) {
			sounds.push({owner: target.name, obj:target.sounds[j]});
		}

		for (let j in target.costumes) {
			if (target.costumes[j].dataFormat === "svg") {
				target.costumes[j].data = new TextDecoder().decode(target.costumes[j].data);
			}
			sprites[sprites.length - 1].costumes.push(target.costumes[j]);
		}

		for (let prop in target.blocks) {
			if (target.blocks.hasOwnProperty(prop)) {
				blocks.push(cleanScratch3Block(target.blocks[prop], target.name, prop));
			}
		}
	}
	
	ir.monitors = obj.monitors;
	ir.sprites = sprites;
	ir.variables = variables;
	ir.lists = lists;
	ir.broadcasts = broadcasts;
	ir.sounds = sounds;
	ir.blocks = blocks;
	ir.scripts = createScratch3Scripts(blocks);
	ir.v3info = obj.meta;
	return ir;
}

function ScratchtoIR(obj) {
	if (obj.version === 2) {
		return Scratch2toIR(obj.objs);
	} else if (obj.version === 3) {
		return Scratch3toIR(obj.objs);
	} else {
		console.error("Unrecognized version number. Version must be 2 or 3.");
	}
}
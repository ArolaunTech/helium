//Consts
const WASM_I32 = 0;
const WASM_I64 = 1;
const WASM_F32 = 2;
const WASM_F64 = 3;

//Functions
function isNumber(x) {
	return !(isNaN(x) || isNaN(parseFloat(x)));
}

//WASM IR generation. The end result has a very similar structure to wasm.
function constructWasmIR(ir) {
	console.log(ir);
	//Initialize various sections. These are similar to WASM but not quite.
	let wasmfunctions = [];
	let wasmmems = [];
	let wasmglobals = [];
	let wasmstartidx = null;
	let wasmimports = [];
	let wasmexports = [];

	//Determine variable types
	for (let i = 0; i < ir.variables.length; i++) {
		if (typeof ir.variables[i].value !== 'string') {
			continue;
		}
		if (isNumber(ir.variables[i].value)) {
			continue;
		}
		ir.variables[i].type = "string"; //The least efficient type
	}

	//Dynamic arrays
	wasmmems.push({
		idx: wasmmems.length,
		initSize: 1,
		maxSize: null,
		data: [
			0x00, 
			0x01, 
			0x0D, 0x00, 0x00, 0x00, 
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00
		]
	});

	wasmglobals.push({
		idx: wasmglobals.length,
		name: "stackidx",
		type: "i32",
		value: 1
	});

	return {
		functions: wasmfunctions,
		memories: wasmmems,
		globals: wasmglobals,
		start: wasmstartidx,
		imports: wasmimports,
		exports: wasmexports
	}
}

//Convert types
function intToBytes1(v) {
	v |= 0;
	let out = [];
	let curr = v;
	let read = true;
	while (read) {
		let byte = curr & 127;
		curr >>= 7;
		read = !(
			(curr === 0 && (byte & 64) === 0) ||
      		(curr === -1 && (byte & 64) !== 0)
      	);
		out.push(byte | (read ? 128 : 0));
	}
	return out;
}

function floatToBytes1(v) {
	const buffer = new ArrayBuffer(8);
	const bytes = new Uint8Array(buffer);
	const floats = new Float64Array(buffer);
	floats[0] = v;
	return Array.from(bytes);
}

function nameToBytes1(v) {
	return Array.from(new TextEncoder().encode(v));
}

function limitToBytes1(min, max) {
	if (!max) {
		return [0x00].concat(intToBytes1(min));
	}
	return [0x01].concat(intToBytes1(min), intToBytes1(max));
}

function valueTypeToBytes1(type) {
	return [0x7F - type];
}

function globalTypeToBytes1(type, mutable) {
	return valueTypeToBytes1(type).concat([mutable ? 1 : 0]);
}

function functionTypeToBytes1(type) {
	let inputs = type[0];
	let outputs = type[1];
	let out = [0x60].concat(intToBytes1(inputs.length));
	for (let i = 0; i < inputs.length; i++) {
		out = out.concat(valueTypeToBytes1(inputs[i]));
	}
	out = out.concat(intToBytes1(outputs.length));
	for (let i = 0; i < outputs.length; i++) {
		out = out.concat(valueTypeToBytes1(outputs[i]));
	}
	return out;
}

function typeSectionToBytes1(types) {
	let contents = intToBytes1(types.length);
	for (let i = 0; i < types.length; i++) {
		contents = contents.concat(functionTypeToBytes1(types[i]));
	}
	return [0x01].concat(intToBytes1(contents.length), contents);
}

function functionAndTypeSectionToBytes1(types) {
	let typeidxmap = new Map();
	let functiontypeidxs = [];
	let typesectiontypes = [];
	for (let i = 0; i < types.length; i++) {
		if (!typeidxmap.has(types[i])) {
			typeidxmap.set(types[i], typesectiontypes.length);
			typesectiontypes.push(types[i]);
		}
		functiontypeidxs.push(typeidxmap.get(types[i]));
	}

	let functioncontents = intToBytes1(functiontypeidxs.length);
	for (let i = 0; i < types.length; i++) {
		functioncontents = functioncontents.concat(intToBytes1(functiontypeidxs[i]));
	}
	return [
		[0x03].concat(
			intToBytes1(functioncontents.length), 
			functioncontents
		), 
		typeSectionToBytes1(typesectiontypes)
	];
}

function memorySectionToBytes1(limits) {
	let contents = intToBytes1(limits.length);
	for (let i = 0; i < limits.length; i++) {
		contents = contents.concat(limitToBytes1(limits[i][0], limits[i][1]));
	}
	return [0x05].concat(intToBytes1(contents.length), contents);
}

//Compile
function constructWasm1(ir) {
	console.log(ir);
	let bytes = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]; //Magic + version

	return new Uint8Array(bytes);
}
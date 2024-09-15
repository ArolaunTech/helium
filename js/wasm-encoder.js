//Log
function logBytesHex(arr) {
	let str = "";
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] < 16) {
			str += "0" + arr[i].toString(16) + " ";
		} else {
			str += arr[i].toString(16) + " ";
		}
	}
	console.log(str);
}

//Convert types
function intToBytes(v) {
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
	return new Uint8Array(out);
}

function floatToBytes(v) {
	const buffer = new ArrayBuffer(8);
	const bytes = new Uint8Array(buffer);
	const floats = new Float64Array(buffer);
	floats[0] = v;
	return bytes;
}

function nameToBytes(v) {
	return new TextEncoder().encode(v);
}

//Compile
function constructWasm() {
	let bytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]); //Magic + version
	return bytes;
}
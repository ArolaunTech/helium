class SoundBuffer {
	constructor(arr) {
		this.arr = arr;
	}
}

class Bitmap {
	constructor(arr) {
		this.arr = arr;
	}
}

class Reference {
	constructor(index) {
		this.index = index;
	}
}

class Color {
	constructor(r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
}

class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Rectangle {
	constructor(ox, oy, cx, cy) {
		this.ox = ox;
		this.oy = oy;
		this.cx = cx;
		this.cy = cy;
	}
}

class Form {
	constructor(width, height, depth, offset, bitmap, colors) {
		this.width = width;
		this.height = height;
		this.depth = depth;
		this.offset = offset;
		this.bitmap = bitmap;
		this.colors = colors;
	}
}

class UserFormat {
	constructor(id, version, fields) {
		this.id = id;
		this.version = version;
		this.fields = fields;
	}
}

class ArrayBufferStream {
	constructor(arr) {
		this.arr = arr;
		this.i = 0;
	}

	readUint8() {
		return this.arr[this.i++];
	}

	readUint16() {
		let ret = (this.readUint8() << 8) | this.readUint8();
		return ret;
	}

	readUint24() {
		let ret = (this.readUint8() << 16) | (this.readUint8() << 8) | this.readUint8();
		return ret;
	}

	readUint32() {
		let ret = (this.readUint8() << 24) | (this.readUint8() << 16) | (this.readUint8() << 8) | this.readUint8();
		return ret;
	}

	readFloat64() {
		let buf = new ArrayBuffer(8);
		let ret = new Float64Array(buf);
		let uint = new Uint8Array(buf);
		for (let j = 0; j < 8; j++) {
			uint[j] = this.readUint8();
		}
		return ret[0];
	}
	
	readBytes(n) {
		this.i += n;
		return this.arr.slice(this.i-n, this.i);
	}

	readObjectArrElement() {
		let id = this.readUint8();
		switch(id) {
			case 1:
				return null;
			case 2:
				return true;
			case 3:
				return false;
			case 4:
				return this.readUint32();
			case 5:
				return this.readUint16();
			case 6:
			case 7:
				let d1 = 0;
				let d2 = 1;
				let k = this.readUint16();
				for (let k2 = 0; k2 < k; k2++) {
					d1 += this.readUint8() * d2;
					d2 *= 256;
				}
				return (id==7 ? -d1 : d1);
			case 8:
				return this.readFloat64();
			case 99:
				return new Reference(this.readUint24() - 1);
			default:
				setError("what");
		}
	}
}

function setError(err) {
	console.error(err);
}

function isScratch1(arr) {
	const start = 'ScratchV';
	for (let i = 0; i < start.length; i++) {
		if (arr[i] !== start.charCodeAt(i)) {
			return false;
		}
	}
	return true;
}

function isZip(arr) {
	return (arr[0] === 0x50) && (arr[1] === 0x4b);
}

function decodeScratch1ObjectTable(arr) {
	const buffer = new ArrayBufferStream(arr.slice(10));
	const size = buffer.readUint32();

	//console.log(size);

	let decoder = new TextDecoder();
	let length = 0; let id = 0;
	let objs = [];
	let newArr = [];
	for (let obj = 0; obj < size; obj++) {
		let classname = buffer.readUint8();
		//console.log(classname);
		switch (classname) {
			//https://github.com/trumank/sb.js/blob/master/js/sb.js
			case 9:
			case 10:
			case 14:
				objs.push(decoder.decode(buffer.readBytes(buffer.readUint32())));
				break;
			case 11:
				objs.push(buffer.readBytes(buffer.readUint32()));
				break;
			case 12:
				objs.push(new SoundBuffer(buffer.readBytes(2*buffer.readUint32())));
				break;
			case 13:
				objs.push(new Bitmap(buffer.readBytes(4*buffer.readUint32())));
				break;
			case 20:
			case 21:
				newArr = [];
				length = buffer.readUint32();
				for (let j = 0; j < length; j++) {
					newArr.push(buffer.readObjectArrElement());
				}
				objs.push(newArr);
				break;
			case 24:
			case 25:
				let newMap = new Map();
				length = buffer.readUint32();
				for (let j = 0; j < length; j++) {
					newMap.set(buffer.readObjectArrElement(), buffer.readObjectArrElement());
				}
				objs.push(newArr);
				break;
			case 30:
			case 31:
				let col = buffer.readUint32();
				let newCol = new Color((col >> 22) & 255, (col >> 12) & 255, (col >> 2) & 255, 255);
				if (classname == 31) {
					newCol.a = buffer.readUint8(); 
				}
				objs.push(newCol);
				break;
			case 32:
				objs.push(new Vec2(buffer.readObjectArrElement(), buffer.readObjectArrElement()));
				break;
			case 33:
				objs.push(new Rectangle(buffer.readObjectArrElement(), buffer.readObjectArrElement(), buffer.readObjectArrElement(), buffer.readObjectArrElement()));
				break;
			case 34:
			case 35:
				let newForm = new Form(buffer.readObjectArrElement(), buffer.readObjectArrElement(), buffer.readObjectArrElement(), buffer.readObjectArrElement(), buffer.readObjectArrElement(), -1);
				if (classname == 35) {
					newForm.colors = buffer.readObjectArrElement();
				}
				objs.push(newForm);
				break;
			default:
				//User format
				let object = new UserFormat(classname, buffer.readUint8(), []);
				length = buffer.readUint8();
				for (let j = 0; j < length; j++) {
					object.fields.push(buffer.readObjectArrElement());
				}
				objs.push(object);
		}
	}

	/*

	//Reference removal
	for (let obj = 0; obj < size; obj++) {
		if (Array.isArray(objs[obj])) {
			for (let i = 0; i < objs[obj].length; i++) {
				if (objs[obj][i] instanceof Reference) {
					objs[obj][i] = objs[objs[obj][i].index];
				}
			}
		}
		if (objs[obj] instanceof Map) {
			for (const [key, value] of objs[obj].entries()) {
				if (key instanceof Reference) {
					objs[obj].set(objs[key.index], value);
					objs[obj].remove(key);
				}
				if (value instanceof Reference) {
					if (key instanceof Reference) {
						objs[obj].set(objs[key.index], objs[value.index]);
					} else {
						objs[obj].set(key, objs[value.index]);
					}
				}
			}
		}
		if (objs[obj] instanceof Vec2) {
			if (objs[obj].x instanceof Reference) {
				objs[obj].x = objs[objs[obj].x.index];
			}
			if (objs[obj].y instanceof Reference) {
				objs[obj].y = objs[objs[obj].y.index];
			}
		}
		if (objs[obj] instanceof Rectangle) {
			if (objs[obj].ox instanceof Reference) {
				objs[obj].ox = objs[objs[obj].ox.index];
			}
			if (objs[obj].oy instanceof Reference) {
				objs[obj].oy = objs[objs[obj].oy.index];
			}
			if (objs[obj].cx instanceof Reference) {
				objs[obj].cx = objs[objs[obj].cx.index];
			}
			if (objs[obj].cy instanceof Reference) {
				objs[obj].cy = objs[objs[obj].cy.index];
			}
		}
		if (objs[obj] instanceof Form) {
			if (objs[obj].width instanceof Reference) {
				objs[obj].width = objs[objs[obj].width.index];
			}
			if (objs[obj].height instanceof Reference) {
				objs[obj].height = objs[objs[obj].height.index];
			}
			if (objs[obj].depth instanceof Reference) {
				objs[obj].depth = objs[objs[obj].depth.index];
			}
			if (objs[obj].offset instanceof Reference) {
				objs[obj].offset = objs[objs[obj].offset.index];
			}
			if (objs[obj].bitmap instanceof Reference) {
				objs[obj].bitmap = objs[objs[obj].bitmap.index];
			}
			if (objs[obj].colors instanceof Reference) {
				objs[obj].colors = objs[objs[obj].colors.index];
			}
		}
		if (objs[obj] instanceof UserFormat) {
			for (let j = 0; j < objs[obj].fields.length; j++) {
				if (objs[obj].fields[j] instanceof Reference) {
					objs[obj].fields[j] = objs[objs[obj].fields[j].index];
				}
			}
		}
	}*/
	return objs;
}

async function decodeScratch1Project(arr) {
	//Thank you https://en.scratch-wiki.info/wiki/Scratch_File_Format_(1.4)/Project_File!
	//Size of infoObjects table
	const infoSize = (arr[10] << 24) + (arr[11] << 16) + (arr[12] << 8) + arr[13];
	//Decode objects
	return decodeScratch1ObjectTable(arr.slice(14 + infoSize));
}

async function decodeScratch2or3Project(arr) {
	if (isZip(arr)) {
		console.log(arr);
		const reader = new zip.ZipReader(new zip.Uint8ArrayReader(arr));
		console.log(reader);

		const entries = await reader.getEntries();
		console.log(entries);
	} else {
		const decoder = new TextDecoder();
		const obj = JSON.parse(decoder.decode(arr));

		console.log(obj);

		//Asset downloading
		if (typeof obj.objName === 'undefined') {
			//Scratch 3 project
			for (let i = 0; i < obj.targets.length; i++) {
				//console.log(obj.targets[i]);
				if (typeof obj.targets[i].sounds !== 'undefined') {
					for (let j = 0; j < obj.targets[i].sounds.length; j++) {
						obj.targets[i].sounds[j].data = new Uint8Array(await downloadAsset(obj.targets[i].sounds[j].md5ext));
					}
				}
				if (typeof obj.targets[i].costumes !== 'undefined') {
					for (let j = 0; j < obj.targets[i].costumes.length; j++) {
						obj.targets[i].costumes[j].data = new Uint8Array(await downloadAsset(obj.targets[i].costumes[j].md5ext));
					}
				}
			}
		} else {
			//Scratch 2 project
			if (typeof obj.sounds !== 'undefined') {
				for (let i = 0; i < obj.sounds.length; i++) {
					obj.sounds[i].data = new Uint8Array(await downloadAsset(obj.sounds[i].md5));
				}
			}
			if (typeof obj.costumes !== 'undefined') {
				for (let i = 0; i < obj.costumes.length; i++) {
					obj.costumes[i].data = new Uint8Array(await downloadAsset(obj.costumes[i].baseLayerMD5));
				}
			}
			if (typeof obj.children !== 'undefined') {
				for (let i = 0; i < obj.costumes.length; i++) {
					if (typeof obj.children[i].costumes !== 'undefined') {
						for (let j = 0; j < obj.children[i].costumes.length; j++) {
							obj.children[i].costumes[j].data = new Uint8Array(await downloadAsset(obj.children[i].costumes[j].baseLayerMD5));
						}
					}
					if (typeof obj.children[i].sounds !== 'undefined') {
						for (let j = 0; j < obj.children[i].sounds.length; j++) {
							obj.children[i].sounds[j].data = new Uint8Array(await downloadAsset(obj.children[i].sounds[j].md5));
						}
					}
				}
			}
			if (typeof obj.penLayerMD5 !== 'undefined') {
				obj.penLayerData = new Uint8Array(await downloadAsset(obj.penLayerMD5));
			}
		}
	}
}

async function downloadScratch(id) {
	const response = await fetch(`https://trampoline.turbowarp.org/api/projects/${id}`);
	if (response.status === 404) {
		setError("The project is unshared or does not exist.");
	}
	if (!response.ok) {
		setError(`Error fetching project: ${response.status}`);
	}
	const json = await response.json();
	const token = await json.project_token;
	let url = `https://projects.scratch.mit.edu/${id}`;
	if (token) {
		url = `https://projects.scratch.mit.edu/${id}?token=${token}`;
	}
	const dataResponse = await fetch(url);
	if (!dataResponse.ok) {
		setError(`Error fetching project data: ${dataResponse.status}`);
	}
	const data = await dataResponse.arrayBuffer();
	return data;
}

async function downloadAsset(md5) {
	const response = await fetch(`https://assets.scratch.mit.edu/internalapi/asset/${md5}/get/`);
	if (response.status === 404) {
		setError(`Error fetching asset: the asset does not exist: ${md5}`);
	}
	if (!response.ok) {
		setError(`Error fetching asset: ${md5}`);
	}
	return await response.arrayBuffer();
}

async function loadScratchProject(id) {
	const arrbuffer = await downloadScratch(id);
	const data = new Uint8Array(arrbuffer);
	console.log(id);
	if (isScratch1(data)) {
		return await decodeScratch1Project(data);
	} else {
		return await decodeScratch2or3Project(data);
	}
}

//loadScratchProject(142).then((v)=>{console.log(v);});
//loadScratchProject(593143).then((v)=>{console.log(v);});
//loadScratchProject(20011112).then((v)=>{console.log(v);});
//loadScratchProject(275747170).then((v)=>{console.log(v);});
//loadScratchProject(716149928).then((v)=>{console.log(v);});
//loadScratchProject(1046554143).then((v)=>{console.log(v);});
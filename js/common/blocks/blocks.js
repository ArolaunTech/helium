//Combines all of the maps into one
let categoryMaps = [
	heliumMap,
	operatorMap,
];

let blockMap = new Map();
for (let i = 0; i < categoryMaps.length; i++) {
	categoryMaps[i].forEach((blockFunction, opcode) => {
		blockMap.set(opcode, blockFunction);
	});
}
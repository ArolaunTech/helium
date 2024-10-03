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

//Tests
function runTests() {
	loadScratchProject(142).then(
		(v)=>{
			console.log(142);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(10010).then(
		(v)=>{
			console.log(10010);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(20011112).then(
		(v)=>{
			console.log(20011112);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(275747170).then(
		(v)=>{
			console.log(275747170);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(46871716).then(
		(v)=>{
			console.log(46871716);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(1046554143).then(
		(v)=>{
			console.log(1046554143);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(417928392).then(
		(v)=> {
			console.log(417928392);
			console.log(ScratchtoIR(v));
		}
	);
	loadScratchProject(41299510).then(
		(v)=> {
			console.log(41299510);
			console.log(ScratchtoIR(v));
		}
	);
}
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

//Download bytes as file using Blob
function saveBytes(bytes, name, fileType) {
	let blob = new Blob([bytes], {type: fileType});
	let link = document.createElement("a");
	link.href = window.URL.createObjectURL(blob);
	link.download = name;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function saveWasm(bytes, name) {
	saveBytes(bytes, name + ".wasm", "binary/wasm");
}

//Tests
function runTests() {
	let projects = [
		20011112,
		41299510,
		46871716,
		275747170,
		417928392,
		1046554143
	];
	for (let i = 0; i < projects.length; i++) {
		globalPerformanceTester.tagTime(i);
		loadScratchProject(projects[i]).then(
			(v)=>{
				console.log(projects[i], `Load time: ${globalPerformanceTester.elapsed(i)} ms`);
				globalPerformanceTester.tagTime(i);

				let ir = ScratchtoIR(v);
				console.log(projects[i], `IR gen time: ${globalPerformanceTester.elapsed(i)} ms`);
				globalPerformanceTester.tagTime(i);

				ir = optimizeIR(ir);
				console.log(projects[i], `Optimize time: ${globalPerformanceTester.elapsed(i)} ms`);
				globalPerformanceTester.tagTime(i);

				console.log(constructWasm1(constructWasmIR(ir)));
				console.log(projects[i], `WASM gen time: ${globalPerformanceTester.elapsed(i)} ms`);
				globalPerformanceTester.tagTime(i);

				console.log(constructJS(ir));
				console.log(projects[i], `JS gen time: ${globalPerformanceTester.elapsed(i)} ms`);
				globalPerformanceTester.tagTime(i);
			}
		)
	}
}
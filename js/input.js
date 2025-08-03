//Variables
var paused = false;

//Elements
const urlInput = document.getElementById("scratchurl");

const pause = document.getElementById("scratchpause");

const settings = document.getElementById("settingsicon");
const settingsDialog = document.getElementById("settingsdialog");
const closeSettings = document.getElementById("closesettingsicon");

const windowScale = document.getElementById("windowscale");
const windowScaleDisplay = document.getElementById("windowscaledisplay");
const minusZoom = document.getElementById("subtractzoom");
const plusZoom = document.getElementById("addzoom");

const uploadSB = document.getElementById("scratchfileinput");

//Functions
function updatePauseButton() {
	if (paused) {
		pause.src = "images/play.svg";
	} else {
		pause.src = "images/pause.svg";
	}
}

function togglePauseButton() {
	paused = !paused;
	updatePauseButton();
}

function openSettingsDialog() {
	settingsDialog.showModal();
}

function closeSettingsDialog() {
	settingsDialog.close();
}

function uploadFile() {
	const file = uploadSB.files[0];

	globalPerformanceTester.tagTime(0);

	file.arrayBuffer().then(v=>{
		bytes = new Uint8Array(v);
		loadFromSB(bytes).then(o=>{
			console.log(`File read time: ${globalPerformanceTester.elapsed(0)} ms`);
			globalPerformanceTester.tagTime(1);

			let ir = ScratchtoIR(o);

			console.log(`IR gen time: ${globalPerformanceTester.elapsed(1)} ms`);
			globalPerformanceTester.tagTime(0);

			console.log(simpleIRtoJS(ir));

			console.log(`JS generation time: ${globalPerformanceTester.elapsed(0)} ms`);
			globalPerformanceTester.tagTime(1);

			ir = optimizeIR(ir);

			console.log(`Optimizer time: ${globalPerformanceTester.elapsed(1)} ms`);

			
		});
	});
}

function updateWindowScale() {
	let scaleMult = Math.pow(2, windowScale.value);

	windowScaleDisplay.innerText = `${scaleMult.toFixed(2)}x`;
	document.querySelector(":root").style.setProperty('--pagewidth', `${scaleMult * 480}px`);
}

function lowerZoom() {
	windowScale.value -= 0.01;

	updateWindowScale();
}

function increaseZoom() {
	windowScale.value += 0.01;

	updateWindowScale();
}

//Events
pause.addEventListener("click", togglePauseButton);
settings.addEventListener("click", openSettingsDialog);
closeSettings.addEventListener("click", closeSettingsDialog);

windowScale.addEventListener("input", updateWindowScale);
minusZoom.addEventListener("click", lowerZoom);
plusZoom.addEventListener("click", increaseZoom);

uploadSB.addEventListener("change", uploadFile);
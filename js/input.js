//Variables
var paused = false;

//Elements
const urlInput = document.getElementById("scratchurl");

const pause = document.getElementById("scratchpause");

const settings = document.getElementById("settingsicon");
const settingsDialog = document.getElementById("settingsdialog");
const closeSettings = document.getElementById("closesettingsicon");

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
	file.arrayBuffer().then(v=>{
		bytes = new Uint8Array(v);
		loadFromSB(bytes).then(o=>{console.log(optimizeIR(ScratchtoIR(o)));});
	});
}

//Events
pause.addEventListener("click", togglePauseButton);
settings.addEventListener("click", openSettingsDialog);
closeSettings.addEventListener("click", closeSettingsDialog);

uploadSB.addEventListener("change", uploadFile);
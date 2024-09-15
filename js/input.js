//Variables
var paused = false;

//Elements
const urlInput = document.getElementById("scratchurl");

const pause = document.getElementById("scratchpause");

const settings = document.getElementById("settingsicon");
const settingsDialog = document.getElementById("settingsdialog");
const closeSettings = document.getElementById("closesettingsicon");

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

//Events
pause.addEventListener("click", togglePauseButton);
settings.addEventListener("click", openSettingsDialog);
closeSettings.addEventListener("click", closeSettingsDialog);
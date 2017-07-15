const polyfills = require("./polyfills");
const CountDownApp = require("./countdown");

/**
 * @public Initialize and launch the countdown app controller
 * @author Lucian Vuc
 */
window.onload = function () {
	var app = new CountDownApp({	
		$wrapper: document.querySelector('#wrapper'),
		$countDown: document.querySelector('#countDown'),
		$lblDisplay: document.querySelector("#lblDisplay"),
		$settingsMenu: document.querySelector("#settingsMenu"),
		$finalDateTime: document.querySelector("#finalDateTime"),
		$ongoingMsg: document.querySelector("#ongoingMsg"),
		$finalMsg: document.querySelector("#finalMsg"),
		$hideZeroTiles: document.querySelector("#hideZeroTiles"),		
		$okBtn: document.querySelector("#okBtn"),
		$resetBtn: document.querySelector("#resetBtn"),
		$infoBar: document.querySelector('#infoBar'),
		$photoBy: document.querySelector('#photoBy'),
		$photoOwner: document.querySelector('#photoOwner'),
		$photoName: document.querySelector('#photoName'),
		$status: document.querySelector("#status")
	});

	if (window.location.hash === "settings") {
		app.openSettingsMenu();
	} else {
		app.closeSettingsMenu();
	}

	if (this.onunload) {
		this.onunload = function () {
			return app.destroy();
		}
	}
	return app;
};

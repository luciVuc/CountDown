const polyfills = require("./polyfills/details");
const CountDownApp = require("./countdown");

/**
 * @public Initialize and launch the countdown app controller
 * @author Lucian Vuc
 */
window.onload = function () {
	var app = new CountDownApp({
		$wrapper: document.querySelector('#wrapper'),
		$lblDisplay: document.querySelector("#lblDisplay"),
		$settingsMenu: document.querySelector("#settingsMenu"),
		$finalDateTime: document.querySelector("#finalDateTime"),
		$ongoingMsg: document.querySelector("#ongoingMsg"),
		$finalMsg: document.querySelector("#finalMsg"),
		$hideZeroTiles: document.querySelector("#hideZeroTiles"),		
		$okBtn: document.querySelector("#okBtn"),
		$resetBtn: document.querySelector("#resetBtn"),
		$status: document.querySelector("#status")
	});

	if (this.onunload) {
		this.onunload = function () {
			return app.destroy();
		}
	}
	return app;
};

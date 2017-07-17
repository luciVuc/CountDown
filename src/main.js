const polyfills = require("./polyfills");
const CountDown = require("./countdown");

/**
 * @public Initialize and launch the countdown app controller
 * @author Lucian Vuc
 */
window.onload = function () {
	var app = new CountDown({	
		$wrapper: document.querySelector('#wrapper'),
		$backgroundImage: document.querySelector("#wrapper"),
		$countDown: document.querySelector('#countDown'),
		$countDownEventDisplay: document.querySelector("#countDownEventDisplay"),
		$countDownDateTimeDisplay: document.querySelector("#countDownDateTimeDisplay"),
		$mainMenu: document.querySelector("#mainMenu"),
		$countDownDateTime: document.querySelector("#countDownDateTime"),
		$countDownText: document.querySelector("#countDownText"),
		$endCountDownText: document.querySelector("#endCountDownText"),
		$hideZeroTiles: document.querySelector("#hideZeroTiles"),		
		$okBtn: document.querySelector("#okBtn"),
		$resetBtn: document.querySelector("#resetBtn"),
		$title: document.querySelector('#title'),
		$infoBar: document.querySelector('#infoBar'),
		$photoBy: document.querySelector('#photoBy'),
		$photoOwner: document.querySelector('#photoOwner'),
		$photoName: document.querySelector('#photoName')
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

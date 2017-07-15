const Timer = require("./components/timer");
const TimerView = require("./ui/timerview");
const ClockView = require("./ui/clockview");
const ToggleSwitch = require("./ui/widgets").ToggleSwitch;
const storage = require("./components/storage");
const backgrounds = require("../data/backgrounds");

const props = Symbol("props");
const aElements = [
	"$wrapper",
	"$countDown",
	"$lblDisplay",
	"$settingsMenu",
	"$finalDateTime",
	"$ongoingMsg",
	"$finalMsg",
	"$hideZeroTiles",
	"$okBtn",
	"$resetBtn",
	"$infoBar",
	"$photoBy",
	"$photoOwner",
	"$photoName",
	"$status"
];

/**
 * @public	Defines the Coundown App constructor.
 * @param {object} mSettings map of initial settings
 * @param {object} mSettings.view map of initial settings for the view
 * @param {object} mSettings.view.timer map of initial settings for the model
 * @returns {CountDownApp} self reference
 */
function CountDownApp(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};

	// define own event handlers
	this.okClickHandler = this.onOkClick.bind(this);
	this.resetClickHandler = this.onResetClick.bind(this);
	this.countDownStartHandler = this.onCountDownStart.bind(this);
	this.countDownStopHandler = this.onCountDownStop.bind(this);

	// initialize the model and the view
	this[props] = {};
	this[props].view = new TimerView(mSettings.view);
	this[props].clockView = new ClockView(mSettings.clockView);
	return this.init(mSettings);
}

CountDownApp.getRandomaBackgroundImage = function () {
	var iRnd = Math.floor(Math.random() * (backgrounds.length - 0) + 0);
	return backgrounds.filter(function (o, i, arr) {
		return i === iRnd;
	})[0];
};


CountDownApp.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: CountDownApp
	},

	/**
	 * @public	Initializes the UI
	 */
	init: {
		enumerable: true,
		value: function (mSettings) {
			mSettings = mSettings instanceof Object ? mSettings : {};

			// init UI
			for (var i = 0, $el; i < aElements.length; i++) {
				$el = mSettings[aElements[i]];
				this[props][aElements[i]] = $el instanceof HTMLElement ? $el : document.createElement("div");
			}

			// init toggle switch on the settings box
			this[props].oHideZeroTilesSwitch = new ToggleSwitch({
				$el: this[props].$hideZeroTiles,
				label: "Hide Zero tiles",
				name: "hideZeroTiles",
				state: 0,
				ontoggle: function (oEvent) {
					this.view.hideZeroTiles = oEvent.targetChecked;
				}.bind(this)
			});

			this.backgroundImage = null;
			this[props].$wrapper.style.backgroundImage = `url(${this.backgroundImage.source})`;
			this[props].$countDown.appendChild(this.view.render().$el);
			this[props].$infoBar.appendChild(this.clockView.render().$el);
			this._bindEvents();
			this._loadData();
			this.timer.start();
			this.clockView.clock.start();
			return this;
		}
	},

	/**
	 * @private
	 */
	_loadData: {
		value: function () {
			var data = storage.get();
			if (data !== null) {
				var date = Number.isInteger(data.final) ? new Date(data.final) : new Date();
				this.timer.final = date;
				this[props].$finalDateTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace(/\.[0-9]{3}Z/, "");
				this[props].$ongoingMsg.value = data.ongoingText;
				this[props].$finalMsg.value = data.finalText;
				this[props].$lblDisplay.innerHTML = this[props].$finalMsg.value;
				this[props].$status.innerHTML = "";
				this[props].oHideZeroTilesSwitch.state = data.hideZeroTiles ? 1 : 0;
			}
			return this;
		}
	},

	openSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$settingsMenu.open = true;
			return this;
		}
	},

	closeSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$settingsMenu.open = false;
			return this;
		}
	},

	/**
	 * @public	Resets the state of the countdown instance
	 */
	reset: {
		enumerable: true,
		value: function () {
			storage.reset();
			this._loadData();
			return this;
		}
	},

	/**
	 * @public	The Timer property
	 */
	timer: {
		enumerable: true,
		set: function (oTimer) {
			this.view.timer = oTimer;
			return this;
		},
		get: function () {
			return this.view.timer;
		}
	},

	/**
	 * @public	The TimerView property
	 */
	view: {
		enumerable: true,
		get: function () {
			return this[props].view;
		}
	},

	/**
	 * @public	The ClockView property
	 */
	clockView: {
		enumerable: true,
		get: function () {
			return this[props].clockView;
		}
	},

	/**
	 * @public	The ClockView property
	 */
	backgroundImage: {
		enumerable: true,
		set: function () {
			this[props].backgroundImage = CountDownApp.getRandomaBackgroundImage();
			return this;
		},
		get: function () {
			return this[props].backgroundImage;
		}
	},

	/**
	/**
	 * @private
	 */
	_bindEvents: {
		value: function () {
			this[props].$okBtn.addEventListener("click", this.okClickHandler);
			this[props].$resetBtn.addEventListener("click", this.resetClickHandler);
			this.timer.on("start", this.countDownStartHandler);
			this.timer.on("stop", this.countDownStopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_unbindEvents: {
		value: function () {
			this[props].$okBtn.removeEventListener("click", this.okClickHandler);
			this[props].$resetBtn.removeEventListener("click", this.resetClickHandler);
			this.timer.removeListener("start", this.countDownStartHandler);
			this.timer.removeListener("stop", this.countDownStopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	onOkClick: {
		value: function (oEvent) {
			this.timer.stop();
			this[props].$finalDateTime.value.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:\:([0-9]{2}))?/, function () {
				var args = arguments,
					now = new Date(args[1], parseInt(args[2]) - 1, args[3], args[4], args[5], args[6] || 0);
				this.timer.final = now;
			}.bind(this));
			this.timer.start();
			this[props].$settingsMenu.open = false;
			return this;
		}
	},

	/**
	 * @private
	 */
	onResetClick: {
		value: function (oEvent) {
			this.timer.stop();
			this.reset();
			return this;
		}
	},

	/**
	 * @private
	 */
	onCountDownStart: {
		value: function (oSrc) {
			this[props].$lblDisplay.innerHTML = this[props].$ongoingMsg.value;
			this[props].$status.innerHTML = `Counting down to ${new Date(oSrc.final).toLocaleString()}.`;
			storage.set({
				final: this.timer.final.getTime(),
				ongoingText: this[props].$ongoingMsg.value,
				finalText: this[props].$finalMsg.value,
				hideZeroTiles: !!this[props].oHideZeroTilesSwitch.state
			});
			return this;
		}
	},

	/**
	 * @private
	 */
	onCountDownStop: {
		value: function (oEvent) {
			this[props].$lblDisplay.innerHTML = this[props].$finalMsg.value;
			this[props].$status.innerHTML = "Done!";
			storage.reset();
			return this;
		}
	},

	/**
	 * @public	Deallocates resources used by this instance
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this._unbindEvents();
			this.okClickHandler = null;
			this.onResetClickHandler = null;
			this.countDownStartHandler = null;
			this.countDownStopHandler = null;
			this.view.destroy();
			this.timer.destroy();
			return this;
		}
	}
});

module.exports = CountDownApp;

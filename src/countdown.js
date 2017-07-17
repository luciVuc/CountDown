const Timer = require("./components/timer");
const TimerView = require("./ui/timerview");
const ClockView = require("./ui/clockview");
const ToggleSwitch = require("./ui/widgets").ToggleSwitch;
const storage = require("./components/storage");
const backgrounds = require("../data/backgrounds");

const props = Symbol("props");
const aElements = [
	"$wrapper",
	"$backgroundImage",
	"$countDown",
	"$countDownEventDisplay",
	"$countDownDateTimeDisplay",
	"$mainMenu",
	"$countDownDateTime",
	"$countDownText",
	"$endCountDownText",
	"$hideZeroTiles",
	"$title",
	"$okBtn",
	"$resetBtn",
	"$infoBar",
	"$photoBy",
	"$photoOwner",
	"$photoName"
];

/**
 * @public	Defines the Coundown App constructor.
 * @param {object} mSettings map of initial settings
 * @param {object} mSettings.view map of initial settings for the view
 * @param {object} mSettings.view.timer map of initial settings for the model
 * @returns {CountDown} self reference
 */
function CountDown(mSettings) {
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

CountDown.getRandomaBackgroundImage = function () {
	var iRnd = Math.floor(Math.random() * (backgrounds.length - 0) + 0);
	return backgrounds.filter(function (o, i, arr) {
		return i === iRnd;
	})[0];
};


CountDown.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: CountDown
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
			this[props].$countDown.appendChild(this.view.$el);
			this[props].$infoBar.appendChild(this.clockView.$el);
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
				this[props].$countDownDateTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace(/\.[0-9]{3}Z/, "");
				this[props].$countDownText.value = data.ongoingText;
				this[props].$endCountDownText.value = data.finalText;
				this[props].$countDownEventDisplay.innerHTML = this[props].$endCountDownText.value;
				this[props].$countDownDateTimeDisplay.innerHTML = "";
				this[props].oHideZeroTilesSwitch.state = data.hideZeroTiles ? 1 : 0;
			}
			return this;
		}
	},

	openSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$mainMenu.open = true;
			return this;
		}
	},

	closeSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$mainMenu.open = false;
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
			this[props].backgroundImage = CountDown.getRandomaBackgroundImage();
			this[props].$backgroundImage.style.backgroundImage = `url(${this.backgroundImage.source})`;
			// this[props].$photoBy.innerHTML = this.backgroundImage.source;
			this[props].$photoOwner.innerHTML = this.backgroundImage.author;
			this[props].$photoOwner.href = this.backgroundImage.link;
			this[props].$photoName.innerHTML = this.backgroundImage.name;
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
			this[props].$countDownDateTime.value.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:\:([0-9]{2}))?/, function () {
				var args = arguments,
					now = new Date(args[1], parseInt(args[2]) - 1, args[3], args[4], args[5], args[6] || 0);
				this.timer.final = now;
			}.bind(this));
			this.timer.start();
			this[props].$mainMenu.open = false;
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
			// this[props].$title.classList.remove("hourglass");
			// this[props].$title.classList.add("hourglass-on");
			this[props].$countDownEventDisplay.innerHTML = this[props].$countDownText.value;
			this[props].$countDownDateTimeDisplay.innerHTML = `(${new Date(oSrc.final).toLocaleString()})`;
			storage.set({
				final: this.timer.final.getTime(),
				ongoingText: this[props].$countDownText.value,
				finalText: this[props].$endCountDownText.value,
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
			// this[props].$title.classList.remove("hourglass-on");
			// this[props].$title.classList.add("hourglass");
			this[props].$countDownEventDisplay.innerHTML = this[props].$endCountDownText.value;
			this[props].$countDownDateTimeDisplay.innerHTML = storage.DEFAULTS.finalText; // "Coundown Over";
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
			this.clockView.clock.destroy();
			this.clockView.destroy()
			return this;
		}
	}
});

module.exports = CountDown;

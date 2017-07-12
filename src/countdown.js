const Timer = require("./timer");
const TimerView = require("./timerview");
const ToggleSwitch = require("./widget/toggleSwitch");
const storage = require("./storage");

const view = Symbol("view");
const $wrapper = Symbol("$wrapper");
const $lblDisplay = Symbol("$lblDisplay");
const $settingsMenu = Symbol("$settingsMenu");
const $finalDateTime = Symbol("$finalDateTime");
const $ongoingMsg = Symbol("$ongoingMsg");
const $finalMsg = Symbol("$finalMsg");
const $hideZeroTiles = Symbol("$hideZeroTiles");
const $okBtn = Symbol("$okBtn");
const $resetBtn = Symbol("$resetBtn");
const $status = Symbol("$status");
const oHideZeroTile = Symbol("oHideZeroTile");
const aElements = [
	$wrapper,
	$lblDisplay,
	$settingsMenu,
	$finalDateTime,
	$ongoingMsg,
	$finalMsg,
	$hideZeroTiles,
	$okBtn,
	$resetBtn,
	$status
];

/**
 * @public	Defines the Coundown App constructor.
 * @param {object} mSettings map of initial settings
 * @param {object} mSettings.view map of initial settings for the view
 * @param {object} mSettings.view.timer map of initial settings for the model
 * @returns {CountDownApp} self reference
 */
function CountDownApp(mSettings) {
	// define own event handlers
	this.okClickHandler = this._onOkClick.bind(this);
	this.resetClickHandler = this._onResetClick.bind(this);
	this.startHandler = this._onCountDownStart.bind(this);
	this.stopHandler = this._onCountDownStop.bind(this);

	// initialize the model and the view
	this[view] = new TimerView(mSettings);
	return this.init(mSettings);
}

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
			for (var i = 0, str; i < aElements.length; i++) {
				str = aElements[i].toString().replace("Symbol", "").replace("(", "").replace(")", "").trim();
				this[aElements[i]] = mSettings[str];
			}

			this[oHideZeroTile] = new ToggleSwitch({
				$el: this[$hideZeroTiles],
				label: "Hide Zero tiles",
				name: "hideZeroTiles",
				checked: true,
				onchange: function (oEvent) {
					this.view.hideZeroTiles = oEvent.checked;
				}.bind(this)
			});

			this[$wrapper].appendChild(this.view.render().$el);
			this._bindEvents();
			this._loadData();
			this.timer.start();
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
				this[$finalDateTime].value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace(/\.[0-9]{3}Z/, "");
				this[$ongoingMsg].value = data.ongoingText;
				this[$finalMsg].value = data.finalText;
				this[$lblDisplay].innerHTML = this[$finalMsg].value;
				this[$status].innerHTML = "";
				this[oHideZeroTile].checked = data.hideZeroTiles;
			}
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
			return this[view];
		}
	},

	/**
	 * @private
	 */
	_bindEvents: {
		value: function () {
			this[$okBtn].addEventListener("click", this.okClickHandler);
			this[$resetBtn].addEventListener("click", this.resetClickHandler);
			this.timer.on("start", this.startHandler);
			this.timer.on("stop", this.stopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_unbindEvents: {
		value: function () {
			this[$okBtn].removeEventListener("click", this.okClickHandler);
			this[$resetBtn].removeEventListener("click", this.resetClickHandler);
			this.timer.removeListener("start", this.startHandler);
			this.timer.removeListener("stop", this.stopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_onOkClick: {
		value: function (oEvent) {
			this.timer.stop();
			this[$finalDateTime].value.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:\:([0-9]{2}))?/, function () {
				var args = arguments,
					now = new Date(args[1], parseInt(args[2]) - 1, args[3], args[4], args[5], args[6] || 0);
				this.timer.final = now;
			}.bind(this));
			this.timer.start();
			this[$settingsMenu].open = false;
			return this;
		}
	},

	/**
	 * @private
	 */
	_onResetClick: {
		value: function (oEvent) {
			this.timer.stop();
			this.reset();
			return this;
		}
	},

	/**
	 * @private
	 */
	_onCountDownStart: {
		value: function (oSrc) {
			this[$lblDisplay].innerHTML = this[$ongoingMsg].value;
			this[$status].innerHTML = `Counting down to ${new Date(oSrc.final).toLocaleString()}.`;
			storage.set({
				final: this.timer.final.getTime(),
				ongoingText: this[$ongoingMsg].value,
				finalText: this[$finalMsg].value
			});
			return this;
		}
	},

	/**
	 * @private
	 */
	_onCountDownStop: {
		value: function (oEvent) {
			this[$lblDisplay].innerHTML = this[$finalMsg].value;
			this[$status].innerHTML = "Done!";
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
			this.resetClickHandler = null;
			this.startHandler = null;
			this.stopHandler = null;
			this.view.destroy();
			this.timer.destroy();
			return this;
		}
	}
});

module.exports = CountDownApp;

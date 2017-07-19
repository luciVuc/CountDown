const EventEmitter = require("events");
const Timer = require("../components/timer");
const ProgressDonut = require("./progress-circle");

const _ = Symbol("_");

/**
 * @public	Tile visualization for a Timer object
 * 
 * @param {object} mSettings map of initial settings
 * @param {Timer} mSettings.timer the timer object to visualize
 * @returns self reference
 */
function TimerView(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};
	EventEmitter.apply(this, arguments);
	this[_] = {};
	this[_].$el = null;
	this[_].$daysTile = null;
	this[_].$minsTile = null;
	this[_].$hoursTile = null;
	this[_].$secsTile = null;
	this.timer = mSettings.timer instanceof Timer ? mSettings.timer : new Timer();
	this._updateHandler = this.update.bind(this);
	this._startHandler = this.start.bind(this);
	this.timer.on("start", this._startHandler);
	this.timer.on("update", this._updateHandler);
	this.timer.on("stop", this._updateHandler);
	this.timer.on("ready", this._updateHandler);
	this[_].supportsCanvas = HTMLCanvasElement && CanvasRenderingContext2D ? true : false;
	this[_].hideZeroTiles = mSettings.hideZeroTiles === true ? true : false;
	return this;
}

TimerView.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		enumerable: true,
		value: TimerView
	},

	/**
	 * @public	property
	 */
	$el: {
		enumerable: true,
		get: function () {
			if (!(this[_].$el instanceof HTMLElement)) {
				this.render();
			}
			return this[_].$el;
		}
	},

	/**
	 * @public	property
	 */
	$daysTile: {
		enumerable: true,
		get: function () {
			return this[_].$daysTile;
		}
	},

	/**
	 * @public	property
	 */
	$minsTile: {
		enumerable: true,
		get: function () {
			return this[_].$minsTile;
		}
	},

	/**
	 * @public	property
	 */
	$hoursTile: {
		enumerable: true,
		get: function () {
			return this[_].$hoursTile;
		}
	},

	/**
	 * @public	property
	 */
	$secsTile: {
		enumerable: true,
		get: function () {
			return this[_].$secsTile;
		}
	},

	/**
	 * @public
	 */
	supportsCanvas: {
		enumerable: true,
		get: function () {
			return this[_].supportsCanvas;
		}
	},

	/**
	 * @public
	 */
	hideZeroTiles: {
		enumerable: true,
		set: function (bValue) {
			this[_].hideZeroTiles = bValue === true ? true : false;
			return this.update();
		},
		get: function () {
			return this[_].hideZeroTiles;
		}
	},

	/**
	 * @public	property
	 */
	timer: {
		enumerable: true,
		set: function (oTimer) {
			if (oTimer instanceof Timer) {
				this[_].timer = oTimer;
			}
			return this;
		},
		get: function () {
			return this[_].timer;
		}
	},

	/**
	 * @public	Starts the countdown timer
	 */
	start: {
		enumerable: true,
		value: function () {
			if (!(this.$el instanceof HTMLElement)) {
				this.render();
			}
			if (this.supportsCanvas) {
				this._oDaysDonut.max = Math.floor(this.timer.getDiffTime() / 1000 / 60 / 60 / 24);
				this._oHrsDonut.max = 24;
				this._oMinsDonut.max = 60;
				this._oSecsDonut.max = 60;
			}
			return this.update();
		}
	},

	/**
	 * @public	Updates the state of its countdown Timer instance
	 */
	update: {
		enumerable: true,
		value: function () {
			if (!(this.$el instanceof HTMLElement)) {
				this.render();
			}
			if (this.supportsCanvas) {
				this._oDaysDonut.value = this.timer.daysLeft;
				this._oHrsDonut.value = this.timer.hoursLeft;
				this._oMinsDonut.value = this.timer.minutesLeft;
				this._oSecsDonut.value = this.timer.secondsLeft;
			} else {
				this.$daysTile.innerHTML = this.timer.daysLeft;
				this.$minsTile.innerHTML = this.timer.hoursLeft;
				this.$hoursTile.innerHTML = this.timer.minutesLeft;
				this.$secsTile.innerHTML = this.timer.secondsLeft;
			}

			this.$daysTile.parentElement.style.display = "";
			this.$hoursTile.parentElement.style.display = "";
			this.$minsTile.parentElement.style.display = "";
			if (this.hideZeroTiles) {
				if (this.timer.daysLeft === 0) {
					this.$daysTile.parentElement.style.display = "none";
					if (this.timer.hoursLeft === 0) {
						this.$hoursTile.parentElement.style.display = "none";
						if (this.timer.minutesLeft === 0) {
							this.$minsTile.parentElement.style.display = "none";
						}
					}
				}
			}
			return this;
		}
	},

	/**
	 * @public	Renders the state of the its countdown Timer instance in HTML format
	 */
	render: {
		enumerable: true,
		value: function () {
			var el = document.createElement("div");

			el.innerHTML = this.supportsCanvas ? `<div class="timerDisplay">
				<div class="tile"><canvas class="days" width="100" height="100"></canvas><p>DAYS</p></div>
				<div class="tile"><canvas class="hours" width="100" height="100"></canvas><p>HOURS</p></div>
				<div class="tile"><canvas class="mins" width="100" height="100"></canvas><p>MINS</p></div>
				<div class="tile"><canvas class="secs" width="100" height="100"></canvas><p>SECS</p></div>
			</div>` : `<div class="timerDisplay">
				<div class="tile"><h1 class="days"></h1><p>DAYS</p></div>
				<div class="tile"><h1 class="hours"></h1><p>HOURS</p></div>
				<div class="tile"><h1 class="mins"></h1><p>MINS</p></div>
				<div class="tile"><h1 class="secs"></h1><p>SECS</p></div>
			</div>`;

			this[_].$el = el.querySelector(".timerDisplay");
			el = el.removeChild(this.$el);
			this[_].$daysTile = el.querySelector(".days");
			this[_].$hoursTile = el.querySelector(".hours");
			this[_].$minsTile = el.querySelector(".mins");
			this[_].$secsTile = el.querySelector(".secs");

			if (this.supportsCanvas) {
				this._oDaysDonut = new ProgressDonut({ $canvas: this.$daysTile, max: this.timer.daysLeft, value: 0, bgFill: "white", lineFill: "red", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oHrsDonut = new ProgressDonut({ $canvas: this.$hoursTile, max: this.timer.hoursLeft, value: 0, bgFill: "white", lineFill: "green", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oMinsDonut = new ProgressDonut({ $canvas: this.$minsTile, max: this.timer.minutesLeft, value: 0, bgFill: "white", lineFill: "blue", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oSecsDonut = new ProgressDonut({ $canvas: this.$secsTile, max: this.timer.secondsLeft, value: 0, bgFill: "white", lineFill: "orange", backLineFill: "#dddddd", valueColor: "#777777" });
			}
			return this;
		}
	},

	/**
	 * @public	De-allocates the resources used by this instance
	 */
	destroy: {
		enumerable: true,
		value: function () {
			if (this.supportsCanvas) {
				this._oDaysDonut.destroy();
				this._oHrsDonut.destroy();
				this._oMinsDonut.destroy();
				this._oSecsDonut.destroy();
				this._oDaysDonut = this._oHrsDonut = this._oMinsDonut = this._oSecsDonut = null;
			}

			this.timer.removeAllListeners("start");
			this.timer.removeAllListeners("update");
			this.timer.removeAllListeners("stop");
			this.timer.removeAllListeners("ready");
			this._updateHandler = null;
			return this;
		}
	}
});

module.exports = TimerView;

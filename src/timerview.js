const Timer = require("./timer");
const ProgressDonut = require("./progress-donut");

const $el = Symbol("$el");
const $daysEl = Symbol("$daysEl");
const $minsEl = Symbol("$minsEl");
const $hrsEl = Symbol("$hrsEl");
const $secsEl = Symbol("$secsEl");
const timer = Symbol("timer");
const supportsCanvas = Symbol("supportsCanvas");

/**
 * @public	Tile visualization for a Timer object
 * 
 * @param {object} mSettings map of initial settings
 * @param {Timer} mSettings.timer the timer object to visualize
 * @returns self reference
 */
function TimerView(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};
	this[$el] = null;
	this[$daysEl] = null;
	this[$minsEl] = null;
	this[$hrsEl] = null;
	this[$secsEl] = null;
	this.timer = mSettings.timer instanceof Timer ? mSettings.timer : new Timer();
	this._updateHandler = this.update.bind(this);
	this._startHandler = this.start.bind(this);
	this.timer.on("start", this._startHandler);
	this.timer.on("update", this._updateHandler);
	this.timer.on("stop", this._updateHandler);
	this.timer.on("ready", this._updateHandler);
	this[supportsCanvas] = HTMLCanvasElement && CanvasRenderingContext2D ? true : false;
	return this;
}

TimerView.prototype = Object.create(Object.prototype, {
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
			return this[$el];
		}
	},

	/**
	 * @public	property
	 */
	$daysEl: {
		enumerable: true,
		get: function () {
			return this[$daysEl];
		}
	},

	/**
	 * @public	property
	 */
	$minsEl: {
		enumerable: true,
		get: function () {
			return this[$minsEl];
		}
	},

	/**
	 * @public	property
	 */
	$hrsEl: {
		enumerable: true,
		get: function () {
			return this[$hrsEl];
		}
	},

	/**
	 * @public	property
	 */
	$secsEl: {
		enumerable: true,
		get: function () {
			return this[$secsEl];
		}
	},

	/**
	 * @public
	 */
	supportsCanvas: {
		enumerable: true,
		get: function () {
			return this[supportsCanvas];
		}
	},

	/**
	 * @public	property
	 */
	timer: {
		enumerable: true,
		set: function (oTimer) {
			if (oTimer instanceof Timer) {
				this[timer] = oTimer;
			}
			return this;
		},
		get: function () {
			return this[timer];
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
				this.$daysEl.innerHTML = this.timer.daysLeft;
				this.$minsEl.innerHTML = this.timer.hoursLeft;
				this.$hrsEl.innerHTML = this.timer.minutesLeft;
				this.$secsEl.innerHTML = this.timer.secondsLeft;
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

			this[$el] = el.querySelector(".timerDisplay");
			el = el.removeChild(this.$el);
			this[$daysEl] = el.querySelector(".days");
			this[$hrsEl] = el.querySelector(".hours");
			this[$minsEl] = el.querySelector(".mins");
			this[$secsEl] = el.querySelector(".secs");

			if (this.supportsCanvas) {
				this._oDaysDonut = new ProgressDonut({ $canvas: this.$daysEl, max: this.timer.daysLeft, value: 0, backgroundColor: "white", color: "red", textColor: "#555555" });
				this._oHrsDonut = new ProgressDonut({ $canvas: this.$hrsEl, max: this.timer.hoursLeft, value: 0, backgroundColor: "white", color: "green", textColor: "#555555" });
				this._oMinsDonut = new ProgressDonut({ $canvas: this.$minsEl, max: this.timer.minutesLeft, value: 0, backgroundColor: "white", color: "blue", textColor: "#555555" });
				this._oSecsDonut = new ProgressDonut({ $canvas: this.$secsEl, max: this.timer.secondsLeft, value: 0, backgroundColor: "white", color: "orange", textColor: "#555555" });
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

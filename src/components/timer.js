const EventEmitter = require("events");

const _ = Symbol("_");

/**
 * @public	Timer object
 * 
 * @param {object}	mSettings	a map of settings
 * @param {Date}	mSettings.finalDateTime	final date time as Date object 
 * @param {function} mSettings.onstart start callback function 
 * @param {function} mSettings.onupdate update callback function 
 * @param {function} mSettings.onstop stop callback function 
 * @param {function} mSettings.onready ready callback function
 * @returns self reference
 */
function Timer(mSettings) {
	EventEmitter.apply(this, arguments);
	mSettings = mSettings instanceof Object ? mSettings : {};
	// this.final = Number.isInteger(mSettings.finalTime) ? mSettings.finalTime : Date.now() + 10;
	this[_] = {};
	this.final = mSettings.finalDateTime instanceof Date ? mSettings.finalDateTime : new Date();
	this[_].daysLeft = 0;
	this[_].hoursLeft = 0;
	this[_].minutesLeft = 0;
	this[_].secondsLeft = 0;
	this[_].onupdate = mSettings.onupdate || null;
	this[_].onstart = mSettings.onstart || null;
	this[_].onstop = mSettings.onstop || null;
	this[_].onready = mSettings.onready || null;
	this[_].tickInterval = null;
	return this;
}

Timer.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		enumerable: true,
		value: Timer
	},

	/**
	 * @public	property
	 */
	final: {
		enumerable: true,
		set: function (oDate) {
			if (oDate instanceof Date && oDate.getTime() >= Date.now()) {
				this[_].final = oDate;
			}
			return this;
		},
		get: function () {
			return this[_].final;
		}
	},

	/**
	 * @public	property
	 */
	daysLeft: {
		enumerable: true,
		get: function () {
			return this[_].daysLeft;
		}
	},

	/**
	 * @public	property
	 */
	hoursLeft: {
		enumerable: true,
		get: function () {
			return this[_].hoursLeft;
		}
	},

	/**
	 * @public	property
	 */
	minutesLeft: {
		enumerable: true,
		get: function () {
			return this[_].minutesLeft;
		}
	},

	/**
	 * @public	property
	 */
	secondsLeft: {
		enumerable: true,
		get: function () {
			return this[_].secondsLeft;
		}
	},

	/**
	 * @public	property
	 */
	onupdate: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[_].onupdate = fn;
			}
			return this;
		},
		get: function () {
			return this[_].onupdate;
		}
	},

	/**
	 * @public	property
	 */
	onstart: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[_].onstart = fn;
			}
		},
		get: function () {
			return this[_].onstart;
		}
	},

	/**
	 * @public	property
	 */
	onstop: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[_].onstop = fn;
			}
		},
		get: function () {
			return this[_].onstop;
		}
	},

	/**
	 * @public	property
	 */
	onready: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[_].onready = fn;
			}
		},
		get: function () {
			return this[_].onready;
		}
	},

	/**
	 * @public	
	 * @returns {integer}	the difference between the current date-time and the final date-time, in miliseconds.
	 */
	getDiffTime: {
		enumerable: true,
		value: function () {
			return Math.abs(this.final.getTime() - Date.now());
		}
	},

	/**
	 * @public	
	 */
	update: {
		enumerable: true,
		value: function () {
			// Get todays date and time
			var now = new Date().getTime();
			// Find the diference between now an the count down date
			var diff = this.final.getTime() - Date.now();

			if (diff > 0) {
				// re-calculate the days, hours, minutes and seconds left
				this[_].daysLeft = Math.floor(diff / 1000 / 60 / 60 / 24);
				this[_].hoursLeft = Math.floor(diff / 1000 / 60 / 60 % 24);
				this[_].minutesLeft = Math.floor(diff / 1000 / 60 % 60);
				this[_].secondsLeft = Math.floor(diff / 1000 % 60);
				this.emit("update", this);
				if (typeof this.onupdate === "function") {
					this.onupdate(this);
				}
			} else if (diff === 0) {
				this.emit("ready", this);
				if (typeof this.onready === "function") {
					this.onready(this);
				}
				this.stop();
			} else {
				this.stop();
			}
			return this;
		}
	},

	/**
	 * @public	
	 */
	start: {
		enumerable: true,
		value: function () {
			if (this.final.getTime() > Date.now()) {
				// start updating the count down every 1 second
				this[_].tickInterval = setInterval(this.update.bind(this), 250);
			} else {
				this.update();
			}
			this.emit("start", this);
			if (typeof this.onstart === "function") {
				this.onstart(this);
			}
			return this;
		}
	},

	/**
	 * @public	
	 */
	stop: {
		enumerable: true,
		value: function () {
			clearInterval(this[_].tickInterval);
			this[_].tickInterval = null;
			// this.update();
			this.emit("stop", this);
			if (typeof this.onstop === "function") {
				this.onstop(this);
			}
		}
	},

	/**
	 * @public	
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this[_].final = null;
			this.removeAllListeners("start");
			this.removeAllListeners("stop");
			this.removeAllListeners("update");
			this.removeAllListeners("ready");
			this.stop();
			return this;
		}
	}
});

module.exports = Timer;

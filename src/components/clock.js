const EventEmitter = require("events");

const _ = Symbol("_");

/**
 * @public Clock
 * 
 * @param {object} mSettings 
 * @param {Date} mSettings.date
 * @param {Intl.DateTimeFormat} mSettings.DateTimeFormat
 * @param {function} mSettings.onstart 
 * @param {function} mSettings.onupdate
 * @returns {Clock} self reference
 */
function Clock(mSettings) {
  mSettings = typeof mSettings === "object" ? mSettings : {};
  EventEmitter.apply(this, arguments);
  this[_] = {};
  this[_].onupdate = typeof mSettings.onupdate === "function" ? mSettings.onupdate : null;
  this[_].onstart = typeof mSettings.onstart === "function" ? mSettings.onstart : null;
	this[_].tickInterval = null;
  this.date = mSettings.date instanceof Date ? mSettings.date : new Date();
  this.dateTimeFormat = mSettings.dateTimeFormat instanceof Intl.DateTimeFormat ? mSettings.dateTimeFormat : new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });
  return this;
}

/**
 * @public Returns the number of minutes of a date
 * @param {Date} oDate
 * @returns {integer} Minutes
 */
Clock.getMinutes = function (oDate) {
  if (oDate instanceof Date) {
    return Math.floor(oDate.valueOf() / 1000 / 60);
  }
  throw new Error("Invalid argument: Argument must be a Date");
};

Clock.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
    enumerable: true,
    value: Clock
  },

	/**
	 * @public	property
	 */
  date: {
    enumerable: true,
    set: function (oDate) {
      if (oDate instanceof Date) {
        this[_].date = oDate;
      }
      return this;
    },
    get: function () {
      return this[_].date;
    }
  },

	/**
	 * @public	property
	 */
  dateTimeFormat: {
    enumerable: true,
    set: function (oArg) {
      if (oArg instanceof Intl.DateTimeFormat) {
        this[_].dateTimeFormat = oArg;
      }
      return this;
    },
    get: function () {
      return this[_].dateTimeFormat;
    }
  },

  currentTime: {
    enumerable: true,
    get: function () {
      return this.dateTimeFormat.format(this.date);
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

  formattedTime: {
    enumerable: true,
    get: function () {
      const time = this.currentTime;
      return time.replace(' AM', '').replace(' PM', '');
    }
  },

  formattedTimePeriod: {
    enumerable: true,
    get: function () {
      const time = this.currentTime;
      if (time.toUpperCase().indexOf(' AM') > -1) {
        return 'AM';
      }
      if (time.toUpperCase().indexOf(' PM') > -1) {
        return 'PM';
      }
      return '';
    }
  },

  /**
   * @public
   */
  update: {
    enumerable: true,
    value: function () {
      const now = new Date();
      if (Clock.getMinutes(this.date) !== Clock.getMinutes(now)) {
        this.date = now;
        this.emit("update", this);
				if (typeof this.onupdate === "function") {
					this.onupdate(this);
				}
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
      this[_].tickInterval = window.setInterval(this.update.bind(this), 2000);
			this.emit("start", this);
			if (typeof this.onstart === "function") {
				this.onstart(this);
        this.emit("start", this);
        if (typeof this.onstart === "function") {
          this.onstart(this);
        }
			}
			return this;
    }
	},

	/**
	 * @public	
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this[_].date = null;
			this[_].dateTimeFormat = null;
			this.removeAllListeners("start");
			this.removeAllListeners("update");
      clearInterval(this[_].tickInterval);
      this[_].tickInterval = null;
			return this;
		}
  }
});

module.exports = Clock;
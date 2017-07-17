const EventEmitter = require("events");

const props = Symbol("props");

const tickInterval = Symbol("tickInterval");
const onupdate = Symbol("onupdate");
const onstart = Symbol("onstart");
const onstop = Symbol("onstop");
const onready = Symbol("onready");


function Clock(mSettings) {
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[props] = {};
  EventEmitter.apply(this, arguments);
  this[props].onupdate = typeof mSettings.onupdate === "function" ? mSettings.onupdate : null;
  this[props].onstart = typeof mSettings.onstart === "function" ? mSettings.onstart : null;
	this[props].tickInterval = null;
  this.date = mSettings.date instanceof Date ? mSettings.date : new Date();
  this.dateTimeFormat = mSettings.dateTimeFormat instanceof Intl.DateTimeFormat ? mSettings.dateTimeFormat : new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });
  return this;
}

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

  date: {
    enumerable: true,
    set: function (oDate) {
      if (oDate instanceof Date) {
        this[props].date = oDate;
      }
      return this;
    },
    get: function () {
      return this[props].date;
    }
  },

  dateTimeFormat: {
    enumerable: true,
    set: function (oArg) {
      if (oArg instanceof Intl.DateTimeFormat) {
        this[props].dateTimeFormat = oArg;
      }
      return this;
    },
    get: function () {
      return this[props].dateTimeFormat;
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
				this[props].onupdate = fn;
			}
			return this;
		},
		get: function () {
			return this[props].onupdate;
		}
	},

	/**
	 * @public	property
	 */
	onstart: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[props].onstart = fn;
			}
		},
		get: function () {
			return this[props].onstart;
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

  start: {
    enumerable: true,
    value: function () {
      this[props].tickInterval = window.setInterval(this.update.bind(this), 2000);
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
			this[props].date = null;
			this[props].dateTimeFormat = null;
			this.removeAllListeners("start");
			this.removeAllListeners("update");
      clearInterval(this[props].tickInterval);
      this[props].tickInterval = null;
			return this;
		}
  }
});

module.exports = Clock;
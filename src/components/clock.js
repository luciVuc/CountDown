const EventEmitter = require("events");
const ClockState = require("./clockState");

const props = Symbol("props");

function Clock (mSettings) {
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[props] = {};
  EventEmitter.apply(this, arguments);
  this.dateTimeFormat = mSettings.dateTimeFormat instanceof Intl.DateTimeFormat ? mSettings.dateTimeFormat : new Intl.DateTimeFormat([], {hour: '2-digit', minute: '2-digit'});
  this.state = Clock.getClockState(new Date(), this.dateTimeFormat);
  return this;
}

Clock.getClockState = function (oDate, oDateTimeFormat) {
  if (oDate instanceof Date && oDateTimeFormat instanceof Intl.DateTimeFormat) {
    return new ClockState({
      date: oDate,
      dateTimeFormat: oDateTimeFormat
    });
  }
  return null;
};

Clock.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
    enumerable: true,
    value: Clock
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

  state: {
    enumerable: true,
    set: function (oArg) {
      if (oArg instanceof ClockState) {
        this[props].state = oArg;
      }
      return this;
    },
    get: function () {
      return this[props].state;
    }
  },

  formattedTime: {
    enumerable: true,
    get: function () {
      const time = this.state.currentTime;
      return time.replace(' AM', '').replace(' PM', '');
    }
  },

  formattedTimePeriod: {
    enumerable: true,
    get: function () {
      const time = this.state.currentTime;
      if (time.toUpperCase().indexOf(' AM') > -1) {
        return 'AM';
      }
      if (time.toUpperCase().indexOf(' PM') > -1) {
        return 'PM';
      }
      return '';
    }
  },

  getMinutes: {
    enumerable: true,
    value: function (oDate) {
      if (oDate instanceof Date) {
        return Math.floor(oDate.valueOf() / 1000 / 60);
      }
      throw new Error("Invalid argument: Argument must be a Date");
    }
  },

  maybeUpdateClock: {
    enumerable: true,
    value: function () {
      const now = new Date();
      if (this.getMinutes(this.state.date) !== this.getMinutes(now)) {
        this.state = Clock.getClockState(now, this.dateTimeFormat);
      }
    }
  },

  start: {
    enumerable: true,
    value: function () {
      window.setInterval(this.maybeUpdateClock.bind(this), 2000);
    }
  }

});

module.exports = Clock;
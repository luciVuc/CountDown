const props = Symbol("props");

function ClockState (mSettings) {
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[props] = {};
  this.date = mSettings.date instanceof Date ? mSettings.date : new Date();
  this.dateTimeFormat = mSettings.dateTimeFormat instanceof Intl.DateTimeFormat ? mSettings.dateTimeFormat : new Intl.DateTimeFormat([], {hour: '2-digit', minute: '2-digit'});
  return this;
}
ClockState.prototype = Object.create(Object.prototype, {
  constructor: {
    enumerable: true,
    value: ClockState
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
  }
});

module.exports = ClockState;
const EventEmitter = require("events");
const Clock = require("../components/clock");

const props = Symbol("props");

function ClockView (mSettings) {
  EventEmitter.apply(this, arguments);
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[props] = {};
  this[props].$el = null;
  this.clock = mSettings.clock instanceof Clock ? mSettings.clock : new Clock();
  return this;
}

ClockView.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
    enumerable: true,
    value: ClockView
  },

  clock: {
    enumerable: true,
    set: function (oArg) {
      if (oArg instanceof Clock) {
        this[props].clock = oArg;
        this.render();
      }
      return this;
    },
    get: function () {
      return this[props].clock;
    }
  },

  /**
	 * @public	property
	 */
	$el: {
		enumerable: true,
		get: function () {
			return this[props].$el;
		}
	},

  render: {
    enumerable: true,
    value: function () {
      var el = document.createElement("div");

			el.innerHTML = `<div class="clock">
        <span class="time">${this.clock.formattedTime}</span><span class="timePeriod">${this.clock.formattedTimePeriod}</span>
      </div>`;
			this[props].$el = el.querySelector(".clock");
			el.removeChild(this.$el);
			return this;
    }
  }
});

module.exports = ClockView;
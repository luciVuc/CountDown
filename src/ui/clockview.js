const EventEmitter = require("events");
const Clock = require("../components/clock");

const _ = Symbol("_");

function ClockView (mSettings) {
  EventEmitter.apply(this, arguments);
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[_] = {};
  this[_].$el = null;
	this.onUpdate = this.update.bind(this);
	this.onStart = this.start.bind(this);
  this.clock = mSettings.clock instanceof Clock ? mSettings.clock : new Clock();
	this.clock.on("start", this.onStart);
	this.clock.on("update", this.onUpdate);
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
        this[_].clock = oArg;
        this.render();
      }
      return this;
    },
    get: function () {
      return this[_].clock;
    }
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
	 * @public	Starts the clock
	 */
	start: {
		enumerable: true,
		value: function () {
			if (!(this.$el instanceof HTMLElement)) {
				this.render();
			}
			return this.update();
		}
	},

	/**
	 * @public	Updates the state of its Clock instance
	 */
	update: {
		enumerable: true,
		value: function () {
			if (!(this.$el instanceof HTMLElement)) {
				this.render();
			}
      this[_].$time.innerHTML = this.clock.formattedTime;
      this[_].$timePeriod.innerHTML = this.clock.formattedTimePeriod;
			return this;
		}
	},

  render: {
    enumerable: true,
    value: function () {
      var el = document.createElement("div");

			el.innerHTML = `<div class="clock">
        <span class="time">${this.clock.formattedTime}</span><span class="timePeriod">${this.clock.formattedTimePeriod}</span>
      </div>`;
			this[_].$el = el.querySelector(".clock");
			el = el.removeChild(this.$el);
			this[_].$time = el.querySelector(".time");
			this[_].$timePeriod = el.querySelector(".timePeriod");
			return this;
    }
	},

	/**
	 * @public	De-allocates the resources used by this instance
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this.clock.removeAllListeners("start");
      this.clock.removeAllListeners("update");
      this[_].clock = null;
      this[_] = null;
      this.onUpdate = null;
      this.onStart = null;
			return this;
		}
  }
});

module.exports = ClockView;

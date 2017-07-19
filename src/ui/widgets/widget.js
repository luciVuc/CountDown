const EventEmitter = require("events");

const _ = Symbol("_");

/**
 * Widget
 * Base JS class for wrapping HTML elements styled with CSS3.
 */
function Widget (mSettings) {
	EventEmitter.apply(this, arguments);
	this[_] = {};
	this.init(mSettings);
	this.render();
  return this;
}

Widget.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
		enumerable: true,
    value: Widget
  },

	init: {
		enumerable: true,
		value: function (mSettings) {
			mSettings = mSettings instanceof Object ? mSettings : {};			
			this[_].$el = mSettings.$el instanceof HTMLElement ? mSettings.$el : document.createElement("div");
			this[_].id = this.$el.id || mSettings.id || "__CSS3Widget" + Date.now();
			return this;
		}
	},

	id: {
		enumerable: true,
		get: function () {
			return this[_].id;
		}
	},  

	$el: {
		enumerable: true,
		set: function ($El) {
			if ($El instanceof HTMLElement) {
				this[_].$el = $El;
			}
			return this;
		},
		get: function () {
			return this[_].$el;
		}
	},

  getElementTemplate: {
		enumerable: true,
    value: function () {
      return `<div id="${this.id}-inner" class="widget-inner"></div>`;
    }
  },

	preRender: {
		enumerable: true,
		value: function () {
			return this;
		}
	},

	postRender: {
		enumerable: true,
		value: function () {
			return this;
		}
	},

  render: {
		enumerable: true,
    value: function () {
			this.preRender();
      this[_].$el = this.$el instanceof HTMLElement ? this.$el : document.createElement("div");
			this.$el.setAttribute("id", this.id);
			this.$el.classList.add("widget");
			this.$el.innerHTML = this.getElementTemplate();
			this.postRender();
			// setTimeout(this.postRender.bind(this), 1);
      return this;
    }
  },

	destroy: {
		enumerable: true,
		value: function () {
			return this;
		}
	}  
});

module.exports = Widget;
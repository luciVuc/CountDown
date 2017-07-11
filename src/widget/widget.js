const EventEmitter = require("events");

const id = Symbol("id");
const $el = Symbol("$el");
// const htmlEvents = Symbol("htmlEvents");

/**
 * Widget
 * Base JS class for wrapping HTML elements styled with CSS3.
 */
function Widget (mSettings) {
  EventEmitter.apply(this, arguments);
  mSettings = mSettings instanceof Object ? mSettings : {};
  // mSettings.events = mSettings.events instanceof Object ? mSettings.events : {};
  
	this[$el] = mSettings.$el instanceof HTMLElement ? mSettings.$el : document.createElement("div");
	this[id] = this.$el.id || mSettings.id || "__CSS3Widget" + Date.now();
	// this._initEvents(mSettings.events);
	this.render();
  return this;
}

Widget.prototype = Object.create(EventEmitter.prototype, {
  constructor: {
		enumerable: true,
    value: Widget
  },

	id: {
		enumerable: true,
		get: function () {
			return this[id];
		}
	},  

	// htmlEvents: {
	// 	get: function () {
	// 		return this[htmlEvents];
	// 	}
	// },  

	$el: {
		enumerable: true,
		set: function ($El) {
			if ($El instanceof HTMLElement) {
				this[$el] = $El;
			}
			return this;
		},
		get: function () {
			return this[$el];
		}
	},

  getElementTemplate: {
		enumerable: true,
    value: function () {
      return `<div id="${this.id}-inner" class="widget"></div>`;
    }
  },

	// hasClass: {
	// 	enumerable: true,
	// 	value: function () {
	// 		return false;
	// 	}
	// },

	// addClass: {
	// 	enumerable: true,
	// 	value: function () {
	// 		return false;
	// 	}
	// },

	// removeClass: {
	// 	enumerable: true,
	// 	value: function () {
	// 		return false;
	// 	}
	// },

	// toggleClass: {
	// 	enumerable: true,
	// 	value: function () {
	// 		return false;
	// 	}
	// },


// document.getElementById("MyElement").classList.add('MyClass');

// document.getElementById("MyElement").classList.remove('MyClass');

// if ( document.getElementById("MyElement").classList.contains('MyClass') )

// document.getElementById("MyElement").classList.toggle('MyClass');

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
      this[$el] = this.$el instanceof HTMLElement ? this.$el : document.createElement("div");
      // this.onRender();
			// this._attachEventListeners();
			this.$el.setAttribute("id", this.id);
			this.$el.classList.add("widget-wrapper");
			this.$el.innerHTML = this.getElementTemplate();
			setTimeout(this.postRender.bind(this), 1);
      return this;
    }
  },

	destroy: {
		enumerable: true,
		value: function () {

		}
	}
  
  // _initEvents: {
  //   value: function (mEvents) {
  //     this[htmlEvents] = {};
  //     for (var e in mEvents) {
  //       if (mEvents.hasOwnProperty(e) && mEvents[e] instanceof Object && typeof mEvents[e].handler === "function") {
  //         this.htmlEvents[e] = {
  //           eventType: e,
  //           cssSelector: mEvents[e].cssSelector || null,
  //           handler: mEvents[e].handler
  //         };
  //       }
  //     }
  //     return this;
  //   }
  // },

  // _attachEventListeners: {
  //   value: function () {
  //     var $el;
  //     for (var e in this.htmlEvents) {
  //       if (this.htmlEvents.hasOwnProperty(e) && this.htmlEvents[e] instanceof Object && typeof this.htmlEvents[e].eventType === "string" && this.htmlEvents[e].eventType.length > 0 && typeof this.htmlEvents[e].handler === "function") {
  //         if (this.htmlEvents[e].cssSelector) {
  //           $el = this.$el.querySelector(this.htmlEvents[e].cssSelector);
  //           if ($el instanceof HTMLElement) {
  //             $el.addEventListener(this.htmlEvents[e].eventType, this.htmlEvents[e].handler);
  //           }
  //         } else {
  //           this.$el.addEventListener(this.htmlEvents[e].eventType, this.htmlEvents[e].handler);
  //         }
  //       }
  //     }
  //     return this;
  //   }
  // },
  
});

module.exports = Widget;
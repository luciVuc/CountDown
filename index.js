(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CountDown = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
const Timer = require("./timer");
const TimerView = require("./timerview");
const ToggleSwitch = require("./widget/toggleSwitch");
const storage = require("./storage");

const view = Symbol("view");
const $wrapper = Symbol("$wrapper");
const $lblDisplay = Symbol("$lblDisplay");
const $settingsMenu = Symbol("$settingsMenu");
const $finalDateTime = Symbol("$finalDateTime");
const $ongoingMsg = Symbol("$ongoingMsg");
const $finalMsg = Symbol("$finalMsg");
const $hideZeroTiles = Symbol("$hideZeroTiles");
const $okBtn = Symbol("$okBtn");
const $resetBtn = Symbol("$resetBtn");
const $status = Symbol("$status");
const oHideZeroTilesSwitch = Symbol("oHideZeroTilesSwitch");
const aElements = [
	$wrapper,
	$lblDisplay,
	$settingsMenu,
	$finalDateTime,
	$ongoingMsg,
	$finalMsg,
	$hideZeroTiles,
	$okBtn,
	$resetBtn,
	$status
];

/**
 * @public	Defines the Coundown App constructor.
 * @param {object} mSettings map of initial settings
 * @param {object} mSettings.view map of initial settings for the view
 * @param {object} mSettings.view.timer map of initial settings for the model
 * @returns {CountDownApp} self reference
 */
function CountDownApp(mSettings) {
	// define own event handlers
	this.okClickHandler = this._onOkClick.bind(this);
	this.resetClickHandler = this._onResetClick.bind(this);
	this.startHandler = this._onCountDownStart.bind(this);
	this.stopHandler = this._onCountDownStop.bind(this);

	// initialize the model and the view
	this[view] = new TimerView(mSettings);
	return this.init(mSettings);
}

CountDownApp.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: CountDownApp
	},

	/**
	 * @public	Initializes the UI
	 */
	init: {
		enumerable: true,
		value: function (mSettings) {
			mSettings = mSettings instanceof Object ? mSettings : {};

			// init UI
			for (var i = 0, str; i < aElements.length; i++) {
				str = aElements[i].toString().replace("Symbol", "").replace("(", "").replace(")", "").trim();
				this[aElements[i]] = mSettings[str];
			}

			this[oHideZeroTilesSwitch] = new ToggleSwitch({
				$el: this[$hideZeroTiles],
				label: "Hide Zero tiles",
				name: "hideZeroTiles",
				state: 0,
				ontoggle: function (oEvent) {
					this.view.hideZeroTiles = oEvent.targetChecked;
				}.bind(this)
			});

			this[$wrapper].appendChild(this.view.render().$el);
			this._bindEvents();
			this._loadData();
			this.timer.start();
			return this;
		}
	},

	/**
	 * @private
	 */
	_loadData: {
		value: function () {
			var data = storage.get();
			if (data !== null) {
				var date = Number.isInteger(data.final) ? new Date(data.final) : new Date();
				this.timer.final = date;
				this[$finalDateTime].value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace(/\.[0-9]{3}Z/, "");
				this[$ongoingMsg].value = data.ongoingText;
				this[$finalMsg].value = data.finalText;
				this[$lblDisplay].innerHTML = this[$finalMsg].value;
				this[$status].innerHTML = "";
				this[oHideZeroTilesSwitch].state = data.hideZeroTiles ? 1 : 0;
			}
			return this;
		}
	},

	/**
	 * @public	Resets the state of the countdown instance
	 */
	reset: {
		enumerable: true,
		value: function () {
			storage.reset();
			this._loadData();
			return this;
		}
	},

	/**
	 * @public	The Timer property
	 */
	timer: {
		enumerable: true,
		set: function (oTimer) {
			this.view.timer = oTimer;
			return this;
		},
		get: function () {
			return this.view.timer;
		}
	},

	/**
	 * @public	The TimerView property
	 */
	view: {
		enumerable: true,
		get: function () {
			return this[view];
		}
	},

	/**
	 * @private
	 */
	_bindEvents: {
		value: function () {
			this[$okBtn].addEventListener("click", this.okClickHandler);
			this[$resetBtn].addEventListener("click", this.resetClickHandler);
			this.timer.on("start", this.startHandler);
			this.timer.on("stop", this.stopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_unbindEvents: {
		value: function () {
			this[$okBtn].removeEventListener("click", this.okClickHandler);
			this[$resetBtn].removeEventListener("click", this.resetClickHandler);
			this.timer.removeListener("start", this.startHandler);
			this.timer.removeListener("stop", this.stopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_onOkClick: {
		value: function (oEvent) {
			this.timer.stop();
			this[$finalDateTime].value.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:\:([0-9]{2}))?/, function () {
				var args = arguments,
					now = new Date(args[1], parseInt(args[2]) - 1, args[3], args[4], args[5], args[6] || 0);
				this.timer.final = now;
			}.bind(this));
			this.timer.start();
			this[$settingsMenu].open = false;
			return this;
		}
	},

	/**
	 * @private
	 */
	_onResetClick: {
		value: function (oEvent) {
			this.timer.stop();
			this.reset();
			return this;
		}
	},

	/**
	 * @private
	 */
	_onCountDownStart: {
		value: function (oSrc) {
			this[$lblDisplay].innerHTML = this[$ongoingMsg].value;
			this[$status].innerHTML = `Counting down to ${new Date(oSrc.final).toLocaleString()}.`;
			storage.set({
				final: this.timer.final.getTime(),
				ongoingText: this[$ongoingMsg].value,
				finalText: this[$finalMsg].value,
				hideZeroTiles: !!this[oHideZeroTilesSwitch].state
			});
			return this;
		}
	},

	/**
	 * @private
	 */
	_onCountDownStop: {
		value: function (oEvent) {
			this[$lblDisplay].innerHTML = this[$finalMsg].value;
			this[$status].innerHTML = "Done!";
			storage.reset();
			return this;
		}
	},

	/**
	 * @public	Deallocates resources used by this instance
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this._unbindEvents();
			this.okClickHandler = null;
			this.resetClickHandler = null;
			this.startHandler = null;
			this.stopHandler = null;
			this.view.destroy();
			this.timer.destroy();
			return this;
		}
	}
});

module.exports = CountDownApp;

},{"./storage":8,"./timer":9,"./timerview":10,"./widget/toggleSwitch":11}],3:[function(require,module,exports){
const polyfills = require("./polyfills/index");
const CountDownApp = require("./countdown");

/**
 * @public Initialize and launch the countdown app controller
 * @author Lucian Vuc
 */
window.onload = function () {
	var app = new CountDownApp({
		$wrapper: document.querySelector('#wrapper'),
		$lblDisplay: document.querySelector("#lblDisplay"),
		$settingsMenu: document.querySelector("#settingsMenu"),
		$finalDateTime: document.querySelector("#finalDateTime"),
		$ongoingMsg: document.querySelector("#ongoingMsg"),
		$finalMsg: document.querySelector("#finalMsg"),
		$hideZeroTiles: document.querySelector("#hideZeroTiles"),		
		$okBtn: document.querySelector("#okBtn"),
		$resetBtn: document.querySelector("#resetBtn"),
		$status: document.querySelector("#status")
	});

	if (this.onunload) {
		this.onunload = function () {
			return app.destroy();
		}
	}
	return app;
};

},{"./countdown":2,"./polyfills/index":5}],4:[function(require,module,exports){
const DETAILS = 'details';
const SUMMARY = 'summary';

/**
 * Checks for support for `<details>`
 * 
 * @returns 
 */
function checkSupport() {
	var body = document.querySelector("body"),
		el = document.createElement(DETAILS);

	if (!('open' in el)) {
		return false;
	}
	el.innerHTML = `<${SUMMARY}>a</${SUMMARY}>b`;
	body.appendChild(el);

	var diff = el.offsetHeight;
	el.open = true;

	var result = (diff !== el.offsetHeight);
	body.removeChild(el);
	return result;
}

/**
 * Injects styles (idempotent)
 * 
 * @param {*} id 
 * @param {*} style 
 */
function injectStyle(id, style) {
	if (document.getElementById(id)) {
		return;
	}

	var el = document.createElement('style');
	el.id = id;
	el.innerHTML = style;
	document.getElementsByTagName('head')[0].appendChild(el);
}

/**
 * Click handler for `<summary>` tags
 */
function clickHandler(e) {
	if (e.target.nodeName.toLowerCase() === SUMMARY) {
		var details = e.target.parentNode,
			sOpen = 'open';

		if (details) {
			// define the 'open' attribute as a property, if not defined 
			if (details.hasOwnProperty("open") === false) {
				Object.defineProperty(details, "open", {
					set: function (bVal) {
						if (bVal === true) {
							this._open = true;
							this.setAttribute("open", "open");
						} else {
							this._open = false;
							this.removeAttribute("open");
						}
						return this;
					}
				});
			}
			// set the 'open' attribute
			if (details.getAttribute(sOpen)) {
				details.open = false;
			} else {
				details.open = true;
			}
		}
	}
	return;
}

/**
 * HTML5 Details Polyfill
 */
window.addEventListener("load", function () {
	if (!checkSupport()) {
		// Add a classname
		document.documentElement.className += ' no-details';
		window.addEventListener('click', clickHandler);
		injectStyle('details-polyfill-style', `html.no-details ${DETAILS}:not([open]) > :not(${SUMMARY}) { display: none; }	html.no-details  ${DETAILS} > ${SUMMARY}:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; } html.no-details  ${DETAILS}[open] > ${SUMMARY}:before { content: "▼"; }`);
	}
});

module.exports = true;
},{}],5:[function(require,module,exports){
const symbol = require("./symbol");
const details = require("./details");

module.exports = this;
},{"./details":4,"./symbol":6}],6:[function(require,module,exports){

/* 
 * Emulates the ES6 Symbol datatype on older browsers or environments that don't support it, such as IE.
 */
if (!Symbol && typeof Symbol !== "function") {
	var prefix = '__symbol' + Math.random() + '__',
		id = 0;

	var get = function () { /* avoid set w/out get prob */ };

	function _Symbol() {
		var __symbol__ = prefix + id++;

		this.__sId = __symbol__;
		Object.defineProperty(Object.prototype, __symbol__, {
			enumerable: false,
			configurable: false,
			get: get, // undefined
			set: function (value) {
				Object.defineProperty(this, __symbol__, {
					enumerable: false,
					configurable: true,
					writable: true,
					value: value
				});
			}
		});
		return this;
	};

	_Symbol.prototype = Object.create(Object.prototype, {
		constructor: {
			enumerable: true,
			value: _Symbol
		},

		toString: {
			enumerable: false,
			configurable: false,
			writable: false,
			value: function toString() {
				return this.__sId;
			}
		}
	});

	this.Symbol = function () {
		return new _Symbol();
	};

	return this.Symbol;
}
module.exports = true;

},{}],7:[function(require,module,exports){
/**
 * @private Draws a "slice" of a pie chart with the given coordinates.
 * 
 * @param {CanvasRenderingContext2D} oContext The 2D context to draw on
 * @param {integer} centerX The horizontal center point of the pie chart
 * @param {integer} centerY The vertical center point of the pie chart
 * @param {integer} radius 
 * @param {number} startAngle 
 * @param {number} endAngle 
 * @param {CSSColor} color 
 */
function drawPieSlice(oContext, centerX, centerY, radius, startAngle, endAngle, color) {
	if (oContext instanceof CanvasRenderingContext2D) {
		oContext.fillStyle = color;
		oContext.beginPath();
		oContext.moveTo(centerX, centerY);
		oContext.arc(centerX, centerY, radius, startAngle, endAngle);
		oContext.closePath();
		oContext.fill();
	}
	return oContext;
}

const $canvas = Symbol("$canvas");
const ctx = Symbol("ctx");
const min = Symbol("min");
const max = Symbol("max");
const value = Symbol("value");
const lineWidth = Symbol("lineWidth");
const lineFill = Symbol("lineFill");
const backLineFill = Symbol("backLineFill");
const bgFill = Symbol("bgFill");
const showValue = Symbol("showValue");
const valueStyle = Symbol("valueStyle");
const valueColor = Symbol("valueColor");

/**
 * @public	Displays a round, doughnut-like progress bar, using HTML canvas.
 * 
 * @param {object}	mSettings	Hashmap of instance values
 * @param {HTMLCanvasElement}	mSettings.$canvas	The HTML canvas element to draw on
 * @param {integer} mSettings.min The minimum value
 * @param {integer} mSettings.max The maximum value
 * @param {integer} mSettings.value The current value
 * @param {integer} mSettings.lineWidth The width of the progress line
 * @param {CSSColor} mSettings.lineFill The color of the progress line, in CSS format
 * @param {CSSColor} mSettings.backLineFill The background color of the progress line, in CSS format
 * @param {CSSColor} mSettings.bgFill The background color, in CSS format
 * @param {boolean} mSettings.showValue Whether to show or not the info text
 * @param {CSSFont} mSettings.valueStyle The info text font style, in CSS format
 * @param {CSSColor} mSettings.valueColor The info text color, in CSS format
 */
function ProgressDonut(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};
	this.$canvas = mSettings.$canvas;
	this[min] = Number.isInteger(mSettings.min) ? mSettings.min : 0;
	this[max] = Number.isInteger(mSettings.max) ? mSettings.max : 100;
	this[value] = Number.isInteger(mSettings.value) ? mSettings.value : 0;
	this[lineWidth] = Number.isInteger(mSettings.lineWidth) ? mSettings.lineWidth : 3;
	this[lineFill] = typeof mSettings.lineFill === "string" ? mSettings.lineFill : "#CCB566";
	this[backLineFill] = typeof mSettings.backLineFill === "string" ? mSettings.backLineFill : "#FB6929";
	this[bgFill] = typeof mSettings.bgFill === "string" ? mSettings.bgFill : "#F8FF8E";
	this[showValue] = typeof mSettings.showValue === "boolean" ? mSettings.showValue : true;
	this[valueStyle] = typeof mSettings.valueStyle === "string" ? mSettings.valueStyle : "bold " + this.radius * 0.8 + "px sans-serif";
	this[valueColor] = typeof mSettings.valueColor === "string" ? mSettings.valueColor : "red";
	return this.draw();
}

ProgressDonut.radians = function (nDeg) {
	nDeg = Number(nDeg);
	return !Number.isNaN(nDeg) ? nDeg * Math.PI/180 : 0;
};

ProgressDonut.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: ProgressDonut
	},

	/**
	 * @public	property
	 */
	$canvas: {
		enumerable: true,
		set: function ($Canvas) {
			if (!($Canvas instanceof HTMLCanvasElement)) {
				throw new Error("No Canvas support");
			}
			this[$canvas] = $Canvas;
			this[ctx] = $Canvas.getContext("2d");
			return this.draw();
		},
		get: function () {
			return this[ctx];
		}
	},

	/**
	 * @public	property
	 */
	context2d: {
		enumerable: true,
		get: function () {
			return this[ctx];
		}
	},

	/**
	 * @public	property
	 */
	x: {
		enumerable: true,
		get: function () {
			return this[ctx].canvas.width / 2;
		}
	},

	/**
	 * @public	property
	 */
	y: {
		enumerable: true,
		get: function () {
			return this[ctx].canvas.height / 2;
		}
	},

	/**
	 * @public	property
	 */
	radius: {
		enumerable: true,
		get: function () {
			return Math.min(this.x, this.y) - 10;
		}
	},

	/**
	 * @public	property
	 */
	min: {
		enumerable: true,
		set: function (iMin) {
			if (Number.isInteger(iMin)) {
				this[min] = iMin;
			}
			return this.draw();
		},
		get: function () {
			return this[min];
		}
	},

	/**
	 * @public	property
	 */
	max: {
		enumerable: true,
		set: function (iMax) {
			if (Number.isInteger(iMax)) {
				this[max] = iMax;
			}
			return this.draw();
		},
		get: function () {
			return this[max];
		}
	},

	/**
	 * @public	property
	 */
	value: {
		enumerable: true,
		set: function (iValue) {
			if (Number.isInteger(iValue) && iValue >= this.min && iValue <= this.max) {
				this[value] = iValue;
			}
			return this.draw();
		},
		get: function () {
			return this[value];
		}
	},

	/**
	 * @public	property
	 */
	lineWidth: {
		enumerable: true,
		set: function (iLineWidth) {
			this[lineWidth] = Number.isInteger(iLineWidth) ? Math.abs(iLineWidth) : this[lineWidth];
			return this.draw();
		},
		get: function () {
			return this[lineWidth];
		}
	},

	/**
	 * @public	property
	 */
	lineFill: {
		enumerable: true,
		set: function (sLineFill) {
			this[lineFill] = typeof sLineFill === "string" ? sLineFill : this[lineFill];
			return this.draw();
		},
		get: function () {
			return this[lineFill];
		}
	},

	/**
	 * @public	property
	 */
	backLineFill: {
		enumerable: true,
		set: function (sBackLineFill) {
			this[backLineFill] = typeof sBackLineFill === "string" ? sBackLineFill : this[backLineFill];
			return this.draw();
		},
		get: function () {
			return this[backLineFill];
		}
	},

	/**
	 * @public	property
	 */
	bgFill: {
		enumerable: true,
		set: function (sBgFill) {
			this[bgFill] = typeof sBgFill === "string" ? sBgFill : this[bgFill];
			return this.draw();
		},
		get: function () {
			return this[bgFill];
		}
	},

	/**
	 * @public	property
	 */
	showValue: {
		enumerable: true,
		set: function (bShowInfoText) {
			this[showValue] = typeof bShowInfoText === "boolean" ? bShowInfoText : this[showValue];
			return this.draw();
		},
		get: function () {
			return this[showValue];
		}
	},

	/**
	 * @public	property
	 */
	valueStyle: {
		enumerable: true,
		set: function (sInfoStyle) {
			this[valueStyle] = typeof sInfoStyle === "string" ? sInfoStyle : this[valueStyle];
			return this.draw();
		},
		get: function () {
			return this[valueStyle];
		}
	},

	/**
	 * @public	property
	 */
	valueColor: {
		enumerable: true,
		set: function (sInfoColor) {
			this[valueColor] = typeof sInfoColor === "string" ? sInfoColor : this[valueColor];
			return this.draw();
		},
		get: function () {
			return this[valueColor];
		}
	},

	/**
	 * @public	Draws the state of the instance on an HTMLCanvasElement
	 */
	draw: {
		value: function () {
			var ctx = this.context2d,
				cx = this.x,
				cy = this.y,
				r = this.radius,
				angle = - Math.PI / 2;

			// clear the canvas
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// draw the shadow of the chart
			ctx.shadowBlur = 0;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;

			// draw the background
			ctx.fillStyle = this.backLineFill;
			ctx.globalAlpha = 1;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();

			// reset the shadows
			ctx.shadowBlur = 0;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;

			// draw the pie-chart slice
			ctx.globalAlpha = 1;
			drawPieSlice(ctx, cx, cy, r, angle, angle + 2 * Math.PI * this.value / this.max, this.lineFill);

			// draw the pie chart inner content
			ctx.fillStyle = this.bgFill;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r - this.lineWidth, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();

			// draw the pie-chart's inner text
			if (this.showValue === true) {
				ctx.fillStyle = this.valueColor;
				ctx.font = "bold " + r * 0.8 + "px sans-serif";
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(this.value, cx, cy);
			}
			return this;
		}
	},

	/**
	 * @public	Deallocates resources used by this instance
	 */
	destroy: {
		enumerable: true,
		value: function () {
			this[context2d] = null;
			this[$canvas] = null;
			return this;
		}
	}
});

module.exports = ProgressDonut;
},{}],8:[function(require,module,exports){
const sKey = "countdown";

function fn() {
	console.log(arguments);
}

function DataStore() {
	return this;
}

DataStore.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: DataStore
	},

	/**
	 * @public	Returns the locally stored countdown data.
	 * 
	 * @returns {object}	The countdown data as a literal object with the following properties
	 * <ul>
	 * 	<li>final, {integer}</li>
	 * 	<li>ongoingText, {string}</li>
	 * 	<li>finalText, {string}</li>
	 * </ul>
	 */
	get: {
		enumerable: true,
		value: function () {
			var json = null;
			json = JSON.parse(localStorage.getItem(sKey));

			json = json instanceof Object ? json : {};
			var m = {
				final: Number.isInteger(json.final) ? json.final : Date.now(),
				ongoingText: typeof json.ongoingText === "string" ? json.ongoingText : "Remaining Time",
				finalText: typeof json.finalText === "string" ? json.finalText : "Done",
				hideZeroTiles: !!json.hideZeroTiles
			};
			return m;
		}
	},

	/**
	 * @public	Stores locally the countdown data passed in JSON format as argument.
	 * 
	 * @param mJSON	{object}	countdown data to be stored
	 * @param mJSON.final	{integer}	countdown final date and time, in milliseconds
	 * @param mJSON.ongoingText	{string}	Text to display while counting down
	 * @param mJSON.finalText	{string}	Text to display when countdown is over
	 */
	set: {
		enumerable: true,
		value: function (mJSON) {
			mJSON = mJSON instanceof Object ? mJSON : {};
			var m = {
				final: Number.isInteger(mJSON.final) ? mJSON.final : null,
				ongoingText: typeof mJSON.ongoingText === "string" ? mJSON.ongoingText : "Remaining Time",
				finalText: typeof mJSON.finalText === "string" ? mJSON.finalText : "Done",
				hideZeroTiles: !!mJSON.hideZeroTiles
			};
			localStorage.setItem(sKey, JSON.stringify(m));
			return this;
		}
	},

	/**
	 * @public	Resets the countdown data stored locally with initial values
	 */
	reset: {
		enumerable: true,
		value: function () {
			var m = {
				final: null,
				ongoingText: "Remaining Time",
				finalText: "Done",
				hideZeroTiles: false
			};
			localStorage.setItem(sKey, JSON.stringify(m));
			return this;
		}
	},

	/**
	 * @public	Removes the countdown data from the local storage.
	 */
	delete: {
		enumerable: true,
		value: function () {
			localStorage.removeItem(sKey);
			return this;
		}
	}
});

module.exports = new DataStore();
},{}],9:[function(require,module,exports){
const EventEmitter = require("events");

const final = Symbol("final");
const daysLeft = Symbol("daysLeft");
const hoursLeft = Symbol("hoursLeft");
const minutesLeft = Symbol("minutesLeft");
const secondsLeft = Symbol("secondsLeft");
const tickInterval = Symbol("tickInterval");
const onupdate = Symbol("onupdate");
const onstart = Symbol("onstart");
const onstop = Symbol("onstop");
const onready = Symbol("onready");

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
	this.final = mSettings.finalDateTime instanceof Date ? mSettings.finalDateTime : new Date();
	this[daysLeft] = 0;
	this[hoursLeft] = 0;
	this[minutesLeft] = 0;
	this[secondsLeft] = 0;
	this[onupdate] = mSettings.onupdate || null;
	this[onstart] = mSettings.onstart || null;
	this[onstop] = mSettings.onstop || null;
	this[onready] = mSettings.onready || null;
	this[tickInterval] = null;
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
				this[final] = oDate;
			}
			return this;
		},
		get: function () {
			return this[final];
		}
	},

	/**
	 * @public	property
	 */
	daysLeft: {
		enumerable: true,
		get: function () {
			return this[daysLeft];
		}
	},

	/**
	 * @public	property
	 */
	hoursLeft: {
		enumerable: true,
		get: function () {
			return this[hoursLeft];
		}
	},

	/**
	 * @public	property
	 */
	minutesLeft: {
		enumerable: true,
		get: function () {
			return this[minutesLeft];
		}
	},

	/**
	 * @public	property
	 */
	secondsLeft: {
		enumerable: true,
		get: function () {
			return this[secondsLeft];
		}
	},

	/**
	 * @public	property
	 */
	onupdate: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[onupdate] = fn;
			}
			return this;
		},
		get: function () {
			return this[onupdate];
		}
	},

	/**
	 * @public	property
	 */
	onstart: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[onstart] = fn;
			}
		},
		get: function () {
			return this[onstart];
		}
	},

	/**
	 * @public	property
	 */
	onstop: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[onstop] = fn;
			}
		},
		get: function () {
			return this[onstop];
		}
	},

	/**
	 * @public	property
	 */
	onready: {
		enumerable: true,
		set: function (fn) {
			if (typeof fn === "function" || fn === null) {
				this[onready] = fn;
			}
		},
		get: function () {
			return this[onready];
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
				this[daysLeft] = Math.floor(diff / 1000 / 60 / 60 / 24);
				this[hoursLeft] = Math.floor(diff / 1000 / 60 / 60 % 24);
				this[minutesLeft] = Math.floor(diff / 1000 / 60 % 60);
				this[secondsLeft] = Math.floor(diff / 1000 % 60);
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
				this[tickInterval] = setInterval(this.update.bind(this), 250);
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
			clearInterval(this[tickInterval]);
			this[tickInterval] = null;
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
			this[final] = null;
			this.removeAllListeners("start");
			this.removeAllListeners("stop");
			this.removeAllListeners("update");
			this.removeAllListeners("ready");
			return this;
		}
	}
});

module.exports = Timer;

},{"events":1}],10:[function(require,module,exports){
const Timer = require("./timer");
const ProgressDonut = require("./progress-donut");

const $el = Symbol("$el");
const $daysEl = Symbol("$daysEl");
const $minsEl = Symbol("$minsEl");
const $hrsEl = Symbol("$hrsEl");
const $secsEl = Symbol("$secsEl");
const timer = Symbol("timer");
const supportsCanvas = Symbol("supportsCanvas");
const hideZeroTiles = Symbol("hideZeroTiles");

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
	this[hideZeroTiles] = mSettings.hideZeroTiles === true ? true : false;
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
	 * @public
	 */
	hideZeroTiles: {
		enumerable: true,
		set: function (bValue) {
			this[hideZeroTiles] = bValue === true ? true : false;
			return this.update();
		},
		get: function () {
			return this[hideZeroTiles];
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

			this.$daysEl.parentElement.style.display = "";
			this.$hrsEl.parentElement.style.display = "";
			this.$minsEl.parentElement.style.display = "";
			if (this.hideZeroTiles) {
				if (this.timer.daysLeft === 0) {
					this.$daysEl.parentElement.style.display = "none";
					if (this.timer.hoursLeft === 0) {
						this.$hrsEl.parentElement.style.display = "none";
						if (this.timer.minutesLeft === 0) {
							this.$minsEl.parentElement.style.display = "none";
						}
					}
				}
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
				this._oDaysDonut = new ProgressDonut({ $canvas: this.$daysEl, max: this.timer.daysLeft, value: 0, bgFill: "white", lineFill: "red", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oHrsDonut = new ProgressDonut({ $canvas: this.$hrsEl, max: this.timer.hoursLeft, value: 0, bgFill: "white", lineFill: "green", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oMinsDonut = new ProgressDonut({ $canvas: this.$minsEl, max: this.timer.minutesLeft, value: 0, bgFill: "white", lineFill: "blue", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oSecsDonut = new ProgressDonut({ $canvas: this.$secsEl, max: this.timer.secondsLeft, value: 0, bgFill: "white", lineFill: "orange", backLineFill: "#dddddd", valueColor: "#777777" });
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

},{"./progress-donut":7,"./timer":9}],11:[function(require,module,exports){
const Widget = require("./widget");

const $inputEl = Symbol("$inputEl");
const label = Symbol("label");
const description = Symbol("description");
const name = Symbol("name");
const state = Symbol("state");
const ontoggle = Symbol("ontoggle");

/**
 * ToggleSwitch
 * JS wrapper for HTML checkbox input, styled with CSS3 to look like a Toggle Switch.
 */
function ToggleSwitch(mSettings) {
	this._fToggleHandler = this.toggleHandler.bind(this);
	Widget.apply(this, arguments);
	return this;
}

ToggleSwitch.prototype = Object.create(Widget.prototype, {
	constructor: {
		value: ToggleSwitch
	},

	init: {
		enumerable: true,
		value: function (mSettings) {
			Widget.prototype.init.apply(this, arguments);
			// mSettings.id = this.$el.id || mSettings.id || "__ToggleSwitch" + Date.now();
			this[label] = typeof mSettings.label === "string" ? mSettings.label : "Switch " + this.id;
			this[description] = typeof mSettings.label === "string" ? mSettings.description : this.label;
			this[name] = typeof mSettings.label === "string" ? mSettings.name : this.id + "Checkbox";
			this[state] = !mSettings.state ? 0 : 1;
			this[ontoggle] = typeof mSettings.ontoggle === "function" ? mSettings.ontoggle : null;
			return this;
		}
	},

	$inputEl: {
		enumerable: true,
		get: function () {
			return this[$inputEl];
		}
	},

	label: {
		enumerable: true,
		set: function (sLabel) {
			this[label] = typeof sLabel === "string" ? sLabel : "";
			return this;
		},
		get: function () {
			return this[label];
		}
	},

	description: {
		enumerable: true,
		set: function (sDescription) {
			this[description] = typeof sDescription === "string" ? description : "";
			return this;
		},
		get: function () {
			return this[description];
		}
	},

	name: {
		enumerable: true,
		set: function (sName) {
			this[name] = typeof sName === "string" ? sName : "";
			return this;
		},
		get: function () {
			return this[name];
		}
	},

	state: {
		enumerable: true,
		set: function (iValue) {
			this[state] = !!iValue ? 1 : 0;
			if (!(this.$inputEl instanceof HTMLInputElement)) {
				this.render();
			}
			if (this.$inputEl instanceof HTMLInputElement && this.$inputEl.checked !== !!this.state) {
				this.$inputEl.checked = !!this.state;
				var event = document.createEvent("HTMLEvents");
				event.initEvent('change', false, true);
				this.$inputEl.dispatchEvent(event);
			}
			return this;
		},
		get: function () {
			return this[state];
		}
	},

	stateValue: {
		enumerable: true,
		get: function () {
			return ToggleSwitch.STATES[this.state];
		}
	},

	ontoggle: {
		enumerable: true,
		set: function (fn) {
			if (fn === null || typeof fn === "function") {
				this[ontoggle] = fn;
			}
			return this;
		},
		get: function () {
			return this[ontoggle];
		}
	},

	toggleHandler: {
		value: function ($Event) {
			if (this.$inputEl instanceof HTMLInputElement) {
				this.state = !!this.$inputEl.checked ? 1 : 0;
			}
			var oEvent = {
				targetChecked: $Event.target.checked,
				state: this.state,
				source: this,
				sourceEvent: $Event
			};
			this.emit("toggle", oEvent);
			if (typeof this.ontoggle === "function") {
				this.ontoggle(oEvent);
			}
			return this;
		}
	},

	toggle: {
		enumerable: true,
		value: function () {
			this.state = (this.state + 1) % 2;
			return this;
		}
	},

	getElementTemplate: {
		value: function () {
			var checked = this.state ? "checked" : "";

			return `<input type="checkbox" id="${this.id}-Checkbox" name="${this.name}" class="widget switch-checkbox" ${checked} data-label="${this.label}" title="${this.description}"/>`;
		}
	},

	preRender: {
		enumerable: true,
		value: function () {
			if (this.$inputEl instanceof HTMLInputElement) {
				this.$inputEl.removeEventListener("change", this._fToggleHandler);
			}
			return Widget.prototype.preRender.apply(this, arguments);
		}
	},

	postRender: {
		enumerable: true,
		value: function () {
			this[$inputEl] = this.$el.querySelector("input[type=checkbox]");
			this.$inputEl.addEventListener("change", this._fToggleHandler);
			this.$inputEl.checked = !!this.state;
			this.$el.classList.add("switch");
			this.$el.setAttribute("data-label", this.label);
			return Widget.prototype.postRender.apply(this, arguments);
		}
	},

	destroy: {
		enumerable: true,
		value: function () {
			if (this.$inputEl instanceof HTMLInputElement) {
				this.$inputEl.removeEventListener("change", this._fToggleHandler);
			}
			return Widget.prototype.destroy.apply(this, arguments);
		}
	},

});

ToggleSwitch.STATES = {
	0: "Off",
	1: "On"
};

module.exports = ToggleSwitch;
},{"./widget":12}],12:[function(require,module,exports){
const EventEmitter = require("events");

const id = Symbol("id");
const $el = Symbol("$el");

/**
 * Widget
 * Base JS class for wrapping HTML elements styled with CSS3.
 */
function Widget (mSettings) {
  EventEmitter.apply(this, arguments);
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
			this[$el] = mSettings.$el instanceof HTMLElement ? mSettings.$el : document.createElement("div");
			this[id] = this.$el.id || mSettings.id || "__CSS3Widget" + Date.now();
			return this;
		}
	},

	id: {
		enumerable: true,
		get: function () {
			return this[id];
		}
	},  

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
      this[$el] = this.$el instanceof HTMLElement ? this.$el : document.createElement("div");
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
},{"events":1}]},{},[3])(3)
});
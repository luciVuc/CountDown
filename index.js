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
module.exports = [
  {
    "name": "Tuolome Meadows",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto1.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "South Tufa, Mono Lake",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto2.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Little Lakes Valley",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto3.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Bay Bridge",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto4.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Yosemite",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto5.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Beach Ice",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto6.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Color and White Trunks",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto7.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Golden Gate Bridge",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto8.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Long Lake",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto9.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "San Francisco Skyline",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto10.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Across Mono Basin",
    "source": "https://s3.amazonaws.com/brave-backgrounds/dksfoto11.jpg",
    "author": "Darrell Sano",
    "link": "https://dksfoto.smugmug.com"
  }, {
    "name": "Corsica",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_Corsica.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Corsica",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_Corsica2.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Griffith Park Observatory (Downtown Los Angeles)",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_DowntownGriffith.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Elmatador Beach",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_ElmatadorBeach.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Paris:Conciergeri",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_ParisConciergeri.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Paris:The Roof",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_Theroofparis.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Paris:The Seant",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_TheSeantParis.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Venise Sunset",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_VeniseSunset.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }, {
    "name": "Yosemite",
    "source": "https://s3.amazonaws.com/brave-backgrounds/Phoyoserge_Yosemite.jpg",
    "author": "Serge Ramelli",
    "link": "https://www.photoserge.com/"
  }
];
},{}],3:[function(require,module,exports){
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
},{"events":1}],4:[function(require,module,exports){
const sKey = "countdown";
const DEFAULTS = {
	ongoingText: "Countdown is Over",
	finalText: "Countdown Over",
	hideZeroTiles: false
};

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

	DEFAULTS: {
		enumerable: true,
		get: function () {
			return DEFAULTS;
		}
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
				ongoingText: typeof json.ongoingText === "string" ? json.ongoingText : DEFAULTS.ongoingText,
				finalText: typeof json.finalText === "string" ? json.finalText : DEFAULTS.finalText,
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
				ongoingText: typeof mJSON.ongoingText === "string" ? mJSON.ongoingText : DEFAULTS.ongoingText,
				finalText: typeof mJSON.finalText === "string" ? mJSON.finalText : DEFAULTS.finalText,
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
				ongoingText: DEFAULTS.ongoingText,
				finalText: DEFAULTS.finalText,
				hideZeroTiles: DEFAULTS.hideZeroTiles
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
},{}],5:[function(require,module,exports){
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
			this.stop();
			return this;
		}
	}
});

module.exports = Timer;

},{"events":1}],6:[function(require,module,exports){
const Timer = require("./components/timer");
const TimerView = require("./ui/timerview");
const ClockView = require("./ui/clockview");
const ToggleSwitch = require("./ui/widgets").ToggleSwitch;
const storage = require("./components/storage");
const backgrounds = require("../data/backgrounds");

const props = Symbol("props");
const aElements = [
	"$wrapper",
	"$backgroundImage",
	"$countDown",
	"$countDownEventDisplay",
	"$countDownDateTimeDisplay",
	"$mainMenu",
	"$countDownDateTime",
	"$countDownText",
	"$endCountDownText",
	"$hideZeroTiles",
	"$title",
	"$okBtn",
	"$resetBtn",
	"$infoBar",
	"$photoBy",
	"$photoOwner",
	"$photoName"
];

/**
 * @public	Defines the Coundown App constructor.
 * @param {object} mSettings map of initial settings
 * @param {object} mSettings.view map of initial settings for the view
 * @param {object} mSettings.view.timer map of initial settings for the model
 * @returns {CountDown} self reference
 */
function CountDown(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};

	// define own event handlers
	this.okClickHandler = this.onOkClick.bind(this);
	this.resetClickHandler = this.onResetClick.bind(this);
	this.countDownStartHandler = this.onCountDownStart.bind(this);
	this.countDownStopHandler = this.onCountDownStop.bind(this);

	// initialize the model and the view
	this[props] = {};
	this[props].view = new TimerView(mSettings.view);
	this[props].clockView = new ClockView(mSettings.clockView);
	return this.init(mSettings);
}

CountDown.getRandomaBackgroundImage = function () {
	var iRnd = Math.floor(Math.random() * (backgrounds.length - 0) + 0);
	return backgrounds.filter(function (o, i, arr) {
		return i === iRnd;
	})[0];
};


CountDown.prototype = Object.create(Object.prototype, {
	constructor: {
		enumerable: true,
		value: CountDown
	},

	/**
	 * @public	Initializes the UI
	 */
	init: {
		enumerable: true,
		value: function (mSettings) {
			mSettings = mSettings instanceof Object ? mSettings : {};

			// init UI
			for (var i = 0, $el; i < aElements.length; i++) {
				$el = mSettings[aElements[i]];
				this[props][aElements[i]] = $el instanceof HTMLElement ? $el : document.createElement("div");
			}

			// init toggle switch on the settings box
			this[props].oHideZeroTilesSwitch = new ToggleSwitch({
				$el: this[props].$hideZeroTiles,
				label: "Hide Zero tiles",
				name: "hideZeroTiles",
				state: 0,
				ontoggle: function (oEvent) {
					this.view.hideZeroTiles = oEvent.targetChecked;
				}.bind(this)
			});

			this.backgroundImage = null;
			this[props].$countDown.appendChild(this.view.$el);
			this[props].$infoBar.appendChild(this.clockView.$el);
			this._bindEvents();
			this._loadData();
			this.timer.start();
			this.clockView.clock.start();
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
				this[props].$countDownDateTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace(/\.[0-9]{3}Z/, "");
				this[props].$countDownText.value = data.ongoingText;
				this[props].$endCountDownText.value = data.finalText;
				this[props].$countDownEventDisplay.innerHTML = this[props].$endCountDownText.value;
				this[props].$countDownDateTimeDisplay.innerHTML = "";
				this[props].oHideZeroTilesSwitch.state = data.hideZeroTiles ? 1 : 0;
			}
			return this;
		}
	},

	openSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$mainMenu.open = true;
			return this;
		}
	},

	closeSettingsMenu: {
		enumerable: true,
		value: function () {
			this[props].$mainMenu.open = false;
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
			return this[props].view;
		}
	},

	/**
	 * @public	The ClockView property
	 */
	clockView: {
		enumerable: true,
		get: function () {
			return this[props].clockView;
		}
	},

	/**
	 * @public	The ClockView property
	 */
	backgroundImage: {
		enumerable: true,
		set: function () {
			this[props].backgroundImage = CountDown.getRandomaBackgroundImage();
			this[props].$backgroundImage.style.backgroundImage = `url(${this.backgroundImage.source})`;
			// this[props].$photoBy.innerHTML = this.backgroundImage.source;
			this[props].$photoOwner.innerHTML = this.backgroundImage.author;
			this[props].$photoOwner.href = this.backgroundImage.link;
			this[props].$photoName.innerHTML = this.backgroundImage.name;
			return this;
		},
		get: function () {
			return this[props].backgroundImage;
		}
	},

	/**
	/**
	 * @private
	 */
	_bindEvents: {
		value: function () {
			this[props].$okBtn.addEventListener("click", this.okClickHandler);
			this[props].$resetBtn.addEventListener("click", this.resetClickHandler);
			this.timer.on("start", this.countDownStartHandler);
			this.timer.on("stop", this.countDownStopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	_unbindEvents: {
		value: function () {
			this[props].$okBtn.removeEventListener("click", this.okClickHandler);
			this[props].$resetBtn.removeEventListener("click", this.resetClickHandler);
			this.timer.removeListener("start", this.countDownStartHandler);
			this.timer.removeListener("stop", this.countDownStopHandler);
			return this;
		}
	},

	/**
	 * @private
	 */
	onOkClick: {
		value: function (oEvent) {
			this.timer.stop();
			this[props].$countDownDateTime.value.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?:\:([0-9]{2}))?/, function () {
				var args = arguments,
					now = new Date(args[1], parseInt(args[2]) - 1, args[3], args[4], args[5], args[6] || 0);
				this.timer.final = now;
			}.bind(this));
			this.timer.start();
			this[props].$mainMenu.open = false;
			return this;
		}
	},

	/**
	 * @private
	 */
	onResetClick: {
		value: function (oEvent) {
			this.timer.stop();
			this.reset();
			return this;
		}
	},

	/**
	 * @private
	 */
	onCountDownStart: {
		value: function (oSrc) {
			// this[props].$title.classList.remove("hourglass");
			// this[props].$title.classList.add("hourglass-on");
			this[props].$countDownEventDisplay.innerHTML = this[props].$countDownText.value;
			this[props].$countDownDateTimeDisplay.innerHTML = `(${new Date(oSrc.final).toLocaleString()})`;
			storage.set({
				final: this.timer.final.getTime(),
				ongoingText: this[props].$countDownText.value,
				finalText: this[props].$endCountDownText.value,
				hideZeroTiles: !!this[props].oHideZeroTilesSwitch.state
			});
			return this;
		}
	},

	/**
	 * @private
	 */
	onCountDownStop: {
		value: function (oEvent) {
			// this[props].$title.classList.remove("hourglass-on");
			// this[props].$title.classList.add("hourglass");
			this[props].$countDownEventDisplay.innerHTML = this[props].$endCountDownText.value;
			this[props].$countDownDateTimeDisplay.innerHTML = storage.DEFAULTS.finalText; // "Coundown Over";
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
			this.onResetClickHandler = null;
			this.countDownStartHandler = null;
			this.countDownStopHandler = null;
			this.view.destroy();
			this.timer.destroy();
			this.clockView.clock.destroy();
			this.clockView.destroy()
			return this;
		}
	}
});

module.exports = CountDown;

},{"../data/backgrounds":2,"./components/storage":4,"./components/timer":5,"./ui/clockview":11,"./ui/timerview":13,"./ui/widgets":14}],7:[function(require,module,exports){
const polyfills = require("./polyfills");
const CountDown = require("./countdown");

/**
 * @public Initialize and launch the countdown app controller
 * @author Lucian Vuc
 */
window.onload = function () {
	var app = new CountDown({	
		$wrapper: document.querySelector('#wrapper'),
		$backgroundImage: document.querySelector("#wrapper"),
		$countDown: document.querySelector('#countDown'),
		$countDownEventDisplay: document.querySelector("#countDownEventDisplay"),
		$countDownDateTimeDisplay: document.querySelector("#countDownDateTimeDisplay"),
		$mainMenu: document.querySelector("#mainMenu"),
		$countDownDateTime: document.querySelector("#countDownDateTime"),
		$countDownText: document.querySelector("#countDownText"),
		$endCountDownText: document.querySelector("#endCountDownText"),
		$hideZeroTiles: document.querySelector("#hideZeroTiles"),		
		$okBtn: document.querySelector("#okBtn"),
		$resetBtn: document.querySelector("#resetBtn"),
		$title: document.querySelector('#title'),
		$infoBar: document.querySelector('#infoBar'),
		$photoBy: document.querySelector('#photoBy'),
		$photoOwner: document.querySelector('#photoOwner'),
		$photoName: document.querySelector('#photoName')
	});

	if (window.location.hash === "settings") {
		app.openSettingsMenu();
	} else {
		app.closeSettingsMenu();
	}

	if (this.onunload) {
		this.onunload = function () {
			return app.destroy();
		}
	}
	return app;
};

},{"./countdown":6,"./polyfills":9}],8:[function(require,module,exports){
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
			// if (details.hasOwnProperty("open") === false) {
			if (details instanceof HTMLUnknownElement && typeof details._open === "undefined") {
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
					},
					get: function () {
						return this._open;
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
		document.addEventListener('click', clickHandler, false);
		injectStyle('details-polyfill-style', `html.no-details ${DETAILS}:not([open]) > :not(${SUMMARY}) { display: none; }	html.no-details  ${DETAILS} > ${SUMMARY}:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; } html.no-details  ${DETAILS}[open] > ${SUMMARY}:before { content: "▼"; display: block;}`);
	}
});

module.exports = true;
},{}],9:[function(require,module,exports){
const symbol = require("./symbol");
const details = require("./details");

module.exports = this;
},{"./details":8,"./symbol":10}],10:[function(require,module,exports){

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

},{}],11:[function(require,module,exports){
const EventEmitter = require("events");
const Clock = require("../components/clock");

const props = Symbol("props");

function ClockView (mSettings) {
  EventEmitter.apply(this, arguments);
  mSettings = typeof mSettings === "object" ? mSettings : {};
  this[props] = {};
  this[props].$el = null;
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
			if (!(this[props].$el instanceof HTMLElement)) {
				this.render();
			}
			return this[props].$el;
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
      this[props].$time.innerHTML = this.clock.formattedTime;
      this[props].$timePeriod.innerHTML = this.clock.formattedTimePeriod;
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
			this[props].$el = el.querySelector(".clock");
			el = el.removeChild(this.$el);
			this[props].$time = el.querySelector(".time");
			this[props].$timePeriod = el.querySelector(".timePeriod");
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
      this[props].clock = null;
      this[props] = null;
      this.onUpdate = null;
      this.onStart = null;
			return this;
		}
  }
});

module.exports = ClockView;

},{"../components/clock":3,"events":1}],12:[function(require,module,exports){
const EventEmitter = require("events");

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
function ProgressCircle(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};
	EventEmitter.apply(this, arguments);
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

ProgressCircle.radians = function (nDeg) {
	nDeg = Number(nDeg);
	return !Number.isNaN(nDeg) ? nDeg * Math.PI/180 : 0;
};

ProgressCircle.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		enumerable: true,
		value: ProgressCircle
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
			drawPieSlice(ctx, cx, cy, r, angle, angle + 2 * Math.PI * (this.min + this.value) / (this.min + this.max), this.lineFill);

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

module.exports = ProgressCircle;
},{"events":1}],13:[function(require,module,exports){
const EventEmitter = require("events");
const Timer = require("../components/timer");
const ProgressDonut = require("./progress-circle");

const $el = Symbol("$el");
const $daysTile = Symbol("$daysTile");
const $minsTile = Symbol("$minsTile");
const $hoursTile = Symbol("$hoursTile");
const $secsTile = Symbol("$secsTile");
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
	EventEmitter.apply(this, arguments);
	this[$el] = null;
	this[$daysTile] = null;
	this[$minsTile] = null;
	this[$hoursTile] = null;
	this[$secsTile] = null;
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

TimerView.prototype = Object.create(EventEmitter.prototype, {
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
			if (!(this[$el] instanceof HTMLElement)) {
				this.render();
			}
			return this[$el];
		}
	},

	/**
	 * @public	property
	 */
	$daysTile: {
		enumerable: true,
		get: function () {
			return this[$daysTile];
		}
	},

	/**
	 * @public	property
	 */
	$minsTile: {
		enumerable: true,
		get: function () {
			return this[$minsTile];
		}
	},

	/**
	 * @public	property
	 */
	$hoursTile: {
		enumerable: true,
		get: function () {
			return this[$hoursTile];
		}
	},

	/**
	 * @public	property
	 */
	$secsTile: {
		enumerable: true,
		get: function () {
			return this[$secsTile];
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
				this.$daysTile.innerHTML = this.timer.daysLeft;
				this.$minsTile.innerHTML = this.timer.hoursLeft;
				this.$hoursTile.innerHTML = this.timer.minutesLeft;
				this.$secsTile.innerHTML = this.timer.secondsLeft;
			}

			this.$daysTile.parentElement.style.display = "";
			this.$hoursTile.parentElement.style.display = "";
			this.$minsTile.parentElement.style.display = "";
			if (this.hideZeroTiles) {
				if (this.timer.daysLeft === 0) {
					this.$daysTile.parentElement.style.display = "none";
					if (this.timer.hoursLeft === 0) {
						this.$hoursTile.parentElement.style.display = "none";
						if (this.timer.minutesLeft === 0) {
							this.$minsTile.parentElement.style.display = "none";
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
			this[$daysTile] = el.querySelector(".days");
			this[$hoursTile] = el.querySelector(".hours");
			this[$minsTile] = el.querySelector(".mins");
			this[$secsTile] = el.querySelector(".secs");

			if (this.supportsCanvas) {
				this._oDaysDonut = new ProgressDonut({ $canvas: this.$daysTile, max: this.timer.daysLeft, value: 0, bgFill: "white", lineFill: "red", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oHrsDonut = new ProgressDonut({ $canvas: this.$hoursTile, max: this.timer.hoursLeft, value: 0, bgFill: "white", lineFill: "green", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oMinsDonut = new ProgressDonut({ $canvas: this.$minsTile, max: this.timer.minutesLeft, value: 0, bgFill: "white", lineFill: "blue", backLineFill: "#dddddd", valueColor: "#777777" });
				this._oSecsDonut = new ProgressDonut({ $canvas: this.$secsTile, max: this.timer.secondsLeft, value: 0, bgFill: "white", lineFill: "orange", backLineFill: "#dddddd", valueColor: "#777777" });
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

},{"../components/timer":5,"./progress-circle":12,"events":1}],14:[function(require,module,exports){

module.exports = {
  Widget: require("./widget"),
  ToggleSwitch: require("./toggleSwitch")
};
},{"./toggleSwitch":15,"./widget":16}],15:[function(require,module,exports){
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
},{"./widget":16}],16:[function(require,module,exports){
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
},{"events":1}]},{},[7])(7)
});
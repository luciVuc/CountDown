
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

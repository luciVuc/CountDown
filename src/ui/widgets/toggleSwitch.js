const Widget = require("./widget");

const _ = Symbol("_");

/**
 * ToggleSwitch
 * JS wrapper for HTML checkbox input, styled with CSS3 to look like a Toggle Switch.
 */
function ToggleSwitch(mSettings) {
	this[_] = {};
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
			this[_].label = typeof mSettings.label === "string" ? mSettings.label : "Switch " + this.id;
			this[_].description = typeof mSettings.label === "string" ? mSettings.description : this.label;
			this[_].name = typeof mSettings.label === "string" ? mSettings.name : this.id + "Checkbox";
			this[_].state = !mSettings.state ? 0 : 1;
			this[_].ontoggle = typeof mSettings.ontoggle === "function" ? mSettings.ontoggle : null;
			return this;
		}
	},

	$inputEl: {
		enumerable: true,
		get: function () {
			return this[_].$inputEl;
		}
	},

	label: {
		enumerable: true,
		set: function (sLabel) {
			this[_].label = typeof sLabel === "string" ? sLabel : "";
			return this;
		},
		get: function () {
			return this[_].label;
		}
	},

	description: {
		enumerable: true,
		set: function (sDescription) {
			this[_].description = typeof sDescription === "string" ? description : "";
			return this;
		},
		get: function () {
			return this[_].description;
		}
	},

	name: {
		enumerable: true,
		set: function (sName) {
			this[_].name = typeof sName === "string" ? sName : "";
			return this;
		},
		get: function () {
			return this[_].name;
		}
	},

	state: {
		enumerable: true,
		set: function (iValue) {
			this[_].state = !!iValue ? 1 : 0;
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
			return this[_].state;
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
				this[_].ontoggle = fn;
			}
			return this;
		},
		get: function () {
			return this[_].ontoggle;
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
			this[_].$inputEl = this.$el.querySelector("input[type=checkbox]");
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
	}

});

ToggleSwitch.STATES = {
	0: "Off",
	1: "On"
};

module.exports = ToggleSwitch;
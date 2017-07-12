const Widget = require("./widget");

const $inputEl = Symbol("$inputEl");
const label = Symbol("label");
const description = Symbol("description");
const name = Symbol("name");
const checked = Symbol("checked");
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
			this[checked] = !!mSettings.checked;
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

	checked: {
		enumerable: true,
		set: function (bChecked) {
			this[checked] = !!bChecked;
			if (this.$inputEl instanceof HTMLInputElement) {
				this.$inputEl.checked = this.checked;
			}
			return this;
		},
		get: function () {
			// return this[checked];
			return this.$inputEl && this.$inputEl.checked;
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
			var oEvent = {
				checked: $Event.target.checked,
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

	getElementTemplate: {
		value: function () {
			var checked = this.checked ? "checked" : "";

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
			this.$inputEl.checked = this.checked;
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

module.exports = ToggleSwitch;
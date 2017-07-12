const Widget = require("./widget");

const $inputEl = Symbol("$inputEl");
const label = Symbol("label");
const description = Symbol("description");
const name = Symbol("name");
const checked = Symbol("checked");
const onchange = Symbol("onchange");

/**
 * ToggleSwitch
 * JS wrapper for HTML checkbox input, styled with CSS3 to look like a Toggle Switch.
 */
function ToggleSwitch(mSettings) {
	this[$inputEl] = null;
	this._fChangeHandler = this.changeHandler.bind(this);
	return Widget.apply(this, arguments);
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
			this[onchange] = typeof mSettings.onchange === "function" ? mSettings.onchange : null;
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
				this.$inputEl.change();
			}
			return this;
		},
		get: function () {
			return this[checked];
		}
	},

	onchange: {
		enumerable: true,
		set: function (fn) {
			if (fn === null || typeof fn === "function") {
				this[onchange] = fn;
			}
			return this;
		},
		get: function () {
			return this[onchange];
		}
	},

	changeHandler: {
		value: function ($Event) {
			var oEvent = {
				checked: $Event.target.checked,
				source: this,
				sourceEvent: $Event
			};
			this.emit("change", oEvent);
			if (typeof this.onchange === "function") {
				this.onchange(oEvent);
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

	postRender: {
		enumerable: true,
		value: function () {
			this[$inputEl] = this.$el.querySelector("input[type=checkbox]");
			this.$inputEl.addEventListener("change", this._fChangeHandler);
			this.$el.classList.add("switch");
			this.$el.setAttribute("data-label", this.label);
			return Widget.prototype.postRender.apply(this, arguments);
		}
	}
});

module.exports = ToggleSwitch;
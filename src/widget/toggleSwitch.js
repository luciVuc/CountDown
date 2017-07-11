const Widget = require("./widget");

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
	mSettings = mSettings instanceof Object ? mSettings : {};
	mSettings.id = mSettings.id || "__ToggleSwitch" + Date.now();
	this[label] = typeof mSettings.label === "string" ? mSettings.label : "Switch " + this.id;
	this[description] = typeof mSettings.label === "string" ? mSettings.description : this.label;
	this[name] = typeof mSettings.label === "string" ? mSettings.name : this.id + "Checkbox";
	this[checked] = !!mSettings.checked;
	this[onchange] = typeof mSettings.onchange === "function" ? mSettings.onchange : null;
	this._fChangeHandler = this._fChangeHandler.bind(this);
	return Widget.apply(this, arguments);
}

ToggleSwitch.prototype = Object.create(Widget.prototype, {
	constructor: {
		value: ToggleSwitch
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

			return `<input type="checkbox" id="switchWidget${this.id}Checkbox" name="${this.name}" class="widget switch-checkbox" ${checked} data-label="${this.label}" title="${this.description}"/>`;
		}
	},

	postRender: {
		enumerable: true,
		value: function () {
			this.$el.querySelector("input[type=checkbox]").addEventListener("change", this._fChangeHandler);
			return Widget.prototype.postRender.apply(this, arguments);
		}
	}
});

module.exports = ToggleSwitch;
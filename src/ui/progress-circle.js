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
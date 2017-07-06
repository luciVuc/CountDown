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
const max = Symbol("max");
const value = Symbol("value");
const backgroundColor = Symbol("backgroundColor");
const color = Symbol("color");
const textColor = Symbol("textColor");

/**
 * @public	Displays a round, doughnut-like progress bar, using HTML canvas.
 * 
 * @param {object}	mSettings	Hashmap of instance values
 * @param {HTMLCanvasElement}	mSettings.$canvas	The HTML canvas element to draw on
 * @param {intenger} mSettings.max The maximum value
 * @param {integer} mSettings.value The current value
 * @param {CSSColor} mSettings.backgroundColor The background color, in CSS format
 * @param {CSSColor} mSettings.color The fore color in CSS format
 * @param {CSSColor} mSettings.textColor The text color in CSS format
 */
function ProgressDonut(mSettings) {
	mSettings = mSettings instanceof Object ? mSettings : {};
	this.$canvas = mSettings.$canvas;
	this[max] = Number.isInteger(mSettings.max) ? mSettings.max : 100;
	this[value] = Number.isInteger(mSettings.value) ? mSettings.value : 0;
	this[backgroundColor] = mSettings.backgroundColor;
	this[color] = mSettings.color;
	this[textColor] = mSettings.textColor;
	return this.draw();
}

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
			if (Number.isInteger(iValue)) {
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
	backgroundColor: {
		enumerable: true,
		set: function (sBackgroundColor) {
			this[backgroundColor] = sBackgroundColor;
			return this.draw();
		},
		get: function () {
			return this[backgroundColor];
		}
	},

	/**
	 * @public	property
	 */
	color: {
		enumerable: true,
		set: function (sColor) {
			this[color] = sColor;
			return this.draw();
		},
		get: function () {
			return this[color];
		}
	},

	/**
	 * @public	property
	 */
	textColor: {
		enumerable: true,
		set: function (sColor) {
			this[textColor] = sColor;
			return this.draw();
		},
		get: function () {
			return this[textColor];
		}
	},

	/**
	 * @public	Draws the state of the instance on an HTMLCanvasElement
	 */
	draw: {
		value: function () {
			var ctx = this.context2d,
				cx = ctx.canvas.width / 2,
				cy = ctx.canvas.height / 2,
				r = Math.min(cx, cy) - 20,
				angle = - Math.PI / 2;

			// clear the canvas
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// draw the shadow of the chart
			ctx.shadowBlur = 2;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;

			// draw the background
			ctx.fillStyle = this.backgroundColor;
			ctx.globalAlpha = 0.8;
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
			drawPieSlice(ctx, cx, cy, r, angle, angle + 2 * Math.PI * this.value / this.max, this.color);

			// draw the pie chart inner content
			ctx.fillStyle = this.backgroundColor;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r - 3, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fill();

			// draw the pie-chart's inner text
			ctx.fillStyle = this.textColor;
			ctx.font = `bold ${r * 0.8}px sans-serif`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(this.value, cx, cy);

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
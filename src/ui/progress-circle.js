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

const _ = Symbol("_");

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
	this[_] = {};
	this.$canvas = mSettings.$canvas;
	this[_].min = Number.isInteger(mSettings.min) ? mSettings.min : 0;
	this[_].max = Number.isInteger(mSettings.max) ? mSettings.max : 100;
	this[_].value = Number.isInteger(mSettings.value) ? mSettings.value : 0;
	this[_].lineWidth = Number.isInteger(mSettings.lineWidth) ? mSettings.lineWidth : 3;
	this[_].lineFill = typeof mSettings.lineFill === "string" ? mSettings.lineFill : "#CCB566";
	this[_].backLineFill = typeof mSettings.backLineFill === "string" ? mSettings.backLineFill : "#FB6929";
	this[_].bgFill = typeof mSettings.bgFill === "string" ? mSettings.bgFill : "#F8FF8E";
	this[_].showValue = typeof mSettings.showValue === "boolean" ? mSettings.showValue : true;
	this[_].valueStyle = typeof mSettings.valueStyle === "string" ? mSettings.valueStyle : "bold " + this.radius * 0.8 + "px sans-serif";
	this[_].valueColor = typeof mSettings.valueColor === "string" ? mSettings.valueColor : "red";
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
			this[_].$canvas = $Canvas;
			this[_].ctx = $Canvas.getContext("2d");
			return this.draw();
		},
		get: function () {
			return this[_].ctx;
		}
	},

	/**
	 * @public	property
	 */
	context2d: {
		enumerable: true,
		get: function () {
			return this[_].ctx;
		}
	},

	/**
	 * @public	property
	 */
	x: {
		enumerable: true,
		get: function () {
			return this[_].ctx.canvas.width / 2;
		}
	},

	/**
	 * @public	property
	 */
	y: {
		enumerable: true,
		get: function () {
			return this[_].ctx.canvas.height / 2;
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
				this[_].min = iMin;
			}
			return this.draw();
		},
		get: function () {
			return this[_].min;
		}
	},

	/**
	 * @public	property
	 */
	max: {
		enumerable: true,
		set: function (iMax) {
			if (Number.isInteger(iMax)) {
				this[_].max = iMax;
			}
			return this.draw();
		},
		get: function () {
			return this[_].max;
		}
	},

	/**
	 * @public	property
	 */
	value: {
		enumerable: true,
		set: function (iValue) {
			if (Number.isInteger(iValue) && iValue >= this.min && iValue <= this.max) {
				this[_].value = iValue;
			}
			return this.draw();
		},
		get: function () {
			return this[_].value;
		}
	},

	/**
	 * @public	property
	 */
	lineWidth: {
		enumerable: true,
		set: function (iLineWidth) {
			this[_].lineWidth = Number.isInteger(iLineWidth) ? Math.abs(iLineWidth) : this[_].lineWidth;
			return this.draw();
		},
		get: function () {
			return this[_].lineWidth;
		}
	},

	/**
	 * @public	property
	 */
	lineFill: {
		enumerable: true,
		set: function (sLineFill) {
			this[_].lineFill = typeof sLineFill === "string" ? sLineFill : this[_].lineFill;
			return this.draw();
		},
		get: function () {
			return this[_].lineFill;
		}
	},

	/**
	 * @public	property
	 */
	backLineFill: {
		enumerable: true,
		set: function (sBackLineFill) {
			this[_].backLineFill = typeof sBackLineFill === "string" ? sBackLineFill : this[_].backLineFill;
			return this.draw();
		},
		get: function () {
			return this[_].backLineFill;
		}
	},

	/**
	 * @public	property
	 */
	bgFill: {
		enumerable: true,
		set: function (sBgFill) {
			this[_].bgFill = typeof sBgFill === "string" ? sBgFill : this[_].bgFill;
			return this.draw();
		},
		get: function () {
			return this[_].bgFill;
		}
	},

	/**
	 * @public	property
	 */
	showValue: {
		enumerable: true,
		set: function (bShowInfoText) {
			this[_].showValue = typeof bShowInfoText === "boolean" ? bShowInfoText : this[_].showValue;
			return this.draw();
		},
		get: function () {
			return this[_].showValue;
		}
	},

	/**
	 * @public	property
	 */
	valueStyle: {
		enumerable: true,
		set: function (sInfoStyle) {
			this[_].valueStyle = typeof sInfoStyle === "string" ? sInfoStyle : this[_].valueStyle;
			return this.draw();
		},
		get: function () {
			return this[_].valueStyle;
		}
	},

	/**
	 * @public	property
	 */
	valueColor: {
		enumerable: true,
		set: function (sInfoColor) {
			this[_].valueColor = typeof sInfoColor === "string" ? sInfoColor : this[_].valueColor;
			return this.draw();
		},
		get: function () {
			return this[_].valueColor;
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
			this[_].context2d = null;
			this[_].$canvas = null;
			return this;
		}
	}
});

module.exports = ProgressCircle;
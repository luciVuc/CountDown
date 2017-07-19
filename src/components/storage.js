const sKey = "countdown";
const DEFAULTS = {
	countdownText: "Countdown is Over",
	endCountdownText: "Countdown Over",
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
	 * 	<li>countdownText, {string}</li>
	 * 	<li>endCountdownText, {string}</li>
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
				countdownText: typeof json.countdownText === "string" ? json.countdownText : DEFAULTS.countdownText,
				endCountdownText: typeof json.endCountdownText === "string" ? json.endCountdownText : DEFAULTS.endCountdownText,
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
	 * @param mJSON.countdownText	{string}	Text to display while counting down
	 * @param mJSON.endCountdownText	{string}	Text to display when countdown is over
	 */
	set: {
		enumerable: true,
		value: function (mJSON) {
			mJSON = mJSON instanceof Object ? mJSON : {};
			var m = {
				final: Number.isInteger(mJSON.final) ? mJSON.final : null,
				countdownText: typeof mJSON.countdownText === "string" ? mJSON.countdownText : DEFAULTS.countdownText,
				endCountdownText: typeof mJSON.endCountdownText === "string" ? mJSON.endCountdownText : DEFAULTS.endCountdownText,
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
				countdownText: DEFAULTS.countdownText,
				endCountdownText: DEFAULTS.endCountdownText,
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
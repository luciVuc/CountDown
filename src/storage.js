const sKey = "countdown";

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
				ongoingText: typeof json.ongoingText === "string" ? json.ongoingText : "Remaining Time",
				finalText: typeof json.finalText === "string" ? json.finalText : "Done",
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
				ongoingText: typeof mJSON.ongoingText === "string" ? mJSON.ongoingText : "Remaining Time",
				finalText: typeof mJSON.finalText === "string" ? mJSON.finalText : "Done",
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
				ongoingText: "Remaining Time",
				finalText: "Done",
				hideZeroTiles: false
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
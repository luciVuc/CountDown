const DETAILS = 'details';
const SUMMARY = 'summary';

/**
 * Checks for support for `<details>`
 * 
 * @returns 
 */
function checkSupport() {
	var body = document.querySelector("body"),
		el = document.createElement(DETAILS);

	if (!('open' in el)) {
		return false;
	}
	el.innerHTML = `<${SUMMARY}>a</${SUMMARY}>b`;
	body.appendChild(el);

	var diff = el.offsetHeight;
	el.open = true;

	var result = (diff !== el.offsetHeight);
	body.removeChild(el);
	return result;
}

/**
 * Injects styles (idempotent)
 * 
 * @param {*} id 
 * @param {*} style 
 */
function injectStyle(id, style) {
	if (document.getElementById(id)) {
		return;
	}

	var el = document.createElement('style');
	el.id = id;
	el.innerHTML = style;
	document.getElementsByTagName('head')[0].appendChild(el);
}

/**
 * Click handler for `<summary>` tags
 */
function clickHandler(e) {
	if (e.target.nodeName.toLowerCase() === SUMMARY) {
		var details = e.target.parentNode,
			sOpen = 'open';

		if (details) {
			// define the 'open' attribute as a property, if not defined 
			// if (details.hasOwnProperty("open") === false) {
			if (details instanceof HTMLUnknownElement && typeof details._open === "undefined") {
				Object.defineProperty(details, "open", {
					set: function (bVal) {
						if (bVal === true) {
							this._open = true;
							this.setAttribute("open", "open");
						} else {
							this._open = false;
							this.removeAttribute("open");
						}
						return this;
					},
					get: function () {
						return this._open;
					}
				});
			}
			// set the 'open' attribute
			if (details.getAttribute(sOpen)) {
				details.open = false;
			} else {
				details.open = true;
			}
		}
	}
	return;
}

/**
 * HTML5 Details Polyfill
 */
window.addEventListener("load", function () {
	if (!checkSupport()) {
		// Add a classname
		document.documentElement.className += ' no-details';
		document.addEventListener('click', clickHandler, false);
		injectStyle('details-polyfill-style', `html.no-details ${DETAILS}:not([open]) > :not(${SUMMARY}) { display: none; }	html.no-details  ${DETAILS} > ${SUMMARY}:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; } html.no-details  ${DETAILS}[open] > ${SUMMARY}:before { content: "▼"; display: block;}`);
	}
});

module.exports = true;
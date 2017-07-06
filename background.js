/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function (launchData) {
  wnd = chrome.app.window.create(
    'popup.html',
    {
      id: 'mainWindow',
      bounds: { width: 550, height: 300 }
    }
  );
});

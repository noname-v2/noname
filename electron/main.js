const { app, BrowserWindow } = require('electron');

// FIXME
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

let win;

function createWindow() {
	win = new BrowserWindow({
		width: 960,
		height: 850,
		x: 20,
		y: 180,
		title: '无名杀',
		webPreferences: {
			nodeIntegration: true
		}
	});
	win.setMenuBarVisibility(false);
	win.webContents.openDevTools(); // FIXME
	win.on('closed', () => {
		win = null;
	});
	win.loadFile('index.html')
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
	app.quit();
});
app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});

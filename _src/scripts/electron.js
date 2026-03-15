const { app, BrowserWindow } = require('electron');
const express = require('express');
const path = require('path');
const { networkInterfaces } = require('os');
const portfinder = require('portfinder');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true

let win;
let server = null;

function createWindow() {
	win = new BrowserWindow({
		width: 960,
		height: 850,
		x: 20,
		y: 180,
		title: 'Noname',
		webPreferences: {
			nodeIntegration: true
		}
	});
	win.setMenuBarVisibility(false);
	win.webContents.openDevTools(); // FIXME
	win.on('closed', () => {
		win = null;
	});
	if (server === null) {
		const expressApp = express();
		// Serve static files
		expressApp.use(express.static(path.join(__dirname, '../dist/debug')));
		
		portfinder.basePort = 8088;
		portfinder.getPort((err, port) => {
			if (err) {
				throw(err);
			}
			
			server = expressApp.listen(port, () => {
				win.loadURL('http://127.0.0.1:' + port);
				const ifaces = networkInterfaces();
				
				for (const dev in ifaces) {
					for (const details of ifaces[dev]) {
						if (details.family === 'IPv4') {
							win.webContents.executeJavaScript(`console.log('  http://${details.address}:${port}')`)
						}
					}
				}
			});
		});
	}
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

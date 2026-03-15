const { app, BrowserWindow } = require("electron");
const { path } = require("path");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 960,
        height: 850,
        // x: 20,
        // y: 180,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    app.quit();
});

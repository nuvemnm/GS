const path = require('path');
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

let mainWindow;
let flaskProcess;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Ground Station',
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, 'assets/logo_oficial_branca.png'),
        autoHideMenuBar: true,
        webPreferences: {
            // Permitir acesso normal à web (para fetch)
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Aguardar Flask iniciar e carregar a página
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5000');
    }, 2000); // 3 segundos para Flask iniciar

    //mainWindow.webContents.openDevTools();
}

function startFlaskServer() {
    // Iniciar o servidor Flask
    flaskProcess = spawn('python', ['data_collect.py'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    flaskProcess.on('error', (error) => {
        console.error('Erro ao iniciar Flask:', error);
    });
}

app.whenReady().then(() => {
    // Primeiro inicia o Flask, depois o Electron
    startFlaskServer();
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Fechar Flask quando fechar o Electron
    if (flaskProcess) {
        flaskProcess.kill();
    }
    app.quit();
});
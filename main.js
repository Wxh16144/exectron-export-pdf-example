// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.webContents.setWindowOpenHandler((details) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        show: false, // 不显示窗口可以静默打印
      }
    };
  })

  mainWindow.webContents.on('did-create-window', (event, details) => {
    event.webContents.once('did-finish-load', () => {
      const { url } = details
      const { host } = new URL(url)
      dialog
        .showSaveDialog(mainWindow, {
          title: '保存文件',
          defaultPath: path.join(os.homedir(), 'Desktop', `${host}.pdf`),
        })
        .then(file => Promise.resolve(file.filePath))
        .then((filePath) => {
          event.webContents
            .printToPDF({
              printBackground: true,
              pageSize: 'A4'
            })
            .then((data) =>
              fs.writeFileSync(filePath, data)
            ).then(() => {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '提示',
                message: '保存成功',
              })
            })
            .catch(err => {
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: '错误',
                message: err.message,
              })
            })
            .finally(() => {
              event.close()
            })
        })
    })
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

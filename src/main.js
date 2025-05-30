const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ytdlp = require('./utils/ytdlp');

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false, // 不直接集成Node.js
      contextIsolation: true, // 上下文隔离
      preload: path.join(__dirname, 'preload.js') // 使用预加载脚本
    }
  });

  // 加载应用的index.html
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 打开开发者工具（开发时使用，发布时可注释）
  // mainWindow.webContents.openDevTools();

  // 当窗口关闭时调用的方法
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (mainWindow === null) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，用户通常希望点击dock图标重新打开应用
  if (process.platform !== 'darwin') app.quit();
});

// 处理IPC通信
// 获取视频信息
ipcMain.handle('get-video-info', async (event, url, cookiesPath) => {
  try {
    return await ytdlp.getVideoInfo(url, cookiesPath);
  } catch (error) {
    console.error('获取视频信息失败:', error);
    return { error: error.message };
  }
});

// 下载视频
ipcMain.handle('download-video', async (event, url, format, audioFormat, outputPath, cookiesPath) => {
  try {
    const downloadProcess = ytdlp.downloadVideo(url, format, audioFormat, outputPath, cookiesPath);
    
    // 监听下载进度
    downloadProcess.on('progress', (progress) => {
      mainWindow.webContents.send('download-progress', progress);
    });
    
    // 监听下载完成
    downloadProcess.on('complete', (result) => {
      mainWindow.webContents.send('download-complete', result);
    });
    
    // 监听下载错误
    downloadProcess.on('error', (error) => {
      mainWindow.webContents.send('download-error', error);
    });
    
    return { success: true, message: '下载已开始' };
  } catch (error) {
    console.error('下载视频失败:', error);
    return { error: error.message };
  }
});

// 选择文件对话框
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || []
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { filePath: result.filePaths[0] };
});

// 选择目录对话框
ipcMain.handle('select-directory', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { directoryPath: result.filePaths[0] };
});
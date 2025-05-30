const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 视频信息相关
  getVideoInfo: (url, cookiesPath) => 
    ipcRenderer.invoke('get-video-info', url, cookiesPath),

  // 下载相关
  downloadVideo: (url, format, audioFormat, outputPath, cookiesPath) =>
    ipcRenderer.invoke('download-video', url, format, audioFormat, outputPath, cookiesPath),
  
  // 文件选择相关
  selectFile: (options) => 
    ipcRenderer.invoke('select-file', options),
  selectDirectory: () => 
    ipcRenderer.invoke('select-directory'),

  // 监听下载进度
  onDownloadProgress: (callback) =>
    ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  
  // 监听下载完成
  onDownloadComplete: (callback) =>
    ipcRenderer.on('download-complete', (event, result) => callback(result)),
  
  // 监听下载错误
  onDownloadError: (callback) =>
    ipcRenderer.on('download-error', (event, error) => callback(error)),

  // 移除事件监听器
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('download-complete');
    ipcRenderer.removeAllListeners('download-error');
  }
});
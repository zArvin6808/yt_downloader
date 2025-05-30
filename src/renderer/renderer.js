// DOM元素
const elements = {
    videoUrl: document.getElementById('videoUrl'),
    fetchInfo: document.getElementById('fetchInfo'),
    useCookies: document.getElementById('useCookies'),
    cookiesGroup: document.getElementById('cookiesGroup'),
    cookiesPath: document.getElementById('cookiesPath'),
    selectCookies: document.getElementById('selectCookies'),
    videoInfo: document.getElementById('videoInfo'),
    thumbnail: document.getElementById('thumbnail'),
    videoTitle: document.getElementById('videoTitle'),
    videoDetails: document.getElementById('videoDetails'),
    formatSelect: document.getElementById('formatSelect'),
    audioFormatSelect: document.getElementById('audioFormatSelect'),
    downloadSection: document.getElementById('downloadSection'),
    outputPath: document.getElementById('outputPath'),
    selectOutput: document.getElementById('selectOutput'),
    startDownload: document.getElementById('startDownload'),
    progressSection: document.getElementById('progressSection'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    downloadStatus: document.getElementById('downloadStatus'),
    errorToast: document.getElementById('errorToast'),
    errorMessage: document.getElementById('errorMessage')
};

// 存储视频信息
let currentVideoInfo = null;

// 工具函数
const utils = {
    // 显示错误提示
    showError: (message) => {
        // 检查是否是cookies过期错误
        if (message.includes('Cookies已过期或无效')) {
            elements.errorMessage.innerHTML = `
                Cookies已过期或无效，请更新cookies文件。<br>
                <small>提示：可以使用浏览器插件导出新的cookies文件，或参考
                <a href="https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp" 
                   target="_blank">yt-dlp文档</a>
                获取更多帮助。</small>
            `;
        } else {
            elements.errorMessage.textContent = message;
        }
        elements.errorToast.classList.remove('hidden');
        setTimeout(() => {
            elements.errorToast.classList.add('hidden');
        }, 8000);  // 对于cookies错误，显示时间稍长一些
    },

    // 格式化文件大小
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },

    // 格式化持续时间
    formatDuration: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s]
            .map(v => v.toString().padStart(2, '0'))
            .filter((v, i) => v !== '00' || i > 0)
            .join(':');
    },

    // 更新进度条
    updateProgress: (progress) => {
        elements.progressBar.style.width = `${progress}%`;
        elements.progressText.textContent = `${progress}%`;
    },

    // 重置UI状态
    resetUI: () => {
        elements.videoInfo.classList.add('hidden');
        elements.downloadSection.classList.add('hidden');
        elements.progressSection.classList.add('hidden');
        elements.progressBar.style.width = '0%';
        elements.progressText.textContent = '0%';
        elements.downloadStatus.textContent = '';
        currentVideoInfo = null;
    }
};

// 事件处理函数
const handlers = {
    // 获取视频信息
    fetchVideoInfo: async () => {
        const url = elements.videoUrl.value.trim();
        if (!url) {
            utils.showError('请输入视频URL');
            return;
        }

        try {
            elements.fetchInfo.disabled = true;
            elements.fetchInfo.textContent = '获取中...';
            utils.resetUI();

            const cookiesPath = elements.useCookies.checked ? elements.cookiesPath.value : null;
            const info = await window.electronAPI.getVideoInfo(url, cookiesPath);

            if (info.error) {
                throw new Error(info.error);
            }

            currentVideoInfo = info;

            // 更新UI显示视频信息
            elements.thumbnail.src = info.thumbnail;
            elements.videoTitle.textContent = info.title;
            elements.videoDetails.textContent = `时长: ${utils.formatDuration(info.duration)} | 上传者: ${info.uploader}`;

            // 更新视频格式选择下拉框
            elements.formatSelect.innerHTML = info.formats
                .map((format, index) => `
                    <option value="${index}">
                        ${format.quality} - ${format.ext} 
                        ${format.filesize ? `(${utils.formatFileSize(format.filesize)})` : ''}
                    </option>
                `)
                .join('');

            // 更新音频格式选择下拉框
            elements.audioFormatSelect.innerHTML = info.audioFormats
                .map((format, index) => `
                    <option value="${index}">
                        ${format.quality} - ${format.ext} 
                        ${format.filesize ? `(${utils.formatFileSize(format.filesize)})` : ''}
                    </option>
                `)
                .join('');

            // 显示视频信息和下载区域
            elements.videoInfo.classList.remove('hidden');
            elements.downloadSection.classList.remove('hidden');
        } catch (error) {
            utils.showError(error.message);
        } finally {
            elements.fetchInfo.disabled = false;
            elements.fetchInfo.textContent = '获取信息';
        }
    },

    // 开始下载
    startDownload: async () => {
        if (!currentVideoInfo) {
            utils.showError('请先获取视频信息');
            return;
        }

        if (!elements.outputPath.value) {
            utils.showError('请选择保存位置');
            return;
        }

        try {
            elements.startDownload.disabled = true;
            elements.startDownload.textContent = '准备下载...';
            elements.progressSection.classList.remove('hidden');

            const selectedFormat = currentVideoInfo.formats[elements.formatSelect.value];
            const selectedAudioFormat = currentVideoInfo.audioFormats[elements.audioFormatSelect.value];
            const cookiesPath = elements.useCookies.checked ? elements.cookiesPath.value : null;

            const result = await window.electronAPI.downloadVideo(
                elements.videoUrl.value,
                selectedFormat,
                selectedAudioFormat,
                elements.outputPath.value,
                cookiesPath
            );

            if (result.error) {
                throw new Error(result.error);
            }

            elements.downloadStatus.textContent = '下载已开始...';
        } catch (error) {
            utils.showError(error.message);
            elements.progressSection.classList.add('hidden');
            elements.startDownload.disabled = false;
            elements.startDownload.textContent = '开始下载';
        }
    },

    // 选择cookies文件
    selectCookiesFile: async () => {
        try {
            const result = await window.electronAPI.selectFile({
                filters: [
                    { name: 'Text Files', extensions: ['txt'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                elements.cookiesPath.value = result.filePath;
            }
        } catch (error) {
            utils.showError('选择cookies文件失败');
        }
    },

    // 选择输出目录
    selectOutputDirectory: async () => {
        try {
            const result = await window.electronAPI.selectDirectory();
            if (!result.canceled && result.directoryPath) {
                elements.outputPath.value = result.directoryPath;
            }
        } catch (error) {
            utils.showError('选择保存位置失败');
        }
    }
};

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 按钮点击事件
    elements.fetchInfo.addEventListener('click', handlers.fetchVideoInfo);
    elements.selectCookies.addEventListener('click', handlers.selectCookiesFile);
    elements.selectOutput.addEventListener('click', handlers.selectOutputDirectory);
    elements.startDownload.addEventListener('click', handlers.startDownload);

    // Cookies复选框变化事件
    elements.useCookies.addEventListener('change', (e) => {
        elements.cookiesGroup.classList.toggle('hidden', !e.target.checked);
    });

    // 错误提示关闭按钮
    elements.errorToast.querySelector('.close-btn').addEventListener('click', () => {
        elements.errorToast.classList.add('hidden');
    });

    // 下载进度监听
    window.electronAPI.onDownloadProgress((progress) => {
        utils.updateProgress(progress);
    });

    // 下载完成监听
    window.electronAPI.onDownloadComplete((result) => {
        elements.downloadStatus.textContent = '下载完成！';
        elements.startDownload.disabled = false;
        elements.startDownload.textContent = '开始下载';
    });

    // 下载错误监听
    window.electronAPI.onDownloadError((error) => {
        utils.showError(error);
        elements.progressSection.classList.add('hidden');
        elements.startDownload.disabled = false;
        elements.startDownload.textContent = '开始下载';
    });
});

// 页面关闭时清理事件监听器
window.addEventListener('unload', () => {
    window.electronAPI.removeAllListeners();
});
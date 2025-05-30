const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const isDev = require('electron').app.isPackaged === false;

class YtDlpDownloader extends EventEmitter {
    constructor() {
        super();
        // 根据开发环境或生产环境确定yt-dlp路径
        this.ytDlpPath = isDev
            ? path.join(process.cwd(), 'resources', 'bin', 'yt-dlp.exe')
            : path.join(process.resourcesPath, 'bin', 'yt-dlp.exe');
    }

    // 获取视频信息
    async getVideoInfo(url, cookiesPath = null) {
        try {
            const args = [
                '--no-warnings',
                '--dump-json',
                '--no-playlist',
            ];

            if (cookiesPath) {
                args.push('--cookies', cookiesPath);
            }

            args.push(url);

            const result = await this._executeCommand(args);
            const info = JSON.parse(result);

            // 提取所需的格式信息
            const formats = this._parseFormats(info.formats);

            return {
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration,
                uploader: info.uploader || info.channel || '未知',
                formats: formats.video,
                audioFormats: formats.audio
            };
        } catch (error) {
            // 检查是否是cookies相关的错误
            if (error.message.includes('Sign in to confirm you') || 
                error.message.includes('cookies') ||
                error.message.includes('bot')) {
                throw new Error('Cookies已过期或无效，请更新cookies文件');
            }
            throw new Error(`获取视频信息失败: ${error.message}`);
        }
    }

    // 下载视频
    downloadVideo(url, format, audioFormat, outputPath, cookiesPath = null) {
        const downloadEmitter = new EventEmitter();
        
        // 构建输出模板
        const outputTemplate = path.join(outputPath, '%(title)s.%(ext)s');

        // 构建格式参数，如果同时有视频和音频格式，则使用格式ID组合
        let formatArg = format.format_id;
        if (audioFormat && audioFormat.format_id) {
            formatArg = `${format.format_id}+${audioFormat.format_id}`;
        }

        const args = [
            '--no-warnings',
            '--no-playlist',
            '-f', formatArg,
            '-o', outputTemplate
        ];

        if (cookiesPath) {
            args.push('--cookies', cookiesPath);
        }

        args.push(url);

        const process = spawn(this.ytDlpPath, args);
        let lastProgress = 0;

        process.stdout.on('data', (data) => {
            const output = data.toString();
            // 解析下载进度
            const progressMatch = output.match(/(\d+\.?\d*)%/);
            if (progressMatch) {
                const progress = parseFloat(progressMatch[1]);
                if (progress !== lastProgress) {
                    lastProgress = progress;
                    downloadEmitter.emit('progress', progress);
                }
            }
        });

        process.stderr.on('data', (data) => {
            const error = data.toString();
            // 检查是否是cookies相关的错误
            if (error.includes('Sign in to confirm you') || 
                error.includes('cookies') ||
                error.includes('bot')) {
                downloadEmitter.emit('error', 'Cookies已过期或无效，请更新cookies文件');
            } else {
                downloadEmitter.emit('error', error);
            }
        });

        process.on('close', (code) => {
            if (code === 0) {
                downloadEmitter.emit('complete', { success: true });
            } else {
                downloadEmitter.emit('error', '下载过程中出现错误');
            }
        });

        return downloadEmitter;
    }

    // 解析视频和音频格式
    _parseFormats(formats) {
        // 分别处理视频和音频格式
        const videoFormats = formats
            .filter(format => format.vcodec !== 'none')
            .map(format => {
                let quality = '';
                if (format.height) {
                    quality += `${format.height}p`;
                    if (format.fps) {
                        quality += `${format.fps}fps`;
                    }
                }
                if (format.vcodec) {
                    quality += ` [${format.vcodec.split('.')[0]}]`;
                }

                return {
                    format_id: format.format_id,
                    ext: format.ext,
                    quality: quality,
                    filesize: format.filesize,
                    vcodec: format.vcodec,
                    acodec: format.acodec,
                    type: 'video'
                };
            });

        const audioFormats = formats
            .filter(format => format.vcodec === 'none' && format.acodec !== 'none')
            .map(format => {
                let quality = '';
                if (format.abr) {
                    quality += `${format.abr}kbps`;
                }
                if (format.acodec) {
                    quality += ` [${format.acodec.split('.')[0]}]`;
                }

                return {
                    format_id: format.format_id,
                    ext: format.ext,
                    quality: quality,
                    filesize: format.filesize,
                    vcodec: format.vcodec,
                    acodec: format.acodec,
                    type: 'audio'
                };
            });

        // 按质量排序并返回所有格式
        return {
            video: videoFormats.sort((a, b) => {
                const aQuality = parseInt(a.format_id);
                const bQuality = parseInt(b.format_id);
                return bQuality - aQuality;
            }),
            audio: audioFormats.sort((a, b) => {
                const aQuality = parseInt(a.format_id);
                const bQuality = parseInt(b.format_id);
                return bQuality - aQuality;
            })
        };
    }

    // 执行yt-dlp命令
    _executeCommand(args) {
        return new Promise((resolve, reject) => {
            let output = '';
            let error = '';

            const process = spawn(this.ytDlpPath, args);

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(error || '执行命令失败'));
                }
            });

            process.on('error', (err) => {
                reject(new Error(`启动yt-dlp失败: ${err.message}`));
            });
        });
    }
}

// 创建单例实例
const ytdlp = new YtDlpDownloader();

module.exports = {
    getVideoInfo: (url, cookiesPath) => ytdlp.getVideoInfo(url, cookiesPath),
    downloadVideo: (url, format, outputPath, cookiesPath) => 
        ytdlp.downloadVideo(url, format, outputPath, cookiesPath)
};

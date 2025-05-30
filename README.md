# yt_downloader

这是一个 Windows 批处理脚本，用于通过 `yt-dlp` 工具从 YouTube 下载 **最大支持 2K 分辨率（1440p）的视频** ，并使用 `ffmpeg` 自动合并音视频。  
脚本支持下载单个视频或整个播放列表，并利用本地 cookies 实现登录状态访问受限制内容。

* * *

### 功能亮点：

*   🔧 支持 **YouTube 单个视频 / 播放列表**
*   🎬 下载 **最高 2K (1440p) 分辨率 MP4 视频**
*   📂 使用 cookies 登录，可访问会员专属内容
*   📦 内置 ffmpeg 支持，自动完成视频格式合并与转换
*   🌐 中文提示界面，操作简单易懂

* * *

### 使用前提：

1.  安装好 `yt-dlp.exe` 和 `ffmpeg`
2.  准备有效的 YouTube cookies 文件（如：`cookies.txt`）
3.  正确设置脚本中对应的路径

* * *

### 推荐命名文件说明：

你可以将该脚本保存为：

1

yt\_2k\_downloader.bat

并在同一目录下确保有以下文件：

*   `yt-dlp.exe`
*   `ffmpeg.exe`
*   `cookies.txt`（由浏览器导出）

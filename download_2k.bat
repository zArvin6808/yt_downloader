@echo off
chcp 65001 >nul
title YouTube 2K 视频下载器（yt-dlp）
setlocal enabledelayedexpansion

:: 设置路径
set "YTDLP=D:\environment\ffmpeg\ffmpeg-2025-03-31\bin\yt-dlp.exe"
set "COOKIES=D:\environment\ffmpeg\ffmpeg-2025-03-31\bin\cookies.txt"
set "FFMPEG_PATH=D:\environment\ffmpeg\ffmpeg-2025-03-31\bin"

:: 设置 ffmpeg 路径
set "PATH=%FFMPEG_PATH%;%PATH%"

:: 中文提示
echo.
echo ========================================
echo        YouTube 2K 视频下载脚本          
echo   （使用 yt-dlp + cookies + ffmpeg）    
echo ========================================
echo.

:: 输入链接
set /p VIDEO_URL=请输入视频地址（支持 YouTube 播放列表）：

echo.
echo 正在开始下载，请稍候...
echo.

:: 执行下载
"%YTDLP%" ^
 --cookies "%COOKIES%" ^
 --ffmpeg-location "%FFMPEG_PATH%" ^
 -f "bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[height<=1440]" ^
 -o "%%(title)s.%%(ext)s" ^
 "%VIDEO_URL%"

echo.
echo 下载完成！按任意键退出...
pause >nul

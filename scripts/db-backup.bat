@echo off
setlocal

:: --- CONFIGURATION ---
set DB_NAME=beton
set DB_USER=postgres
set BACKUP_DIR=C:\backups\beton
set PG_BIN="C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"

:: Create backup directory if not exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Timestamp (YYYY-MM-DD_HH-MM)
set TIMESTAMP=%date:~10,4%-%date:~4,2%-%date:~7,2%_%time:~0,2%-%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

set FILE_NAME=%BACKUP_DIR%\beton_backup_%TIMESTAMP%.sql

echo [LOG] Starting backup for %DB_NAME%...
%PG_BIN% -U %DB_USER% %DB_NAME% > "%FILE_NAME%"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backup created: %FILE_NAME%
) else (
    echo [ERROR] Backup failed!
)

:: Retention: Delete backups older than 7 days
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -7 /c "cmd /c del @path"

endlocal

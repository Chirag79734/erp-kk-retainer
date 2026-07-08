@echo off
echo ==================================================
echo KK Retainer ERP - Push to GitHub Script
echo ==================================================
echo.

:: Initialize git repository if not already done
if not exist .git (
    echo [1/4] Initializing Git repository...
    git init
    git branch -M main
) else (
    echo [1/4] Git repository already initialized.
)

:: Add remote origin if not already added
git remote get-url origin >/dev/null 2>&1
if %errorlevel% neq 0 (
    echo [2/4] Adding remote origin...
    git remote add origin https://github.com/Chirag79734/erp-kk-retainer.git
) else (
    echo [2/4] Remote origin already set.
)

echo [3/4] Staging files and committing...
git add .
git commit -m "Initialize KK Retainer ERP dashboard frontend with Airtel LOB and Retainer Type split rules"

echo.
echo [4/4] Pushing to GitHub (main branch)...
echo (If prompted, please enter your GitHub credentials/Personal Access Token)
echo.
git push -u origin main

echo.
echo ==================================================
echo Push process completed! Press any key to close.
echo ==================================================
pause

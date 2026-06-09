@echo off
title Obsidian Graph Widget
cd /d "%~dp0"
echo Starting Obsidian Graph Widget...
node_modules\.bin\electron.cmd .

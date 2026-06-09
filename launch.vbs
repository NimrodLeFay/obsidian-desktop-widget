' Obsidian Graph Widget – silent launcher (no CMD window)
' Double-click this file to run the widget.
Option Explicit

Dim shell, scriptDir, electronPath, cmd

Set shell = CreateObject("WScript.Shell")

' Get folder where this .vbs lives
scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Path to electron executable inside node_modules
electronPath = scriptDir & "node_modules\.bin\electron.cmd"

' Build command: electron.cmd accepts the app directory as argument
cmd = """" & electronPath & """ """ & scriptDir & """"

' Run hidden (0 = no window), not waiting for exit
shell.Run "cmd /c " & cmd, 0, False

Set shell = Nothing

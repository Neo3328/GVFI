' GVFI — 静默启动桌面版（无命令行窗口）
' Developed by Mr. Gong · Copyright © 2026 Mr. Gong. All Rights Reserved.

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
root = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = root
WshShell.Run """" & root & "\scripts\launch-desktop.vbs""", 0, False

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
root = FSO.GetParentFolderName(FSO.GetParentFolderName(WScript.ScriptFullName))
WshShell.CurrentDirectory = root
WshShell.Run "cmd /c """ & root & "\scripts\launch-desktop.cmd""", 0, False

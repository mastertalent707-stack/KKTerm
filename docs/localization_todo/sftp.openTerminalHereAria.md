# sftp.openTerminalHereAria

- **English value**: `Open terminal in {{pane}} folder`
- **Namespace**: `sftp`
- **File/component**: `src/modules/workspace/connections/sftp/SftpFilePane.tsx`
- **UI role**: `tooltip`
- **User flow**: `Shown as the tooltip and accessible label for the file-browser pane action that opens a local terminal in the current folder.`
- **Tone**: `concise/neutral`
- **Placeholders**: `{{pane}}; must survive unchanged in every locale`
- **Context/meaning**: `Open means launch a terminal Session at the currently displayed local folder, not open a file or expand a disclosure.`
- **Domain notes**: `Terminal is KKTerm's local terminal Pane. For SFTP/FTP browsers, this action is local-side only because the remote side is not a local filesystem directory.`

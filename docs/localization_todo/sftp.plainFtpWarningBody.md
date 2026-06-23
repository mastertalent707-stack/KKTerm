# sftp.plainFtpWarningBody

- **English value**: `Plain FTP sends credentials and file contents without encryption.`
- **Namespace**: `sftp`
- **File/component**: `src/modules/workspace/connections/sftp/SftpWorkspace.tsx`
- **UI role**: `error`
- **User flow**: `Shown in an app-owned warning dialog when the SSH-toolbar file browser switches to plain FTP, including after an FTPS fallback.`
- **Tone**: `direct security warning`
- **Placeholders**: `none`
- **Context/meaning**: `Plain FTP means FTP without TLS encryption. Credentials are usernames/passwords sent to the remote server.`
- **Domain notes**: `Keep FTP as a protocol term. This warning is about transport encryption, not password storage.`

<!--
Filename: sftp.plainFtpWarningBody.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->

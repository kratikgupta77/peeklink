
; Minimal NSIS template (Windows)
!define APPNAME "PeekLink"
!define COMPANY "PeekLink Team"
!define VERSION "0.1.0"
OutFile "PeekLinkInstaller-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\PeekLink"

Section "Install"
  SetOutPath "$INSTDIR"
  ; Place extension files
  File /r "..\extension_mv3\*.*"
  ; Registry for Chrome external extension (placeholder extension id)
  WriteRegStr HKCU "Software\Google\Chrome\Extensions\peeklinkid" "path" "$INSTDIR"
  WriteRegStr HKCU "Software\Google\Chrome\Extensions\peeklinkid" "version" "${VERSION}"
SectionEnd

Section "Uninstall"
  DeleteRegKey HKCU "Software\Google\Chrome\Extensions\peeklinkid"
  RMDir /r "$INSTDIR"
SectionEnd

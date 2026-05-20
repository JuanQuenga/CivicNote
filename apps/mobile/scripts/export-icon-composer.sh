#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICTOOL="/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
ICON_DOCUMENT="$ROOT_DIR/assets/CivicNote.icon"
OUTPUT="$ROOT_DIR/assets/icon.png"
IOS_OUTPUT="$ROOT_DIR/ios/CivicNote/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"

"$ICTOOL" "$ICON_DOCUMENT" \
  --export-image \
  --output-file "$OUTPUT" \
  --platform iOS \
  --rendition Default \
  --width 1024 \
  --height 1024 \
  --scale 1

cp "$OUTPUT" "$ROOT_DIR/assets/icon-composer.png"
cp "$OUTPUT" "$IOS_OUTPUT"

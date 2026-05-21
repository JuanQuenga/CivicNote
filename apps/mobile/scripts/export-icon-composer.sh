#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ICTOOL="/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
ICON_DOCUMENT="$ROOT_DIR/assets/CivicNote.icon"
OUTPUT="$ROOT_DIR/assets/icon.png"
IOS_OUTPUT="$ROOT_DIR/ios/CivicNote/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
BACKGROUND="#D9151E"

"$ICTOOL" "$ICON_DOCUMENT" \
  --export-image \
  --output-file "$OUTPUT" \
  --platform iOS \
  --rendition Default \
  --width 1024 \
  --height 1024 \
  --scale 1

python3 - "$OUTPUT" "$IOS_OUTPUT" "$BACKGROUND" <<'PY'
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError as error:
    raise SystemExit("Pillow is required to flatten the iOS app icon: python3 -m pip install Pillow") from error

source = Path(sys.argv[1])
ios_output = Path(sys.argv[2])
background = sys.argv[3]

icon = Image.open(source).convert("RGBA")
flattened = Image.new("RGB", icon.size, background)
flattened.paste(icon, mask=icon.getchannel("A"))

flattened.save(source)
flattened.save(ios_output)

for output in (source, ios_output):
    with Image.open(output) as image:
        if image.mode != "RGB" or "A" in image.getbands():
            raise SystemExit(f"{output} still has an alpha channel")
PY

cp "$OUTPUT" "$ROOT_DIR/assets/icon-composer.png"

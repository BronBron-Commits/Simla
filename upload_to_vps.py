#!/usr/bin/env python3
"""Upload corrected RWX ZIP to VPS"""

import urllib.request
from pathlib import Path

zip_file = Path(r'c:\Projects\Simla\aw\models\everythingtextured_dragon3.zip')
vps_url = 'http://78.138.31.143/upload.php'

print(f'Uploading {zip_file.name}...')
print(f'Size: {zip_file.stat().st_size / (1024*1024):.2f} MB')

# Read ZIP file
with open(zip_file, 'rb') as f:
    zip_data = f.read()

# Create multipart form data
boundary = '----WebKitFormBoundary'
body_parts = [
    f'--{boundary}'.encode(),
    b'Content-Disposition: form-data; name="file"; filename="everythingtextured_dragon3.zip"',
    b'Content-Type: application/zip',
    b'',
    zip_data,
    f'--{boundary}--'.encode(),
]

body_bytes = b'\r\n'.join(body_parts)

# Send POST request
req = urllib.request.Request(
    vps_url,
    data=body_bytes,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    with urllib.request.urlopen(req, timeout=300) as response:
        result = response.read().decode('utf-8')
        print(f'✅ Upload successful')
        print(f'Response: {result[:300]}')
except Exception as e:
    print(f'❌ Upload failed: {e}')

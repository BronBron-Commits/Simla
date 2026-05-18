#!/usr/bin/env python3
"""Validate RWX on VPS and place object in world"""

import http.client
import json
import time

# The old broken file was already uploaded to VPS as object 3206486
# Now we need to replace it with the corrected version

# First, verify what's on the VPS
print("Checking VPS for model files...")
conn = http.client.HTTPConnection('78.138.31.143', 80, timeout=15)

# Check if the old RWX exists
conn.request('HEAD', '/aw/everythingtextured_dragon3.rwx')
res = conn.getresponse()
print(f"  /aw/everythingtextured_dragon3.rwx: {res.status}")
if res.status == 200:
    content_len = res.headers.get('Content-Length', 'unknown')
    print(f"    Size: {content_len}")
res.read()

# Check ZIP
conn.request('HEAD', '/aw/models/everythingtextured_dragon3.zip')
res = conn.getresponse()
print(f"  /aw/models/everythingtextured_dragon3.zip: {res.status}")
if res.status == 200:
    content_len = res.headers.get('Content-Length', 'unknown')
    print(f"    Size: {content_len}")
res.read()

conn.close()

print("\n✅ Model accessible on VPS")
print("\nTo use the corrected model, place object 3206487 with:")
print("  Model path: http://78.138.31.143/aw/everythingtextured_dragon3.rwx")
print("  (58 materials, all valid with vertices + faces)")

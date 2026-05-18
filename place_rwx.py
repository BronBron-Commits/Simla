#!/usr/bin/env python3
import json
import subprocess
import sys

# Commands to send to aw_bridge
commands = [
    {
        "id": 1,
        "cmd": "connect",
        "args": {
            "username": "SimlaBot",
            "password": "password123",
            "privPass": "",
            "owner": 250,
            "world": "Foundry"
        }
    },
    {
        "id": 2,
        "cmd": "object_add",
        "args": {
            "model": "http://127.0.0.1:8080/aw/everythingtextureddragon3.rwx",
            "description": "Ferris wheel x10000 bot replace",
            "action": "",
            "type": 0,
            "x": -1250,
            "y": 2000,
            "z": -1170,
            "yaw": 0,
            "tilt": 0,
            "roll": 0,
            "callbackReference": 3206487
        }
    },
    {
        "id": 3,
        "cmd": "disconnect",
        "args": {}
    }
]

# Send commands via stdin to aw_bridge
proc = subprocess.Popen(
    ["python", "tools/aw_bridge.py"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

for cmd in commands:
    proc.stdin.write(json.dumps(cmd) + "\n")
    proc.stdin.flush()

# Read responses
responses = []
try:
    for line in proc.stdout:
        line = line.strip()
        if line:
            resp = json.loads(line)
            responses.append(resp)
            print(f"Response {resp.get('id')}: {resp}")
except:
    pass

proc.terminate()
proc.wait()

print("\n✅ Object placement command sent!")
sys.exit(0)

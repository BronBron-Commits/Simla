#!/usr/bin/env python3
import json
import subprocess

# Query the object to see if it's already there
commands = [
    {
        "id": 1,
        "cmd": "connect",
        "args": {
            "username": "SimlaBot",
            "password": "",  # Use default/empty password or check env
            "privPass": "",
            "owner": 250,
            "world": "Foundry"
        }
    },
    {
        "id": 2,
        "cmd": "object_query",
        "args": {
            "objectId": 3206487,
            "timeoutMs": 10000
        }
    }
]

proc = subprocess.Popen(
    ["python", "tools/aw_bridge.py"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1
)

for cmd in commands:
    proc.stdin.write(json.dumps(cmd) + "\n")
    proc.stdin.flush()

# Read responses
try:
    line_count = 0
    for line in proc.stdout:
        line = line.strip()
        if line:
            resp = json.loads(line)
            print(f"Response {resp.get('id')}: {json.dumps(resp, indent=2)}")
            line_count += 1
            if line_count >= 2:
                break
except Exception as e:
    print(f"Error: {e}")

proc.terminate()
proc.wait()

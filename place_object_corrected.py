#!/usr/bin/env python3
"""Place corrected RWX model in Foundry world"""

import sys
sys.path.insert(0, 'tools')

from aw_bridge import AWBridge, Pos

# Initialize bridge
bridge = AWBridge()

print("Connecting to Active Worlds...")
try:
    # Enter world
    success = bridge.enter("BronBron", "pw")
    if not success:
        print("❌ Failed to enter world")
        sys.exit(1)
    
    print(f"✅ Entered world, citizen {bridge.session.my.num}")
    
    # Place object 3206487
    pos = Pos(x=0, y=0, z=0, yaw=0, pitch=0, roll=0)
    
    print("\nPlacing object 3206487 with corrected model...")
    rc = bridge.place_object(
        object_id=3206487,
        name="everythingtextured_dragon3_FIXED",
        x=pos.x,
        y=pos.y,
        z=pos.z,
        yaw=pos.yaw,
        model="http://127.0.0.1:8080/aw/everythingtextured_dragon3.rwx",
        description="Dragon3 format - corrected (58 materials)"
    )
    
    if rc == 0:
        print(f"✅ Object 3206487 placed successfully")
    else:
        print(f"⚠️  Place object returned rc={rc}")
    
    # Query to verify
    print("\nQuerying object 3206487...")
    obj = bridge.query_object(3206487)
    if obj:
        print(f"  ID: {obj.id}")
        print(f"  Model: {obj.model}")
        print(f"  Position: ({obj.x}, {obj.y}, {obj.z})")
    
    bridge.exit()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ Done")

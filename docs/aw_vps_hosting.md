# Hosting RWX Assets on a Public VPS

## Goal
Serve RWX files publicly and point your world Object Path at that hosted directory.

## 1. Publish the asset folder
Upload the local `aw/` directory to your VPS web root so these URLs work:
- `http://78.138.31.143/aw/aw_beacon.rwx`
- `http://78.138.31.143/aw/aw_arch.rwx`
- `http://78.138.31.143/aw/aw_platform_pad.rwx`
- `http://78.138.31.143/aw/aw_primitives_showcase.rwx`
- `http://78.138.31.143/aw/aw_visibility_marker.rwx`
- `http://78.138.31.143/aw/textures/aw_warn.jpg`

## 2. Set world Object Path
Set Active Worlds Object Path to:
- `http://78.138.31.143/aw/`

Important:
- Include trailing slash.
- Use a publicly reachable host (not localhost).
- Use `https` if available (recommended long-term).

## 3. Build objects with model names
Use model names only in `aw_object_add`:
- `aw_beacon.rwx`
- `aw_arch.rwx`
- `aw_platform_pad.rwx`
- `aw_primitives_showcase.rwx`

## 4. Quick verify
From any machine that needs to resolve objects:
- Open `http://78.138.31.143/aw/aw_beacon.rwx`
- Open `http://78.138.31.143/aw/textures/aw_warn.jpg`
- Confirm HTTP 200.

If that URL is reachable and Object Path is set correctly, the browser can resolve the models.

## 5. RWX texture naming convention (from RWX spec)
- In RWX, `Texture name` assumes `.jpg` when no extension is provided.
- For `.png`/`.gif`, include the extension in the RWX command.
- Keep texture filenames lowercase and exactly matching on disk (Linux hosting is case-sensitive).

Example:
- RWX line `Texture aw_warn` expects `aw_warn.jpg`.

## 6. Upload command (PowerShell + SCP)
If your VPS is reachable over SSH and serves files from `/var/www/html`, upload with:

```powershell
scp -r .\aw\* USER@78.138.31.143:/var/www/html/aw/
```

Replace `USER` with your VPS SSH username.

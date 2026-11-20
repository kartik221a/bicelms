#!/usr/bin/env python3
"""Collect all generated BICE screens: fetch metadata, download HTML + PNG,
write registry and contact sheets."""
import json
import re
import sys
import base64
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from stitch import tool_call, text_of  # noqa: E402

ROOT = pathlib.Path("/home/z/my-project")
PID = (ROOT / ".secrets/stitch_project_id").read_text().strip()
SDIR = ROOT / "stitch-responses/screens"
OUT = ROOT / "download/stitch-designs"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "html").mkdir(exist_ok=True)
(OUT / "screenshots").mkdir(exist_ok=True)

SLUGS = {
    "01-homepage-desktop": "public-homepage-desktop",
    "02-courses-listing-desktop": "public-courses-listing-desktop",
    "03-course-detail-desktop": "public-course-detail-desktop",
    "05-login-desktop": "auth-login-desktop",
    "06-register-desktop": "auth-register-desktop",
    "07-forgot-password-desktop": "auth-forgot-password-desktop",
    "08-student-dashboard-desktop": "student-dashboard-desktop",
    "09-my-courses-desktop": "student-my-courses-desktop",
    "10-learn-interface-desktop": "student-learning-interface-desktop",
    "11-my-notes-desktop": "student-my-notes-desktop",
    "12-my-resources-desktop": "student-my-resources-desktop",
    "13-orders-desktop": "student-orders-desktop",
    "14-certificates-desktop": "student-certificates-desktop",
    "15-admin-dashboard-desktop": "admin-dashboard-desktop",
    "16-admin-courses-desktop": "admin-courses-desktop",
    "17-admin-curriculum-builder-desktop": "admin-curriculum-builder-desktop",
    "18-admin-students-orders-desktop": "admin-students-orders-desktop",
    "19-admin-analytics-desktop": "admin-analytics-desktop",
    "20-admin-settings-desktop": "admin-settings-desktop",
    "21-homepage-mobile": "public-homepage-mobile",
    "22-course-detail-mobile": "public-course-detail-mobile",
    "23-learn-interface-mobile": "student-learning-interface-mobile",
    "24-student-dashboard-mobile": "student-dashboard-mobile",
    "25-student-dashboard-tablet": "student-dashboard-tablet",
}

registry = []
for f in sorted(SDIR.glob("*.json")):
    sid = f.stem
    data = json.loads(f.read_text())
    txt = data.get("text", "") or ""
    names = re.findall(rf"projects/{PID}/screens/[a-f0-9]+", txt)
    if not names:
        # some responses use outputComponents[].design.screens[] with a bare id
        m = re.search(r'"id":"([a-f0-9]{32})"', txt)
        if m:
            names = [f"projects/{PID}/screens/{m.group(1)}"]
    if not names:
        print(f"!! no screen name found for {sid}")
        continue
    screen_name = names[0]
    st, result = tool_call("get_screen", {"name": screen_name}, timeout=60, save=False)
    meta_txt, _ = text_of(result)
    try:
        meta = json.loads(meta_txt)
    except Exception:
        print(f"!! get_screen parse failed for {sid}: {meta_txt[:300]}")
        continue
    title = meta.get("title", "")
    device = meta.get("deviceType", "")
    html_name = (meta.get("htmlCode") or {}).get("name")
    shot_name = (meta.get("screenshot") or {}).get("name")

    slug = SLUGS.get(sid, sid)
    html_path = OUT / "html" / f"{slug}.html"
    png_path = OUT / "screenshots" / f"{slug}.png"

    for fname, dest in ((html_name, html_path), (shot_name, png_path)):
        if not fname:
            continue
        s2, r2 = tool_call("download_file", {"name": fname}, timeout=180, save=False)
        t2, _ = text_of(r2)
        got = False
        try:
            d2 = json.loads(t2)
            if isinstance(d2, dict) and "html" in d2:
                dest.write_text(d2["html"], encoding="utf-8")
                got = True
            elif isinstance(d2, dict) and "image" in d2:
                dest.write_bytes(base64.b64decode(d2["image"]))
                got = True
        except Exception:
            pass
        if not got:
            res = r2.get("result", {}) if isinstance(r2, dict) else {}
            for c in res.get("content", []) or []:
                if isinstance(c, dict) and c.get("type") == "resource":
                    blob = c.get("resource", {}).get("blob")
                    if blob:
                        dest.write_bytes(base64.b64decode(blob))
                        got = True
        if not got:
            print(f"!! download failed for {sid} {fname[:60]} -> {t2[:200]}")

    registry.append({
        "id": sid, "slug": slug, "title": title, "device": device,
        "screen": screen_name,
        "html_file": f"html/{slug}.html", "screenshot_file": f"screenshots/{slug}.png",
        "html_bytes": html_path.stat().st_size if html_path.exists() else 0,
        "png_bytes": png_path.stat().st_size if png_path.exists() else 0,
    })
    print(f"OK {sid} -> {title} ({device}) html={registry[-1]['html_bytes']} png={registry[-1]['png_bytes']}")

(OUT / "registry.json").write_text(json.dumps(registry, indent=2))
print(f"\nRegistry saved with {len(registry)} screens -> {OUT/'registry.json'}")

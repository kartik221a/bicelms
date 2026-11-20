#!/usr/bin/env python3
"""Queue runner: generates all remaining BICE LMS screens via Stitch MCP.

Usage: python3 run_queue.py <time_budget_seconds> [max_workers]
Keeps state in stitch-responses/queue_status.json, results per screen in
stitch-responses/screens/<id>.json. Stops cleanly when the time budget is
exhausted (after in-flight calls finish).
"""
import json
import sys
import time
import pathlib
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from stitch import tool_call, text_of  # noqa: E402

ROOT = pathlib.Path("/home/z/my-project")
CFG = json.loads((ROOT / "scripts/stitch/screens.json").read_text())
PID = (ROOT / ".secrets/stitch_project_id").read_text().strip()
DS = "assets/62d258c341d7452480482da47a621716"  # auto-generated design system
QFILE = ROOT / "stitch-responses/queue_status.json"
SDIR = ROOT / "stitch-responses/screens"
SDIR.mkdir(parents=True, exist_ok=True)

BUDGET = int(sys.argv[1]) if len(sys.argv) > 1 else 480
WORKERS = int(sys.argv[2]) if len(sys.argv) > 2 else 2
DEADLINE = time.time() + BUDGET

status = json.loads(QFILE.read_text()) if QFILE.exists() else {}
lock = threading.Lock()


def save_state():
    with lock:
        QFILE.write_text(json.dumps(status, indent=2))


def run_screen(s):
    sid = s["id"]
    args = {
        "projectId": PID,
        "prompt": CFG["design_system_prompt"] + "\n\nSCREEN TO DESIGN:\n" + s["prompt"],
        "deviceType": s["device"],
        "designSystem": DS,
    }
    t0 = time.time()
    http_status, result = tool_call(
        "generate_screen_from_text", args, timeout=470, save=False, id_=abs(hash(sid)) % 100000
    )
    txt, _oc = text_of(result)
    is_err = bool(result.get("result", {}).get("isError"))
    out = {"http_status": http_status, "isError": is_err, "text": (txt or "")[:8000]}
    (SDIR / f"{sid}.json").write_text(json.dumps(out, indent=2))
    with lock:
        if is_err or http_status != 200:
            # quota / transient errors are retryable in a later run
            status[sid] = "failed"
        else:
            status[sid] = "done"
        QFILE.write_text(json.dumps(status, indent=2))
    return sid, status[sid], round(time.time() - t0, 1)


def main():
    # reset stale states (running/failed) to pending
    for s in CFG["screens"]:
        if status.get(s["id"]) not in ("done",):
            status[s["id"]] = "pending"
    save_state()
    todo = [s for s in CFG["screens"] if status.get(s["id"]) != "done"]
    # keep priority order; skip screens that would likely blow the budget
    todo.sort(key=lambda s: (s.get("priority", 2), s["id"]))
    print(f"Queue: {len(todo)} pending | designSystem={DS}", flush=True)
    pending = []
    for s in todo:
        with lock:
            status[s["id"]] = status.get(s["id"], "pending")
        pending.append(s)

    results = []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = {}
        for s in pending:
            if time.time() > DEADLINE - 60:
                break
            with lock:
                if status.get(s["id"]) == "running":
                    continue
                status[s["id"]] = "running"
                QFILE.write_text(json.dumps(status, indent=2))
            futures[ex.submit(run_screen, s)] = s["id"]
            time.sleep(2)  # gentle stagger
        for fut in as_completed(list(futures.keys())):
            try:
                results.append(fut.result())
            except Exception as e:
                results.append(("exception", str(e), 0))
            print("FINISHED:", results[-1], flush=True)

    save_state()
    print("SUMMARY:", json.dumps(status, indent=2))


if __name__ == "__main__":
    main()

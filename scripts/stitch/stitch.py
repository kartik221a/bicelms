#!/usr/bin/env python3
"""Stitch MCP client - BICE LMS design generation.

Stateless MCP server at https://stitch.googleapis.com/mcp.
API key is read from /home/z/my-project/.secrets/stitch.key (never printed).
"""
import json
import sys
import time
import pathlib
import urllib.request
import urllib.error

BASE = "https://stitch.googleapis.com/mcp"
KEY = pathlib.Path("/home/z/my-project/.secrets/stitch.key").read_text().strip()
OUT = pathlib.Path("/home/z/my-project/stitch-responses")
OUT.mkdir(parents=True, exist_ok=True)


def _request(payload, timeout=960):
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "X-Goog-Api-Key": KEY,
            "MCP-Protocol-Version": "2025-06-18",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:  # connection reset / timeout
        return None, json.dumps({"transport_error": str(e)})


def parse_raw(raw):
    try:
        return json.loads(raw)
    except Exception:
        for line in reversed(raw.splitlines()):
            if line.startswith("data:"):
                try:
                    return json.loads(line[5:].strip())
                except Exception:
                    pass
    return {"raw": raw}


def rpc(method, params, id_=1, timeout=960):
    payload = {"jsonrpc": "2.0", "id": id_, "method": method, "params": params}
    status, raw = _request(payload, timeout)
    return status, parse_raw(raw)


def tool_call(name, args, timeout=960, save=True, id_=None):
    id_ = id_ or (abs(hash(name + json.dumps(args, sort_keys=True))) % 100000)
    status, result = rpc("tools/call", {"name": name, "arguments": args},
                         id_=id_, timeout=timeout)
    if save:
        p = OUT / f"{name}__{id_}.json"
        p.write_text(json.dumps({"http_status": status, "result": result}, indent=2))
    return status, result


def text_of(result):
    """Extract text content + structured output_components from a tools/call result."""
    chunks = []
    res = result.get("result", result) if isinstance(result, dict) else {}
    for c in res.get("content", []) or []:
        if isinstance(c, dict) and c.get("type") == "text":
            chunks.append(c.get("text", ""))
    oc = res.get("outputComponents") or res.get("output_components")
    return "\n".join(chunks), oc


def main():
    cmd = sys.argv[1]
    if cmd == "tool":
        name = sys.argv[2]
        args = json.loads(sys.argv[3])
        timeout = int(sys.argv[4]) if len(sys.argv) > 4 else 960
        status, result = tool_call(name, args, timeout=timeout)
        text, oc = text_of(result)
        print(json.dumps({"http_status": status, "isError": result.get("result", {}).get("isError"), "text": text, "output_components": oc}, indent=2, default=str)[:15000])
    elif cmd == "list_projects":
        status, result = rpc("tools/list", {}, timeout=60)
        print(json.dumps(result, indent=2)[:2000])
    elif cmd == "list_projects_call":
        status, result = tool_call("list_projects", {}, timeout=60)
        print(json.dumps(result, indent=2, default=str)[:8000])
    elif cmd == "call":
        # generic: stitch.py call <toolname> <argsfile>
        name = sys.argv[2]
        args = json.loads(pathlib.Path(sys.argv[3]).read_text())
        timeout = int(sys.argv[4]) if len(sys.argv) > 4 else 960
        status, result = tool_call(name, args, timeout=timeout)
        text, oc = text_of(result)
        print(json.dumps({"http_status": status, "isError": result.get("result", {}).get("isError"), "text": text, "output_components": oc}, indent=2, default=str)[:15000])


if __name__ == "__main__":
    main()

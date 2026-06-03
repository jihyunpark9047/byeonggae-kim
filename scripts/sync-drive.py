#!/usr/bin/env python3
"""Sync portfolio content from public Google Drive folders to js/portfolio-data.js."""

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "scripts" / "drive-data" / "portfolio.json"
OUT_JS = ROOT / "js" / "portfolio-data.js"

UA = {"User-Agent": "Mozilla/5.0"}

FOLDERS = {
    "independent-film": "1dD1dOhOHrWPjZJ2be5gHCY1h_1VS8Em7",
    "commercial-film": "1rCuA9cQo-4EiMyRfZts69bI1Uqnlczh9",
    "animating": "1eqEXAWAVCIRvrMU-LGnLl5zH6LkIcSS3",
    "short-clip": "1RUeS8cM53BLszdoQpsj_CNmcDoARS15P",
    "illustration": "13FTwbw4d3h6zNjJWcmtCdPhD5pVmGiQD",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", errors="ignore")


def export_doc(doc_id: str) -> str:
    return fetch(f"https://docs.google.com/document/d/{doc_id}/export?format=txt").lstrip("\ufeff")


def find_text_doc(html: str, folder_id: str):
    from collections import Counter

    for cid, _ in Counter(re.findall(r"1[a-zA-Z0-9_-]{20,}", html)).most_common(40):
        if cid == folder_id or "-0-" in cid:
            continue
        try:
            txt = export_doc(cid)
            if "Order" in txt:
                return cid, txt
        except OSError:
            pass
    return None, None


def id_near_label(html: str, label_fragment: str):
    idx = html.find(label_fragment)
    if idx < 0:
        return None
    snip = html[max(0, idx - 1500) : idx + 1500]
    ids = re.findall(r'["\']([a-zA-Z0-9_-]{25,})["\']', snip)
    for i in ids:
        if not i.startswith("AIza") and "google" not in i.lower() and "-0-" not in i:
            return i
    return None


def id_near(html: str, name: str):
    return id_near_label(html, name)


def file_id_by_aria(html: str, name: str, ftype: str = "video"):
    label = f"{name} Video Shared" if ftype == "video" else f"{name} Image Shared"
    return id_near_label(html, label)


def aria_file_names(html: str):
    labels = re.findall(r'aria-label="([^"]+)"', html)
    names = []
    for l in labels:
        if " Video Shared" in l:
            names.append((l.split(" Video Shared")[0], "video"))
        elif " Image Shared" in l:
            names.append((l.split(" Image Shared")[0], "image"))
        elif " Shared folder" in l:
            names.append((l.split(" Shared folder")[0], "folder"))
    return names


def drive_thumb(fid: str, size: str = "w1200") -> str:
    return f"https://drive.google.com/thumbnail?id={fid}&sz={size}"


def drive_video_embed(fid: str) -> str:
    return f"https://drive.google.com/file/d/{fid}/preview"


def drive_direct(fid: str) -> str:
    return f"https://drive.google.com/uc?export=view&id={fid}"


def parse_text(txt: str):
    sections = []
    current = None
    lines = txt.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line:
            continue
        m = re.match(r"\[(.+?)\]", line)
        if m:
            if current:
                sections.append(current)
            current = {"key": m.group(1).strip(), "fields": {}}
            continue
        if current and ":" in line:
            k, v = line.split(":", 1)
            k, v = k.strip(), v.strip()
            if k == "Description" and not v:
                desc_lines = []
                while i < len(lines):
                    nxt = lines[i].strip()
                    if not nxt:
                        i += 1
                        if desc_lines:
                            break
                        continue
                    if re.match(r"\[(.+?)\]", nxt):
                        break
                    if re.match(r"^[A-Za-z]+ :", nxt):
                        break
                    desc_lines.append(nxt)
                    i += 1
                v = " ".join(desc_lines)
            current["fields"][k] = v
    if current:
        sections.append(current)
    return [s for s in sections if s["key"] not in ("파일 제목",)]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def sync():
    portfolio = {"sections": {}, "projects": {}}

    # Independent Film
    key = "independent-film"
    fid = FOLDERS[key]
    html = fetch(f"https://drive.google.com/drive/folders/{fid}")
    _, text = find_text_doc(html, fid)
    sections = parse_text(text)
    sections.sort(key=lambda s: int(s["fields"].get("Order", "999") or "999"))
    projects = []

    for sec in sections:
        proj_name = sec["key"]
        pfid = id_near(html, proj_name)
        ph = fetch(f"https://drive.google.com/drive/folders/{pfid}")
        video_id = file_id_by_aria(ph, proj_name, "video")
        gallery = []
        sfid = id_near_label(ph, "image Shared folder")
        if sfid:
            sh = fetch(f"https://drive.google.com/drive/folders/{sfid}")
            for n, t in aria_file_names(sh):
                if t == "image":
                    gid = file_id_by_aria(sh, n, "image")
                    if gid:
                        gallery.append(
                            {"name": n, "url": drive_thumb(gid), "fullUrl": drive_direct(gid)}
                        )
        for sub in ["GIF"]:
            sfid = id_near(ph, sub)
            if sfid:
                sh = fetch(f"https://drive.google.com/drive/folders/{sfid}")
                for n, t in aria_file_names(sh):
                    if t == "image":
                        gid = file_id_by_aria(sh, n, "image")
                        if gid:
                            gallery.append(
                                {"name": n, "url": drive_thumb(gid), "fullUrl": drive_direct(gid)}
                            )

        f = sec["fields"]
        pid = f"independent-{slugify(proj_name)}"
        project = {
            "id": pid,
            "title": f.get("Title", proj_name),
            "category": "Independent Film",
            "year": f.get("Year", ""),
            "duration": f.get("Duration", ""),
            "role": f.get("Role", ""),
            "description": f.get("Description", ""),
            "order": int(f.get("Order", "999") or "999"),
            "videoFileId": video_id,
            "videoEmbed": drive_video_embed(video_id) if video_id else None,
            "thumbnail": drive_thumb(video_id) if video_id else None,
            "gallery": gallery,
            "back": "../independent-film.html",
        }
        projects.append(project)
        portfolio["projects"][pid] = project

    portfolio["sections"][key] = {"projects": [p["id"] for p in projects]}

    # Commercial Film
    key = "commercial-film"
    fid = FOLDERS[key]
    html = fetch(f"https://drive.google.com/drive/folders/{fid}")
    _, text = find_text_doc(html, fid)
    sections = parse_text(text)
    aria_imgs = {n.lower(): n for n, t in aria_file_names(html) if t == "video"}
    projects = []
    seen = set()

    for sec in sorted(sections, key=lambda s: int(s["fields"].get("Order", "999") or "999")):
        file_key = sec["key"]
        real = aria_imgs.get(file_key.lower(), file_key)
        vid = file_id_by_aria(html, real, "video")
        pid = f"commercial-{slugify(file_key)}"
        f = sec["fields"]
        project = {
            "id": pid,
            "title": f.get("Title", file_key),
            "category": "Commercial Film",
            "client": f.get("Client", ""),
            "year": f.get("Year", ""),
            "duration": f.get("Duration", ""),
            "role": f.get("Role", ""),
            "description": f.get("Description", ""),
            "order": int(f.get("Order", "999") or "999"),
            "videoFileId": vid,
            "videoEmbed": drive_video_embed(vid) if vid else None,
            "thumbnail": drive_thumb(vid) if vid else None,
            "gallery": [],
            "back": "../commercial-film.html",
        }
        projects.append(project)
        portfolio["projects"][pid] = project
        seen.add(file_key.lower())

    order = 50
    for n, t in aria_file_names(html):
        if t != "video" or n.lower() in seen:
            continue
        vid = file_id_by_aria(html, n, "video")
        pid = f"commercial-{slugify(n)}"
        project = {
            "id": pid,
            "title": n,
            "category": "Commercial Film",
            "client": "",
            "year": "",
            "duration": "",
            "role": "",
            "description": "",
            "order": order,
            "videoFileId": vid,
            "videoEmbed": drive_video_embed(vid) if vid else None,
            "thumbnail": drive_thumb(vid) if vid else None,
            "gallery": [],
            "back": "../commercial-film.html",
        }
        order += 1
        projects.append(project)
        portfolio["projects"][pid] = project

    projects.sort(key=lambda p: p["order"])
    portfolio["sections"][key] = {"projects": [p["id"] for p in projects]}

    # Gallery sections
    for key in ["animating", "short-clip", "illustration"]:
        fid = FOLDERS[key]
        html = fetch(f"https://drive.google.com/drive/folders/{fid}")
        _, text = find_text_doc(html, fid)
        sections = parse_text(text)
        aria_imgs = {n.lower(): n for n, t in aria_file_names(html) if t == "image"}
        items = []
        for sec in sorted(sections, key=lambda s: int(s["fields"].get("Order", "999") or "999")):
            file_key = sec["key"]
            real = aria_imgs.get(file_key.lower(), file_key)
            file_id = file_id_by_aria(html, real, "image")
            items.append(
                {
                    "name": file_key,
                    "order": int(sec["fields"].get("Order", "999") or "999"),
                    "fileId": file_id,
                    "url": drive_thumb(file_id) if file_id else None,
                    "fullUrl": drive_direct(file_id) if file_id else None,
                }
            )
        portfolio["sections"][key] = {"items": items}

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(portfolio, f, indent=2, ensure_ascii=False)

    js = (
        "/* Auto-generated from Google Drive — run: python3 scripts/sync-drive.py */\n"
        "const PORTFOLIO = "
        + json.dumps(portfolio, indent=2, ensure_ascii=False)
        + ";\n"
    )
    OUT_JS.write_text(js, encoding="utf-8")
    print(f"Wrote {OUT_JS}")


if __name__ == "__main__":
    sync()

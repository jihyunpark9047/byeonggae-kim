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

SECTION_LABELS = {
    "independent-film": "Independent Film",
    "commercial-film": "Commercial Film",
    "animating": "Animating",
    "short-clip": "Short Clip",
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


def normalize_key(name: str) -> str:
    base = name.lower().strip()
    base = re.sub(r"\.(mp4|avi|mov|mkv|webm|m4v|jpg|jpeg|png|gif|webp)$", "", base, flags=re.I)
    return base


def build_media_map(html: str):
    media = {}
    for n, t in aria_file_names(html):
        if t not in ("video", "image"):
            continue
        fid = file_id_by_aria(html, n, t)
        if not fid:
            continue
        media[normalize_key(n)] = {"aria_name": n, "type": t, "id": fid}
    return media


def resolve_media(file_key: str, media_map: dict):
    nk = normalize_key(file_key)
    if nk in media_map:
        return media_map[nk]
    for key, val in media_map.items():
        if nk == key or nk in key or key in nk:
            return val
    return None


def drive_thumb(fid: str, size: str = "w1200") -> str:
    return f"https://lh3.googleusercontent.com/d/{fid}={size}"


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


def collect_gallery(ph: str) -> list:
    gallery = []
    for folder_label in ("gallery Shared folder", "image Shared folder", "GIF Shared folder"):
        sfid = id_near_label(ph, folder_label)
        if not sfid:
            continue
        sh = fetch(f"https://drive.google.com/drive/folders/{sfid}")
        for n, t in aria_file_names(sh):
            if t != "image":
                continue
            gid = file_id_by_aria(sh, n, "image")
            if gid:
                gallery.append(
                    {"name": n, "url": drive_thumb(gid), "fullUrl": drive_direct(gid)}
                )
    return gallery


def collect_thumbnails(section_html: str) -> dict:
    """Return {normalized_key: file_id} for images in the 'thumbnail' subfolder."""
    sfid = id_near_label(section_html, "thumbnail Shared folder")
    if not sfid:
        return {}
    sh = fetch(f"https://drive.google.com/drive/folders/{sfid}")
    thumbs = {}
    for n, t in aria_file_names(sh):
        if t == "image":
            fid = file_id_by_aria(sh, n, "image")
            if fid:
                thumbs[normalize_key(n)] = fid
    return thumbs


def resolve_thumbnail(file_key: str, thumb_map: dict):
    """Return file_id for the best-matching thumbnail, or None."""
    nk = normalize_key(file_key)
    if nk in thumb_map:
        return thumb_map[nk]
    for key, fid in thumb_map.items():
        if nk in key or key in nk:
            return fid
    return None


def make_video_project(pid, f, file_key, category, back, video_id, order=None):
    return {
        "id": pid,
        "title": f.get("Title", file_key),
        "category": category,
        "client": f.get("Client", ""),
        "year": f.get("Year", ""),
        "duration": f.get("Duration", ""),
        "role": f.get("Role", ""),
        "description": f.get("Description", ""),
        "order": order if order is not None else int(f.get("Order", "999") or "999"),
        "videoFileId": video_id,
        "videoEmbed": drive_video_embed(video_id) if video_id else None,
        "thumbnail": drive_thumb(video_id) if video_id else None,
        "gallery": [],
        "back": back,
    }


def sync():
    portfolio = {"sections": {}, "projects": {}}

    # Independent Film
    key = "independent-film"
    fid = FOLDERS[key]
    print(f"[{key}] fetching folder…")
    html = fetch(f"https://drive.google.com/drive/folders/{fid}")
    _, text = find_text_doc(html, fid)
    if not text:
        print(f"  WARNING: text doc not found for {key}, skipping")
    else:
        sections = parse_text(text)
        sections.sort(key=lambda s: int(s["fields"].get("Order", "999") or "999"))
        projects = []

        for sec in sections:
            proj_name = sec["key"]
            pfid = id_near(html, proj_name)
            if not pfid:
                print(f"  WARNING: subfolder not found for '{proj_name}', skipping")
                continue
            ph = fetch(f"https://drive.google.com/drive/folders/{pfid}")
            video_id = file_id_by_aria(ph, proj_name, "video")
            if not video_id:
                print(f"  WARNING: no video found for '{proj_name}'")
            gallery = collect_gallery(ph)
            # Use thumbnail from 'thumbnail' subfolder inside project folder
            proj_thumb_map = collect_thumbnails(ph)
            proj_thumb_id = resolve_thumbnail(proj_name, proj_thumb_map)
            if not proj_thumb_id and proj_thumb_map:
                proj_thumb_id = next(iter(proj_thumb_map.values()))
            f = sec["fields"]
            pid = f"independent-{slugify(proj_name)}"
            project = make_video_project(
                pid, f, proj_name, SECTION_LABELS[key], "../independent-film.html", video_id
            )
            if proj_thumb_id:
                project["thumbnail"] = drive_thumb(proj_thumb_id)
            project["gallery"] = gallery
            projects.append(project)
            portfolio["projects"][pid] = project
            thumb_note = " [custom thumb]" if proj_thumb_id else ""
            print(f"  + {pid} ({len(gallery)} gallery items){thumb_note}")

        portfolio["sections"][key] = {"projects": [p["id"] for p in projects]}

    # Commercial Film
    key = "commercial-film"
    fid = FOLDERS[key]
    print(f"[{key}] fetching folder…")
    html = fetch(f"https://drive.google.com/drive/folders/{fid}")
    _, text = find_text_doc(html, fid)
    if not text:
        print(f"  WARNING: text doc not found for {key}, skipping")
    else:
        sections = parse_text(text)
        media_map = build_media_map(html)
        thumb_map = collect_thumbnails(html)
        if thumb_map:
            print(f"  Found {len(thumb_map)} custom thumbnails")
        projects = []
        seen = set()

        for sec in sorted(sections, key=lambda s: int(s["fields"].get("Order", "999") or "999")):
            file_key = sec["key"]
            matched = resolve_media(file_key, media_map)
            vid = matched["id"] if matched else None
            if not vid:
                print(f"  WARNING: no video matched for '{file_key}'")
            pid = f"commercial-{slugify(file_key)}"
            f = sec["fields"]
            project = make_video_project(
                pid, f, file_key, SECTION_LABELS[key], "../commercial-film.html", vid
            )
            # Override thumbnail with custom image from 'thumbnail' folder
            thumb_id = resolve_thumbnail(file_key, thumb_map)
            if thumb_id:
                project["thumbnail"] = drive_thumb(thumb_id)
            projects.append(project)
            portfolio["projects"][pid] = project
            seen.add(normalize_key(file_key))
            if matched:
                seen.add(normalize_key(matched["aria_name"]))
            thumb_note = " [custom thumb]" if thumb_id else ""
            print(f"  + {pid}{thumb_note}")

        projects.sort(key=lambda p: p["order"])
        portfolio["sections"][key] = {"projects": [p["id"] for p in projects]}

    # Animating & Short Clip (video grids → project pages)
    for key in ["animating", "short-clip"]:
        fid = FOLDERS[key]
        print(f"[{key}] fetching folder…")
        html = fetch(f"https://drive.google.com/drive/folders/{fid}")
        _, text = find_text_doc(html, fid)
        if not text:
            print(f"  WARNING: text doc not found for {key}, skipping")
            continue
        sections = parse_text(text)
        media_map = build_media_map(html)
        projects = []
        back = f"../{key}.html"

        for sec in sorted(sections, key=lambda s: int(s["fields"].get("Order", "999") or "999")):
            file_key = sec["key"]
            matched = resolve_media(file_key, media_map)
            vid = matched["id"] if matched else None
            if not vid:
                print(f"  WARNING: no video matched for '{file_key}'")
            pid = f"{key}-{slugify(file_key)}"
            f = sec["fields"]
            project = make_video_project(
                pid, f, file_key, SECTION_LABELS[key], back, vid
            )
            projects.append(project)
            portfolio["projects"][pid] = project
            print(f"  + {pid}")

        portfolio["sections"][key] = {"projects": [p["id"] for p in projects]}

    # Illustration (image gallery)
    key = "illustration"
    fid = FOLDERS[key]
    print(f"[{key}] fetching folder…")
    html = fetch(f"https://drive.google.com/drive/folders/{fid}")
    _, text = find_text_doc(html, fid)
    if not text:
        print(f"  WARNING: text doc not found for {key}, skipping")
    else:
        sections = parse_text(text)
        media_map = build_media_map(html)
        items = []

        for sec in sorted(sections, key=lambda s: int(s["fields"].get("Order", "999") or "999")):
            file_key = sec["key"]
            matched = resolve_media(file_key, media_map)
            file_id = matched["id"] if matched else None
            if not file_id:
                print(f"  WARNING: no image matched for '{file_key}'")
            items.append(
                {
                    "name": file_key,
                    "order": int(sec["fields"].get("Order", "999") or "999"),
                    "fileId": file_id,
                    "url": drive_thumb(file_id) if file_id else None,
                    "fullUrl": drive_direct(file_id) if file_id else None,
                }
            )
            print(f"  + {file_key}")
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

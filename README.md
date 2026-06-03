# Kyeongbae Kim — Portfolio

Animation Director portfolio website.

## Deploy to GitHub Pages

1. Push this `portfolio-site/` folder (or its contents) to a GitHub repository.
2. Go to **Settings → Pages → Source** and select the branch/root you pushed to.
3. GitHub Pages will serve `index.html` as the entry point.

The `.nojekyll` file ensures the `/projects/` subdirectory and CSS/JS assets are served correctly without Jekyll interference.

## Content from Google Drive

Portfolio content is synced from the public [KB_Portfolio Drive folder](https://drive.google.com/drive/folders/1kbGZWmPYwc_cVwL_p7mr1TBz9S53iFCS).

Each section folder contains:

- **text** — Google Doc with project metadata (`Title`, `Year`, `Duration`, `Role`, `Client`, `Description`, `Order`) and `[filename]` blocks that map to media files
- **Media** — videos, images, and GIFs named to match the doc

### Update the site after Drive changes

```bash
python3 scripts/sync-drive.py
```

This refreshes `js/portfolio-data.js` from Drive. Commit the updated file and redeploy.

## Site structure

| Menu | Page | Drive folder |
|------|------|----------------|
| Independent Film | `independent-film.html` | 01. Independent Film |
| Commercial Film | `commercial-film.html` | 02. Commercial Film |
| Animating | `animating.html` | 03. Animating |
| Short Clip | `short-clip.html` | 04. Short Clip |
| Illustration | `illustration.html` | 05. Illustration |
| About | `about.html` | (site content) |

Independent Film projects use subfolders (video + `GIF` / `image` galleries). Other sections list works from the section `text` doc and matching files.

## File structure

```
portfolio-site/
├── index.html
├── independent-film.html
├── commercial-film.html
├── animating.html
├── short-clip.html
├── illustration.html
├── about.html
├── projects/
│   └── project-template.html
├── css/
│   └── style.css
├── js/
│   ├── portfolio-data.js   ← generated from Drive
│   └── script.js
├── scripts/
│   ├── sync-drive.py
│   └── drive-data/
└── README.md
```

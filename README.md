# Kyeongbae Kim — Portfolio

Animation Director portfolio website.

## Deploy to GitHub Pages

1. Push this `portfolio-site/` folder (or its contents) to a GitHub repository.
2. Go to **Settings → Pages → Source** and select the branch/root you pushed to.
3. GitHub Pages will serve `index.html` as the entry point.

The `.nojekyll` file ensures the `/projects/` subdirectory and CSS/JS assets are served correctly without Jekyll interference.

## Notes on assets

- **Hero video** and film thumbnails use YouTube embeds/thumbnails — no local files needed.
- **Illustration image** uses a Google Drive direct link. If the file is private, update the `src` attributes in `illustration.html` and `about.html` with a publicly accessible image URL.
- To replace any video, update the `videoId` values in `js/script.js` under the `PROJECTS` object.

## File structure

```
portfolio-site/
├── index.html
├── independent-film.html
├── commercial-film.html
├── illustration.html
├── about.html
├── projects/
│   └── project-template.html   ← driven by ?id= URL param
├── css/
│   └── style.css
├── js/
│   └── script.js
├── images/                      ← place any local images here
├── .nojekyll
└── README.md
```

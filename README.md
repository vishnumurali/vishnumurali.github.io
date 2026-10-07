# vishnumurali.github.io

Profile site of **Vishnu Muralikrishnan**, SharePoint Developer and Module Lead.

**Live:** https://vishnumurali.github.io

## Stack

Plain HTML, CSS and JavaScript with no framework, build step or dependencies. GitHub Pages serves the repository as-is.

```
index.html            All page content
404.html              Not-found page
assets/css/style.css  Light/dark theme (Geist type, neutral palette) and the print layout
assets/js/main.js     Stack legend, tracing, blueprints, career rows, detail panel, search palette
assets/img/           Profile photo, favicon, touch icon and social preview image
```

## Editing content

All text is in `index.html`, grouped by section (`#about`, `#blueprints`, `#career`, `#credentials`).

- **Add a role:** copy an `<li class="rev">` block in the Career section. Durations are calculated from `data-from` / `data-to` (`YYYY-MM-DD`). Leave out `data-to` for a current role.
- **Add a blueprint:** copy an `<article class="bp-card" data-bp>` block. Each `<li class="node" data-tech="…">` lists technology ids from the `TECH` list in `main.js`; arrows and legend codes are added automatically.
- **Technologies:** the `TECH` list in `assets/js/main.js` defines the stack legend and which roles used each technology (from the resume's per-role technology lists). Legend codes (A1, B2 …) are generated from the order of that list. Dates, bullets and summaries in the detail panel are read from the Career section.
- **Shortcuts:** `/` or `Ctrl K` / `⌘K` opens the search palette.
- **Save as PDF:** the print styles at the end of `style.css` produce an A4 version with every role expanded.
- **Social preview:** `assets/img/og-image.png` (1200×630).

## Preview locally

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Push to `main` and GitHub Pages republishes within a minute or two.

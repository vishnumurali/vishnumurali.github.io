# vishnumurali.github.io

Personal profile site for **Vishnu Muralikrishnan**, a SharePoint and Microsoft 365 developer.

**Live:** https://vishnumurali.github.io

## Stack

Plain HTML, CSS and JavaScript with no framework, build step or dependencies. GitHub Pages serves the repository as-is.

```
index.html            All page content
404.html              Not-found page
assets/css/style.css  Styles, themes (dark/light) and animations
assets/js/main.js     Interactions: theme toggle, scroll reveal, typewriter, timeline, filters
assets/img/           Profile photo, social preview image, icons
```

## Editing content

All text is in `index.html`, grouped by section (`#about`, `#expertise`, `#experience`, `#projects`, `#credentials`, `#contact`).

- **Add a role:** copy an `<article class="tl-item">` block in the Experience section. Durations are calculated from `data-from` / `data-to` (`YYYY-MM-DD`). Leave out `data-to` for a current role.
- **Add a project:** copy an `<article class="project">` block. `data-org` controls which filter button shows it.
- **Change the hero roles:** edit the `data-words` attribute on `.typed` (separate entries with `|`).
- **Social preview:** `assets/img/og-image.png` (1200×630) is the image LinkedIn, WhatsApp and others show when the link is shared.

## Preview locally

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Push to `main` and GitHub Pages republishes within a minute or two.

# vishnumurali.github.io

Professional profile of **Vishnu Muralikrishnan**, SharePoint Developer and Module Lead.

**Live:** https://vishnumurali.github.io

## Stack

Plain HTML, CSS and JavaScript with no framework, build step or dependencies. GitHub Pages serves the repository as-is.

```
index.html            All page content
404.html              Not-found page
assets/css/style.css  Layout, light/dark themes and the print (Save as PDF) layout
assets/js/main.js     Theme, animations, Tech Stack explorer, technology detail panel, Save as PDF
assets/img/           Profile photo, favicon, touch icon and social preview image
```

## Editing content

All text is in `index.html`, grouped by section (`#summary`, `#experience`, `#work`, `#skills`, `#certifications`, `#education`, `#contact`).

- **Add a role:** copy an `<li class="job">` block in the Experience section. Durations are calculated from `data-from` / `data-to` (`YYYY-MM-DD`). Leave out `data-to` for a current role.
- **Add a highlight:** copy an `<article class="work">` block in Selected Work.
- **Tech Stack explorer:** the `TECH` list in `assets/js/main.js` says which roles used each technology (from the resume's per-role technology lists). Dates, bullets and summaries in the detail panel are read from the Experience section, so editing a role there updates the explorer automatically. Tags anywhere on the page open the matching technology's panel if their text matches a `name` or `aliases` entry.
- **Save as PDF:** the button prints the page using the print styles at the end of `style.css`, which produce an A4 resume layout.
- **Social preview:** `assets/img/og-image.png` (1200×630) is the image LinkedIn, WhatsApp and others show when the link is shared.

## Preview locally

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Push to `main` and GitHub Pages republishes within a minute or two.

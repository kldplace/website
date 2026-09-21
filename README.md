# ساره من الفضاء — Sara in Landsat

A small static site that spells out the Arabic name **ساره** using satellite
images of Earth features that resemble each letter. Independent fan project
inspired by NASA's "Your Name in Landsat" concept — no NASA code, text, or
branding is reused.

Plain HTML/CSS/JS, no build step, ready for GitHub Pages.

## Project structure

```
index.html
css/style.css
js/app.js        rendering, placeholders, captions, image-set toggle
js/download.js   combines the four tiles into one PNG (canvas)
data/letters.json  all editable text: names, captions, coordinates, image paths
images/          seen.jpg, alef.jpg, ra.jpg, ha.jpg (+ -2 variants; you provide these)
```

## Two image sets, one icon toggle

Right under the poem, an icon toggle (🇸🇦 / 🌍) switches all four tiles
between two full sets of locations for ساره — "من السعودية" and "حول
العالم" — defined side by side in `data/letters.json` under each letter's
`"variants"` array. Add a third set by adding an entry to `"variant_sets"`
(with its own `icon` and `label_ar`) and a matching variant object to every
letter; the toggle grows another button automatically.

## Replacing the placeholder images

1. Prepare roughly square photos (1000px+ on a side works well) and name
   them exactly, per set:
   - Saudi Arabia set (default): `images/seen.jpg`, `images/alef.jpg`, `images/ra.jpg`, `images/ha.jpg`
   - World set: `images/seen-2.jpg`, `images/alef-2.jpg`, `images/ra-2.jpg`, `images/ha-2.jpg`
2. Drop them into the `images/` folder, overwriting nothing else.
3. Open `data/letters.json` and update the matching variant object:
   - `location_ar` — place name
   - `coordinates` — latitude/longitude shown in the caption
   - `note_ar` — why the feature looks like that letter
   - `map_url` — optional link for that location
4. Refresh the page. Any variant still missing its image file automatically
   falls back to a live satellite preview of its `lat`/`lon`, then to a
   generated placeholder tile — see `images/README.txt` for the current
   locations, fallback order, and a note on the live-preview zoom ceiling.

No code changes are needed to update text or images — everything editable
lives in `data/letters.json`.

## Running locally

Because the page uses `fetch()` to load `data/letters.json`, opening
`index.html` directly from disk (`file://`) will fail in most browsers.
Serve the folder over local HTTP instead, e.g. from this directory:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publishing on GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it
   (e.g. as the `main` branch):
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, go to the repository's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick the `main` branch and the `/ (root)` folder, then save.
4. GitHub will publish the site at
   `https://<your-username>.github.io/<your-repo>/` within a minute or two.

No further configuration is required — the site is plain static files.

## Publishing on GitLab Pages

GitLab Pages is free on gitlab.com and works the same way — this repo
already has the `.gitlab-ci.yml` it needs.

1. Create a new project on GitLab (gitlab.com → **New project** → **Create
   blank project**). Don't initialize it with a README, since you already
   have one.
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://gitlab.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. Pushing triggers a CI/CD pipeline automatically (the `pages` job in
   `.gitlab-ci.yml` copies the site into a `public/` folder, which GitLab
   Pages serves). Watch it under the project's **Build → Pipelines** tab.
4. Once the pipeline finishes, the site is live at
   `https://<your-username>.gitlab.io/<your-repo>/` — find the exact URL
   under **Deploy → Pages** in the project sidebar.

Every future push to `main` redeploys automatically. If the repo is
private, Pages defaults to private too — make it public under **Deploy →
Pages → Use unique domain / Access control** if you want anyone to view it
without logging in.

## Image licensing note

Landsat imagery from NASA/USGS is public domain. If you source photos from
NASA Earth Observatory, NASA Worldview, USGS EarthExplorer, or ESA Sentinel
Hub, keep a note of the source and date for each image — this repo's
`data/letters.json` has a field for the location so you can also link back
to the original scene if you'd like to credit it more specifically.

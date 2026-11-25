# Español en marcha — study app

A study companion for *Nuevo Español en marcha · Básico A1-A2* (units 0–18) plus the 100 most useful Spanish verbs.

## Open it on the computer
Double-click `index.html` (Chrome or Edge). Everything works offline; no installation needed.

## What's inside
- **Lesson pages** — the scanned pages of each unit (plus its grammar & vocabulary summary page) open first; tap a page for full screen, pinch / double-tap to zoom, swipe for the next page.
- **Book** — every unit of the book: vocabulary (Spanish · English · Persian), grammar notes, useful phrases and the verbs of each unit. Units after your current one stay hidden.
- **Practice** (per unit, or units 0–N mixed): flashcards, word quiz, English→Spanish sentence translation (word tiles or typing), listen & write, spell the word, conjugation drills with only the tenses you have reached in class.
- **Verbs** — top 100 verbs in 10 groups. Pick the tenses you want (all 12 are included), learn the tables with an example sentence for every person, practise, and take the group test: 80 % unlocks the next group. "Review groups 1–N" mixes earlier groups.
- **Review** — spaced repetition: everything you practise comes back when you are about to forget it.

## Progress
Progress is stored in the browser on each device. Use **Settings → Export / Import** to back it up or move it to another device.

## Put it on the iPhone
The folder is a Progressive Web App. Host it on any static site (e.g. Netlify Drop or GitHub Pages), open the link in Safari, then Share → *Add to Home Screen*. After the first visit it works offline.

## Files
- `index.html`, `styles.css`, `app.js` — the app
- `data.js` — all book content, conjugations and examples (generated)
- `pages/` — the book pages as images
- `sw.js`, `manifest.json`, `icons/` — offline / home-screen support
- `source/` — the editable unit files (`units/u00.txt` … `u18.txt`) and the Python scripts that build `data.js` (`python build_data.py ../data.js`, needs `pip install verbecc`)

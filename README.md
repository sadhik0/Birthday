# Reshu's Birthday Website

A romantic, cinematic birthday website built with plain HTML, CSS and JavaScript.
No frameworks, no build step, no server. It works by opening `index.html` and it
deploys to GitHub Pages as-is.

## What is inside

```
reshu-birthday/
├── index.html      page structure
├── style.css       all styling
├── script.js       all behaviour  (photo list + captions are at the top)
├── images/         put your 15 photos here
│   └── README.txt  the exact file names expected
├── audio/          optional: put your song here
│   └── README.txt
└── README.md       this guide
```

## 1. Add your 15 photos

1. Open the `images` folder.
2. Copy in 15 photos using exactly these names (all lowercase, `.jpeg`):

   `image.jpeg`, `image1.jpeg`, `image2.jpeg`, `image3.jpeg`, `image4.jpeg`,
   `image5.jpeg`, `image6.jpeg`, `image7.jpeg`, `image8.jpeg`, `image9.jpeg`,
   `image10.jpeg`, `image11.jpeg`, `image12.jpeg`, `image13.jpeg`, `image14.jpeg`

3. Tip: resize each photo to about 1600 px on the long side (roughly 300 to 600 KB each).
   The site loads faster and works better on phones.

GitHub Pages is **case-sensitive**: `Image1.jpeg` or `image1.jpg` will NOT match `image1.jpeg`.

If a file is missing, its tile shows a rose card that says which file to add, so nothing looks broken.

## 2. Change captions or alt text (optional)

Open `script.js`. At the top is the `PHOTOS` list, with comments. Each photo has:

- `src` the file path
- `alt` a short description for screen readers (for example "Reshu laughing at the beach")
- `caption` optional text shown on hover and in the full-screen viewer (leave `''` for none)

To use a different file name for any photo, change its `src` to match.

## 3. Optional music

1. Put a song you have the right to use at `audio/birthday-song.mp3`.
2. Reload. The small music button (bottom-right) becomes active.

Music never starts by itself. If the file is missing, the button stays dimmed.
To use another file name, change `musicSrc` in the `CONFIG` block at the top of `script.js`.

## 4. Test locally

1. Double-click `index.html` to open it in your browser. That is all.
2. Check:
   - Tap or click the envelope: the flap opens and the greeting card rises.
   - Scroll: the two language marquees move in opposite directions.
   - The "HAPPY BIRTHDAY" flaps animate once, then stay.
   - Photos open in the full-screen viewer. Try the arrow keys, Esc and swipe.
   - "Save this letter" opens the print window with only the letter.
3. Phone check: in Chrome press `F12`, then the device toolbar icon, then pick a small phone
   (320 px wide works too).

Fonts come from Google Fonts. Offline, the site falls back to system fonts.

## 5. Publish with GitHub Pages

1. Create a free account at <https://github.com> if needed.
2. Click **New repository**. Name it, for example, `reshu-birthday`. Choose **Public**
   (free GitHub Pages needs a public repository). Click **Create repository**.
3. On the new repository page click **uploading an existing file**.
4. Drag in `index.html`, `style.css`, `script.js` and the whole `images` folder
   (and the `audio` folder if you added a song). Wait for the uploads to finish.
5. Click **Commit changes**.
6. Go to **Settings** then **Pages**.
7. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
   Pick branch **main** and folder **/ (root)**, then **Save**.
8. Wait one or two minutes and refresh. GitHub shows the address:
   `https://YOUR-USERNAME.github.io/reshu-birthday/`
9. Open that address on your phone and check it.

All paths in the site are relative, so it works from that `/reshu-birthday/` sub-path.

### To change something later

Open the file in your repository, click the pencil icon, edit, and **Commit changes**.
To replace a photo, upload a new file with the same name. The site updates in a minute or so.

## Privacy notes

- A GitHub Pages site is public. Anyone who gets the link can open it, and the photos can be saved.
  A hard-to-guess address is not security.
- The page asks search engines not to list it (`noindex`), but that is a request, not protection.
- Only share the link with people you trust, and only upload photos you are happy to have online.
- There are no accounts, forms, cookies, analytics or API keys on this site.

## Accessibility and motion

- Everything works with a keyboard. Visible focus rings are on every control.
- If the visitor's device asks to reduce motion, the envelope opens instantly, the marquees become a
  still wrapped list, the flaps appear at once and the gallery stops drifting.
- Narrow screens (under 900 px wide) get a calm two-column photo grid instead of the drifting wall.

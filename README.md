# guanlinhuang.com

Personal academic website. Plain HTML/CSS, hosted on GitHub Pages.

## Edit content
Everything lives in `index.html`. Replace each `[bracketed]` placeholder.
- Photo: put `photo.jpg` in `assets/` and swap the `<div class="photo">` for `<img class="photo" src="assets/photo.jpg" alt="Guanlin Huang">`.
- CV: save it as `assets/cv.pdf`.
- Publication/project images: `assets/pub1.png` etc., swapped in the same way as the photo (`<img class="thumb" ...>`).

## Deploy
1. Create a public repo named `<username>.github.io` and push these files.
2. Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/`.
3. Custom domain: `guanlinhuang.com` (GitHub then adds a `CNAME` file), then tick "Enforce HTTPS".

## DNS (at your registrar)
| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | `<username>.github.io` |

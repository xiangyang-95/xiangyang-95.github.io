# Personal GitHub Pages Blog

This is a minimal static blog starter for GitHub Pages. It contains a homepage, a small client-side renderer, a stylesheet, and a manifest-driven list of posts so you can publish quickly.

Important: the site source files live in the `src/` folder. When testing locally, serve the `src/` directory (see testing below).

How to publish

1. Push this repo to GitHub under the repository named `xiangyang-95.github.io`.
2. In repository Settings -> Pages, ensure the site is served from the `main` branch (root).
3. The site will be available at `https://xiangyang-95.github.io` (may take a minute).

Project layout (relevant files)

- `src/index.html` — homepage and posts list (dynamically rendered by `src/js/blogs.js`)
- `src/post.html` — single-post reader (uses query string `?file=...`)
- `src/contents/blogs/_manifest.json` — manifest that lists posts and metadata
- `src/contents/blogs/*.md` — markdown post source files
- `src/css/styles.css` — simple responsive styles
- `src/js/blogs.js` — client-side renderer that loads the manifest and markdown

Adding a new post

1. Create a markdown file in `src/contents/blogs/`, for example `hello-world.md`.
2. Add an entry in `src/contents/blogs/_manifest.json` with the `file` name and optional `title`, `date`, `tags`, `summary`.
3. Commit and push. The homepage reads the manifest and renders posts client-side.

Example manifest entry:

```json
{
	"file": "hello-world.md",
	"title": "Hello World",
	"date": "2025-09-03",
	"tags": ["intro"]
}
```

Notes

- If you move files or change the posts folder, update `src/js/blogs.js` (it expects the manifest at `contents/blogs/_manifest.json` by default).
- For GitHub Pages project sites, ensure files are reachable at the expected paths; adjust paths in `src/js/blogs.js` if you serve from a subpath.

If you want, I can update this README further to show an example workflow for adding posts or make the manifest path configurable in `src/js/blogs.js`.

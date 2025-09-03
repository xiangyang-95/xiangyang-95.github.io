// Minimal blog renderer for static GitHub Pages
(function () {
    const manifestPath = 'contents/blogs/_manifest.json';

    // tiny markdown -> html renderer (very small subset)
    function mdToHtml(md) {
        const lines = md.replace(/\r/g, '').split('\n');
        let out = '';
        let inCode = false;
        let codeLang = '';
        let listType = null;
        for (let line of lines) {
            if (line.startsWith('```')) {
                if (!inCode) { inCode = true; codeLang = line.slice(3).trim(); out += '<pre><code>'; }
                else { inCode = false; out += '</code></pre>'; }
                continue;
            }
            if (inCode) { out += escapeHtml(line) + '\n'; continue; }
            if (line.match(/^#{1}\s+/)) { out += '<h1>' + escapeHtml(line.replace(/^#\s+/, '')) + '</h1>'; continue; }
            if (line.match(/^#{2}\s+/)) { out += '<h2>' + escapeHtml(line.replace(/^##\s+/, '')) + '</h2>'; continue; }
            if (line.match(/^#{3}\s+/)) { out += '<h3>' + escapeHtml(line.replace(/^###\s+/, '')) + '</h3>'; continue; }
            if (line.match(/^\-\s+/)) { if (listType !== 'ul') { if (listType === 'ol') { out += '</ol>'; } listType = 'ul'; out += '<ul>'; } out += '<li>' + escapeHtml(line.replace(/^\-\s+/, '')) + '</li>'; continue; }
            if (line.match(/^\d+\.\s+/)) { if (listType !== 'ol') { if (listType === 'ul') { out += '</ul>'; } listType = 'ol'; out += '<ol>'; } out += '<li>' + escapeHtml(line.replace(/^\d+\.\s+/, '')) + '</li>'; continue; }
            if (line.trim() === '') { if (listType === 'ul') { out += '</ul>'; listType = null } else if (listType === 'ol') { out += '</ol>'; listType = null } else { out += '<p></p>'; } continue; }
            out += '<p>' + escapeHtml(line) + '</p>';
        }
        if (inCode) out += '</code></pre>';
        if (listType === 'ul') out += '</ul>';
        if (listType === 'ol') out += '</ol>';
        return out;
    }

    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // Pagination: render posts row-by-row, max per page
    const PER_PAGE = 10;
    let manifestCache = null;

    function getPageFromUrl() { const u = new URL(location.href); const p = parseInt(u.searchParams.get('page') || '1', 10); return isNaN(p) || p < 1 ? 1 : p; }
    function setPageInUrl(page) { const u = new URL(location.href); if (page <= 1) u.searchParams.delete('page'); else u.searchParams.set('page', String(page)); history.replaceState(null, '', u); }

    async function renderPage(manifest, page) {
        const container = document.getElementById('posts');
        if (!container) return;
        container.innerHTML = '';
        manifestCache = manifest;

        const total = (manifest.posts || []).length;
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (page > totalPages) page = totalPages;

        const start = (page - 1) * PER_PAGE;
        const slice = manifest.posts.slice(start, start + PER_PAGE);

        // Render only the slice to limit network and DOM work
        const cards = await Promise.all(slice.map(async (p) => {
            const file = p.file;
            const title = p.title || file;
            let date = p.date || '';
            let tags = p.tags || [];
            let summary = p.summary || '';

            if ((!tags || tags.length === 0) || !summary) {
                try {
                    const mdPath = 'contents/blogs/' + file.replace(/\.\./g, '');
                    const md = await fetchText(mdPath);
                    const fm = parseFrontMatter(md);
                    if (!summary) summary = fm.summary || '';
                    if ((!tags || tags.length === 0) && fm.tags) tags = fm.tags;
                    if (!date && fm.date) date = fm.date;
                } catch (e) { /* ignore */ }
            }

            if (!summary) {
                try {
                    const mdPath = 'contents/blogs/' + file.replace(/\.\./g, '');
                    const md = await fetchText(mdPath);
                    summary = extractExcerpt(md);
                } catch (e) { }
            }

            const art = document.createElement('article');
            art.className = 'post-card';
            const readUrl = 'post.html?file=' + encodeURIComponent(file);
            const formattedDate = date ? formatDate(date) : '';
            const tagsHtml = (tags && tags.length) ? (`<div class="tags">` + tags.map(t => `<span class="tag">${escapeHtml(String(t))}</span>`).join('') + `</div>`) : '';

            art.innerHTML = `
        <h2><a href="${readUrl}" style="color:inherit;text-decoration:none">${escapeHtml(title)}</a></h2>
        <div class="meta">${formattedDate ? ('Date: ' + escapeHtml(formattedDate)) : ''}${(formattedDate && tagsHtml) ? ' · ' : ''}${tagsHtml}</div>
        <div class="excerpt">${escapeHtml(truncate(summary, 200))}</div>
        <a class="read-more" href="${readUrl}">Read</a>
      `;
            // Make the whole card behave as a clickable row while preserving inner links
            art.setAttribute('tabindex', '0');
            art.setAttribute('role', 'link');
            art.addEventListener('click', (e) => {
                // if an anchor inside was clicked, let it handle navigation
                if (e.target.closest('a')) return;
                location.href = readUrl;
            });
            art.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    location.href = readUrl;
                }
            });
            return art;
        }));

        for (const c of cards) container.appendChild(c);

        renderPagination(total, page, totalPages);
        setPageInUrl(page);
    }

    function renderPagination(total, page, totalPages) {
        // remove existing pagination if any
        const old = document.getElementById('pagination');
        if (old) old.remove();

        const nav = document.createElement('nav');
        nav.id = 'pagination';
        nav.className = 'pagination';

        function makeBtn(label, target, disabled) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.disabled = !!disabled;
            b.className = 'page-btn';
            b.addEventListener('click', () => {
                if (typeof manifestCache === 'object') renderPage(manifestCache, target);
            });
            return b;
        }

        nav.appendChild(makeBtn('← Prev', Math.max(1, page - 1), page <= 1));

        // smart page list
        const maxButtons = 7;
        const pages = [];
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 4) pages.push('...');
            const start = Math.max(2, page - 2);
            const end = Math.min(totalPages - 1, page + 2);
            for (let i = start; i <= end; i++) pages.push(i);
            if (page < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }

        for (const p of pages) {
            if (p === '...') {
                const span = document.createElement('span'); span.className = 'dots'; span.textContent = '…'; nav.appendChild(span); continue;
            }
            const b = makeBtn(String(p), p, false);
            if (p === page) b.classList.add('active');
            nav.appendChild(b);
        }

        nav.appendChild(makeBtn('Next →', Math.min(totalPages, page + 1), page >= totalPages));

        const container = document.getElementById('posts');
        if (container) container.after(nav);
    }

    // Try to parse a minimal YAML frontmatter block from markdown
    function parseFrontMatter(md) {
        const res = {};
        if (!md.startsWith('---')) return res;
        const end = md.indexOf('\n---', 3);
        if (end === -1) return res;
        const block = md.slice(3, end).split('\n');
        for (let line of block) {
            const m = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
            if (!m) continue;
            const key = m[1];
            let val = m[2].trim();
            // remove surrounding quotes
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            // simple tags array: [a, b, c]
            if (val.startsWith('[') && val.endsWith(']')) {
                const inner = val.slice(1, -1).trim();
                if (inner === '') res[key] = [];
                else res[key] = inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                res[key] = val;
            }
        }
        return res;
    }

    // Extract a short excerpt from markdown (skip frontmatter and initial headings)
    function extractExcerpt(md) {
        // strip frontmatter
        if (md.startsWith('---')) {
            const end = md.indexOf('\n---', 3);
            if (end !== -1) md = md.slice(end + 4);
        }
        const lines = md.replace(/\r/g, '').split('\n');
        let buf = [];
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].trim();
            if (!l) { if (buf.length) break; else continue; }
            // skip headings and date lines
            if (l.match(/^#+\s+/)) continue;
            if (l.toLowerCase().startsWith('date:')) continue;
            // stop at next heading after first paragraph
            buf.push(l);
            // collect subsequent non-empty lines until blank
            for (let j = i + 1; j < lines.length; j++) {
                const nl = lines[j].trim();
                if (!nl) break;
                if (nl.match(/^#+\s+/)) break;
                buf.push(nl);
            }
            break;
        }
        const text = buf.join(' ');
        return text ? text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim() : '';
    }

    function formatDate(d) {
        try {
            // Accept ISO-like dates or plain strings
            const dt = new Date(d);
            if (!isNaN(dt)) return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { }
        return d;
    }

    function truncate(s, n) { if (!s) return ''; return s.length > n ? s.slice(0, n).trim() + '…' : s; }
    function fetchJSON(path) { return fetch(path).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }); }
    function fetchText(path) { return fetch(path).then(r => { if (!r.ok) throw new Error(r.statusText); return r.text(); }); }

    // If on post page: ?file=hello-world.md
    const url = new URL(location.href);
    const file = url.searchParams.get('file');
    if (file && document.getElementById('post-content')) {
        const mdPath = 'contents/blogs/' + file.replace(/\.{2}/g, '');
        fetchText(mdPath)
            .then(md => {
                const container = document.getElementById('post-content');
                // Prefer Marked if available for GitHub-like rendering; fallback to tiny renderer
                if (window.marked && typeof window.marked.parse === 'function') {
                    try {
                        // enable GFM
                        window.marked.use({ gfm: true });
                        container.innerHTML = window.marked.parse(md);
                    } catch (e) {
                        container.innerHTML = mdToHtml(md);
                    }
                } else {
                    container.innerHTML = mdToHtml(md);
                }
                // Fix relative links/images to point to the blogs folder
                fixRelativeLinks(container, 'contents/blogs/');
                // Trigger syntax highlighting if highlight.js is present
                if (window.hljs && typeof window.hljs.highlightAll === 'function') {
                    window.hljs.highlightAll();
                }
                document.getElementById('post-meta').textContent = '';
            })
            .catch(err => {
                document.getElementById('post-content').textContent = 'Failed to load post: ' + err.message;
            });
        return;
    }

    function isAbsoluteUrl(u){ try { return new URL(u, location.href).origin !== location.origin || /^(?:https?:)?\/\//i.test(u); } catch { return false; } }
    function isHashOrMail(u){ return !u || u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('tel:'); }
    function fixRelativeLinks(root, base){
        // anchors
        const as = root.querySelectorAll('a[href]');
        as.forEach(a => {
            const href = a.getAttribute('href');
            if (isHashOrMail(href) || isAbsoluteUrl(href)) return;
            // avoid rewriting absolute-rooted urls ("/path")
            if (href.startsWith('/')) return;
            a.setAttribute('href', base + href.replace(/^\.\//, ''));
        });
        // images
        const imgs = root.querySelectorAll('img[src]');
        imgs.forEach(img => {
            const src = img.getAttribute('src');
            if (isAbsoluteUrl(src)) return;
            if (src.startsWith('/')) return;
            img.setAttribute('src', base + src.replace(/^\.\//, ''));
        });
    }

    // Otherwise render index (paged)
    document.addEventListener('DOMContentLoaded', () => {
        fetchJSON(manifestPath).then(manifest => renderPage(manifest, getPageFromUrl())).catch(err => {
            const container = document.getElementById('posts');
            if (container) container.textContent = 'Failed to load blog manifest: ' + err.message;
        });
    });

})();

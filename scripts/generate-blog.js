#!/usr/bin/env node
/**
 * generate-blog.js
 * Gera páginas estáticas do blog a partir da API WordPress da Allaser.
 *
 * Uso:
 *   node scripts/generate-blog.js          → protótipo (5 posts)
 *   node scripts/generate-blog.js --all    → todos os posts (85+)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_BASE = 'https://allaser.com.br/wp-json/wp/v2';
const ROOT     = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const IS_ALL   = process.argv.includes('--all');
const PER_PAGE = IS_ALL ? 100 : 5;

/* ─── helpers ────────────────────────────────────────── */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'allaser-blog-generator/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error on ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function getFeaturedImage(post) {
  try { return post._embedded['wp:featuredmedia'][0].source_url; }
  catch { return null; }
}

function getCats(post, catMap) {
  return (post.categories || []).map(id => catMap[id]).filter(Boolean);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

/* ─── templates ──────────────────────────────────────── */
const GTM_HEAD = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KTHL2SP9');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KTHL2SP9"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const PIXEL = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '885615589651085');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=885615589651085&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">`;

/* ─── Post page ──────────────────────────────────────── */
function generatePostPage(post, catMap) {
  const title      = post.title.rendered;
  const content    = post.content.rendered;
  const excerpt    = stripHtml(post.excerpt.rendered).substring(0, 160);
  const img        = getFeaturedImage(post);
  const cats       = getCats(post, catMap);
  const date       = formatDate(post.date);
  const catBadges  = cats.map(c => `<span class="post-cat">${c.name}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · Blog Allaser</title>
<meta name="description" content="${excerpt}">
${FONTS}
<link rel="stylesheet" href="/assets/shared.css">
<style>
.post-hero {
  background: #0a0a0c;
  padding: 80px 0 56px;
}
.post-hero__inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 32px;
}
.post-hero__cats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.post-cat {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(174,191,60,0.12);
  color: #aebf3c;
  border: 1px solid rgba(174,191,60,0.25);
}
.post-hero__title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 800;
  line-height: 1.15;
  color: #f4f3ee;
  margin-bottom: 20px;
}
.post-hero__meta { font-size: 0.85rem; color: rgba(244,243,238,0.40); }
.post-featured-wrap {
  width: 100%;
  background: #0a0a0c;
  display: flex;
  justify-content: center;
}
.post-featured-img {
  display: block;
  width: 100%;
  max-width: 900px;
  height: auto;
}
.post-body {
  max-width: 760px;
  margin: 0 auto;
  padding: 52px 32px 96px;
}
.post-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7a8f1c;
  margin-bottom: 44px;
  text-decoration: none;
  transition: gap 0.2s;
}
.post-back:hover { gap: 12px; }
.post-back svg { width: 16px; height: 16px; }
.post-content { font-size: 1rem; line-height: 1.85; color: #2a2a2a; }
.post-content h2 { font-size: 1.5rem; font-weight: 700; margin: 44px 0 16px; line-height: 1.25; color: #111; }
.post-content h3 { font-size: 1.2rem; font-weight: 700; margin: 36px 0 12px; line-height: 1.3; color: #111; }
.post-content h4 { font-size: 1rem; font-weight: 700; margin: 28px 0 10px; color: #111; }
.post-content p { margin-bottom: 20px; }
.post-content ul, .post-content ol { margin: 0 0 20px 24px; }
.post-content li { margin-bottom: 8px; }
.post-content img { max-width: 100%; border-radius: 10px; margin: 28px auto; display: block; }
.post-content blockquote {
  border-left: 3px solid #aebf3c;
  padding: 8px 0 8px 24px;
  margin: 28px 0;
  color: #555;
  font-style: italic;
}
.post-content a { color: #7a8f1c; }
.post-content a:hover { text-decoration: underline; }
.post-content figure { margin: 28px 0; }
.post-content figcaption { font-size: 0.8rem; color: #999; text-align: center; margin-top: 8px; }
/* Limpa classes do WP/Elementor que não se aplicam */
.post-content [class*="wp-block"] { all: unset; display: revert; }
.post-content .wp-block-image { display: block; margin: 28px 0; }
.post-content .wp-block-image img { max-width: 100%; border-radius: 10px; }
@media (max-width: 640px) {
  .post-hero { padding: 60px 0 40px; }
  .post-hero__inner, .post-body { padding-left: 20px; padding-right: 20px; }
}
</style>
${GTM_HEAD}
${PIXEL}
</head>
<body>
${GTM_BODY}
<div id="site-header"></div>
<main id="main-content">
  <div class="post-hero">
    <div class="post-hero__inner">
      ${cats.length ? `<div class="post-hero__cats">${catBadges}</div>` : ''}
      <h1 class="post-hero__title">${title}</h1>
      <div class="post-hero__meta">${date}</div>
    </div>
  </div>
  ${img ? `<div class="post-featured-wrap"><img class="post-featured-img" src="${img}" alt="${title}" loading="lazy"></div>` : ''}
  <div class="post-body">
    <a href="/blog.html" class="post-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      Voltar ao Blog
    </a>
    <div class="post-content">${content}</div>
  </div>
</main>
<div id="site-footer"></div>
<script src="/assets/components.js"></script>
<script src="/assets/shared.js"></script>
<script>setActiveNav('blog');</script>
</body>
</html>`;
}

/* ─── Blog index ─────────────────────────────────────── */
function generateBlogIndex(posts, catMap) {
  const usedCatIds = [...new Set(posts.flatMap(p => p.categories))];
  const usedCats   = usedCatIds.map(id => catMap[id]).filter(Boolean);

  const catFilters = [
    `<button class="blog-filter active" data-cat="all">Todos</button>`,
    ...usedCats.map(c => `<button class="blog-filter" data-cat="${c.id}">${c.name}</button>`)
  ].join('\n    ');

  const cards = posts.map(post => {
    const img     = getFeaturedImage(post);
    const cats    = getCats(post, catMap);
    const date    = formatDate(post.date);
    const excerpt = stripHtml(post.excerpt.rendered).substring(0, 150);
    const catIds  = post.categories.join(',');
    const catBadges = cats.map(c => `<span class="blog-card__cat">${c.name}</span>`).join('');

    return `
  <article class="blog-card" data-cats="${catIds}">
    <a href="/blog/${post.slug}.html" class="blog-card__img-wrap">
      ${img
        ? `<img src="${img}" alt="${post.title.rendered}" class="blog-card__img" loading="lazy">`
        : `<div class="blog-card__img-placeholder"></div>`}
    </a>
    <div class="blog-card__body">
      ${cats.length ? `<div class="blog-card__cats">${catBadges}</div>` : ''}
      <h2 class="blog-card__title"><a href="/blog/${post.slug}.html">${post.title.rendered}</a></h2>
      <p class="blog-card__excerpt">${excerpt}…</p>
      <div class="blog-card__foot">
        <span class="blog-card__date">${date}</span>
        <a href="/blog/${post.slug}.html" class="blog-card__read">Ler mais →</a>
      </div>
    </div>
  </article>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog — Allaser</title>
<meta name="description" content="Artigos sobre laserterapia, fotobiomodulação e aplicações clínicas para profissionais de saúde.">
${FONTS}
<link rel="stylesheet" href="/assets/shared.css">
<style>
/* ── Blog hero ───────────────────────────────── */
.blog-hero {
  background: #0a0a0c;
  padding: 80px 0 56px;
  text-align: center;
}
.blog-hero__inner { max-width: 640px; margin: 0 auto; padding: 0 32px; }
.blog-hero__eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #aebf3c;
  margin-bottom: 16px;
}
.blog-hero__title { font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800; color: #f4f3ee; line-height: 1.15; margin-bottom: 16px; }
.blog-hero__sub { font-size: 1rem; color: rgba(244,243,238,0.50); line-height: 1.7; }

/* ── Blog main ───────────────────────────────── */
.blog-main { padding: 64px 0 100px; background: #f8f8f6; }
.blog-wrap { max-width: 1100px; margin: 0 auto; padding: 0 32px; }

/* ── Filters ─────────────────────────────────── */
.blog-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 48px; }
.blog-filter {
  padding: 8px 20px;
  border-radius: 99px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  background: white;
  border: 1.5px solid #e0e0dc;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}
.blog-filter:hover, .blog-filter.active {
  background: #aebf3c;
  border-color: #aebf3c;
  color: #0a0a0a;
}

/* ── Cards ───────────────────────────────────── */
.blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.blog-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #ebebeb;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.blog-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-2px); }
.blog-card.hidden { display: none; }
.blog-card__img-wrap {
  display: block;
  background: #e8e8e4;
  overflow: hidden;
}
.blog-card__img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.35s;
}
.blog-card__img-wrap:hover .blog-card__img { transform: scale(1.02); }
.blog-card__img-placeholder { width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #e8e8e4 0%, #d8d8d0 100%); }
.blog-card__body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
.blog-card__cats { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.blog-card__cat {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7a8f1c;
  background: rgba(174,191,60,0.10);
  padding: 3px 10px;
  border-radius: 99px;
}
.blog-card__title { font-size: 1rem; font-weight: 700; line-height: 1.35; margin-bottom: 10px; }
.blog-card__title a { color: #1a1a1a; text-decoration: none; }
.blog-card__title a:hover { color: #7a8f1c; }
.blog-card__excerpt { font-size: 0.84rem; color: #666; line-height: 1.65; margin-bottom: 20px; flex: 1; }
.blog-card__foot { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.blog-card__date { font-size: 0.76rem; color: #aaa; }
.blog-card__read { font-size: 0.82rem; font-weight: 600; color: #aebf3c; text-decoration: none; }
.blog-card__read:hover { text-decoration: underline; }

@media (max-width: 960px) { .blog-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) {
  .blog-grid { grid-template-columns: 1fr; }
  .blog-wrap, .blog-hero__inner { padding: 0 20px; }
  .blog-hero { padding: 60px 0 40px; }
  .blog-main { padding: 48px 0 72px; }
}
</style>
${GTM_HEAD}
${PIXEL}
</head>
<body>
${GTM_BODY}
<div id="site-header"></div>
<main id="main-content">
  <div class="blog-hero">
    <div class="blog-hero__inner">
      <div class="blog-hero__eyebrow">Blog</div>
      <h1 class="blog-hero__title">Conhecimento em Laserterapia</h1>
      <p class="blog-hero__sub">Artigos científicos e práticos sobre fotobiomodulação, laserterapia e suas aplicações clínicas.</p>
    </div>
  </div>
  <section class="blog-main">
    <div class="blog-wrap">
      <div class="blog-filters">
    ${catFilters}
      </div>
      <div class="blog-grid" id="blogGrid">
${cards}
      </div>
    </div>
  </section>
</main>
<div id="site-footer"></div>
<script src="/assets/components.js"></script>
<script src="/assets/shared.js"></script>
<script>
setActiveNav('blog');
document.querySelectorAll('.blog-filter').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.blog-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    var cat = btn.dataset.cat;
    document.querySelectorAll('.blog-card').forEach(function(card) {
      if (cat === 'all') {
        card.classList.remove('hidden');
      } else {
        var cats = card.dataset.cats.split(',');
        card.classList.toggle('hidden', !cats.includes(cat));
      }
    });
  });
});
</script>
</body>
</html>`;
}

/* ─── main ───────────────────────────────────────────── */
async function main() {
  console.log(`\n🔍 Buscando categorias...`);
  const categories = await fetchJSON(`${API_BASE}/categories?per_page=100`);
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = { id: c.id, name: c.name, slug: c.slug }; });
  console.log(`   ${categories.length} categorias encontradas`);

  console.log(`\n🔍 Buscando posts (per_page=${PER_PAGE})...`);
  const posts = await fetchJSON(`${API_BASE}/posts?per_page=${PER_PAGE}&_embed=true`);
  console.log(`   ${posts.length} posts encontrados`);

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  console.log(`\n📝 Gerando páginas individuais...`);
  for (const post of posts) {
    const html = generatePostPage(post, catMap);
    const outPath = path.join(BLOG_DIR, `${post.slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`   ✓ blog/${post.slug}.html`);
  }

  console.log(`\n📋 Gerando blog.html (índice)...`);
  const indexHtml = generateBlogIndex(posts, catMap);
  fs.writeFileSync(path.join(ROOT, 'blog.html'), indexHtml, 'utf8');
  console.log(`   ✓ blog.html`);

  console.log(`\n✅ Concluído! ${posts.length} posts + blog.html gerados.\n`);
  if (!IS_ALL) {
    console.log(`   Para gerar TODOS os posts: node scripts/generate-blog.js --all\n`);
  }
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });

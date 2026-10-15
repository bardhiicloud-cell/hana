#!/usr/bin/env python3
"""Gjeneron faqet statike: index.html, market/index.html dhe faqet e kategorive.

Përdorim:  python scripts/build-pages.py
Pjesët e përbashkëta (modalet, shporta, checkout) janë te src/partials/.
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SITE = 'https://hanafreeshop.com'
PHONE = '+383 48 588 886'
TEL = '+38348588886'

# slug, id i kategorisë, titulli, përshkrimi, foto
CATS = [
    ('alkoholi', 'alkool', 'Alkool Premium', "Grey Goose, Jack Daniel's dhe marka të tjera botërore. Dorëzim brenda 30 minutash në Pejë.", 'images/hero-alcohol-variety-1200w.webp'),
    ('cigare', 'cigare', 'Cigare & Duhan', 'Puro, Golden Eagle, OCB dhe marka të njohura. Dorëzim brenda 30 minutash në Pejë.', 'images/hero-puro-tobacco-1200w.webp'),
    ('buldak', 'bulldak', 'Buldak & Ice Cups', 'Noodles pikante koreane Buldak dhe akullore Ice Cups. Dorëzim brenda 30 minutash në Pejë.', 'images/hero-buldak-ice-1200w.webp'),
    ('pije', 'pije-tonike', 'Pije & Energjike', 'Red Bull dhe pije të tjera të njohura. Dorëzim brenda 30 minutash në Pejë.', 'images/products/redbull-250ml.webp'),
    ('embelsira', 'cokollata-embelsira', 'Çokollata & Ëmbëlsira', 'Lindt, Ferrero, Kinder dhe më shumë. Dorëzim brenda 30 minutash në Pejë.', 'images/products/lindt-lindor-dark-200g.webp'),
    ('ushqime', 'ushqime-pije', 'Ushqime & Snacks', 'Snacks dhe ushqime të importuara. Dorëzim brenda 30 minutash në Pejë.', 'images/hero-premium-bag-1200w.webp'),
]


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


LOCATION = read('src/partials/location.html')
OVERLAYS = read('src/partials/overlays.html')

BAG = '<path d="M6 2h12l3 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7l3-5z"/><path d="M3 7h18"/><path d="M16 11a4 4 0 0 1-8 0"/>'


def head(title, desc, path, image, page, extra_ld=''):
    canon = SITE + path
    return f'''<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<base href="/">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#08080A">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/{image}">
<meta property="og:url" content="{canon}">
<meta property="og:type" content="website">
<meta property="og:locale" content="sq_AL">
<meta property="og:site_name" content="Hana Free Shop">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/images/icon-192x192.png" type="image/png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Hana">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v=9-100k">
<link rel="stylesheet" href="css/hana-final.css?v=2">
<link rel="stylesheet" href="css/site.css?v=5">
{extra_ld}<script type="importmap">
{{"imports":{{
 "firebase/app":"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js",
 "firebase/firestore":"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js",
 "firebase/auth":"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js",
 "firebase/storage":"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js",
 "firebase/functions":"https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js"
}}}}
</script>
<script src="js/config.js?v=12"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}
(function(){{var id=window.HANA_CONFIG&&window.HANA_CONFIG.gaId;if(!id)return;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.appendChild(s);gtag('js',new Date());gtag('config',id,{{anonymize_ip:true}});}})();
</script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js" defer></script>
</head>
<body data-page="{page}"'''


NAV = '''<nav class="desktop-nav" aria-label="Navigimi kryesor">
  <a href="/" {home}>Ballina</a>
  <a href="/alkoholi" {c_alkoholi}>Alkool</a>
  <a href="/cigare" {c_cigare}>Cigare</a>
  <a href="/buldak" {c_buldak}>Buldak</a>
  <a href="/pije" {c_pije}>Pije</a>
  <a href="/embelsira" {c_embelsira}>Ëmbëlsira</a>
  <a href="/market" {market}>Të gjitha</a>
 </nav>'''


def header(active):
    flags = {k: '' for k in ['home', 'market'] + ['c_' + c[0] for c in CATS]}
    if active in flags:
        flags[active] = 'class="active"'
    nav = NAV.format(**flags)
    return f'''<div class="app">
{LOCATION}
 <header class="header" id="header">
 <div class="header-main">
  <a href="/" class="logo" aria-label="Hana Free Shop - Ballina">
  <div class="logo-mark">H</div>
  <div class="logo-text"><strong>HANA</strong><span>FREE SHOP</span></div>
  </a>
  <div class="location" id="locationBtn" role="button" tabindex="0" aria-label="Zgjidh lokacionin">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="1.8"><path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
  <span id="currentCity">Pejë</span>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
  </div>
  {nav}
  <div class="header-actions">
  <button class="icon-btn" id="wishlistBtn" aria-label="Lista e dëshirave">
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0l-1.3 1.3-1.3-1.3c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l8 8 8-8c1.5-1.5 1.5-4 0-5.5z"/></svg>
   <span class="badge wishlist-badge" id="wishlistCount" style="display:none">0</span>
  </button>
  <button class="icon-btn cart-btn" id="cartBtn" aria-label="Shporta">
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{BAG}</svg>
   <span class="badge gold" id="cartCount">0</span>
  </button>
  <button class="icon-btn profile-btn" id="accountBtn" aria-label="Llogaria ime">
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  </button>
  </div>
 </div>
 <div class="search-wrap">
  <div class="search-field">
  <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
  <input id="searchInput" type="search" placeholder="Kërko produkte dhe marka..." autocomplete="off" aria-label="Kërko produkte">
  </div>
 </div>
 </header>
'''


FOOTER = f'''
 <footer class="s-footer">
  <div class="s-footer-grid">
   <div>
    <div class="s-footer-brand">HANA <span>FREE SHOP</span></div>
    <p>General Wesley Clark, Pejë<br>Çdo ditë 08:00–22:00<br>Dorëzim brenda 30 minutash</p>
    <p><a href="tel:{TEL}">{PHONE}</a> · <a href="https://wa.me/{TEL.lstrip('+')}" rel="noopener" target="_blank">WhatsApp</a></p>
   </div>
   <div>
    <h4>Kategoritë</h4>
    <a href="/alkoholi">Alkool</a><a href="/cigare">Cigare & Duhan</a><a href="/buldak">Buldak & Ice Cups</a><a href="/pije">Pije & Energjike</a><a href="/embelsira">Çokollata & Ëmbëlsira</a><a href="/ushqime">Ushqime & Snacks</a>
   </div>
   <div>
    <h4>Informacion</h4>
    <a href="/shipping.html">Dërgesa</a><a href="/returns.html">Kthimet</a><a href="/terms.html">Kushtet</a><a href="/privacy.html">Privatësia</a>
   </div>
  </div>
  <div class="s-footer-bottom">© 2026 Hana Free Shop. Të gjitha të drejtat e rezervuara.</div>
 </footer>
'''

SCRIPTS = '''
</div>
<script src="js/security.js?v=11-super-huge"></script>
<script src="js/features-100k.js?v=11-super-huge"></script>
<script src="js/pwa.js?v=11-super-huge"></script>
<script type="module" src="js/firebase.js?v=11-super-huge"></script>
<script type="module" src="js/app.js?v=12"></script>
<script src="js/app-100k-patch.js?v=11-super-huge"></script>
<script src="js/auto-bg.js?v=1"></script>
<script src="js/home.js?v=1"></script>
<script>document.querySelector('.s-chip.active')?.scrollIntoView({inline:'center',block:'nearest'});</script>
</body>
</html>
'''

CARD_BAG = f'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{BAG}</svg>'


def home():
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "Store", "name": "Hana Free Shop",
        "image": f"{SITE}/images/hero-premium-bag-800w.webp",
        "description": "Dyqan me marka botërore në Pejë. Dorëzim brenda 30 minutash.",
        "address": {"@type": "PostalAddress", "streetAddress": "General Wesley Clark", "addressLocality": "Pejë", "addressCountry": "XK"},
        "telephone": TEL, "openingHours": "Mo-Su 08:00-22:00", "url": SITE,
    }, ensure_ascii=False)
    h = head('Hana Free Shop — Marka botërore në Pejë | Dorëzim në 30 minuta',
             'Hana Free Shop në Pejë: alkool, cigare, pije energjike, çokollata dhe ushqime të importuara. Dorëzim brenda 30 minutash, çdo ditë 08:00–22:00.',
             '/', 'images/hero-premium-bag-800w.webp', 'home',
             extra_ld=f'<script type="application/ld+json">{ld}</script>\n')
    def slide(img, eyebrow, title, text, ctas, first=False):
        tag = 'h1' if first else 'h2'
        load = 'fetchpriority="high" decoding="async"' if first else 'loading="lazy" decoding="async"'
        base = img.rsplit('.', 1)[0]
        return f'''<article class="s-slide">
     <picture>
      <source type="image/webp" srcset="{base}-800w.webp 800w, {base}-1200w.webp 1200w" sizes="(max-width:1280px) 100vw, 1280px">
      <img src="{base}-1200w.webp" alt="{title.replace('<br>', ' ')}" width="1200" height="800" {load}>
     </picture>
     <div class="s-hero-body">
      <span class="s-eyebrow">{eyebrow}</span>
      <{tag}>{title}</{tag}>
      <p>{text}</p>
      <div class="s-cta">{ctas}</div>
     </div>
    </article>'''

    slides = ''.join([
        slide('images/hero-premium-bag.webp', 'Hana Free Shop · Pejë', 'Marka botërore,<br>në Pejë',
              'Dorëzim brenda 30 minutash, çdo ditë 08:00–22:00. Pagesa në dorë.',
              f'<a class="s-btn s-btn-gold" href="/market">Shiko produktet</a><a class="s-btn s-btn-ghost" href="tel:{TEL}">Telefono</a>', True),
        slide('images/hero-alcohol-variety.webp', 'Alkool Premium', "Grey Goose, Jack Daniel's<br>dhe më shumë",
              'Marka origjinale për çdo rast. Dorëzim brenda 30 minutash.',
              '<a class="s-btn s-btn-gold" href="/alkoholi">Shiko alkoolin</a>'),
        slide('images/hero-buldak-ice.webp', 'Trendi i momentit', 'Buldak<br>& Ice Cups',
              'Noodles pikante koreane dhe akullore, të gatshme brenda 30 minutash.',
              '<a class="s-btn s-btn-gold" href="/buldak">Zbulo</a>'),
        slide('images/hero-puro-tobacco.webp', 'Cigare & Duhan', 'Puro, Golden Eagle<br>dhe OCB',
              'Marka të njohura, gjithmonë në stok.',
              '<a class="s-btn s-btn-gold" href="/cigare">Shiko koleksionin</a>'),
    ])
    dots = ''.join(f'<button type="button" class="s-dot{" active" if i == 0 else ""}" aria-label="Slide {i+1}"></button>' for i in range(4))
    brands = ['Red Bull', 'Lindt', 'Ferrero', 'Kinder', 'Grey Goose', "Jack Daniel's", 'Puro', 'Golden Eagle', 'OCB', "Lay's", 'Buldak']
    marq = ''.join(f'<span>{b}</span>' for b in brands)
    rail_arrows = lambda t: f'<div class="s-arrows"><button type="button" class="s-arrow" data-rail="{t}" data-dir="-1" aria-label="Mbrapa">‹</button><button type="button" class="s-arrow" data-rail="{t}" data-dir="1" aria-label="Para">›</button></div>'

    main = f'''>
{header('home')}
 <main class="s-main">
  <section class="s-hero" id="ballina" aria-roledescription="karusel">
   <div class="s-slides" id="heroSlides">{slides}</div>
   <div class="s-dots" id="heroDots">{dots}</div>
  </section>

  <section class="s-strip s-reveal" aria-label="Si porosit">
   <div><strong>30 min</strong><span>Dorëzim në Pejë</span></div>
   <div><strong>Cash</strong><span>Pagesa në dorë</span></div>
   <div><strong>08–22</strong><span>Çdo ditë</span></div>
  </section>

  <div class="s-marquee s-reveal" aria-label="Markat tona"><div class="s-marquee-track">{marq}{marq}</div></div>

  <section id="kategorite" class="s-section s-reveal">
   <div class="s-head"><h2>Kategoritë</h2><a href="/market" class="s-link">Të gjitha produktet →</a></div>
   <div class="cat-track" id="catTrack"></div>
  </section>

  <section id="ofertat" class="s-section s-reveal">
   <div class="s-head"><h2>Ofertat</h2>{rail_arrows('productGrid')}<a href="/market?filter=oferta" class="s-link">Shiko të gjitha →</a></div>
   <div class="product-grid s-rail" id="productGrid"></div>
   <div class="empty-state" id="emptyState" style="display:none"><h3>Nuk ka oferta për momentin</h3><p>Shiko të gjitha produktet.</p><a class="s-btn s-btn-gold" href="/market">Produktet</a></div>
  </section>

  <section id="best" class="s-section s-reveal">
   <div class="s-head"><h2>Më të kërkuarat</h2>{rail_arrows('popularGrid')}<a href="/market" class="s-link">Shiko të gjitha →</a></div>
   <div class="product-grid s-rail" id="popularGrid"></div>
  </section>

  <section class="s-section s-reveal" id="si-funksionon">
   <div class="s-head"><h2>Si funksionon</h2></div>
   <ol class="s-steps">
    <li><span class="s-step-n">1</span><h3>Zgjidh produktet</h3><p>Shfleto kategoritë dhe shtoji në shportë me një klik.</p></li>
    <li><span class="s-step-n">2</span><h3>Dërgo porosinë</h3><p>Shkruaj emrin, telefonin dhe adresën. Ne të telefonojmë për konfirmim.</p></li>
    <li><span class="s-step-n">3</span><h3>Merre brenda 30 minutash</h3><p>Korrieri e sjell te dera. Paguan në dorë. Gjurmo porosinë me ID.</p></li>
   </ol>
  </section>

  <section class="s-section s-reveal s-why">
   <div class="s-head"><h2>Pse Hana</h2></div>
   <div class="s-why-grid">
    <div><h3>Marka origjinale</h3><p>Red Bull, Lindt, Grey Goose, Jack Daniel's, Puro dhe marka të tjera të njohura.</p></div>
    <div><h3>Dorëzim i shpejtë</h3><p>Brenda 30 minutash në Pejë qytet. Dërgesa është falas mbi 25 €.</p></div>
    <div><h3>Pagesë e thjeshtë</h3><p>Paguan në dorë kur e merr porosinë. Pa llogari, pa komplikime.</p></div>
   </div>
  </section>

  <section class="s-cta-band s-reveal">
   <div>
    <h2>Gati për porosi?</h2>
    <p>Telefono ose shkruaj në WhatsApp. Jemi hapur çdo ditë 08:00–22:00.</p>
   </div>
   <div class="s-cta">
    <a class="s-btn s-btn-gold" href="/market">Shiko produktet</a>
    <a class="s-btn s-btn-ghost" href="tel:{TEL}">{PHONE}</a>
    <a class="s-btn s-btn-ghost" href="https://wa.me/{TEL.lstrip('+')}" target="_blank" rel="noopener">WhatsApp</a>
   </div>
  </section>
 </main>
{FOOTER}
{OVERLAYS}
{SCRIPTS}'''
    return h + main


def listing(slug, cat_id, title, desc, image):
    is_market = slug is None
    path = '/market' if is_market else f'/{slug}'
    page_title = 'Të gjitha produktet' if is_market else title
    seo_title = f'{page_title} në Pejë | Hana Free Shop'
    seo_desc = 'Të gjitha produktet e Hana Free Shop në Pejë. Dorëzim brenda 30 minutash.' if is_market else desc
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Ballina", "item": SITE + '/'},
            {"@type": "ListItem", "position": 2, "name": page_title, "item": SITE + path},
        ]}, ensure_ascii=False)
    attrs = 'data-cat="%s"' % cat_id if cat_id else ''
    page = 'market' if is_market else 'category'
    h = head(seo_title, seo_desc, path, image or 'images/hero-premium-bag-800w.webp', page,
             extra_ld=f'<script type="application/ld+json">{ld}</script>\n')
    chips = ['<a class="s-chip%s" href="/market">Të gjitha</a>' % (' active' if is_market else '')]
    for s_, _, t_, _, _ in CATS:
        chips.append('<a class="s-chip%s" href="/%s">%s</a>' % (' active' if s_ == slug else '', s_, t_))
    intro = 'Zgjidh nga e gjithë gama e Hana Free Shop. Dorëzim brenda 30 minutash në Pejë.' if is_market else desc
    main = f''' {attrs}>
{header('market' if is_market else 'c_' + slug)}
 <main class="s-main">
  <section class="s-page-head">
   <nav class="s-crumbs" aria-label="Breadcrumb"><a href="/">Ballina</a><span>/</span><span>{page_title}</span></nav>
   <h1>{page_title}</h1>
   <p>{intro}</p>
  </section>
  <div class="s-chips" role="navigation" aria-label="Kategoritë">{''.join(chips)}</div>
  <div class="s-count" id="resultCount"></div>
  <div class="product-grid" id="productGrid"></div>
  <div class="empty-state" id="emptyState" style="display:none"><h3>Nuk u gjet asnjë produkt</h3><p>Provo një kategori tjetër.</p><a class="s-btn s-btn-gold" href="/market">Të gjitha produktet</a></div>
 </main>
{FOOTER}
{OVERLAYS}
{SCRIPTS}'''
    return h + main


def write(path, content):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print('wrote', path)


if __name__ == '__main__':
    write('index.html', home())
    write('market/index.html', listing(None, None, None, None, None))
    for slug, cid, title, desc, img in CATS:
        write(f'{slug}/index.html', listing(slug, cid, title, desc, img))

    # sitemap
    urls = [('/', '1.0', 'daily'), ('/market', '0.9', 'daily')] + [(f'/{c[0]}', '0.8', 'daily') for c in CATS]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for loc, pr, cf in urls:
        xml += f'  <url><loc>{SITE}{loc}</loc><changefreq>{cf}</changefreq><priority>{pr}</priority></url>\n'
    xml += '</urlset>\n'
    write('sitemap.xml', xml)

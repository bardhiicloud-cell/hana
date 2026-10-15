#!/usr/bin/env python3
"""Gjeneron faqet statike: index.html, market/index.html dhe faqet e kategorive.

Përdorim:  python scripts/build-pages.py        (kërkon Node.js)

- Përmbajtja e ballinës vjen nga src/home-defaults.json (e njëjta që admini mund ta ndryshojë).
- HTML-ja e hero/seksioneve/footer gjenerohet nga js/site-render.js (e njëjta logjikë si në shfletues).
- Pjesët e përbashkëta (modalet, shporta, checkout) janë te src/partials/.
"""
import json
import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SITE = 'https://hanafreeshop.com'
PHONE = '+383 48 588 886'
TEL = '+38348588886'

# slug, id i kategorisë, titulli, përshkrimi, foto
CATS = [
    ('alkoholi', 'alkool', 'Alkool Premium', "Grey Goose, Jack Daniel's dhe marka të tjera botërore. Dorëzim brenda {minutes} minutash në {city}.", 'images/hero-alcohol-variety-1200w.webp'),
    ('cigare', 'cigare', 'Cigare & Duhan', 'Puro, Golden Eagle, OCB dhe marka të njohura. Dorëzim brenda {minutes} minutash në {city}.', 'images/hero-puro-tobacco-1200w.webp'),
    ('buldak', 'bulldak', 'Buldak & Ice Cups', 'Noodles pikante koreane Buldak dhe akullore Ice Cups. Dorëzim brenda {minutes} minutash në {city}.', 'images/hero-buldak-ice-1200w.webp'),
    ('pije', 'pije-tonike', 'Pije & Energjike', 'Red Bull dhe pije të tjera të njohura. Dorëzim brenda {minutes} minutash në {city}.', 'images/products/redbull-250ml.webp'),
    ('embelsira', 'cokollata-embelsira', 'Çokollata & Ëmbëlsira', 'Lindt, Ferrero, Kinder dhe më shumë. Dorëzim brenda {minutes} minutash në {city}.', 'images/products/lindt-lindor-dark-200g.webp'),
    ('ushqime', 'ushqime-pije', 'Ushqime & Snacks', 'Snacks dhe ushqime të importuara. Dorëzim brenda {minutes} minutash në {city}.', 'images/hero-premium-bag-1200w.webp'),
]


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write(path, content):
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print('wrote', path)


def fragments():
    cats = [{'name': c[2], 'href': '/' + c[0]} for c in CATS]
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as tf:
        json.dump(cats, tf, ensure_ascii=False)
        tmp = tf.name
    try:
        out = subprocess.run(['node', 'scripts/render-fragments.cjs', tmp], capture_output=True, check=True, encoding='utf-8')
    finally:
        os.unlink(tmp)
    return json.loads(out.stdout)


LOCATION = read('src/partials/location.html')
OVERLAYS = read('src/partials/overlays.html')
FRAG = fragments()
ORDER = FRAG['order']

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
<link rel="stylesheet" href="css/site.css?v=7">
<link rel="stylesheet" href="css/shop.css?v=9">
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
<script src="js/home-defaults.js?v=1"></script>
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
<a class="skip-link" href="#main-content">Kalo te përmbajtja</a>
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
  <button class="icon-btn" id="trackBtn" aria-label="Gjurmo porosinë" title="Gjurmo porosinë">
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>
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


FOOTER = f'\n <footer class="s-footer" id="siteFooter">{FRAG["footer"]}</footer>\n'

SCRIPTS = '''
</div>
<script src="js/security.js?v=11-super-huge"></script>
<script src="js/features-100k.js?v=11-super-huge"></script>
<script src="js/pwa.js?v=11-super-huge"></script>
<script src="js/home-defaults.js?v=1"></script>
<script src="js/cities.js?v=1"></script>
<script src="js/site-render.js?v=2"></script>
<script type="module" src="js/firebase.js?v=11-super-huge"></script>
<script type="module" src="js/app.js?v=19"></script>
<script src="js/app-100k-patch.js?v=11-super-huge"></script>
<script src="js/product-modal.js?v=1"></script>
<script src="js/auto-bg.js?v=2"></script>
<script src="js/home.js?v=3"></script>
<script src="js/shop-ux.js?v=4"></script>
<script>document.querySelector('.s-chip.active')?.scrollIntoView({inline:'center',block:'nearest'});</script>
</body>
</html>
'''


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

    def sec(idv, key, frag, cls='s-section s-reveal'):
        return f'  <section id="{idv}" class="{cls}" style="order:{ORDER[key]}">{FRAG[frag]}</section>\n'

    main = f'''>
{header('home')}
 <main class="s-main" id="main-content">
  <section class="s-hero" id="ballina" aria-roledescription="karusel">
   <div class="s-slides" id="heroSlides">{FRAG['heroSlides']}</div>
   <div class="s-dots" id="heroDots">{FRAG['heroDots']}</div>
  </section>
  <section class="s-strip s-reveal" id="hm-strip" style="order:5" aria-label="Si porosit">{FRAG['strip']}</section>
  <div class="s-marquee s-reveal" id="hm-marquee" style="order:6" aria-label="Markat tona"><div class="s-marquee-track">{FRAG['marquee']}</div></div>
{sec('kategorite', 'categories', 'categories')}{sec('ofertat', 'offers', 'offers')}{sec('best', 'best', 'best')}{sec('si-funksionon', 'steps', 'steps')}{sec('hm-why', 'why', 'why', 's-section s-reveal s-why')}{sec('hm-cta', 'cta', 'cta', 's-cta-band s-reveal')}
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
    desc_f = (desc or '').replace('{minutes}', '30').replace('{city}', 'Pejë')
    seo_desc = 'Të gjitha produktet e Hana Free Shop në Pejë. Dorëzim brenda 30 minutash.' if is_market else desc_f
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
    intro = 'Zgjidh nga e gjithë gama e Hana Free Shop. Dorëzim brenda {minutes} minutash në {city}.' if is_market else desc
    intro_tpl = intro
    intro = intro.replace('{minutes}', '30').replace('{city}', 'Pejë')
    main = f''' {attrs}>
{header('market' if is_market else 'c_' + slug)}
 <main class="s-main s-main-list" id="main-content">
  <section class="s-page-head">
   <nav class="s-crumbs" aria-label="Breadcrumb"><a href="/">Ballina</a><span>/</span><span>{page_title}</span></nav>
   <h1>{page_title}</h1>
   <p data-tpl="{intro_tpl}">{intro}</p>
  </section>
  <div class="s-chips" role="navigation" aria-label="Kategoritë">{''.join(chips)}</div>
  <div class="s-toolbar"><div class="s-count" id="resultCount"></div>
   <label class="s-sort"><span>Rendit</span><select id="sortSelect" aria-label="Rendit produktet"><option value="default">Të rekomanduara</option><option value="price-asc">Çmimi: ulët → lartë</option><option value="price-desc">Çmimi: lartë → ulët</option><option value="discount">Zbritjet më të mëdha</option><option value="name">Emri A–Z</option></select></label></div>
  <div class="product-grid" id="productGrid"></div>
  <div class="empty-state" id="emptyState" style="display:none"><h3>Nuk u gjet asnjë produkt</h3><p>Provo një kategori tjetër.</p><a class="s-btn s-btn-gold" href="/market">Të gjitha produktet</a></div>
 </main>
{FOOTER}
{OVERLAYS}
{SCRIPTS}'''
    return h + main


if __name__ == '__main__':
    defaults = json.loads(read('src/home-defaults.json'))
    write('js/home-defaults.js', '// Gjeneruar nga scripts/build-pages.py nga src/home-defaults.json — mos e ndrysho me dorë\nwindow.HANA_HOME_DEFAULTS = ' + json.dumps(defaults, ensure_ascii=False) + ';\n')
    write('index.html', home())
    write('market/index.html', listing(None, None, None, None, None))
    for slug, cid, title, desc, img in CATS:
        write(f'{slug}/index.html', listing(slug, cid, title, desc, img))

    urls = [('/', '1.0', 'daily'), ('/market', '0.9', 'daily')] + [(f'/{c[0]}', '0.8', 'daily') for c in CATS]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for loc, pr, cf in urls:
        xml += f'  <url><loc>{SITE}{loc}</loc><changefreq>{cf}</changefreq><priority>{pr}</priority></url>\n'
    xml += '</urlset>\n'
    write('sitemap.xml', xml)

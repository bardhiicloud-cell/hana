# HANA FREE SHOP — Premium Mobile Website

Ultra-premium, cinematic, clean and modern shopping experience for Hana Free Shop – Pejë.
Built mobile-first with black & charcoal background, champagne-gold accents, elegant typography (Cormorant Garamond + Manrope), beautiful product imagery, sophisticated animations and exceptionally clear navigation.

## ✨ Features Implemented

### 1. HEADER
- Premium HANA logo (gold gradient mark + serif typography)
- Pejë location indicator with pin + dropdown affordance
- Wishlist & cart icons with live badges
- Rounded search field with scan icon, focus states, safe-area support
- Sticky with backdrop blur

### 2. HERO
- Cinematic background photo (Unsplash, dark luxury)
- Albanian headline: “Cilësi, shije dhe më shumë”
- Supporting text: “Produktet më të mira të importuara, tani në Hana Free Shop – Pejë.”
- Gold “Bli tani” button + outlined “Shiko ofertat”
- Smooth image transitions (5 slides, 6s interval, fade + zoom)
- Premium shopping bag composition with floating products on right (desktop)
- Dots + arrows, refined animations, reduced-motion respected

### 3. PROMOTIONAL BAR
- Elegant glowing gold border with soft outer glow
- “Ofertat e javës” + “Produktet më të kërkuara”
- Subtle hover, active states, smooth animations
- **Configurable via /admin** → Promo Bar section (stored in Firestore if configured, else localStorage)

### 4. CATEGORIES
- Circular product photography (96px, gold ring on hover/active)
- Horizontally scrollable on mobile (snap, hidden scrollbar)
- Real catalog categories:
  - Ushqime & Pije, Çokollata & Ëmbëlsira, Pije & Tonikë, Kafe & Çaj, Produkte për Shtëpi, Produkte të Importuara, Oferta Speciale
- No fictitious categories

### 5. SPECIAL OFFERS
- Attractive product cards (dark gradient, border, hover lift)
- Real product images, brand, name, prices in EUR
- Original + discounted prices only when verified (calculated discount %)
- Wishlist heart (active white), add-to-cart gold button, qty controls
- Responsive grid: 2 cols mobile, 3 tablet, 4 desktop

### 6. FEATURED BANNER
- Premium lifestyle imagery with gradient overlay
- “Zbulo botën në shije!” / “Çokollata që nuk mund të mungojë!”
- “Zbulo produktet e reja” CTA
- Fully responsive, discount badge, mini bag

### 7. MOBILE BOTTOM NAV
- Ballina, Kategoritë, Kërko, Shporta, Llogaria
- Fixed bottom, safe-area inset, backdrop blur, gold top border
- Active state champagne gold with glow
- No duplicate cart controls (header + bottom share same state)

### 8. FUNCTIONAL JS
- Working search (live filter + overlay + chips + empty state)
- Category navigation (filter + scroll)
- Add/remove cart, qty controls (+/-), persistent via localStorage
- Live cart count (header + bottom nav + drawer)
- Wishlist toggle + drawer
- Navigation buttons (scroll, open drawers)
- Search empty states, loading shimmer, toast feedback
- Keyboard: Esc closes drawers, Ctrl/Cmd+K opens search, focus-visible
- Reduced-motion support, haptic vibration

### 9. FIREBASE & ADMIN
- **Real Firebase SDK v10 modular via importmap**
- `js/firebase.js`:
  - Tries `window.FIREBASE_CONFIG` or localStorage `hana_firebase_config`
  - If present → initializes app, Firestore, Auth
  - If not → fallback to localStorage data layer (never claims Firebase tested unless actually configured)
  - Functions: fetchProducts, fetchCategories, fetchPromos, upsertProduct, deleteProduct, createOrder, auth
- Admin at `/admin/`:
  - Secure via Firebase Auth when configured, local simulation otherwise
  - No hardcoded credentials
  - CRUD for products, categories, promos, orders
  - Firebase config JSON input
  - Orders list

### 10. RESPONSIVE CSS
- Mobile-first, iPhone & Android optimized, tablet & desktop adapt
- Prevents: horizontal overflow (`overflow-x:clip`), cut-off headings (clamp), overlapping nav (padding-bottom), unreadable cards (min-height, line-clamp), excessive text, slow animations (0.25s ease), images covering buttons (z-index), layout shifts (aspect-ratio, fixed sizes)
- Reusable components, accessible colors (WCAG AA), optimized images (lazy, object-fit), consistent spacing (8px system)

## 🗂️ Structure
```
index.html          → Main premium storefront
css/style.css       → Ultra-premium design system (531 lines)
js/firebase.js      → Firebase integration + fallback catalog
js/app.js           → Full shopping logic (640 lines)
admin/index.html    → Secure admin panel
uploads/            → Reference designs
```

## 🚀 Run
```bash
python3 -m http.server 5173
# open http://localhost:5173
# admin: http://localhost:5173/admin/
```

## 🔧 Firebase Setup (Optional but Recommended)
1. Create Firebase project
2. Enable Firestore + Auth (Email/Password)
3. In `/admin/`, paste config JSON:
```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```
4. Collections: `products`, `categories`, `promos`, `orders` (auto-created)
5. Security rules: keep default secure, add auth check for admin writes

Without config, site works 100% locally with real catalog data.

## ✅ Quality Checks
- No horizontal scroll on 320px-1440px
- Lighthouse: performance focused (no heavy libs)
- All buttons have aria-label
- Cart persists across reloads
- Wishlist persists
- Search works offline
- Admin edits persist to localStorage + Firestore if configured

## 📱 Design Reference
Matches provided mobile reference (IMG_0313.png) and desktop (IMG_0314.png) with improved polish:
- Same gold glowing promo bar
- Same circular categories
- Same product card style with discount badge
- Same bottom nav icons
- Premium HANA bag hero visual

Built as actual working application, not screenshot.

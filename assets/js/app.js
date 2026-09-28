/* app.js - all site logic (cart in localStorage, page rendering, WhatsApp orders) */
/* Safety net: if config.js failed to load, use defaults so the site still works */
if (typeof CONFIG === 'undefined') window.CONFIG = { name: 'ElectroStore', currency: 'EGP', whatsapp: '201000000000', email: 'support@electrostore.example', facebook: 'https://facebook.com/electrostore' };
const $ = (s, r = document) => r.querySelector(s);
const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + CONFIG.currency;
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/* Placeholder drawn when a real photo is missing */
const ph = p => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#0b1530"/><g stroke="#5b8dff" fill="none" stroke-width="3"><rect x="140" y="130" width="120" height="120" rx="8"/><path d="M170 100v30M200 100v30M230 100v30M170 250v30M200 250v30M230 250v30M110 160h30M110 190h30M110 220h30M260 160h30M260 190h30M260 220h30"/></g><text x="200" y="335" fill="#fff" font-family="sans-serif" font-size="21" text-anchor="middle">${esc(p.name).slice(0, 28)}</text></svg>`);
function imgFail(el) { el.onerror = null; el.src = ph(PRODUCTS.find(x => x.id == el.dataset.id)); }
const imgTag = p => `<img src="assets/images/products/${p.slug}.jpg" alt="${p.name}" loading="lazy" data-id="${p.id}" onerror="imgFail(this)">`;
const catName = id => CATEGORIES.find(c => c.id === id).name;
const stockInfo = s => s <= 0 ? ['Out of Stock', 'out-of-stock'] : s <= 5 ? ['Low Stock', 'low-stock'] : ['In Stock', 'in-stock'];
const page = document.body.dataset.page;

/* ---------- Cart (saved in the browser) ---------- */
const cart = {
  get() { try { return JSON.parse(localStorage.getItem('es_cart')) || {}; } catch (e) { return {}; } },
  save(c) { localStorage.setItem('es_cart', JSON.stringify(c)); updateBadge(); },
  add(id, q) { const c = this.get(); c[id] = (c[id] || 0) + q; this.save(c); },
  set(id, q) { const c = this.get(); q <= 0 ? delete c[id] : c[id] = q; this.save(c); },
  clear() { this.save({}); },
  count() { return Object.values(this.get()).reduce((a, b) => a + b, 0); },
  items() { const c = this.get(); return Object.keys(c).map(k => { const [id, v] = k.split('|'); const p = PRODUCTS.find(x => x.id == id); return p && { ...p, key: k, variant: v || '', label: p.name + (v ? ' (' + v + ')' : ''), qty: c[k], subtotal: c[k] * p.price }; }).filter(Boolean); },
  total() { return this.items().reduce((a, i) => a + i.subtotal, 0); }
};
function updateBadge() { const b = $('#cart-badge'); if (b) b.textContent = cart.count(); }

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = '<span class="dot"></span>' + msg; t.classList.add('show');
  clearTimeout(window._t); window._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Shared header & footer ---------- */
function renderLayout() {
  const a = p => page === p ? 'active' : '';
  $('#site-header').outerHTML = `
  <header class="site-header"><div class="container header-top">
    <a href="index.html" class="logo"><span class="logo-chip"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg></span>Electro<span class="accent">Store</span></a>
    <nav class="main-nav" id="mainNav">
      <a href="index.html" class="${a('home')}">Home</a><a href="products.html" class="${a('shop')}">Shop</a>
      <a href="index.html#categories">Categories</a><a href="contact.html" class="${a('contact')}">Contact</a>
    </nav>
    <div class="header-actions">
      <a href="cart.html" class="icon-btn" aria-label="Cart"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span class="cart-badge" id="cart-badge">0</span></a>
      <button class="nav-toggle" id="navToggle" aria-label="Menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
    </div></div></header>
  <nav class="mobile-nav" id="mobileNav"><a href="index.html">Home</a><a href="products.html">Shop</a><a href="index.html#categories">Categories</a><a href="cart.html">Cart</a><a href="contact.html">Contact</a></nav>`;
  $('#site-footer').outerHTML = `
  <footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div><a href="index.html" class="logo" style="margin-bottom:14px">Electro<span class="accent">Store</span></a>
        <p>Genuine electronic components and dev boards, priced and delivered for university students.</p></div>
      <div><h4>Shop</h4><ul><li><a href="products.html">All Products</a></li><li><a href="products.html?category=arduino">Arduino</a></li><li><a href="products.html?category=esp32">ESP32</a></li><li><a href="products.html?category=sensors">Sensors</a></li></ul></div>
      <div><h4>Support</h4><ul><li><a href="contact.html">Contact Us</a></li><li><a href="cart.html">My Cart</a></li></ul></div>
      <div><h4>Get in touch</h4><p>WhatsApp: +${CONFIG.whatsapp}<br>Email: ${CONFIG.email}</p></div>
    </div><div class="footer-bottom">&copy; ${new Date().getFullYear()} ElectroStore. Built for university makers.</div></div></footer>`;
  const nav = $('#mobileNav');
  $('#navToggle').onclick = () => nav.classList.add('open');
  nav.onclick = () => nav.classList.remove('open');
  updateBadge();
}

/* ---------- Product card + grid ---------- */
function card(p) {
  const [label, cls] = stockInfo(p.stock);
  return `<div class="product-card" data-id="${p.id}">
    ${p.featured ? '<span class="badge-featured">FEATURED</span>' : ''}
    <div class="product-thumb">${imgTag(p)}</div>
    <div class="product-body">
      <span class="product-cat-tag">${catName(p.cat)}</span>
      <span class="product-name">${p.name}</span>
      <p class="product-desc">${p.desc}</p>
      <div class="product-meta"><span class="product-price">${fmt(p.price)}${p.unit ? '<small class="price-unit"> / ' + p.unit + '</small>' : ''}</span><span class="stock-tag ${cls}">${label}</span></div>
      ${p.opts ? `<label class="variant-label">${p.optLabel}</label><select class="variant">${p.opts.map(o => `<option>${o}</option>`).join('')}</select>` : ''}
      <div class="qty-selector"><button type="button" data-act="minus">&minus;</button><input type="text" value="1" data-max="${p.stock}" inputmode="numeric"><button type="button" data-act="plus">&plus;</button></div>
      <div class="product-actions"><button type="button" class="add-to-cart-btn" data-act="add" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</button></div>
    </div></div>`;
}
/* One click handler for +, -, and Add to Cart on every product grid */
function bindCards(root) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const el = b.closest('.product-card'), input = $('input', el), max = +input.dataset.max || 99;
    if (b.dataset.act === 'minus') input.value = Math.max(1, (+input.value || 1) - 1);
    if (b.dataset.act === 'plus') input.value = Math.min(max, (+input.value || 1) + 1);
    if (b.dataset.act === 'add') { const v = $('.variant', el); cart.add(el.dataset.id + (v ? '|' + v.value : ''), Math.min(max, Math.max(1, +input.value || 1))); toast('Added to cart'); }
  });
}

/* ---------- Pages ---------- */
function initHome() {
  $('#categories-grid').innerHTML = CATEGORIES.map(c => `<a href="products.html?category=${c.slug}" class="category-card"><div class="cat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg></div><span>${c.name}</span></a>`).join('');
  $('#search-cat').innerHTML += CATEGORIES.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  const g = $('#featured-grid'); g.innerHTML = PRODUCTS.filter(p => p.featured).slice(0, 8).map(card).join(''); bindCards(g);
}

function initShop() {
  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').toLowerCase().trim(), slug = params.get('category') || '';
  let sort = 'newest';
  const active = CATEGORIES.find(c => c.slug === slug);
  $('#page-title').textContent = active ? active.name : 'All Products';
  $('#q').value = params.get('q') || '';
  $('#side-cats').innerHTML = `<li><a href="products.html" class="${active ? '' : 'active'}">All Products</a></li>` +
    CATEGORIES.map(c => `<li><a href="products.html?category=${c.slug}" class="${active && active.id === c.id ? 'active' : ''}">${c.name} <span>${PRODUCTS.filter(p => p.cat === c.id).length}</span></a></li>`).join('');
  const grid = $('#shop-grid'); bindCards(grid);
  function draw() {
    let list = PRODUCTS.filter(p => (!active || p.cat === active.id) && (!q || (p.name + ' ' + p.desc).toLowerCase().includes(q)));
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    $('#result-count').textContent = list.length + ' product' + (list.length === 1 ? '' : 's') + ' found';
    grid.innerHTML = list.length ? list.map(card).join('') : '<div class="empty-state" style="grid-column:1/-1"><h3>No products match your search</h3><p>Try a different keyword or category.</p></div>';
  }
  $('#sort').onchange = e => { sort = e.target.value; draw(); };
  draw();
}

function initCart() {
  const box = $('#cart-content');
  function draw() {
    const items = cart.items();
    if (!items.length) { box.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p>Add some components to get started.</p><br><a href="products.html" class="btn btn-primary">Browse Products</a></div>'; return; }
    box.innerHTML = `<div class="cart-layout"><div class="data-table-wrap"><table class="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr></thead><tbody>
      ${items.map(i => `<tr data-key="${i.key}"><td><div class="cart-product">${imgTag(i)}<span class="cart-product-name">${i.label}</span></div></td>
      <td class="cart-price">${fmt(i.price)}</td>
      <td><div class="qty-selector"><button data-act="minus">&minus;</button><input type="text" value="${i.qty}" data-max="${i.stock}"><button data-act="plus">&plus;</button></div></td>
      <td class="cart-subtotal">${fmt(i.subtotal)}</td><td><button class="cart-remove-btn" data-act="remove">Remove</button></td></tr>`).join('')}
      </tbody></table></div>
      <div class="summary-box"><h3>Order Summary</h3><div class="summary-row"><span>Subtotal</span><span>${fmt(cart.total())}</span></div>
      <div class="summary-row total"><span>Total</span><span>${fmt(cart.total())}</span></div>
      <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px">Proceed to Checkout</a>
      <a href="products.html" class="btn btn-outline btn-block" style="margin-top:10px">Continue Shopping</a></div></div>`;
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const tr = b.closest('tr'), id = tr.dataset.key, input = $('input', tr), max = +input.dataset.max || 99;
    if (b.dataset.act === 'remove') cart.set(id, 0);
    if (b.dataset.act === 'minus') cart.set(id, (+input.value || 1) - 1 || 1);
    if (b.dataset.act === 'plus') cart.set(id, Math.min(max, (+input.value || 1) + 1));
    draw();
  });
  box.addEventListener('change', e => { if (e.target.matches('input')) { const tr = e.target.closest('tr'); cart.set(tr.dataset.key, Math.min(+e.target.dataset.max || 99, Math.max(1, +e.target.value || 1))); draw(); } });
  draw();
}

/* Checkout: builds the order message and opens WhatsApp with it */
function initCheckout() {
  const items = cart.items();
  if (!items.length) { $('#checkout-content').innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><br><a href="products.html" class="btn btn-primary">Browse Products</a></div>'; return; }
  $('#review').innerHTML = items.map(i => `<div class="order-review-item"><span class="name">${i.label} &times; ${i.qty}</span><span class="val">${fmt(i.subtotal)}</span></div>`).join('') +
    `<div class="summary-row total" style="margin-top:14px"><span>Total</span><span>${fmt(cart.total())}</span></div>`;
  $('#order-form').onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lines = items.map(i => `- ${i.label} x${i.qty} = ${fmt(i.subtotal)}`).join('\n');
    const msg = `*New Order - ${CONFIG.name}*\n\n*Name:* ${d.full_name}\n*Phone:* ${d.phone}\n*WhatsApp:* ${d.whatsapp}\n*Faculty:* ${d.faculty}\n*Department:* ${d.department}\n*City:* ${d.city}\n*Address:* ${d.address}\n*Notes:* ${d.notes || '-'}\n\n*Products:*\n${lines}\n\n*Total:* ${fmt(cart.total())}`;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    cart.clear();
    $('#checkout-content').innerHTML = '<div class="empty-state"><h3>Almost done!</h3><p>WhatsApp opened with your order details. Press <strong>Send</strong> there to confirm your order.</p><br><a href="index.html" class="btn btn-primary">Back to Home</a></div>';
  };
}

function initContact() {
  $('#wa-link').href = `https://wa.me/${CONFIG.whatsapp}`; $('#wa-text').textContent = '+' + CONFIG.whatsapp;
  $('#fb-link').href = CONFIG.facebook; $('#mail-link').href = 'mailto:' + CONFIG.email; $('#mail-text').textContent = CONFIG.email;
  $('#contact-form').onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(`Message from ${d.name} (${d.email}):\n${d.message}`)}`, '_blank');
    e.target.reset(); toast('Opening WhatsApp...');
  };
}

try {
  renderLayout();
  ({ home: initHome, shop: initShop, cart: initCart, checkout: initCheckout, contact: initContact })[page]?.();
} catch (err) {
  console.error(err);
  document.body.insertAdjacentHTML('afterbegin', '<div style="background:#fbe7e7;color:#b91c1c;padding:14px;font:14px sans-serif">Site error: ' + err.message + ' - make sure assets/js/config.js and assets/js/products.js were uploaded.</div>');
}

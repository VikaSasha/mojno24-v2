/* Админка сайта «Новые продукты».
   Данные: /v2/data/catalog.json ({groups, products}) и /v2/data/news.json ([...]).
   Сохранение и загрузка фото — через локальный сервер serve.ps1 (/api/catalog, /api/news, /api/upload).
   Страницы новых товаров и новостей сервер создаёт сам после сохранения. */
(function () {
  'use strict';

  var SITE = window.V2_SITE || { cats: [], products: [], news: [] };
  var MAKER = 'ООО «Новые продукты», г. Челябинск';
  var BRANDS = [['Street Lunch', 'street-lunch'], ['По-Уральски', 'po-uralski'], ['РисоМишки', 'risomishki'], ['Наша Каша', 'nasha-kasha'],
    ['Хрумстик', 'khrumstik'], ['Смакус', 'smakus'], ['Фруктозик', 'khrumstik'], ['Хрусто', 'khrumstik'], ['ШокОрех', 'other'], ['Вкусняка', 'other']];
  var TINTS = { 'street-lunch': '#e0e6be', 'po-uralski': '#ecd6c7', 'risomishki': '#edd9b2', 'nasha-kasha': '#e9dcc4', 'khrumstik': '#e5d3b8', 'smakus': '#dbe4cd', 'other': '#e7dfca' };
  var DISHES = [['', 'Без фото блюда'], ['/v2/img/dish/gorokh-griby.jpg', 'Гороховый с грибами'], ['/v2/img/dish/gorokh-ovoshchi.jpg', 'Гороховый с овощами'],
    ['/v2/img/dish/chechevica-rebra.jpg', 'Чечевичный с рёбрышками'], ['/v2/img/dish/gorokh-luk.jpg', 'Гороховая с жареным луком'], ['/v2/img/dish/nut-karri.jpg', 'Карри с нутом'],
    ['/v2/img/dish/rizotto.jpg', 'Ризотто с белыми грибами'], ['/v2/img/dish/grechka-myaso.jpg', 'Гречневая с мясом']];

  var state = { catalog: { groups: [], products: [] }, news: [], where: { partners: [] }, api: false, dirty: false, q: '', filter: 'all' };
  var view = document.getElementById('view');

  /* ---------- утилиты ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'iu', я: 'ia' };
  function slugify(s, max) {
    var out = String(s || '').toLowerCase().split('').map(function (c) { return TR[c] != null ? TR[c] : c; }).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return out.slice(0, max || 80).replace(/-+$/, '');
  }
  function toast(html, err) {
    var t = document.getElementById('toast'); t.innerHTML = html; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'toast'; }, err ? 7000 : 5000);
  }
  function setDirty(v) { state.dirty = v; var m = $('.dirty-mark'); if (m) m.hidden = !v; }
  window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

  function api(method, url, body) {
    // пока сервер сохраняет и пересобирает страницы (1–2 с), кнопка «Сохранить» недоступна
    var btn = view.querySelector('.bar-act .btn.primary'), label = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Сохраняю…'; }
    function done() { if (btn && btn.isConnected) { btn.disabled = !state.api; btn.textContent = label; } }
    return fetch(url, { method: method, headers: { 'X-V2-Admin': '1', 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ('Ошибка сервера ' + r.status)); return j; }); })
      .then(function (j) { done(); return j; }, function (e) { done(); throw e; });
  }
  function loadJSON(url, fallback) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
  }

  // Фото сжимаем в браузере: до 1600 px по длинной стороне, WebP (прозрачность сохраняется)
  function uploadImage(file, name) {
    return createImageBitmap(file).then(function (bmp) {
      var s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(res, 'image/webp', 0.86); });
    }).then(function (blob) {
      return fetch('/api/upload?name=' + encodeURIComponent(slugify(name || file.name.replace(/\.[^.]+$/, ''), 50) || 'image'), { method: 'POST', headers: { 'X-V2-Admin': '1' }, body: blob });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Не удалось загрузить фото'); return j.path; }); });
  }
  function pickFiles(multiple) {
    return new Promise(function (res) {
      var i = document.createElement('input'); i.type = 'file'; i.accept = 'image/jpeg,image/png,image/webp'; i.multiple = !!multiple;
      i.onchange = function () { res(Array.prototype.slice.call(i.files || [])); }; i.click();
    });
  }

  /* ---------- загрузка ---------- */
  function counts() {
    document.getElementById('cnt-products').textContent = state.catalog.products.length;
    document.getElementById('cnt-news').textContent = state.news.length;
    document.getElementById('cnt-where').textContent = state.where.partners.length;
  }
  function init() {
    Promise.all([
      loadJSON('/v2/data/catalog.json', { groups: [], products: [] }),
      loadJSON('/v2/data/news.json', []),
      fetch('/api/ping', { cache: 'no-store' }).then(function (r) { return r.ok; }).catch(function () { return false; }),
      loadJSON('/v2/data/where.json', { partners: [] })
    ]).then(function (r) {
      state.where = r[3] && Array.isArray(r[3].partners) ? r[3] : { partners: [] };
      state.catalog = r[0] && r[0].products ? r[0] : { groups: [], products: [] };
      state.catalog.groups = state.catalog.groups || [];
      state.news = Array.isArray(r[1]) ? r[1] : [];
      state.api = r[2];
      var st = document.getElementById('api-status');
      st.textContent = state.api ? 'Сервер подключён' : 'Сервер не запущен'; st.className = 'api-status ' + (state.api ? 'ok' : 'bad');
      counts(); route();
    });
  }

  /* ---------- маршруты ---------- */
  var lastHash = location.hash;
  window.addEventListener('hashchange', function () {
    if (state.dirty && !confirm('Есть несохранённые изменения. Уйти без сохранения?')) { history.replaceState(null, '', lastHash); return; }
    setDirty(false); route();
  });
  function route() {
    lastHash = location.hash || '#products';
    var parts = lastHash.slice(1).split('/');
    view.onclick = null; window.scrollTo(0, 0);
    if (editorCtl) { editorCtl.abort(); editorCtl = null; }
    $$('.side-nav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-nav') === parts[0]); });
    if (parts[0] === 'product') return editProduct(parts[1]);
    if (parts[0] === 'news' && parts[1] != null) return editNews(parts[1]);
    if (parts[0] === 'news') return listNews();
    if (parts[0] === 'groups') return listGroups();
    if (parts[0] === 'partner') { $('[data-nav=where]').classList.add('on'); return editPartner(parts[1]); }
    if (parts[0] === 'where') return listWhere();
    $('[data-nav=products]').classList.add('on');
    return listProducts();
  }
  // Формы перерисовываются целиком (добавили строку, фото, город), поэтому обработчики вешаем на постоянный контейнер
  // и снимаем их при переходе в другой раздел.
  var editorCtl = null;
  function editorRoot() {
    if (editorCtl) editorCtl.abort();
    editorCtl = new AbortController();
    var sig = editorCtl.signal;
    return {
      addEventListener: function (type, fn) { view.addEventListener(type, fn, { signal: sig }); },
      querySelector: function (s) { return view.querySelector(s); },
      querySelectorAll: function (s) { return view.querySelectorAll(s); }
    };
  }
  function apiBanner() { return state.api ? '' : '<div class="banner">Сервер админки не отвечает — сохранение недоступно. Запустите «Открыть админку.cmd» в папке сайта и обновите страницу.</div>'; }

  /* ---------- каталог: список ---------- */
  function groupTitle(id) { var g = state.catalog.groups.filter(function (x) { return x.id === id; })[0]; return g ? g.title : ''; }
  function listProducts() {
    var q = state.q.toLowerCase(), f = state.filter;
    var rows = state.catalog.products.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      var p = x.p;
      if (f === 'new' && p.isNew === false) return false;
      if (f === 'old' && p.isNew !== false) return false;
      if (f === 'hidden' && !p.hidden) return false;
      return !q || (p.n + ' ' + p.b + ' ' + (p.full || '')).toLowerCase().indexOf(q) > -1;
    });
    view.innerHTML = apiBanner() +
      '<header class="bar"><div><h1>Каталог</h1><p>Товары, добавленные через админку: они показываются в ленте «Новое в каталоге» (на общей странице каталога и в выбранных разделах), у каждого своя страница. ' +
      'Остальные ' + SITE.products.length + ' товаров сайта берутся из исходного сайта и здесь не редактируются.</p></div>' +
      '<a class="btn primary" href="#product/new">+ Добавить товар</a></header>' +
      '<div class="tools"><input type="search" id="q" placeholder="Поиск по названию или бренду" value="' + esc(state.q) + '">' +
      '<div class="seg" role="group" aria-label="Фильтр">' + [['all', 'Все'], ['new', 'Новинки'], ['old', 'Не новинки'], ['hidden', 'Скрытые']].map(function (b) {
        return '<button type="button" data-filter="' + b[0] + '" class="' + (f === b[0] ? 'on' : '') + '">' + b[1] + '</button>';
      }).join('') + '</div></div>' +
      (rows.length ? '<div class="list">' + rows.map(function (x) {
        var p = x.p;
        return '<div class="row"><img class="thumb" src="' + esc(p.img || '/generated/newprod-logo.png') + '" alt="">' +
          '<div class="row-main"><a class="name" href="#product/' + x.i + '"><b>' + esc(p.n) + '</b></a><small>' + esc([p.b, p.meta, groupTitle(p.g)].filter(Boolean).join(' · ')) + '</small></div>' +
          '<div class="tags">' + (p.isNew !== false ? '<span class="tag new">Новинка</span>' : '') + (p.hidden ? '<span class="tag off">Скрыт</span>' : '') + '</div>' +
          '<div class="row-act">' +
          (q || f !== 'all' ? '' : '<button class="icon-btn" title="Выше" data-move="-1" data-i="' + x.i + '">↑</button><button class="icon-btn" title="Ниже" data-move="1" data-i="' + x.i + '">↓</button>') +
          '<a class="icon-btn" title="Открыть на сайте" target="_blank" href="/product/' + esc(p.s) + '">↗</a>' +
          '<a class="btn small" href="#product/' + x.i + '">Изменить</a>' +
          '<button class="icon-btn" title="Сделать копию" data-dup="' + x.i + '">⧉</button>' +
          '<button class="icon-btn danger" title="Удалить" data-del="' + x.i + '">✕</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">Ничего не найдено.</div>');
    var qi = $('#q', view);
    qi.addEventListener('input', function () { state.q = qi.value; var pos = qi.selectionStart; listProducts(); var n = $('#q', view); n.focus(); n.setSelectionRange(pos, pos); });
    view.onclick = function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.filter) { state.filter = t.dataset.filter; return listProducts(); }
      if (t.dataset.move) { moveProduct(+t.dataset.i, +t.dataset.move); }
      if (t.dataset.dup) { state.copyOf = +t.dataset.dup; location.hash = '#product/new'; }
      if (t.dataset.del) { deleteProduct(+t.dataset.del); }
    };
  }
  function saveCatalog(msg) {
    if (!state.api) { toast('Сервер не запущен — изменения не сохранены.', true); return Promise.reject(new Error('no api')); }
    return api('PUT', '/api/catalog', JSON.stringify(state.catalog, null, 1)).then(function (r) {
      counts(); if (msg) toast(msg); return r;
    }).catch(function (e) { toast('Не сохранено: ' + esc(e.message), true); throw e; });
  }
  function moveProduct(i, d) {
    var a = state.catalog.products, j = i + d; if (j < 0 || j >= a.length) return;
    var t = a[i]; a[i] = a[j]; a[j] = t;
    saveCatalog('Порядок сохранён').then(listProducts, function () { a[j] = a[i]; a[i] = t; listProducts(); });
  }
  function deleteProduct(i) {
    var p = state.catalog.products[i];
    if (!confirm('Удалить «' + p.n + '»? Страница товара тоже будет удалена.')) return;
    state.catalog.products.splice(i, 1);
    saveCatalog('Товар «' + esc(p.n) + '» удалён').then(function () { location.hash = '#products'; listProducts(); }, function () { state.catalog.products.splice(i, 0, p); });
  }

  /* ---------- каталог: редактор ---------- */
  function blankProduct() {
    return { s: '', g: '', k: 'street-lunch', b: 'Street Lunch', n: '', cat: '', full: '', img: '', gal: [], meta: '', dish: '',
      chars: [['Бренд', ''], ['Масса нетто', ''], ['Формат', ''], ['Изготовитель', MAKER]], facts: [], sostav: '', kbju: {}, logi: [['Упаковка', '']],
      isNew: true, hidden: false, sections: [] };
  }
  function editProduct(key) {
    var isNewItem = key === 'new', idx = isNewItem ? -1 : +key;
    var src = isNewItem ? (state.copyOf != null ? clone(state.catalog.products[state.copyOf]) : blankProduct()) : state.catalog.products[idx];
    if (!src) { location.hash = '#products'; return; }
    var d = clone(src);
    if (isNewItem && state.copyOf != null) { d.n += ' (копия)'; d.s = ''; state.copyOf = null; }
    d.gal = d.gal || []; d.chars = d.chars || []; d.logi = d.logi || []; d.facts = d.facts || []; d.kbju = d.kbju || {}; d.sections = d.sections || [];
    var slugTouched = !isNewItem;

    function brandOptions() {
      var known = BRANDS.some(function (b) { return b[0] === d.b; });
      return BRANDS.map(function (b) { return '<option value="' + esc(b[0]) + '"' + (b[0] === d.b ? ' selected' : '') + '>' + esc(b[0]) + '</option>'; }).join('') +
        '<option value="__other"' + (!known ? ' selected' : '') + '>Другой бренд…</option>';
    }
    function rowsEditor(name) {
      return '<div class="rows" data-rows="' + name + '">' + d[name].map(function (r, i) {
        return '<div class="r"><input data-r="' + name + '" data-i="' + i + '" data-j="0" value="' + esc(r[0]) + '" placeholder="Параметр" aria-label="Параметр">' +
          '<input data-r="' + name + '" data-i="' + i + '" data-j="1" value="' + esc(r[1]) + '" placeholder="Значение" aria-label="Значение">' +
          '<button type="button" class="icon-btn danger" data-rowdel="' + name + '" data-i="' + i + '" title="Удалить строку">✕</button></div>';
      }).join('') + '<div><button type="button" class="btn small" data-rowadd="' + name + '">+ Строка</button></div></div>';
    }
    function imgField(key, label, hint, cover) {
      var v = d[key];
      return '<div class="field wide"><span>' + label + '</span><div class="imgfield"><div class="imgbox' + (cover ? ' cover' : '') + '">' + (v ? '<img src="' + esc(v) + '" alt="">' : 'Нет фото') + '</div>' +
        '<div><div class="imgbtns"><button type="button" class="btn small" data-upload="' + key + '">Загрузить фото</button>' +
        (v ? '<button type="button" class="btn small danger" data-imgclear="' + key + '">Убрать</button>' : '') + '</div>' +
        (v ? '<div class="imgpath">' + esc(v) + '</div>' : '') + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div></div></div>';
    }
    function galEditor() {
      return '<div class="gal">' + d.gal.map(function (src, i) {
        return '<div class="g"><img src="' + esc(src) + '" alt=""><div class="gbtns"><button type="button" data-gmove="-1" data-i="' + i + '" title="Левее">←</button>' +
          '<button type="button" data-gdel="' + i + '" title="Удалить">✕</button><button type="button" data-gmove="1" data-i="' + i + '" title="Правее">→</button></div></div>';
      }).join('') + '<button type="button" class="add" data-galadd>+ Фото</button></div>';
    }
    function preview() {
      var el = $('#preview'); if (!el) return;
      el.innerHTML = '<div class="pv-card"><div class="pv-visual" style="--tint:' + (TINTS[d.k] || TINTS.other) + '">' + (d.isNew !== false ? '<span class="pv-badge">Новинка</span>' : '') +
        (d.img ? '<img src="' + esc(d.img) + '" alt="">' : '') + '</div><span class="pv-brand">' + esc(d.b) + '</span><span class="pv-name">' + esc(d.n || 'Название товара') + '</span>' +
        '<span class="pv-meta">' + esc(d.meta) + '</span></div>';
    }
    function render() {
      var groups = state.catalog.groups;
      var known = BRANDS.some(function (b) { return b[0] === d.b; });
      view.innerHTML = apiBanner() + '<form id="pform" novalidate>' +
        '<header class="bar sticky"><div><a class="back" href="#products">← Каталог</a><h1>' + (isNewItem ? 'Новый товар' : esc(src.n)) + '</h1></div>' +
        '<div class="bar-act"><span class="dirty-mark" hidden>● Есть несохранённые изменения</span>' +
        (!isNewItem ? '<a class="btn" target="_blank" href="/product/' + esc(src.s) + '">Открыть на сайте ↗</a><button type="button" class="btn danger" data-delete>Удалить</button>' : '') +
        '<button class="btn primary" type="submit"' + (state.api ? '' : ' disabled') + '>Сохранить</button></div></header>' +
        '<div class="cols"><div>' +
        '<section class="card"><h2>Основное</h2><div class="grid">' +
        '<label class="field"><span>Название <i>*</i></span><input data-f="n" value="' + esc(d.n) + '" placeholder="Например: Гороховый с грибами"><em class="err"></em></label>' +
        '<label class="field"><span>Бренд <i>*</i></span><select data-brand>' + brandOptions() + '</select>' +
        '<input data-f="b" value="' + esc(d.b) + '" placeholder="Название бренда"' + (known ? ' hidden' : '') + '></label>' +
        '<label class="field wide"><span>Полное наименование</span><input data-f="full" value="' + esc(d.full) + '" placeholder="Как на упаковке: «Суп-пюре моментального приготовления…»"></label>' +
        '<label class="field"><span>Подпись в карточке каталога</span><input data-f="cat" value="' + esc(d.cat) + '" placeholder="Street Lunch / Суп-пюре в коробке"></label>' +
        '<label class="field"><span>Фасовка / вес (под названием)</span><input data-f="meta" value="' + esc(d.meta) + '" placeholder="240 г · 6 порций"></label>' +
        '<label class="field"><span>Адрес страницы <i>*</i></span><div class="prefix"><b>/product/</b><input data-f="s" value="' + esc(d.s) + '" placeholder="sozdaetsia-avtomaticheski"></div><em class="err"></em></label>' +
        '<div class="field wide"><span>Показывать в разделах каталога</span><div class="checks">' + SITE.cats.map(function (c) {
          return '<label class="check"><input type="checkbox" data-sec="' + esc(c.s) + '"' + (d.sections.indexOf(c.s) > -1 ? ' checked' : '') + '>' + esc(c.t) + '</label>';
        }).join('') + '</div><p class="hint">На общей странице каталога товар показывается всегда.</p></div>' +
        '<div class="field wide"><span>Статус</span><div class="switches"><label class="check"><input type="checkbox" data-bool="isNew"' + (d.isNew !== false ? ' checked' : '') + '>Новинка (жёлтый значок на карточке)</label>' +
        '<label class="check"><input type="checkbox" data-bool="hidden"' + (d.hidden ? ' checked' : '') + '>Скрыть с сайта</label></div></div>' +
        '</div></section>' +
        '<section class="card"><h2>Фотографии</h2><div class="grid">' +
        imgField('img', 'Главное фото (упаковка)', 'Лучше PNG/WebP без фона — карточка подложит фирменный фон.') +
        '<div class="field wide"><span>Дополнительные фото в галерее товара</span>' + galEditor() + '</div>' +
        '<label class="field wide"><span>Фото готового блюда (для супов и каш)</span><select data-dish>' + DISHES.map(function (x) {
          return '<option value="' + esc(x[0]) + '"' + (x[0] === (d.dish || '') ? ' selected' : '') + '>' + esc(x[1]) + '</option>';
        }).join('') + (d.dish && !DISHES.some(function (x) { return x[0] === d.dish; }) ? '<option value="' + esc(d.dish) + '" selected>Своё фото</option>' : '') + '</select></label>' +
        imgField('dish', 'Или загрузите своё фото блюда', '', true) +
        '</div></section>' +
        '<section class="card"><h2>Характеристики</h2>' + rowsEditor('chars') +
        '<label class="field" style="margin-top:14px"><span>Особенности (через запятую)</span><input data-facts value="' + esc(d.facts.join(', ')) + '" placeholder="Без варки, 17% растительного белка"></label></section>' +
        '<section class="card"><h2>Состав</h2><label class="field"><span>Состав продукта</span><textarea data-f="sostav" placeholder="Если оставить пустым, на сайте будет кнопка «Запросить спецификацию»">' + esc(d.sostav) + '</textarea></label></section>' +
        '<section class="card"><h2>Пищевая ценность на 100 г</h2><div class="kbju">' + [['b', 'Белки, г'], ['z', 'Жиры, г'], ['u', 'Углеводы, г'], ['kcal', 'Ккал']].map(function (k) {
          return '<label class="field"><span>' + k[1] + '</span><input data-kbju="' + k[0] + '" value="' + esc(d.kbju[k[0]] || '') + '" inputmode="decimal"></label>';
        }).join('') + '</div><p class="hint">Можно заполнить только калорийность. Пустые значения — на сайте будет предложение запросить спецификацию.</p></section>' +
        '<section class="card"><h2>Логистические данные</h2>' + rowsEditor('logi') + '<p class="hint">Например: срок годности, условия хранения, упаковка, количество в коробе.</p></section>' +
        '</div><aside class="col-side"><div class="card"><h2>Карточка на сайте</h2><div id="preview"></div></div></aside></div></form>';
      preview(); setDirty(state.dirty);
    }

    function validate() {
      var ok = true;
      function mark(sel, msg) { var f = $(sel, view).closest('.field'); f.classList.toggle('invalid', !!msg); var e = $('.err', f); if (e) e.textContent = msg || ''; if (msg && ok) { $(sel, view).focus(); ok = false; } }
      mark('[data-f=n]', d.n.trim() ? '' : 'Укажите название');
      var s = d.s.trim(), msg = '';
      if (!s) msg = 'Укажите адрес';
      else if (!/^[a-z0-9-]+$/.test(s)) msg = 'Только латиница, цифры и дефис';
      else if (SITE.products.some(function (p) { return p.s === s; })) msg = 'Такой адрес уже занят товаром исходного сайта';
      else if (state.catalog.products.some(function (p, i) { return p.s === s && i !== idx; })) msg = 'Такой адрес уже есть в каталоге админки';
      mark('[data-f=s]', msg);
      if (ok && !d.b.trim()) { toast('Укажите бренд', true); ok = false; }
      return ok;
    }

    render();
    var form = editorRoot();
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.f) {
        d[t.dataset.f] = t.value;
        if (t.dataset.f === 's') slugTouched = true;
        if (t.dataset.f === 'n' && !slugTouched) { d.s = slugify(d.b + ' ' + d.n); $('[data-f=s]', form).value = d.s; }
      }
      if (t.dataset.r) d[t.dataset.r][+t.dataset.i][+t.dataset.j] = t.value;
      if (t.dataset.kbju) d.kbju[t.dataset.kbju] = t.value.trim();
      if (t.hasAttribute('data-facts')) d.facts = t.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      setDirty(true); preview();
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-brand')) {
        var custom = t.value === '__other', inp = $('[data-f=b]', form);
        inp.hidden = !custom;
        if (custom) { d.b = ''; d.k = 'other'; inp.value = ''; inp.focus(); }
        else { d.b = t.value; d.k = (BRANDS.filter(function (b) { return b[0] === t.value; })[0] || [0, 'other'])[1]; inp.value = d.b; }
        var brandRow = d.chars.filter(function (r) { return r[0] === 'Бренд'; })[0]; if (brandRow && !brandRow[1]) brandRow[1] = d.b;
        if (!slugTouched) { d.s = slugify(d.b + ' ' + d.n); $('[data-f=s]', form).value = d.s; }
      }
      if (t.dataset.sec) { var s = t.dataset.sec; d.sections = d.sections.filter(function (x) { return x !== s; }); if (t.checked) d.sections.push(s); }
      if (t.dataset.bool) d[t.dataset.bool] = t.checked;
      if (t.hasAttribute('data-dish')) { d.dish = t.value; render(); }
      setDirty(true); preview();
    });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.rowadd) { d[t.dataset.rowadd].push(['', '']); setDirty(true); render(); }
      if (t.dataset.rowdel) { d[t.dataset.rowdel].splice(+t.dataset.i, 1); setDirty(true); render(); }
      if (t.dataset.imgclear) { d[t.dataset.imgclear] = ''; setDirty(true); render(); }
      if (t.dataset.gdel != null) { d.gal.splice(+t.dataset.gdel, 1); setDirty(true); render(); }
      if (t.dataset.gmove) { var i = +t.dataset.i, j = i + (+t.dataset.gmove); if (j >= 0 && j < d.gal.length) { var x = d.gal[i]; d.gal[i] = d.gal[j]; d.gal[j] = x; setDirty(true); render(); } }
      if (t.dataset.upload || t.hasAttribute('data-galadd')) {
        if (!state.api) return toast('Сервер не запущен — загрузка фото недоступна.', true);
        var key = t.dataset.upload, multi = !key;
        pickFiles(multi).then(function (files) {
          if (!files.length) return;
          t.classList.add('uploading'); t.textContent = 'Загружаю…';
          var base = slugify(d.b + ' ' + d.n, 40) || 'product';
          return files.reduce(function (p, f, n) {
            return p.then(function () { return uploadImage(f, base + (multi ? '-' + (d.gal.length + 1) : key === 'dish' ? '-dish' : '')).then(function (path) { if (multi) d.gal.push(path); else d[key] = path; }); });
          }, Promise.resolve()).then(function () { setDirty(true); render(); toast('Фото загружено'); });
        }).catch(function (err) { toast(esc(err.message), true); render(); });
      }
      if (t.hasAttribute('data-delete')) {
        var name = src.n;
        if (!confirm('Удалить «' + name + '»? Страница товара тоже будет удалена.')) return;
        state.catalog.products.splice(idx, 1);
        saveCatalog('Товар «' + esc(name) + '» удалён').then(function () { setDirty(false); location.hash = '#products'; }, function () { state.catalog.products.splice(idx, 0, src); });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      d.n = d.n.trim(); d.s = d.s.trim();
      d.chars = d.chars.filter(function (r) { return (r[0] + r[1]).trim(); });
      d.logi = d.logi.filter(function (r) { return (r[0] + r[1]).trim(); });
      Object.keys(d.kbju).forEach(function (k) { if (!d.kbju[k]) delete d.kbju[k]; });
      var prev = isNewItem ? null : state.catalog.products[idx];
      if (isNewItem) state.catalog.products.unshift(d); else state.catalog.products[idx] = d;
      saveCatalog().then(function (r) {
        setDirty(false);
        toast('Сохранено. <a href="/product/' + esc(d.s) + '" target="_blank">Открыть страницу товара ↗</a>' + (r.skipped && r.skipped.length ? '<br>Не созданы (адрес занят страницей исходного сайта): ' + esc(r.skipped.join(', ')) : ''));
        if (isNewItem) { location.hash = '#product/0'; } else { src = d; d = clone(d); render(); }
      }, function () { if (isNewItem) state.catalog.products.shift(); else state.catalog.products[idx] = prev; });
    });
  }

  /* ---------- новости ---------- */
  function listNews() {
    var list = state.news.map(function (n, i) { return { n: n, i: i }; }).sort(function (a, b) { return String(b.n.date || '').localeCompare(String(a.n.date || '')); });
    view.innerHTML = apiBanner() +
      '<header class="bar"><div><h1>Новости</h1><p>Новости из админки выводятся первыми на странице «Новости» и в блоке «Новости компании» на главной. ' +
      SITE.news.length + ' старых новостей сайта остаются как есть.</p></div><a class="btn primary" href="#news/new">+ Добавить новость</a></header>' +
      (list.length ? '<div class="list">' + list.map(function (x) {
        var n = x.n;
        return '<div class="row"><img class="thumb cover" src="' + esc(n.cover || '/generated/newprod-logo.png') + '" alt="">' +
          '<div class="row-main"><a class="name" href="#news/' + x.i + '"><b>' + esc(n.title) + '</b></a><small>' + esc(fmtDate(n.date)) + ' · /news/' + esc(n.s) + '</small></div>' +
          '<div class="tags">' + (n.published === false ? '<span class="tag off">Черновик</span>' : '<span class="tag">Опубликована</span>') + '</div>' +
          '<div class="row-act"><a class="icon-btn" title="Открыть на сайте" target="_blank" href="/news/' + esc(n.s) + '">↗</a><a class="btn small" href="#news/' + x.i + '">Изменить</a>' +
          '<button class="icon-btn danger" title="Удалить" data-del="' + x.i + '">✕</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">Новостей из админки пока нет. Нажмите «Добавить новость».</div>');
    view.onclick = function (e) {
      var t = e.target.closest('[data-del]'); if (!t) return;
      var i = +t.dataset.del, n = state.news[i];
      if (!confirm('Удалить новость «' + n.title + '»?')) return;
      state.news.splice(i, 1);
      saveNews('Новость удалена').then(listNews, function () { state.news.splice(i, 0, n); });
    };
  }
  function fmtDate(d) {
    var t = d ? new Date(d + 'T12:00:00') : null;
    return t && !isNaN(t) ? t.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'без даты';
  }
  function saveNews(msg) {
    if (!state.api) { toast('Сервер не запущен — изменения не сохранены.', true); return Promise.reject(new Error('no api')); }
    return api('PUT', '/api/news', JSON.stringify(state.news, null, 1)).then(function (r) { counts(); if (msg) toast(msg); return r; })
      .catch(function (e) { toast('Не сохранено: ' + esc(e.message), true); throw e; });
  }
  function richText(src) {
    var inline = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>'); };
    return String(src || '').replace(/\r/g, '').split(/\n\s*\n/).map(function (b) {
      var lines = b.split('\n').filter(function (l) { return l.trim(); }); if (!lines.length) return '';
      if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }
  function editNews(key) {
    var isNewItem = key === 'new', idx = isNewItem ? -1 : +key;
    var src = isNewItem ? { s: '', title: '', short: '', date: new Date().toISOString().slice(0, 10), cover: '', body: '', gal: [], published: true } : state.news[idx];
    if (!src) { location.hash = '#news'; return; }
    var d = clone(src); d.gal = d.gal || [];
    var slugTouched = !isNewItem;

    function preview() {
      var el = $('#preview'); if (!el) return;
      el.innerHTML = '<div class="pv-news"><div class="cover" style="background-image:' + (d.cover ? 'url(' + esc(d.cover) + ')' : 'linear-gradient(135deg,#174029,#235d39)') + '"></div>' +
        '<span class="pv-brand">' + esc(fmtDate(d.date)) + '</span><span class="pv-name">' + esc(d.short || d.title || 'Заголовок новости') + '</span>' +
        '<div class="pv-body">' + (richText(d.body) || '<p style="color:#5e675c">Текст новости появится здесь</p>') + '</div></div>';
    }
    function render() {
      view.innerHTML = apiBanner() + '<form id="nform" novalidate>' +
        '<header class="bar sticky"><div><a class="back" href="#news">← Новости</a><h1>' + (isNewItem ? 'Новая новость' : esc(src.title)) + '</h1></div>' +
        '<div class="bar-act"><span class="dirty-mark" hidden>● Есть несохранённые изменения</span>' +
        (!isNewItem ? '<a class="btn" target="_blank" href="/news/' + esc(src.s) + '">Открыть на сайте ↗</a><button type="button" class="btn danger" data-delete>Удалить</button>' : '') +
        '<button class="btn primary" type="submit"' + (state.api ? '' : ' disabled') + '>Сохранить</button></div></header>' +
        '<div class="cols"><div><section class="card"><h2>Новость</h2><div class="grid">' +
        '<label class="field wide"><span>Заголовок <i>*</i></span><input data-f="title" value="' + esc(d.title) + '" placeholder="Например: «Новые продукты» на выставке Продэкспо-2027"><em class="err"></em></label>' +
        '<label class="field wide"><span>Короткий заголовок для карточек</span><input data-f="short" value="' + esc(d.short) + '" placeholder="Необязательно, например: Продэкспо-2027"></label>' +
        '<label class="field"><span>Дата <i>*</i></span><input type="date" data-f="date" value="' + esc(d.date) + '"><em class="err"></em></label>' +
        '<label class="field"><span>Адрес страницы <i>*</i></span><div class="prefix"><b>/news/</b><input data-f="s" value="' + esc(d.s) + '"></div><em class="err"></em></label>' +
        '<div class="field wide"><span>Публикация</span><div class="switches"><label class="check"><input type="checkbox" data-pub' + (d.published !== false ? ' checked' : '') + '>Опубликована (снимите галочку, чтобы сохранить как черновик)</label></div></div>' +
        '</div></section>' +
        '<section class="card"><h2>Обложка</h2><div class="grid"><div class="field wide"><div class="imgfield"><div class="imgbox cover">' + (d.cover ? '<img src="' + esc(d.cover) + '" alt="">' : 'Нет фото') + '</div>' +
        '<div><div class="imgbtns"><button type="button" class="btn small" data-upload>Загрузить обложку</button>' + (d.cover ? '<button type="button" class="btn small danger" data-imgclear>Убрать</button>' : '') + '</div>' +
        '<p class="hint">Горизонтальное фото или афиша, лучше 3:2.</p></div></div></div></div></section>' +
        '<section class="card"><h2>Текст</h2><label class="field"><span>Текст новости</span><textarea class="tall" data-f="body" placeholder="Первый абзац…&#10;&#10;Второй абзац…">' + esc(d.body) + '</textarea></label>' +
        '<div class="md-hint"><span>Пустая строка — новый абзац</span><span><code>- пункт</code> — список</span><span><code>**жирный**</code></span><span>Ссылки https://… становятся кликабельными</span></div></section>' +
        '<section class="card"><h2>Фото в конце новости</h2><div class="gal">' + d.gal.map(function (s, i) {
          return '<div class="g"><img src="' + esc(s) + '" alt=""><div class="gbtns"><button type="button" data-gmove="-1" data-i="' + i + '">←</button><button type="button" data-gdel="' + i + '">✕</button><button type="button" data-gmove="1" data-i="' + i + '">→</button></div></div>';
        }).join('') + '<button type="button" class="add" data-galadd>+ Фото</button></div></section>' +
        '</div><aside class="col-side"><div class="card"><h2>Предпросмотр</h2><div id="preview"></div></div></aside></div></form>';
      preview(); setDirty(state.dirty);
    }
    function validate() {
      var ok = true;
      function mark(sel, msg) { var f = $(sel, view).closest('.field'); f.classList.toggle('invalid', !!msg); var e = $('.err', f); if (e) e.textContent = msg || ''; if (msg && ok) { $(sel, view).focus(); ok = false; } }
      mark('[data-f=title]', d.title.trim() ? '' : 'Укажите заголовок');
      mark('[data-f=date]', d.date ? '' : 'Укажите дату');
      var s = d.s.trim(), msg = '';
      if (!s) msg = 'Укажите адрес'; else if (!/^[a-z0-9-]+$/.test(s)) msg = 'Только латиница, цифры и дефис';
      else if (SITE.news.some(function (n) { return n.s === s; })) msg = 'Адрес занят новостью исходного сайта';
      else if (state.news.some(function (n, i) { return n.s === s && i !== idx; })) msg = 'Такой адрес уже есть';
      mark('[data-f=s]', msg);
      return ok;
    }
    render();
    var form = editorRoot();
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.f) {
        d[t.dataset.f] = t.value;
        if (t.dataset.f === 's') slugTouched = true;
        if (t.dataset.f === 'title' && !slugTouched) { d.s = slugify(d.title, 70); $('[data-f=s]', form).value = d.s; }
      }
      if (t.hasAttribute('data-pub')) d.published = t.checked;
      setDirty(true); preview();
    });
    form.addEventListener('change', function (e) { if (e.target.hasAttribute('data-pub')) { d.published = e.target.checked; setDirty(true); } });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-imgclear')) { d.cover = ''; setDirty(true); render(); }
      if (t.dataset.gdel != null) { d.gal.splice(+t.dataset.gdel, 1); setDirty(true); render(); }
      if (t.dataset.gmove) { var i = +t.dataset.i, j = i + (+t.dataset.gmove); if (j >= 0 && j < d.gal.length) { var x = d.gal[i]; d.gal[i] = d.gal[j]; d.gal[j] = x; setDirty(true); render(); } }
      if (t.hasAttribute('data-upload') || t.hasAttribute('data-galadd')) {
        if (!state.api) return toast('Сервер не запущен — загрузка фото недоступна.', true);
        var multi = t.hasAttribute('data-galadd');
        pickFiles(multi).then(function (files) {
          if (!files.length) return;
          t.classList.add('uploading'); t.textContent = 'Загружаю…';
          var base = 'news-' + (slugify(d.title, 40) || 'photo');
          return files.reduce(function (p, f) {
            return p.then(function () { return uploadImage(f, base).then(function (path) { if (multi) d.gal.push(path); else d.cover = path; }); });
          }, Promise.resolve()).then(function () { setDirty(true); render(); toast('Фото загружено'); });
        }).catch(function (err) { toast(esc(err.message), true); render(); });
      }
      if (t.hasAttribute('data-delete')) {
        if (!confirm('Удалить новость «' + src.title + '»?')) return;
        state.news.splice(idx, 1);
        saveNews('Новость удалена').then(function () { setDirty(false); location.hash = '#news'; }, function () { state.news.splice(idx, 0, src); });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      d.title = d.title.trim(); d.short = (d.short || '').trim(); d.s = d.s.trim();
      var prev = isNewItem ? null : state.news[idx];
      if (isNewItem) state.news.unshift(d); else state.news[idx] = d;
      saveNews().then(function () {
        setDirty(false);
        toast((d.published === false ? 'Черновик сохранён.' : 'Опубликовано.') + ' <a href="/news/' + esc(d.s) + '" target="_blank">Открыть новость ↗</a>');
        if (isNewItem) location.hash = '#news/0'; else { src = d; d = clone(d); render(); }
      }, function () { if (isNewItem) state.news.shift(); else state.news[idx] = prev; });
    });
  }

  /* ---------- линейки новинок ---------- */
  function listGroups() {
    var G = clone(state.catalog.groups);
    function used(id) { return state.catalog.products.filter(function (p) { return p.g === id; }).length; }
    function render() {
      view.innerHTML = apiBanner() + '<form id="gform" novalidate><header class="bar sticky"><div><h1>Линейки новинок</h1></div>' +
        '<div class="bar-act"><span class="dirty-mark" hidden>● Есть несохранённые изменения</span><button type="button" class="btn" data-add>+ Линейка</button>' +
        '<button class="btn primary" type="submit"' + (state.api ? '' : ' disabled') + '>Сохранить</button></div></header>' +
        '<p class="hint" style="margin:-8px 0 18px">Линейки — это разделы страницы «Новинки»: заголовок, подпись и короткое описание над группой товаров. Порядок здесь = порядок на сайте.</p>' +
        '<div class="groups">' + G.map(function (g, i) {
          var n = used(g.id);
          return '<div class="group-card">' +
            '<label class="field"><span>Заголовок</span><input data-g="title" data-i="' + i + '" value="' + esc(g.title) + '"></label>' +
            '<label class="field"><span>Надпись над заголовком</span><input data-g="label" data-i="' + i + '" value="' + esc(g.label) + '" placeholder="Бренд · фасовка"></label>' +
            '<label class="field wide"><span>Описание</span><input data-g="text" data-i="' + i + '" value="' + esc(g.text) + '"></label>' +
            '<div class="gfoot"><span>Код: ' + esc(g.id) + ' · товаров: ' + n + '</span><span class="row-act">' +
            '<button type="button" class="icon-btn" data-gm="-1" data-i="' + i + '" title="Выше">↑</button><button type="button" class="icon-btn" data-gm="1" data-i="' + i + '" title="Ниже">↓</button>' +
            '<button type="button" class="icon-btn danger" data-gd="' + i + '" title="Удалить"' + (n ? ' disabled' : '') + '>✕</button></span></div></div>';
        }).join('') + '</div></form>';
      setDirty(state.dirty);
    }
    render();
    var form = editorRoot();
    form.addEventListener('input', function (e) { var t = e.target; if (t.dataset.g) { G[+t.dataset.i][t.dataset.g] = t.value; setDirty(true); } });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-add')) {
        var title = prompt('Название новой линейки:'); if (!title) return;
        var id = slugify(title, 30) || 'line'; while (G.some(function (g) { return g.id === id; })) id += '-2';
        G.push({ id: id, label: '', title: title, text: '' }); setDirty(true); render();
      }
      if (t.dataset.gm) { var i = +t.dataset.i, j = i + (+t.dataset.gm); if (j >= 0 && j < G.length) { var x = G[i]; G[i] = G[j]; G[j] = x; setDirty(true); render(); } }
      if (t.dataset.gd != null) { G.splice(+t.dataset.gd, 1); setDirty(true); render(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var prev = state.catalog.groups; state.catalog.groups = G;
      saveCatalog('Линейки сохранены').then(function () { setDirty(false); G = clone(state.catalog.groups); render(); }, function () { state.catalog.groups = prev; });
    });
  }

  /* ---------- где купить ---------- */
  var TYPES = [['market', 'Маркетплейс'], ['federal', 'Федеральная сеть'], ['chain', 'Региональная сеть / магазин'], ['export', 'Экспорт']];
  // координаты городов для автозаполнения точек на карте
  var CITIES = {
    'Москва': [55.7558, 37.6173], 'Санкт-Петербург': [59.9386, 30.3141], 'Екатеринбург': [56.8389, 60.6057], 'Челябинск': [55.1644, 61.4368],
    'Магнитогорск': [53.4072, 58.9791], 'Миасс': [55.0453, 60.1083], 'Златоуст': [55.1711, 59.6508], 'Копейск': [55.1167, 61.6167], 'Троицк': [54.0833, 61.5667],
    'Курган': [55.441, 65.3411], 'Тюмень': [57.153, 65.5343], 'Пермь': [58.0105, 56.2502], 'Уфа': [54.7388, 55.9721], 'Оренбург': [51.7682, 55.0969],
    'Самара': [53.1959, 50.1002], 'Казань': [55.7961, 49.1064], 'Нижний Новгород': [56.3269, 44.0059], 'Новосибирск': [55.0084, 82.9357], 'Омск': [54.9885, 73.3242],
    'Красноярск': [56.0153, 92.8932], 'Ростов-на-Дону': [47.2357, 39.7015], 'Краснодар': [45.0355, 38.9753], 'Сочи': [43.5855, 39.7231], 'Волгоград': [48.708, 44.5133],
    'Воронеж': [51.672, 39.1843], 'Калининград': [54.7104, 20.4522], 'Нижний Тагил': [57.9101, 59.9813], 'Каменск-Уральский': [56.4149, 61.9189], 'Первоуральск': [56.9054, 59.9433],
    'Таганрог': [47.2362, 38.8969], 'Шахты': [47.7085, 40.2159], 'Новочеркасск': [47.4222, 40.0939], 'Сургут': [61.254, 73.3962], 'Нижневартовск': [60.9344, 76.5531],
    'Ханты-Мансийск': [61.0042, 69.0019], 'Ижевск': [56.8526, 53.2045], 'Киров': [58.6036, 49.668], 'Саратов': [51.5336, 46.0342], 'Ярославль': [57.6261, 39.8845],
    'Тула': [54.1931, 37.6173], 'Иркутск': [52.287, 104.305], 'Барнаул': [53.3474, 83.7784], 'Томск': [56.4847, 84.9482], 'Кемерово': [55.3547, 86.0873],
    'Астана': [51.1605, 71.4704], 'Алматы': [43.222, 76.8512], 'Костанай': [53.2144, 63.6246]
  };
  function brandNames() { var seen = {}, out = []; BRANDS.forEach(function (b) { if (!seen[b[0]]) { seen[b[0]] = 1; out.push(b[0]); } }); return out; }
  function saveWhere(msg) {
    if (!state.api) { toast('Сервер не запущен — изменения не сохранены.', true); return Promise.reject(new Error('no api')); }
    return api('PUT', '/api/where', JSON.stringify(state.where, null, 1)).then(function (r) { counts(); if (msg) toast(msg); return r; })
      .catch(function (e) { toast('Не сохранено: ' + esc(e.message), true); throw e; });
  }
  function typeLabel(t) { return (TYPES.filter(function (x) { return x[0] === t; })[0] || [0, ''])[1]; }
  function listWhere() {
    var P = state.where.partners;
    view.innerHTML = apiBanner() +
      '<header class="bar"><div><h1>Где купить</h1><p>Торговые сети, маркетплейсы и экспорт для страницы <a href="/gde-kupit" target="_blank">«Где купить»</a> и блока на главной. ' +
      'Точки с городами появляются на карте; порядок здесь = порядок на сайте.</p></div><a class="btn primary" href="#partner/new">+ Добавить сеть</a></header>' +
      (P.length ? '<div class="list">' + P.map(function (p, i) {
        var pts = (p.points || []).filter(function (x) { return x.city; });
        var stores = (+p.stores || 0) + pts.reduce(function (s, x) { return s + (+x.stores || 0); }, 0);
        return '<div class="row"><img class="thumb cover" src="' + esc((p.photos || [])[0] || '/generated/newprod-logo.png') + '" alt="">' +
          '<div class="row-main"><a class="name" href="#partner/' + i + '"><b>' + esc(p.name) + '</b></a><small>' + esc([typeLabel(p.type), pts.length ? pts.map(function (x) { return x.city; }).join(', ') : (p.region || 'без точек на карте'), stores ? stores + ' маг.' : ''].filter(Boolean).join(' · ')) + '</small></div>' +
          '<div class="tags">' + (p.hidden ? '<span class="tag off">Скрыта</span>' : '') + (pts.length ? '<span class="tag">На карте</span>' : '') + '</div>' +
          '<div class="row-act"><button class="icon-btn" title="Выше" data-move="-1" data-i="' + i + '">↑</button><button class="icon-btn" title="Ниже" data-move="1" data-i="' + i + '">↓</button>' +
          '<a class="icon-btn" title="Открыть на сайте" target="_blank" href="/gde-kupit#' + esc(p.id) + '">↗</a><a class="btn small" href="#partner/' + i + '">Изменить</a>' +
          '<button class="icon-btn danger" title="Удалить" data-del="' + i + '">✕</button></div></div>';
      }).join('') + '</div>' : '<div class="empty">Список пуст. Нажмите «Добавить сеть».</div>');
    view.onclick = function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.move) {
        var i = +t.dataset.i, j = i + (+t.dataset.move); if (j < 0 || j >= P.length) return;
        var x = P[i]; P[i] = P[j]; P[j] = x;
        saveWhere('Порядок сохранён').then(listWhere, function () { P[j] = P[i]; P[i] = x; listWhere(); });
      }
      if (t.dataset.del) {
        var k = +t.dataset.del, p = P[k];
        if (!confirm('Убрать «' + p.name + '» со страницы «Где купить»?')) return;
        P.splice(k, 1);
        saveWhere('«' + esc(p.name) + '» удалена').then(listWhere, function () { P.splice(k, 0, p); });
      }
    };
  }
  function editPartner(key) {
    var isNewItem = key === 'new', idx = isNewItem ? -1 : +key;
    var src = isNewItem ? { id: '', name: '', type: 'chain', text: '', region: '', url: '', button: '', brands: [], stores: '', points: [], photos: [], hidden: false } : state.where.partners[idx];
    if (!src) { location.hash = '#where'; return; }
    var d = clone(src); d.points = d.points || []; d.photos = d.photos || []; d.brands = d.brands || [];
    var idTouched = !isNewItem;
    function pointsEditor() {
      return '<datalist id="v2-cities">' + Object.keys(CITIES).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
        '<div class="pts">' + d.points.map(function (pt, i) {
          return '<div class="pt"><label class="field"><span>Город</span><input list="v2-cities" data-p="city" data-i="' + i + '" value="' + esc(pt.city) + '" placeholder="Начните вводить"></label>' +
            '<label class="field"><span>Подпись на карте</span><input data-p="label" data-i="' + i + '" value="' + esc(pt.label) + '" placeholder="Например: Свердловская область"></label>' +
            '<label class="field"><span>Магазинов</span><input data-p="stores" data-i="' + i + '" value="' + esc(pt.stores) + '" inputmode="numeric"></label>' +
            '<label class="field"><span>Широта</span><input data-p="lat" data-i="' + i + '" value="' + esc(pt.lat) + '" inputmode="decimal"></label>' +
            '<label class="field"><span>Долгота</span><input data-p="lon" data-i="' + i + '" value="' + esc(pt.lon) + '" inputmode="decimal"></label>' +
            '<button type="button" class="icon-btn danger" data-pdel="' + i + '" title="Удалить точку">✕</button>' +
            '<label class="field wide"><span>Пояснение во всплывающей подсказке</span><input data-p="note" data-i="' + i + '" value="' + esc(pt.note) + '" placeholder="Список населённых пунктов, адреса и т. п."></label></div>';
        }).join('') + '<div><button type="button" class="btn small" data-padd>+ Город на карте</button></div></div>' +
        '<p class="hint">Для крупных городов координаты подставятся сами. Для других — найдите город на Яндекс или Google Картах и скопируйте широту и долготу.</p>';
    }
    function render() {
      view.innerHTML = apiBanner() + '<form id="wform" novalidate>' +
        '<header class="bar sticky"><div><a class="back" href="#where">← Где купить</a><h1>' + (isNewItem ? 'Новая сеть' : esc(src.name)) + '</h1></div>' +
        '<div class="bar-act"><span class="dirty-mark" hidden>● Есть несохранённые изменения</span>' +
        (!isNewItem ? '<a class="btn" target="_blank" href="/gde-kupit#' + esc(src.id) + '">Открыть на сайте ↗</a><button type="button" class="btn danger" data-delete>Удалить</button>' : '') +
        '<button class="btn primary" type="submit"' + (state.api ? '' : ' disabled') + '>Сохранить</button></div></header>' +
        '<section class="card"><h2>Основное</h2><div class="grid">' +
        '<label class="field"><span>Название <i>*</i></span><input data-f="name" value="' + esc(d.name) + '" placeholder="Например: Магнит"><em class="err"></em></label>' +
        '<label class="field"><span>Тип</span><select data-f="type">' + TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === d.type ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="field wide"><span>Описание</span><input data-f="text" value="' + esc(d.text) + '" placeholder="Какая сеть и что из продукции там продаётся"></label>' +
        '<label class="field"><span>Регион (текстом)</span><input data-f="region" value="' + esc(d.region) + '" placeholder="Урал, вся Россия…"></label>' +
        '<label class="field"><span>Всего магазинов (если точки не указаны)</span><input data-f="stores" value="' + esc(d.stores) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>Ссылка (магазин на маркетплейсе, сайт сети)</span><input data-f="url" value="' + esc(d.url) + '" placeholder="https://"></label>' +
        '<label class="field"><span>Текст кнопки</span><input data-f="button" value="' + esc(d.button) + '" placeholder="Купить на Ozon"></label>' +
        '<label class="field"><span>Код для ссылки <i>*</i></span><div class="prefix"><b>/gde-kupit#</b><input data-f="id" value="' + esc(d.id) + '"></div><em class="err"></em></label>' +
        '<div class="field"><span>Показ</span><div class="switches"><label class="check"><input type="checkbox" data-hidden' + (d.hidden ? ' checked' : '') + '>Скрыть с сайта</label></div></div>' +
        '<div class="field wide"><span>Бренды в продаже</span><div class="checks">' + brandNames().map(function (b) {
          return '<label class="check"><input type="checkbox" data-brandchk="' + esc(b) + '"' + (d.brands.indexOf(b) > -1 ? ' checked' : '') + '>' + esc(b) + '</label>';
        }).join('') + '</div></div></div></section>' +
        '<section class="card"><h2>Точки на карте</h2>' + pointsEditor() + '</section>' +
        '<section class="card"><h2>Фото с полок</h2><div class="gal">' + d.photos.map(function (s, i) {
          return '<div class="g"><img src="' + esc(s) + '" alt=""><div class="gbtns"><button type="button" data-gmove="-1" data-i="' + i + '">←</button><button type="button" data-gdel="' + i + '">✕</button><button type="button" data-gmove="1" data-i="' + i + '">→</button></div></div>';
        }).join('') + '<button type="button" class="add" data-galadd>+ Фото</button></div><p class="hint">Первое фото — обложка карточки сети. Все фото попадают в раздел «Мы на полках».</p></section>' +
        '</form>';
      setDirty(state.dirty);
    }
    render();
    var form = editorRoot();
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.f) {
        d[t.dataset.f] = t.value;
        if (t.dataset.f === 'id') idTouched = true;
        if (t.dataset.f === 'name' && !idTouched) { d.id = slugify(d.name, 40); $('[data-f=id]', form).value = d.id; }
      }
      if (t.dataset.p) {
        var pt = d.points[+t.dataset.i]; pt[t.dataset.p] = t.value;
        if (t.dataset.p === 'city' && CITIES[t.value.trim()]) {
          var c = CITIES[t.value.trim()]; pt.lat = c[0]; pt.lon = c[1];
          $('[data-p=lat][data-i="' + t.dataset.i + '"]', form).value = c[0]; $('[data-p=lon][data-i="' + t.dataset.i + '"]', form).value = c[1];
          if (!pt.label) { pt.label = t.value.trim(); $('[data-p=label][data-i="' + t.dataset.i + '"]', form).value = pt.label; }
        }
      }
      setDirty(true);
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.f === 'type') d.type = t.value;
      if (t.hasAttribute('data-hidden')) d.hidden = t.checked;
      if (t.dataset.brandchk) { var b = t.dataset.brandchk; d.brands = d.brands.filter(function (x) { return x !== b; }); if (t.checked) d.brands.push(b); }
      setDirty(true);
    });
    form.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-padd')) { d.points.push({ city: '', lat: '', lon: '', label: '', stores: '', note: '' }); setDirty(true); render(); var inp = $$('[data-p=city]', form).pop(); if (inp) inp.focus(); }
      if (t.dataset.pdel != null) { d.points.splice(+t.dataset.pdel, 1); setDirty(true); render(); }
      if (t.dataset.gdel != null) { d.photos.splice(+t.dataset.gdel, 1); setDirty(true); render(); }
      if (t.dataset.gmove) { var i = +t.dataset.i, j = i + (+t.dataset.gmove); if (j >= 0 && j < d.photos.length) { var x = d.photos[i]; d.photos[i] = d.photos[j]; d.photos[j] = x; setDirty(true); render(); } }
      if (t.hasAttribute('data-galadd')) {
        if (!state.api) return toast('Сервер не запущен — загрузка фото недоступна.', true);
        pickFiles(true).then(function (files) {
          if (!files.length) return;
          t.classList.add('uploading'); t.textContent = 'Загружаю…';
          return files.reduce(function (p, f) {
            return p.then(function () { return uploadImage(f, 'shelf-' + (slugify(d.name, 30) || 'photo')).then(function (path) { d.photos.push(path); }); });
          }, Promise.resolve()).then(function () { setDirty(true); render(); toast('Фото загружено'); });
        }).catch(function (err) { toast(esc(err.message), true); render(); });
      }
      if (t.hasAttribute('data-delete')) {
        if (!confirm('Убрать «' + src.name + '» со страницы «Где купить»?')) return;
        state.where.partners.splice(idx, 1);
        saveWhere('«' + esc(src.name) + '» удалена').then(function () { setDirty(false); location.hash = '#where'; }, function () { state.where.partners.splice(idx, 0, src); });
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      function mark(sel, msg) { var f = $(sel, view).closest('.field'); f.classList.toggle('invalid', !!msg); var er = $('.err', f); if (er) er.textContent = msg || ''; if (msg && ok) { $(sel, view).focus(); ok = false; } }
      mark('[data-f=name]', d.name.trim() ? '' : 'Укажите название');
      var id = d.id.trim(), msg = '';
      if (!id) msg = 'Укажите код'; else if (!/^[a-z0-9-]+$/.test(id)) msg = 'Только латиница, цифры и дефис';
      else if (state.where.partners.some(function (p, i) { return p.id === id && i !== idx; })) msg = 'Такой код уже есть';
      mark('[data-f=id]', msg);
      if (!ok) return;
      var bad = d.points.filter(function (pt) { return pt.city && (isNaN(parseFloat(pt.lat)) || isNaN(parseFloat(pt.lon))); });
      if (bad.length) { toast('Укажите координаты для: ' + esc(bad.map(function (x) { return x.city; }).join(', ')), true); return; }
      d.name = d.name.trim(); d.id = id;
      d.points = d.points.filter(function (pt) { return pt.city; }).map(function (pt) {
        return { city: pt.city.trim(), lat: parseFloat(pt.lat), lon: parseFloat(pt.lon), label: (pt.label || '').trim(), stores: pt.stores === '' ? '' : (parseInt(pt.stores, 10) || ''), note: (pt.note || '').trim() };
      });
      d.stores = d.stores === '' ? '' : (parseInt(d.stores, 10) || '');
      var prev = isNewItem ? null : state.where.partners[idx];
      if (isNewItem) state.where.partners.push(d); else state.where.partners[idx] = d;
      saveWhere().then(function () {
        setDirty(false);
        toast('Сохранено. <a href="/gde-kupit#' + esc(d.id) + '" target="_blank">Открыть на сайте ↗</a>');
        if (isNewItem) location.hash = '#partner/' + (state.where.partners.length - 1); else { src = d; d = clone(d); render(); }
      }, function () { if (isNewItem) state.where.partners.pop(); else state.where.partners[idx] = prev; });
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { var f = $('form', view); if (f) { e.preventDefault(); f.requestSubmit(); } }
  });
  init();
})();

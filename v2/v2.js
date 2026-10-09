/* Доработки сайта «Новые продукты», версия v2.
   Скрипт подключается на всех страницах копии и работает поверх готовой вёрстки Next.js:
   ждёт гидратации React, затем добавляет новые блоки рядом с существующими (сами компоненты сайта не трогает).
   Данные о новинках — из «Каталог продукции 2», составы и КБЖУ коробок — из карточек маркетплейсов. */
(function () {
  'use strict';

  var SITE = window.V2_SITE || { cats: [], products: [], news: [] };
  // Префикс адреса: '' локально, '/mojno24-v2' на GitHub Pages — берём из адреса самого скрипта
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? new URL(s).pathname.replace(/\/v2\/v2\.js$/, '') : '';
  })();
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4"></path></svg>';
  var MAKER = 'ООО «Новые продукты», г. Челябинск';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function h(html) {
    // все внутренние ссылки и картинки в генерируемой разметке пишутся от корня — добавляем префикс сайта
    if (BASE) html = html.replace(/(\s(?:href|src|data-src)=")\/(?!\/)/g, '$1' + BASE + '/');
    var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function plural(n, f) { var a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? f[2] : b > 1 && b < 5 ? f[1] : b === 1 ? f[0] : f[2]; }

  /* ---------------- данные ---------------- */

  var SOSTAV = {
    griby: 'Горох, отруби зерновые молотые, грибы белые сушёные, овощи сушёные: морковь, лук, чеснок, укроп, мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.',
    kuritsa: 'Горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон куриный» ЭКО (соль, сахар, порошок жира топлёного (куриный), ароматизатор «Курица», лук, сельдерей, куркума, фарш варёно-сушёный (куриный)), мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.',
    govyadina: 'Горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон говяжий» ЭКО (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.',
    rebra: 'Чечевица, горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон говяжий» ЭКО (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), ароматизатор «Барбекю», мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.',
    rmSalted: 'Рис шлифованный, бурый рис, гречка, зелёная гречка, соль.'
  };
  var KBJU = {
    sl: { b: '17,5', z: '5,3', u: '57,1' },
    slGriby: { b: '17,6', z: '5,3', u: '57,2' }
  };

  var GROUPS = [
    { id: 'sl-box', label: 'Street Lunch · 240 г', title: 'Street Lunch в коробке', text: 'Шесть порционных пакетиков по 40 г в одной коробке. Одна готовая порция — около 300 г, варить не нужно.' },
    { id: 'pu-box', label: 'По-Уральски · 240 г', title: '«По-Уральски» теперь в коробке', text: 'Борщ и солянка в формате на 6 порций: 3 минуты без варки — только горячая вода, срок хранения 12 месяцев.' },
    { id: 'kasha', label: 'Наша Каша', title: 'Гречневая каша-пюре', text: 'Шесть порционных пакетов по 40 г: готово за 2 минуты без варки, порция около 250 г, витамины группы B.' },
    { id: 'rm-fruit', label: 'РисоМишки · 80 г', title: 'РисоМишки во фруктовой глазури', text: 'Хрустящий воздушный рис в форме медвежат — теперь в манговой, малиновой, апельсиновой и клубничной глазури. Без глютена.' },
    { id: 'rm-salt', label: 'РисоМишки · 50 г', title: 'РисоМишки без глазури', text: 'Солёные хрустящие хлебцы из риса и гречки: без глютена, лактозы, дрожжей и масла.' }
  ];

  function slBox(o) {
    return {
      s: o.s, g: 'sl-box', k: 'street-lunch', b: 'Street Lunch', n: o.n, cat: 'Street Lunch / Суп-пюре в коробке',
      full: 'Суп-пюре моментального приготовления «Street Lunch» ' + o.n.toLowerCase() + ', коробка 240 г',
      img: '/v2/img/p/' + o.img, gal: o.gal || [], meta: '240 г · 6 порций', dish: o.dish,
      chars: [['Бренд', 'Street Lunch'], ['Формат', 'Коробка: 6 порционных пакетиков по 40 г'], ['Масса нетто', '240 г'], ['Готовая порция', '≈ 300 г'], ['Приготовление', 'Без варки — достаточно горячей воды'], ['Изготовитель', MAKER]],
      facts: ['Без варки', '17% растительного белка', '6 порций в коробке'],
      sostav: o.sostav, kbju: o.kbju, logi: [['Упаковка', 'Коробка 240 г (6 × 40 г)'], ['Пакетик', 'Порционный, 40 г']]
    };
  }
  function puBox(o) {
    return {
      s: o.s, g: 'pu-box', k: 'po-uralski', b: 'По-Уральски', n: o.n, cat: 'По-Уральски / Суп в коробке',
      full: o.n + ' «Street Lunch» моментального приготовления, коробка 240 г', img: '/v2/img/p/' + o.img, gal: [], meta: '240 г · 6 порций',
      chars: [['Бренд', 'Street Lunch · линейка «По-Уральски»'], ['Формат', 'Коробка: 6 порционных пакетов'], ['Масса нетто', '240 г'], ['Готовая порция', '≈ 300 г'], ['Приготовление', '3 минуты без варки — только горячая вода'], ['Изготовитель', MAKER]],
      facts: ['Без варки', '3 минуты', '6 порций в коробке'],
      logi: [['Срок хранения', '12 месяцев'], ['Упаковка', 'Коробка 240 г, 6 пакетов']]
    };
  }
  function kasha(o) {
    return {
      s: o.s, g: 'kasha', k: 'nasha-kasha', b: 'Наша Каша', n: o.n, cat: 'Наша Каша / Каша-пюре',
      full: 'Каша-пюре гречневая моментального приготовления «Наша Каша» ' + o.n.replace(/^Гречневая /, '').toLowerCase(), img: '/v2/img/p/' + o.img, gal: [], meta: '6 × 40 г',
      chars: [['Бренд', 'Наша Каша'], ['Формат', 'Коробка: 6 порционных пакетов по 40 г'], ['Масса нетто', '240 г (6 × 40 г)'], ['Готовая порция', '≈ 250 г'], ['Приготовление', '2 минуты, без варки'], ['Изготовитель', MAKER]],
      facts: ['Без варки', '2 минуты', 'Витамины группы B', '100% натурально'],
      logi: [['Упаковка', 'Коробка, 6 пакетов по 40 г']]
    };
  }
  function rmFruit(o) {
    return {
      s: o.s, g: 'rm-fruit', k: 'risomishki', b: 'РисоМишки', n: o.n, cat: 'РисоМишки / Фруктовая глазурь',
      full: 'Хрустящий десерт «РисоМишки» ' + o.full, img: '/v2/img/p/' + o.img, gal: [], meta: '80 г',
      chars: [['Бренд', 'РисоМишки'], ['Продукт', 'Хрустящий десерт из воздушного риса в глазури'], ['Глазурь', o.glaze], ['Масса нетто', '80 г'], ['Изготовитель', MAKER]],
      facts: ['Без глютена', 'Воздушный рис', 'Фигурки-медвежата'], logi: [['Упаковка', 'Картонная коробка, 80 г']]
    };
  }

  var NEW = [
    slBox({ s: 'street-lunch-korobka-gorokhovyi-s-gribami', n: 'Гороховый с грибами', img: 'sl-box-mushroom.png', gal: ['/v2/img/g/box-mushroom-1.jpg', '/v2/img/g/box-mushroom-4.jpg', '/v2/img/g/box-mushroom-2.jpg', '/v2/img/g/box-mushroom-3.jpg'], sostav: SOSTAV.griby, kbju: KBJU.slGriby, dish: 'gorokh-griby' }),
    slBox({ s: 'street-lunch-korobka-gorokhovyi-s-kuritsei', n: 'Гороховый с «курицей»', img: 'sl-box-chicken.png', gal: ['/v2/img/g/box-chicken-1.jpg', '/v2/img/g/box-chicken-2.jpg', '/v2/img/g/box-chicken-3.jpg'], sostav: SOSTAV.kuritsa, kbju: KBJU.sl }),
    slBox({ s: 'street-lunch-korobka-gorokhovyi-s-goviadinoi', n: 'Гороховый с «говядиной»', img: 'sl-box-beef.png', gal: ['/v2/img/g/box-beef-1.jpg', '/v2/img/g/box-beef-2.jpg', '/v2/img/g/box-beef-3.jpg'], sostav: SOSTAV.govyadina, kbju: KBJU.sl }),
    slBox({ s: 'street-lunch-korobka-chechevichnyi-s-rebryshkami', n: 'Чечевичный с «копчёными рёбрышками»', img: 'sl-box-ribs.png', gal: ['/v2/img/g/box-ribs-1.jpg', '/v2/img/g/box-ribs-2.jpg', '/v2/img/g/box-ribs-3.jpg'], sostav: SOSTAV.rebra, kbju: KBJU.sl, dish: 'chechevica-rebra' }),
    slBox({ s: 'street-lunch-korobka-gorokhovyi-s-ovoshchami', n: 'Гороховый с овощами', img: 'sl-box-veggie.png', dish: 'gorokh-ovoshchi' }),
    puBox({ s: 'borshch-po-uralski-korobka', n: 'Борщ по-уральски', img: 'pu-box-borsch.png' }),
    puBox({ s: 'solianka-po-uralski-korobka', n: 'Солянка по-уральски', img: 'pu-box-solyanka.png' }),
    kasha({ s: 'nasha-kasha-grechnevaia-s-goviadinoi', n: 'Гречневая с «говядиной»', img: 'kasha-beef.webp' }),
    kasha({ s: 'nasha-kasha-grechnevaia-s-gribami', n: 'Гречневая с грибами', img: 'kasha-mushroom.webp' }),
    rmFruit({ s: 'risomishki-mango', n: 'Со вкусом манго', full: 'в глазури со вкусом манго', glaze: 'Фруктовая, со вкусом манго', img: 'rm-mango.png' }),
    rmFruit({ s: 'risomishki-malina', n: 'Со вкусом малины', full: 'в глазури со вкусом малины', glaze: 'Фруктовая, со вкусом малины', img: 'rm-raspberry.png' }),
    rmFruit({ s: 'risomishki-apelsin', n: 'Со вкусом апельсина', full: 'в глазури со вкусом апельсина', glaze: 'Фруктовая, со вкусом апельсина', img: 'rm-orange.png' }),
    rmFruit({ s: 'risomishki-klubnika', n: 'В клубничной глазури', full: 'в клубничной глазури', glaze: 'Клубничная', img: 'rm-strawberry.jpg' }),
    {
      s: 'risomishki-khlebtsy-solenye', g: 'rm-salt', k: 'risomishki', b: 'РисоМишки', n: 'Хлебцы хрустящие солёные', cat: 'РисоМишки / Хлебцы',
      full: 'Хлебцы хрустящие солёные «РисоМишки»', img: '/v2/img/p/rm-salted.jpg', gal: [], meta: '50 г',
      chars: [['Бренд', 'РисоМишки'], ['Продукт', 'Хлебцы хрустящие солёные, без глазури'], ['Основа', 'Рис шлифованный, бурый рис, гречка, зелёная гречка'], ['Масса нетто', '50 г'], ['Изготовитель', MAKER]],
      facts: ['Без глютена', 'Без лактозы', 'Без дрожжей', 'Без масла', '100% натуральный продукт'],
      sostav: SOSTAV.rmSalted, kbju: { kcal: '325' }, logi: [['Упаковка', 'Картонная коробка, 50 г']]
    }
  ];
  // Разделы каталога, в ленте которых показывается товар (по умолчанию — по линейке)
  var DEFAULT_SECTIONS = { 'sl-box': ['street-lunch', 'sup-piure-razovye-paketiki'], 'pu-box': ['strit-lanch'], 'kasha': ['strit-lanch'], 'rm-fruit': ['mishki-v-shokolade'], 'rm-salt': ['mishki-v-shokolade'] };
  NEW.forEach(function (p) { p.isNew = true; p.sections = DEFAULT_SECTIONS[p.g] || []; if (p.dish) p.dish = '/v2/img/dish/' + p.dish + '.jpg'; });

  // Всё выше — встроенные данные на случай, если файлы админки недоступны.
  // Рабочие данные лежат в /v2/data/catalog.json и /v2/data/news.json и редактируются в /admin/.
  var ALL = NEW, NEWS = [], NEW_BY_SLUG = {}, NEWS_BY_SLUG = {}, WHERE = { partners: [] };
  function isNew(p) { return p.isNew !== false; }
  function applyData(catalog, news) {
    if (catalog && Array.isArray(catalog.products)) {
      ALL = catalog.products.filter(function (p) { return p && p.s && !p.hidden; });
      if (Array.isArray(catalog.groups)) GROUPS = catalog.groups;
    }
    if (Array.isArray(news)) {
      NEWS = news.filter(function (n) { return n && n.s && n.published !== false; })
        .sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    }
    ALL.forEach(function (p) { p.gal = p.gal || []; p.chars = p.chars || []; p.facts = p.facts || []; p.logi = p.logi || []; p.sections = p.sections || []; p.k = p.k || 'other'; });
    NEW = ALL.filter(isNew);
    NEW_BY_SLUG = {}; ALL.forEach(function (p) { NEW_BY_SLUG[p.s] = p; });
    NEWS_BY_SLUG = {}; NEWS.forEach(function (n) { NEWS_BY_SLUG[n.s] = n; });
  }
  function loadJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  /* дополнения к существующим товарам */
  var DISH = {
    'gorokh-griby': ['bobsy-chesnok', 'street-lunch-gorokhovyi-s-gribami', 'sup-piure-momentalnogo-prigotovleniia-street-lunch-gorokhovyi-s-gribami'],
    'gorokh-ovoshchi': ['bobsy-aromatnye-s-chesnokom', 'street-lunch-gorokhovyi-s-ovoshchami', 'sup-piure-momentalnogo-prigotovleniia-street-lunch-gorokhovyi-s-ovoshchami'],
    'chechevica-rebra': ['bobsy-prianye-s-khmeli-suneli', 'street-lunch-chechevichnyi-s-kopchenymi-rebryshkami', 'sup-piure-momentalnogo-prigotovleniia-street-lunch-chechevichnyi-s-kopchenymi-rebryshkami'],
    'gorokh-luk': ['kasha-momentalnogo-prigotovleniia-street-lunch-gorokhovaia-c-zharenym-lukom'],
    'nut-karri': ['kasha-momentalnogo-prigotovleniia-street-lunch-karri-s-nutom'],
    'rizotto': ['kasha-momentalnogo-prigotovleniia-street-lunch-rizotto-s-belymi-gribami'],
    'grechka-myaso': ['kasha-grechnevaia-s-miasom-ovoshchami-i-zeleniu']
  };
  var DISH_BY_SLUG = {};
  Object.keys(DISH).forEach(function (k) { DISH[k].forEach(function (s) { DISH_BY_SLUG[s] = '/v2/img/dish/' + k + '.jpg'; }); });

  var FILL_IMG = { 'khrumstik-pshenichnyi': '/v2/img/p/khrumstik-pshenichnyi.jpg' };

  // Порционные пакетики 40 г — те же, что в коробках: состав и КБЖУ с карточек маркетплейсов.
  // На действующем сайте у этих страниц ошибочно стоит состав снеков «Бобсы».
  var SACHET = { chars: [['Масса нетто', '40 г'], ['Готовая порция', '≈ 300 г'], ['Приготовление', 'Без варки — достаточно горячей воды']], logi: [['Фасовка', '25 пакетиков в шоу-боксе']] };
  var EXTRA = {
    'bobsy-chesnok': { sachet: true, sostav: SOSTAV.griby, kbju: KBJU.slGriby },
    'bobsy-so-vkusom-semgi-i-syrom': { sachet: true, sostav: SOSTAV.kuritsa, kbju: KBJU.sl },
    'bobsy-so-vkusom-bekona': { sachet: true, sostav: SOSTAV.govyadina, kbju: KBJU.sl },
    'bobsy-prianye-s-khmeli-suneli': { sachet: true, sostav: SOSTAV.rebra, kbju: KBJU.sl },
    'bobsy-aromatnye-s-chesnokom': { sachet: true, sostav: '', kbju: null },
    'borshch-po-uralski': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'solianka-po-uralski': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'ukha-po-uralski': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'piure-kartofelnoe-po-uralski': { chars: [['Масса нетто', '40 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'sup-piure-momentalnogo-prigotovleniia-street-lunch-gorokhovyi-s-gribami': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'sup-piure-momentalnogo-prigotovleniia-street-lunch-gorokhovyi-s-ovoshchami': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] },
    'sup-piure-momentalnogo-prigotovleniia-street-lunch-chechevichnyi-s-kopchenymi-rebryshkami': { chars: [['Масса нетто', '50 г'], ['Приготовление', 'Прямо в стаканчике, без варки']] }
  };
  var BRAND_FACTS = {
    'Street Lunch': ['Без варки'], 'ПО-УРАЛЬСКИ': ['Без варки'],
    'РИСО МИШКИ': ['Без глютена', 'Воздушный рис'], 'ХРУМСТИК': ['Воздушные крупы']
  };

  /* ---------------- утилиты ---------------- */

  function whenHydrated(cb) {
    var t0 = Date.now();
    (function poll() {
      var m = $('main');
      var ok = m && Object.keys(m).some(function (k) { return k.indexOf('__reactFiber') === 0; });
      if (ok || Date.now() - t0 > 6000) { setTimeout(cb, 60); } else { setTimeout(poll, 40); }
    })();
  }

  // Открывает штатную форму «Сотрудничество» и подставляет текст комментария.
  function ask(text) {
    var btn = $$('.cooperation-button > button').filter(function (b) { return /Сотрудничество/.test(b.textContent); })[0];
    if (!btn) { location.href = 'mailto:info@newprod.ru?subject=' + encodeURIComponent('Запрос с сайта') + '&body=' + encodeURIComponent(text); return; }
    btn.click();
    setTimeout(function () {
      var ta = $('.cooperation-modal textarea[name=message]');
      if (!ta) return;
      var setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, text);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }, 80);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-v2-ask]');
    if (el) { e.preventDefault(); ask(el.getAttribute('data-v2-ask')); }
  });

  function productUrl(p) { return '/product/' + p.s; }
  function groupItems(id) { return NEW.filter(function (p) { return p.g === id; }); }
  function askFor(p) { return (isNew(p) ? 'Интересует новинка: ' : 'Интересует продукт: ') + (p.full || p.b + ' ' + p.n) + '. Прошу прислать условия поставки и спецификацию.'; }
  function badge(p, cls) { return isNew(p) ? '<span class="v2-badge' + (cls ? ' ' + cls : '') + '">Новинка</span>' : ''; }

  function v2Card(p) {
    return '<a class="v2-card" data-brand="' + esc(p.k) + '" href="' + productUrl(p) + '">' +
      '<div class="v2-card-visual">' + badge(p) + (p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(p.b + ' ' + p.n) + '" loading="lazy">' : '') + '</div>' +
      '<span class="v2-card-brand">' + esc(p.b) + '</span><h3>' + esc(p.n) + '</h3><p class="v2-card-meta">' + esc(p.meta) + '</p></a>';
  }
  function siteCard(p) {
    var askText = askFor(p);
    return '<article class="product-card" data-brand="' + esc(p.k) + '"><div class="product-visual">' +
      '<a class="product-image" tabindex="-1" aria-hidden="true" href="' + productUrl(p) + '">' + (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : '<div class="image-fallback"><span>Изображение уточняется</span></div>') + '</a>' +
      badge(p, 'v2-card-badge') + '</div><div class="product-info"><p class="product-category">' + esc(p.cat) + '</p>' +
      '<h3><a title="' + esc(p.full) + '" href="' + productUrl(p) + '">' + esc(p.n) + '</a></h3>' +
      '<button class="add-button" data-v2-ask="' + esc(askText) + '"><span aria-hidden="true">+</span>Запросить условия</button></div></article>';
  }
  function crumbs(items) {
    return '<nav class="breadcrumbs" aria-label="Хлебные крошки"><ol>' + items.map(function (it, i) {
      return i === items.length - 1 ? '<li><span aria-current="page">' + esc(it[0]) + '</span></li>' : '<li><a href="' + it[1] + '">' + esc(it[0]) + '</a></li>';
    }).join('') + '</ol></nav>';
  }
  function dl(rows) {
    return '<dl>' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>';
  }

  /* ---------------- вкладки товара ---------------- */

  function parseSpecs(specs) {
    var out = { sostav: '', rows: [] };
    if (!specs) return out;
    $$('section', specs).forEach(function (sec) {
      var title = ($('h2', sec) || {}).textContent || '';
      if (/Состав/.test(title)) {
        out.sostav = $$('p', sec).map(function (p) { return p.textContent.trim(); }).filter(function (t) { return t && !/^Изготовитель/.test(t); }).join(' ');
      }
      $$('dl > div', sec).forEach(function (d) {
        var dt = ($('dt', d) || {}).textContent || '', dd = ($('dd', d) || {}).textContent || '';
        out.rows.push([dt.replace(/:\s*$/, '').trim(), dd.replace(/\s+/g, ' ').trim()]);
      });
    });
    return out;
  }
  function kbjuFromRows(rows) {
    var r = {};
    rows.forEach(function (row) {
      if (/Пищевая ценность/i.test(row[0])) {
        var m = row[1].match(/белки[^\d]*([\d,\.]+).*?жиры[^\d]*([\d,\.]+).*?углеводы[^\d]*([\d,\.]+)/i);
        if (m) { r.b = m[1]; r.z = m[2]; r.u = m[3]; }
      }
      if (/Энергетическая/i.test(row[0])) r.kcal = row[1].replace(/[^\d,\.]/g, '');
    });
    return (r.b || r.kcal) ? r : null;
  }
  function storageFromRows(rows) {
    var min, max, life, res = [];
    rows.forEach(function (row) {
      if (/t min/i.test(row[0])) min = row[1].replace(/C0|С0|°?C/g, '').trim();
      if (/t max/i.test(row[0])) max = row[1].replace(/C0|С0|°?C/g, '').trim();
      if (/Срок/i.test(row[0])) life = row[1];
    });
    if (life) res.push(['Срок годности', life.replace(/(\d+)\s*дн\.?/, '$1 дней')]);
    if (min || max) res.push(['Условия хранения', 'от ' + (min || '…').replace('-', '−') + ' до ' + (max || '…') + ' °C']);
    return res;
  }

  function buildTabs(o) {
    // o: {name, chars, facts, sostav, kbju, logi}
    var id = 'v2t' + Math.random().toString(36).slice(2, 7);
    var req = 'Прошу направить спецификацию на продукт: ' + o.name + ' (состав, пищевая ценность, логистические данные).';
    var reqBtn = '<button type="button" class="v2-link" data-v2-ask="' + esc(req) + '">Запросить спецификацию ' + ARROW + '</button>';
    var nutri = '';
    if (o.kbju && (o.kbju.b || o.kbju.kcal)) {
      nutri = '<p>На 100 г продукта:</p><div class="v2-nutri">' +
        (o.kbju.b ? '<div><b>' + o.kbju.b + '</b><span>белки, г</span></div><div><b>' + o.kbju.z + '</b><span>жиры, г</span></div><div><b>' + o.kbju.u + '</b><span>углеводы, г</span></div>' : '') +
        (o.kbju.kcal ? '<div><b>' + o.kbju.kcal + '</b><span>ккал</span></div>' : '') + '</div>';
    } else {
      nutri = '<p>Пищевая и энергетическая ценность указаны на упаковке.</p><div class="v2-note">Точные значения пришлём в спецификации. ' + reqBtn + '</div>';
    }
    var sostav = o.sostav ? '<p>' + esc(o.sostav) + '</p>' : '<p>Состав указан на упаковке продукта.</p><div class="v2-note">Полный состав пришлём вместе со спецификацией. ' + reqBtn + '</div>';
    var logiRows = (o.logi || []).slice();
    var logi = (logiRows.length ? dl(logiRows) : '') +
      '<div class="v2-note">Количество в коробе, габариты и вес брутто, штрихкоды EAN-13 — в спецификации для торговых сетей и дистрибьюторов. ' + reqBtn + '</div>';
    var tabs = [['Характеристики', dl(o.chars) + (o.facts && o.facts.length ? '<ul class="v2-facts">' + o.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '')],
      ['Состав', sostav], ['Пищевая ценность', nutri], ['Логистические данные', logi]];
    return '<div class="v2 v2-tabs">' +
      '<div class="v2-tablist" role="tablist" aria-label="Информация о продукте">' + tabs.map(function (t, i) {
        return '<button type="button" role="tab" id="' + id + 't' + i + '" aria-controls="' + id + 'p' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t[0] + '</button>';
      }).join('') + '</div>' + tabs.map(function (t, i) {
        return '<section class="v2-panel" role="tabpanel" id="' + id + 'p' + i + '" aria-labelledby="' + id + 't' + i + '"' + (i ? ' hidden' : '') + '>' + t[1] + '</section>';
      }).join('') + '</div>';
  }
  function wireTabs(root) {
    var list = $('[role=tablist]', root); if (!list) return;
    var tabs = $$('[role=tab]', list);
    function select(t) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1; if (j < 0 && e.key !== 'ArrowLeft') return;
        j = (j + tabs.length) % tabs.length; tabs[j].focus(); select(tabs[j]); e.preventDefault();
      });
    });
  }

  function dishBlock(src, name, isKasha) {
    return '<section class="v2 v2-dish v2-appear" aria-label="Готовое блюдо"><figure><img src="' + src + '" alt="' + esc(name) + ' — готовое блюдо" loading="lazy"></figure>' +
      '<div><span class="eyebrow">Готовое блюдо</span><h2>Так выглядит порция после приготовления</h2>' +
      '<p>' + (isKasha ? 'Каша' : 'Суп-пюре') + ' моментального приготовления: варить не нужно, достаточно горячей воды.</p>' +
      '<ol><li>Откройте упаковку</li><li>Добавьте горячую воду</li><li>Перемешайте — блюдо готово</li></ol></div></section>';
  }

  /* ---------------- существующие страницы товара ---------------- */

  function enhanceProduct(slug) {
    var ws = $('.product-workspace'); if (!ws) return;
    var name = (($('.workspace-info h1') || {}).textContent || '').trim();
    var official = (($('.product-official-name') || {}).textContent || name).trim();
    var brand = (($('.workspace-info .eyebrow') || {}).textContent || '').trim();
    var crumbsEls = $$('.breadcrumbs li'); var cat = crumbsEls.length > 2 ? crumbsEls[2].textContent.trim() : '';

    // фото для товаров без изображения
    if (FILL_IMG[slug]) {
      $$('.workspace-gallery img:not([src]), .current-product img:not([src])').forEach(function (img) { img.setAttribute('src', BASE + FILL_IMG[slug]); });
    }

    var specs = $('.product-specs');
    var parsed = parseSpecs(specs), ex = EXTRA[slug] || {};
    var chars = [['Бренд', brand], ['Категория', cat], ['Наименование', official]].filter(function (r) { return r[1]; });
    if (ex.sachet) chars = chars.concat(SACHET.chars);
    if (ex.chars) chars = chars.concat(ex.chars);
    chars.push(['Изготовитель', MAKER]);
    var logi = storageFromRows(parsed.rows).concat(ex.sachet ? SACHET.logi : []);
    var sostav = ex.sachet ? ex.sostav : parsed.sostav;
    var kbju = ex.sachet ? ex.kbju : kbjuFromRows(parsed.rows);
    var facts = (BRAND_FACTS[brand] || []).slice();
    if (/фруктоз/i.test(official)) facts.push('С фруктозой');

    if (specs) {
      specs.classList.add('v2-tabbed');
      var tabs = h(buildTabs({ name: official, chars: chars, facts: facts, sostav: sostav, kbju: kbju, logi: logi }));
      specs.appendChild(tabs); wireTabs(tabs);
    }
    if (DISH_BY_SLUG[slug]) ws.insertAdjacentElement('afterend', h(dishBlock(DISH_BY_SLUG[slug], name, /^kasha/.test(slug))));
  }

  /* ---------------- каталог ---------------- */

  function enhanceCatalog(path) {
    var heading = $('main .page-heading'), cat = path.split('/')[2];
    var items = cat ? ALL.filter(function (p) { return p.sections.indexOf(cat) > -1; }) : ALL.slice();
    // сначала новинки, затем остальные добавленные позиции
    items.sort(function (a, b) { return (isNew(b) ? 1 : 0) - (isNew(a) ? 1 : 0); });
    if (items.length && heading) {
      heading.insertAdjacentElement('afterend', h('<section class="v2 v2-catalog-new v2-appear" aria-label="Новые позиции"><header><div><span class="v2-badge">Новое в каталоге</span><h2>' +
        (cat ? 'Новое в этой линейке' : 'Новые вкусы и форматы') + '</h2></div><a class="v2-link" href="/gde-kupit">Где купить ' + ARROW + '</a></header>' +
        '<div class="v2-rail" data-lenis-prevent>' + items.map(v2Card).join('') + '</div></section>'));
    }
    fillCatalogImages();
    var main = $('main');
    if (main) new MutationObserver(fillCatalogImages).observe(main, { childList: true, subtree: true });
  }
  function fillCatalogImages() {
    Object.keys(FILL_IMG).forEach(function (slug) {
      $$('a.product-image[href="' + BASE + '/product/' + slug + '"]').forEach(function (a) {
        if (a.querySelector('img.v2-filled')) return;
        var fb = a.querySelector('.image-fallback'); if (!fb) return;
        fb.style.display = 'none';
        a.appendChild(h('<img class="v2-filled" src="' + FILL_IMG[slug] + '" alt="" loading="lazy">'));
      });
    });
  }

  /* ---------------- главная ---------------- */

  function enhanceHome() {
    var hc = $('.home-continuation');
    if (hc && WHERE.partners.length) hc.insertBefore(h(whereTeaser(true)), hc.firstElementChild);
    var dirs = $('.trade-directions');
    if (dirs) {
      dirs.appendChild(h('<article class="trade-direction v2-trade"><h3>Поставщикам</h3><p>Закупаем крупы, бобовые, сушёные овощи и упаковку. Рассмотрим предложения сельхозпроизводителей и производителей тары.</p>' +
        '<a class="continuation-link" href="/suppliers">Предложить сотрудничество' + ARROW + '</a></article>'));
    }
    var journal = $('.journal-section');
    if (journal) {
      var G = [['g1', '/v2/img/life/soups-group.jpg', 'Супы-пюре Street Lunch'], ['g2', '/v2/img/life/rm-kitchen-1.jpg', 'РисоМишки к завтраку'],
        ['g3', '/v2/img/life/solyanka-forest.jpg', 'Солянка по-уральски'], ['g4', '/v2/img/life/bear-white.jpg', 'РисоМишки в белой глазури'],
        ['g5', '/v2/img/life/gorokh-cup.jpg', 'Гороховый с грибами'], ['g6', '/v2/img/g/box-chicken-1.jpg', 'Street Lunch в коробке'],
        ['g7', '/v2/img/life/bears-strawberry.jpg', 'РисоМишки и ягоды']];
      journal.parentNode.insertBefore(h('<section class="v2 v2-home-section v2-home-gallery" aria-labelledby="v2-gal-title">' +
        '<div class="v2-home-head"><div><span class="continuation-label">Продукция в кадре</span><h2 id="v2-gal-title">Выглядит вкусно<br>на любой полке</h2></div>' +
        '<p>Street Lunch, «По-Уральски» и РисоМишки — такими их видят покупатели в магазинах и на маркетплейсах.</p></div>' +
        '<div class="v2-gallery">' + G.map(function (g) { return '<figure class="' + g[0] + '"><img src="' + g[1] + '" alt="' + esc(g[2]) + '" loading="lazy"><figcaption>' + esc(g[2]) + '</figcaption></figure>'; }).join('') + '</div></section>'), journal);
    }
    // свежие новости из админки — в начало блока «Новости компании», всего остаётся 3 карточки
    var list = $('.journal-list');
    if (list && NEWS.length) {
      var fresh = NEWS.slice(0, 3);
      fresh.slice().reverse().forEach(function (n) {
        list.insertBefore(h('<article class="v2-journal"><a class="journal-story" href="/news/' + esc(n.s) + '"><figure class="journal-cover">' +
          (n.cover ? '<img src="' + esc(n.cover) + '" width="1536" height="1024" loading="lazy" alt="' + esc(n.title) + '">' : '') + '</figure>' +
          '<div class="journal-caption"><h3>' + esc(n.short || n.title) + '</h3><span class="journal-read">Читать новость ' + ARROW + '</span></div></a></article>'), list.firstChild);
      });
      $$(':scope > article', list).forEach(function (a, i) { if (i >= 3) a.style.display = 'none'; });
    }
  }

  /* ---------------- новости ---------------- */

  function fmtDate(d) {
    var t = d ? new Date(d + 'T12:00:00') : null;
    return t && !isNaN(t) ? t.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }
  // Текст новости: пустая строка — новый абзац, «- » в начале строки — пункт списка, **жирный**, ссылки становятся кликабельными
  function richText(src) {
    var inline = function (s) {
      return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    };
    return String(src || '').replace(/\r/g, '').split(/\n\s*\n/).map(function (block) {
      var lines = block.split('\n').filter(function (l) { return l.trim(); });
      if (!lines.length) return '';
      if (lines.every(function (l) { return /^\s*[-•]\s+/.test(l); })) return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }
  function newsCard(n) {
    var date = fmtDate(n.date);
    return '<article class="article-card v2-news-card"><a class="article-cover" href="/news/' + esc(n.s) + '">' +
      (n.cover ? '<img src="' + esc(n.cover) + '" alt="' + esc(n.title) + '" width="1440" height="960" loading="lazy">' : '') + '</a>' +
      '<p class="eyebrow">' + (date ? '<time datetime="' + esc(n.date) + '">' + date + '</time>' : 'Новости компании') + '</p>' +
      '<h3><a href="/news/' + esc(n.s) + '">' + esc(n.short || n.title) + '</a></h3>' +
      '<a class="text-link" href="/news/' + esc(n.s) + '">Читать <span aria-hidden="true">↗︎</span></a></article>';
  }
  function enhanceNewsList() {
    var grid = $('.news-grid');
    if (!grid || !NEWS.length) return;
    NEWS.slice().reverse().forEach(function (n) { grid.insertBefore(h(newsCard(n)), grid.firstChild); });
  }
  function pageNews(n) {
    var date = fmtDate(n.date);
    var gal = (n.gal || []).map(function (src) { return '<figure><img src="' + esc(src) + '" alt="" loading="lazy"></figure>'; }).join('');
    var others = NEWS.filter(function (x) { return x !== n; }).slice(0, 3);
    var el = mount(crumbs([['Главная', '/'], ['Новости', '/news'], [n.title]]) +
      '<div class="page-heading"><h1>' + esc(n.title) + '</h1>' + (date ? '<time class="eyebrow" datetime="' + esc(n.date) + '">' + date + '</time>' : '') + '</div>' +
      '<div class="interior-content"><div class="article-layout' + (n.cover ? '' : ' v2-no-cover') + '">' +
      (n.cover ? '<aside><img class="article-poster" src="' + esc(n.cover) + '" alt="' + esc(n.title) + '"></aside>' : '') +
      '<article class="prose article-body">' + richText(n.body) + (gal ? '<div class="v2 v2-news-gallery">' + gal + '</div>' : '') + '</article></div>' +
      (others.length ? '<section class="v2 v2-block"><header><div><span class="v2-label">Новости компании</span><h2>Читайте также</h2></div><a class="v2-link" href="/news">Все новости ' + ARROW + '</a></header>' +
        '<div class="news-grid">' + others.map(newsCard).join('') + '</div></section>' : '') + '</div>',
      'interior-news interior-detail', null);
    return el;
  }

  /* ---------------- меню и подвал ---------------- */

  function enhanceNav() {
    var nav = $('dialog.brand-menu nav');
    if (nav && !nav.querySelector('.v2-nav')) {
      var last = nav.lastElementChild;
      [['/gde-kupit', 'Где купить'], ['/suppliers', 'Поставщикам']].forEach(function (l, i) {
        var a = last.cloneNode(true); a.classList.add('v2-nav'); a.setAttribute('href', BASE + l[0]);
        var spans = a.querySelectorAll('span'); if (spans[0]) spans[0].textContent = '0' + (nav.children.length + 1); if (spans[1]) spans[1].textContent = l[1];
        nav.appendChild(a);
      });
    }
    var foot = $('footer.contact-section nav');
    if (foot && !foot.querySelector('.v2-nav')) {
      [['/gde-kupit', 'Где купить'], ['/suppliers', 'Поставщикам'], ['/karta-saita', 'Карта сайта']].forEach(function (l) {
        foot.appendChild(h('<a class="v2-nav" href="' + l[0] + '">' + l[1] + '</a>'));
      });
    }
  }

  /* ---------------- новые страницы ---------------- */

  function mount(html, mainClasses, title) {
    var main = $('main'); if (!main) return null;
    if (mainClasses) { main.classList.remove('interior-confidential'); mainClasses.split(' ').forEach(function (c) { main.classList.add(c); }); }
    var el = h('<div class="v2-vp">' + html + '</div>');
    main.insertBefore(el, main.firstChild);
    if (title) document.title = title + ' | Новые продукты';
    return el;
  }
  function heading(title, lead) { return '<div class="page-heading"><h1>' + esc(title) + '</h1>' + (lead ? '<p class="v2-lead">' + lead + '</p>' : '') + '</div>'; }

  function pageProduct(p) {
    var imgs = [p.img].concat(p.gal || []).filter(Boolean);
    var others = ALL.filter(function (x) { return x.g === p.g && x !== p; }).concat(ALL.filter(function (x) { return x.g !== p.g; })).slice(0, 4);
    var fresh = isNew(p), full = p.full || (p.b + ' ' + p.n);
    var cat = p.sections[0] && (SITE.cats.filter(function (c) { return c.s === p.sections[0]; })[0]);
    var el = mount(crumbs([['Главная', '/'], ['Продукция', '/catalog']].concat(cat ? [[cat.t, '/catalog/' + cat.s]] : [], [[p.n]])) +
      '<div class="product-workspace v2"><section class="workspace-gallery" aria-label="Изображения товара" data-brand="' + esc(p.k) + '">' +
      '<div class="v2-gallery-main" data-brand="' + esc(p.k) + '">' + badge(p) + (imgs[0] ? '<img src="' + esc(imgs[0]) + '" alt="' + esc(full) + '">' : '<span class="v2-label">Изображение уточняется</span>') + '</div>' +
      (imgs.length > 1 ? '<div class="v2-thumbs">' + imgs.map(function (src, i) { return '<button type="button" aria-label="Изображение ' + (i + 1) + '" aria-pressed="' + (i === 0) + '" data-src="' + esc(src) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') +
      '</section><section class="workspace-info"><div><p class="eyebrow">' + esc(p.b) + (fresh ? ' · Новинка' : '') + '</p><h1>' + esc(p.n) + '</h1><p class="product-official-name">' + esc(full) + '</p>' +
      '<button class="add-button full" data-v2-ask="' + esc(askFor(p)) + '"><span aria-hidden="true">+</span>Запросить условия поставки</button></div>' +
      '<div class="product-specs">' + buildTabs({ name: full, chars: p.chars.concat(p.chars.some(function (r) { return r[0] === 'Изготовитель'; }) ? [] : [['Изготовитель', MAKER]]), facts: p.facts, sostav: p.sostav, kbju: p.kbju, logi: p.logi }) + '</div></section></div>' +
      (p.dish ? dishBlock(p.dish, p.n, /каш/i.test(p.cat + ' ' + p.n)) : '') +
      (others.length ? '<section class="section related"><div class="section-heading"><h2>Смотрите также</h2><a class="text-link" href="/catalog">Весь каталог ↗︎</a></div>' +
      '<div class="product-grid">' + others.map(siteCard).join('') + '</div></section>' : ''), 'interior-product interior-detail', null);
    if (!el) return;
    wireTabs(el);
    var main = $('.v2-gallery-main img', el);
    $$('.v2-thumbs button', el).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.v2-thumbs button', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        main.src = b.getAttribute('data-src'); main.classList.toggle('photo', b !== $('.v2-thumbs button', el));
      });
    });
  }

  /* ---------------- где купить ---------------- */

  var TYPE_LABEL = { market: 'Маркетплейс', federal: 'Федеральная сеть', chain: 'Региональная сеть', export: 'Экспорт' };
  var HQ = { city: 'Челябинск', lat: 55.1644, lon: 61.4368, text: 'Производство и отдел продаж: г. Челябинск, ул. Лазурная, д. 8' };

  function whereStats() {
    var P = WHERE.partners, cities = {}, stores = 0;
    P.forEach(function (p) {
      (p.points || []).forEach(function (pt) { if (pt.city) cities[pt.city] = 1; stores += +pt.stores || 0; });
      stores += +p.stores || 0;
    });
    return {
      chains: P.filter(function (p) { return p.type === 'federal' || p.type === 'chain'; }).length,
      cities: Object.keys(cities).length, stores: stores,
      markets: P.filter(function (p) { return p.type === 'market'; }).map(function (p) { return p.name; }),
      exports: P.filter(function (p) { return p.type === 'export'; }).map(function (p) { return p.name; })
    };
  }
  function whereSummary() {
    var st = whereStats(), parts = [st.chains + ' ' + plural(st.chains, ['торговая сеть', 'торговые сети', 'торговых сетей'])];
    if (st.cities) parts.push(st.cities + ' ' + plural(st.cities, ['город', 'города', 'городов']) + ' на карте');
    if (st.stores) parts.push('более ' + Math.floor(st.stores / 10) * 10 + ' магазинов');
    var tail = [];
    if (st.markets.length) tail.push((st.markets.length > 1 ? 'маркетплейсы ' : 'маркетплейс ') + st.markets.join(', '));
    if (st.exports.length) tail.push('поставки: ' + st.exports.join(', '));
    return parts.join(', ') + (tail.length ? ', а также ' + tail.join('; ') : '') + '.';
  }
  function whereTeaser(home) {
    var P = WHERE.partners;
    var photos = P.filter(function (p) { return p.photos && p.photos.length; }).slice(0, 4);
    return '<section class="v2 ' + (home ? 'v2-home-section' : 'v2-block') + ' v2-where-teaser" aria-labelledby="v2-where-title">' +
      '<div class="v2-home-head"><div><span class="' + (home ? 'continuation-label' : 'v2-label') + '">Где купить</span><h2 id="v2-where-title">Нас легко найти<br>на полке</h2></div>' +
      '<div><p>' + esc(whereSummary()) + '</p><p><a class="v2-link" href="/gde-kupit">Карта магазинов ' + ARROW + '</a></p></div></div>' +
      '<div class="v2-chips">' + P.map(function (p) { return '<a class="v2-chip" href="/gde-kupit#' + esc(p.id) + '">' + esc(p.name) + '</a>'; }).join('') + '</div>' +
      (photos.length ? '<div class="v2-where-photos">' + photos.map(function (p) {
        return '<a href="/gde-kupit#' + esc(p.id) + '"><figure><img src="' + esc(p.photos[0]) + '" alt="Продукция на полке: ' + esc(p.name) + '" loading="lazy"><figcaption>' + esc(p.name) + '</figcaption></figure></a>';
      }).join('') + '</div>' : '') + '</section>';
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    // ждём и стили, и скрипт: без стилей Leaflet неверно считает размер карты и масштаб
    function load(tag, attrs) {
      return new Promise(function (res, rej) {
        var el = document.createElement(tag); Object.keys(attrs).forEach(function (k) { el[k] = attrs[k]; });
        el.onload = res; el.onerror = rej; document.head.appendChild(el);
      });
    }
    var base = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
    return Promise.race([
      Promise.all([load('link', { rel: 'stylesheet', href: base + 'leaflet.min.css' }), load('script', { src: base + 'leaflet.min.js' })]).then(function () { return window.L; }),
      new Promise(function (res, rej) { setTimeout(function () { rej(new Error('timeout')); }, 12000); })
    ]);
  }
  function cityIndex() {
    var map = {};
    WHERE.partners.forEach(function (p) {
      (p.points || []).forEach(function (pt) {
        if (!pt.city || isNaN(+pt.lat) || isNaN(+pt.lon)) return;
        var c = map[pt.city] || (map[pt.city] = { city: pt.city, lat: +pt.lat, lon: +pt.lon, items: [] });
        c.items.push({ p: p, pt: pt });
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.items.length - a.items.length || a.city.localeCompare(b.city); });
  }
  function cityPopup(c) {
    return '<div class="v2-pop"><b>' + esc(c.city) + '</b><ul>' + c.items.map(function (it) {
      return '<li><strong>' + esc(it.p.name) + '</strong>' + (it.pt.stores ? ' · ' + it.pt.stores + ' ' + plural(+it.pt.stores, ['магазин', 'магазина', 'магазинов']) : '') +
        (it.pt.label && it.pt.label !== c.city ? '<br><span>' + esc(it.pt.label) + '</span>' : '') + (it.pt.note ? '<br><small>' + esc(it.pt.note) + '</small>' : '') + '</li>';
    }).join('') + '</ul></div>';
  }

  function pageWhere() {
    var P = WHERE.partners, st = whereStats(), cities = cityIndex();
    var online = P.filter(function (p) { return p.type === 'market'; });
    var chains = P.filter(function (p) { return p.type === 'federal' || p.type === 'chain'; });
    var exp = P.filter(function (p) { return p.type === 'export'; });
    function card(p) {
      var pts = (p.points || []).filter(function (x) { return x.city; });
      var stores = (+p.stores || 0) + pts.reduce(function (s, x) { return s + (+x.stores || 0); }, 0);
      return '<article class="v2-partner" id="' + esc(p.id) + '" data-partner="' + esc(p.id) + '">' +
        (p.photos && p.photos.length ? '<figure class="v2-partner-photo"><img src="' + esc(p.photos[0]) + '" alt="Продукция на полке: ' + esc(p.name) + '" loading="lazy">' + (p.photos.length > 1 ? '<span>+' + (p.photos.length - 1) + ' фото</span>' : '') + '</figure>' : '') +
        '<div class="v2-partner-body"><span class="v2-label">' + esc(TYPE_LABEL[p.type] || '') + '</span><h3>' + esc(p.name) + '</h3>' +
        (p.text ? '<p>' + esc(p.text) + '</p>' : '') +
        '<dl>' + (p.region ? '<div><dt>Регион</dt><dd>' + esc(p.region) + '</dd></div>' : '') +
        (pts.length ? '<div><dt>' + plural(pts.length, ['Город', 'Города', 'Города']) + '</dt><dd>' + pts.map(function (x) { return esc(x.label || x.city); }).join(', ') + '</dd></div>' : '') +
        (stores ? '<div><dt>Магазинов</dt><dd>' + stores + '</dd></div>' : '') +
        ((p.brands || []).length ? '<div><dt>Бренды</dt><dd>' + p.brands.map(esc).join(', ') + '</dd></div>' : '') + '</dl>' +
        '<div class="v2-partner-act">' + (pts.length ? '<button type="button" class="v2-link" data-show="' + esc(p.id) + '">Показать на карте ' + ARROW + '</button>' : '') +
        (p.url ? '<a class="v2-btn' + (p.type === 'market' ? '' : ' ghost') + '" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.button || (p.type === 'market' ? 'Купить на ' + p.name : 'Сайт сети')) + '</a>' : '') + '</div></div></article>';
    }
    var photos = []; P.forEach(function (p) { (p.photos || []).forEach(function (src) { photos.push([src, p.name]); }); });
    var withPts = P.filter(function (p) { return (p.points || []).some(function (x) { return x.city; }); });
    var el = mount(crumbs([['Главная', '/'], ['Где купить']]) +
      '<div class="v2 v2-page v2-where">' + heading('Где купить', 'Продукция «Новых продуктов» продаётся в федеральных и региональных торговых сетях и на маркетплейсах. ' + esc(whereSummary())) +
      '<div class="v2-where-stats">' +
      '<div><b>' + st.chains + '</b><span>' + plural(st.chains, ['торговая сеть', 'торговые сети', 'торговых сетей']) + '</span></div>' +
      '<div><b>' + st.cities + '</b><span>' + plural(st.cities, ['город', 'города', 'городов']) + ' на карте</span></div>' +
      (st.stores ? '<div><b>' + Math.floor(st.stores / 10) * 10 + '+</b><span>магазинов в сетях-партнёрах</span></div>' : '') +
      (online.length ? '<div><b>' + esc(online.map(function (p) { return p.name; }).join(', ')) + '</b><span>доставка по всей России</span></div>' : '') + '</div>' +
      '<section class="v2-where-mapblock" aria-label="Карта представленности">' +
      '<div class="v2-chips" role="group" aria-label="Фильтр по сети"><button type="button" class="v2-chip on" data-filter="">Все сети</button>' +
      withPts.map(function (p) { return '<button type="button" class="v2-chip" data-filter="' + esc(p.id) + '">' + esc(p.name) + '</button>'; }).join('') + '</div>' +
      '<div class="v2-where-grid"><div class="v2-map" id="v2-map" data-lenis-prevent><div class="v2-map-msg">Загружаю карту…</div></div>' +
      '<div class="v2-citylist" data-lenis-prevent><h3>Города</h3><ul>' + cities.map(function (c, i) {
        return '<li><button type="button" data-city="' + i + '"><b>' + esc(c.city) + '</b><span>' + esc(c.items.map(function (it) { return it.p.name; }).join(', ')) + '</span></button></li>';
      }).join('') + '<li class="hq"><button type="button" data-city="hq"><b>Челябинск · производство</b><span>' + esc(HQ.text.replace(/^Производство и отдел продаж: /, '')) + '</span></button></li></ul></div></div></section>' +
      (online.length ? '<section class="v2-block"><header><div><span class="v2-label">Онлайн</span><h2>Маркетплейсы</h2></div><p>Закажите продукцию с доставкой домой или в пункт выдачи.</p></header><div class="v2-partners">' + online.map(card).join('') + '</div></section>' : '') +
      '<section class="v2-block"><header><div><span class="v2-label">Офлайн</span><h2>Торговые сети и магазины</h2></div><p>Ассортимент в конкретном магазине может отличаться — уточняйте наличие в сети.</p></header><div class="v2-partners">' + chains.map(card).join('') + '</div></section>' +
      (exp.length ? '<section class="v2-block"><header><div><span class="v2-label">Экспорт</span><h2>За пределами России</h2></div></header><div class="v2-partners">' + exp.map(card).join('') + '</div></section>' : '') +
      (photos.length ? '<section class="v2-block"><header><div><span class="v2-label">Фото из магазинов</span><h2>Мы на полках</h2></div></header><div class="v2-shelf">' +
        photos.map(function (x) { return '<figure><img src="' + esc(x[0]) + '" alt="Продукция на полке: ' + esc(x[1]) + '" loading="lazy"><figcaption>' + esc(x[1]) + '</figcaption></figure>'; }).join('') + '</div></section>' : '') +
      '<div class="v2-cta"><div><h2>Хотите продавать нашу продукцию?</h2><p>Расскажите о своей сети или магазине — подберём ассортимент, пришлём прайс и условия поставки.</p></div>' +
      '<div class="v2-cta-actions"><button class="v2-btn" data-v2-ask="Хотим продавать продукцию «Новых продуктов». Сеть/магазин: … Город: … Интересует ассортимент: …">Стать партнёром</button><a href="tel:+79043054275">+7 904 305 42 75</a></div></div></div>',
      '', 'Где купить');
    if (!el) return;

    var mapEl = $('#v2-map', el), markers = [], map = null, hqMarker = null;
    function setFilter(id) {
      $$('[data-filter]', el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-filter') === id); });
      $$('.v2-partner', el).forEach(function (c) { c.classList.toggle('dim', !!id && c.getAttribute('data-partner') !== id); });
      if (!map) return;
      var shown = [];
      markers.forEach(function (m) {
        var on = !id || m.city.items.some(function (it) { return it.p.id === id; });
        if (on) { m.marker.addTo(map); shown.push([m.city.lat, m.city.lon]); } else m.marker.remove();
      });
      if (shown.length) map.fitBounds(shown, { padding: [40, 40], maxZoom: 8 });
    }
    el.addEventListener('click', function (e) {
      var f = e.target.closest('[data-filter]'); if (f) return setFilter(f.getAttribute('data-filter'));
      var s = e.target.closest('[data-show]');
      if (s) { setFilter(s.getAttribute('data-show')); $('.v2-where-mapblock', el).scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      var c = e.target.closest('[data-city]');
      if (c && map) {
        var k = c.getAttribute('data-city');
        if (k === 'hq') { map.flyTo([HQ.lat, HQ.lon], 9); hqMarker.openPopup(); return; }
        var m = markers[+k]; if (!m) return; setFilter(''); map.flyTo([m.city.lat, m.city.lon], 8); m.marker.openPopup();
      }
    });
    loadLeaflet().then(function (L) {
      mapEl.innerHTML = '';
      map = L.map(mapEl, { scrollWheelZoom: false, zoomSnap: 0.5, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, className: 'v2-tiles', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      map.on('click focus', function () { map.scrollWheelZoom.enable(); });
      map.on('mouseout blur', function () { map.scrollWheelZoom.disable(); });
      cities.forEach(function (c) {
        var icon = L.divIcon({ className: 'v2-pin', html: '<span>' + c.items.length + '</span>', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] });
        markers.push({ city: c, marker: L.marker([c.lat, c.lon], { icon: icon, title: c.city, alt: c.city }).bindPopup(cityPopup(c)).addTo(map) });
      });
      hqMarker = L.marker([HQ.lat, HQ.lon], { icon: L.divIcon({ className: 'v2-pin hq', html: '<span>★</span>', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -18] }), title: 'Производство', zIndexOffset: 500 })
        .bindPopup('<div class="v2-pop"><b>«Новые продукты»</b><ul><li>' + esc(HQ.text) + '</li></ul></div>').addTo(map);
      var pts = cities.map(function (c) { return [c.lat, c.lon]; }).concat([[HQ.lat, HQ.lon]]);
      map.fitBounds(pts, { padding: [30, 30], maxZoom: 6 });
      // карта могла создаться, пока страница ещё не получила ширину (скрытая вкладка, анимация) —
      // при любом изменении размера пересчитываем её и, пока посетитель сам не двигал карту, показываем все точки
      var touched = false;
      ['mousedown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) { mapEl.addEventListener(ev, function () { touched = true; }, { passive: true }); });
      el.addEventListener('click', function (e) { if (e.target.closest('[data-filter],[data-show],[data-city]')) touched = true; });
      if (window.ResizeObserver) new ResizeObserver(function () {
        if (!mapEl.clientWidth) return;
        map.invalidateSize();
        if (!touched) map.fitBounds(pts, { padding: [30, 30], maxZoom: 6 });
      }).observe(mapEl);
      var hash = decodeURIComponent(location.hash.slice(1));
      if (hash && WHERE.partners.some(function (p) { return p.id === hash; })) {
        if ($('[data-filter="' + hash + '"]', el)) setFilter(hash);
        var card = document.getElementById(hash); if (card) setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.classList.add('flash'); }, 300);
      }
    }).catch(function () {
      mapEl.innerHTML = '<div class="v2-map-msg">Карта недоступна без подключения к интернету. Список городов — справа.</div>';
    });
  }

  var ICON = {
    grain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21V9M12 9c-3 0-4-3-4-5 2 0 4 1 4 5zM12 9c3 0 4-3 4-5-2 0-4 1-4 5zM12 14c-3 0-4-3-4-5 2 0 4 1 4 5zM12 14c3 0 4-3 4-5-2 0-4 1-4 5z"/></svg>',
    bean: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="12" r="3"/><circle cx="14" cy="9" r="3"/><circle cx="15" cy="16" r="3"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14zM5 19l7-7"/></svg>',
    nut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3c4 0 7 4 7 9s-3 9-7 9-7-4-7-9 3-9 7-9zM12 3v18M7 8c3 1 7 1 10 0M7 16c3-1 7-1 10 0"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12l5 5L20 6"/></svg>'
  };

  function pageSuppliers() {
    var brands = {}; SITE.products.concat(NEW).forEach(function (p) { if (p.b) brands[p.b.toLowerCase().replace(/[\s-]+/g, '')] = 1; });
    var supply = [
      ['grain', 'Крупы и зерно', 'Основа хлебцев, воздушных круп и батончиков.', ['Рис и бурый рис', 'Гречка', 'Зелёная гречка', 'Пшеница', 'Полба', 'Ячмень']],
      ['bean', 'Бобовые', 'Из них готовим супы-пюре и каши Street Lunch.', ['Горох', 'Чечевица', 'Нут']],
      ['leaf', 'Сушёные овощи и грибы', 'Для супов, каш и линейки «По-Уральски».', ['Морковь', 'Лук', 'Чеснок', 'Укроп', 'Белые грибы', 'Картофельные хлопья']],
      ['nut', 'Орехи, семена, сухофрукты', 'Добавки в батончики и сухие завтраки.', ['Кунжут', 'Семечки подсолнечника и тыквы', 'Арахис', 'Грецкий орех', 'Курага', 'Изюм', 'Цукаты', 'Кокосовая стружка']],
      ['drop', 'Масла, глазури, вкусовые компоненты', 'Для РисоМишки, ШокОреха и супов.', ['Масло подсолнечное', 'Шоколадная глазурь', 'Фруктовая глазурь', 'Специи', 'Натуральные ароматизаторы']],
      ['box', 'Упаковка', 'Для всех форматов — от порционного пакетика до шоу-бокса.', ['Стаканы', 'Коробки', 'Порционные пакеты', 'Флоу-пак', 'Шоу-боксы', 'Гофротара']]
    ];
    var req = ['Декларации или сертификаты соответствия ТР ТС, протоколы испытаний и спецификации на продукцию.',
      'Стабильное качество от партии к партии и прослеживаемость сырья.',
      'Образцы для лабораторной проверки и пробной выработки на нашем производстве.',
      'Соблюдение согласованных сроков и объёмов поставки.',
      'Готовность обсудить доставку до производства в Челябинске.',
      'Прозрачные условия оплаты, закреплённые договором.'];
    var steps = [['Предложение', 'Опишите продукцию, объёмы, цены и условия доставки.'], ['Образцы', 'Согласуем и проверим образцы в лаборатории.'], ['Пробная партия', 'Проведём тестовую выработку на нашем производстве.'], ['Договор', 'Зафиксируем спецификацию, график и условия поставок.']];
    var askText = 'Предложение от поставщика. Компания: … Продукция (сырьё/упаковка): … Объёмы и цены: …';
    mount(crumbs([['Главная', '/'], ['Поставщикам']]) +
      '<div class="v2 v2-page">' + heading('Поставщикам', 'Производим супы-пюре, каши, хлебцы, зерновые батончики и десерты из воздушного риса — и постоянно ищем надёжных поставщиков сырья и упаковки.') +
      '<div class="v2-hero"><div class="v2-hero-copy"><div><span class="v2-label">Сырьё и упаковка</span><h2>Растём вместе<br>с партнёрами</h2></div>' +
      '<p>С 2003 года работаем с сырьём отечественных сельхозпроизводителей. Рассматриваем предложения фермерских хозяйств, переработчиков и производителей упаковки.</p>' +
      '<div class="v2-stats"><div><b>2003</b><span>год основания</span></div><div><b>' + (SITE.products.length + NEW.length) + '</b><span>позиций в ассортименте</span></div><div><b>' + Object.keys(brands).length + '</b><span>торговых марок</span></div></div>' +
      '<button class="v2-btn" data-v2-ask="' + esc(askText) + '">Предложить сотрудничество ' + ARROW + '</button></div>' +
      '<div class="v2-hero-media"><img src="/v2/img/life/soups-group.jpg" alt="Супы-пюре Street Lunch"></div></div>' +
      '<section class="v2-block"><header><div><span class="v2-label">Что мы закупаем</span><h2>Сырьё для наших продуктов</h2></div><p>Список составлен по рецептурам продукции, которая выпускается сейчас.</p></header>' +
      '<div class="v2-supply">' + supply.map(function (s) { return '<article><span class="ico">' + ICON[s[0]] + '</span><h3>' + s[1] + '</h3><p>' + s[2] + '</p><ul class="v2-chips">' + s[3].map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></article>'; }).join('') + '</div></section>' +
      '<section class="v2-block"><header><div><span class="v2-label">Требования</span><h2>Что для нас важно</h2></div>' +
      '<div class="v2-grain" style="display:flex;gap:10px">' + [1, 2, 3].map(function (i) { return '<img src="/v2/img/life/grain-' + i + '.jpg" alt="" loading="lazy" style="width:72px;height:90px;object-fit:cover;border-radius:10px">'; }).join('') + '</div></header>' +
      '<div class="v2-req">' + req.map(function (r) { return '<div>' + ICON.check + '<span>' + r + '</span></div>'; }).join('') + '</div></section>' +
      '<section class="v2-block"><header><div><span class="v2-label">Как начать</span><h2>Четыре шага к поставкам</h2></div></header>' +
      '<ol class="v2-steps" style="padding:0;margin:0">' + steps.map(function (s) { return '<li><h3>' + s[0] + '</h3><p>' + s[1] + '</p></li>'; }).join('') + '</ol></section>' +
      '<div class="v2-cta"><div><h2>Есть что предложить?</h2><p>Отправьте предложение через форму или напишите на <a href="mailto:info@newprod.ru">info@newprod.ru</a> — передадим его специалистам.</p></div>' +
      '<div class="v2-cta-actions"><button class="v2-btn" data-v2-ask="' + esc(askText) + '">Отправить предложение</button><a href="tel:+79043054275">+7 904 305 42 75</a></div></div></div>',
      '', 'Поставщикам');
  }

  function pageSitemap() {
    function li(href, text, cls, badge) { return '<li' + (cls ? ' class="' + cls + '"' : '') + '><a href="' + href + '">' + esc(text) + (badge ? ' <span class="v2-badge">new</span>' : '') + '</a></li>'; }
    var company = li('/', 'Главная') + li('/about', 'О компании') + li('/news', 'Новости') +
      NEWS.map(function (n) { return li('/news/' + n.s, n.title, 'sub', true); }).join('') +
      SITE.news.map(function (n) { return li('/news/' + n.s, n.t, 'sub'); }).join('') + li('/contacts', 'Контакты') + li('/confidential', 'Политика конфиденциальности');
    var coop = li('/private-label', 'Частная марка') + li('/suppliers', 'Поставщикам', '', true) + li('/gde-kupit', 'Где купить', '', true);
    var cats = SITE.cats.map(function (c) {
      var items = SITE.products.filter(function (p) { return p.c === c.s; });
      return '<section><h2><a href="/catalog/' + c.s + '" style="color:inherit;text-decoration:none">' + esc(c.t) + '</a></h2><ul>' +
        items.map(function (p) { return li('/product/' + p.s, p.n.replace(/^"|"$/g, '')); }).join('') +
        ALL.filter(function (p) { return !isNew(p) && p.sections.indexOf(c.s) > -1; }).map(function (p) { return li(productUrl(p), p.n); }).join('') + '</ul></section>';
    }).join('');
    var novelties = ALL.length ? '<section><h2><a href="/catalog" style="color:inherit;text-decoration:none">Новые позиции</a></h2><ul>' +
      ALL.map(function (p) { return li(productUrl(p), p.b + ' · ' + p.n); }).join('') + '</ul></section>' : '';
    mount(crumbs([['Главная', '/'], ['Карта сайта']]) +
      '<div class="v2 v2-page">' + heading('Карта сайта', 'Все разделы, категории и товары на одной странице.') +
      '<div class="v2-sitemap"><section><h2>Компания</h2><ul>' + company + '</ul></section><section><h2>Сотрудничество</h2><ul>' + coop + '</ul>' +
      '<h2 style="margin-top:32px"><a href="/catalog" style="color:inherit;text-decoration:none">Продукция</a></h2><ul>' + li('/catalog', 'Каталог продукции') +
      SITE.cats.map(function (c) { return li('/catalog/' + c.s, c.t, 'sub'); }).join('') + '</ul></section>' + novelties + cats + '</div></div>',
      '', 'Карта сайта');
  }

  function page404() {
    var pick = NEW.filter(function (p, i) { return i % 3 === 0; }).slice(0, 5);
    mount('<div class="v2 v2-page"><div class="v2-404"><div class="v2-404-num" aria-hidden="true">4<span>0</span>4</div>' +
      '<div><span class="eyebrow">Ошибка 404</span><h1>Такой страницы нет</h1><p>Возможно, ссылка устарела или в адресе опечатка. Загляните в каталог или на карту сайта — там всё на месте.</p>' +
      '<div class="v2-404-links"><a class="v2-btn" href="/">На главную</a><a class="v2-btn ghost" href="/catalog">В каталог</a><a class="v2-btn ghost" href="/karta-saita">Карта сайта</a></div></div></div>' +
      (pick.length ? '<section class="v2-block"><header><div><span class="v2-label">Пока вы здесь</span><h2>Новое в каталоге</h2></div><a class="v2-link" href="/catalog">Весь каталог ' + ARROW + '</a></header>' +
      '<div class="v2-rail" data-lenis-prevent>' + pick.map(v2Card).join('') + '</div></section>' : '') +
      (WHERE.partners.length ? whereTeaser(false) : '') + '</div>', '', 'Страница не найдена');
  }

  /* ---------------- маршрутизация ---------------- */

  function run() {
    var path = location.pathname.slice(BASE.length).replace(/\/+$/, '') || '/';
    var vp = ($('meta[name=v2-page]') || {}).content;
    enhanceNav();
    if (vp === '404') return page404();
    if (vp === 'where') return pageWhere();
    if (vp === 'suppliers') return pageSuppliers();
    if (vp === 'sitemap') return pageSitemap();
    var m = path.match(/^\/product\/([^/]+)$/);
    if (vp === 'product') return m && NEW_BY_SLUG[m[1]] ? pageProduct(NEW_BY_SLUG[m[1]]) : page404();
    var nm = path.match(/^\/news\/([^/]+)$/);
    if (vp === 'news') return nm && NEWS_BY_SLUG[nm[1]] ? pageNews(NEWS_BY_SLUG[nm[1]]) : page404();
    if (path === '/') return enhanceHome();
    if (path === '/news') return enhanceNewsList();
    if (m) return enhanceProduct(m[1]);
    if (/^\/catalog(\/|$)/.test(path)) return enhanceCatalog(path);
  }

  window.V2 = { ask: ask, data: function () { return { groups: GROUPS, products: ALL, news: NEWS }; }, defaults: { groups: GROUPS, products: NEW } };
  applyData(null, null);
  var dataReady = Promise.all([loadJSON(BASE + '/v2/data/catalog.json'), loadJSON(BASE + '/v2/data/news.json'), loadJSON(BASE + '/v2/data/where.json')])
    .then(function (r) { applyData(r[0], r[1]); if (r[2] && Array.isArray(r[2].partners)) WHERE = { partners: r[2].partners.filter(function (p) { return p && p.id && !p.hidden; }) }; });
  whenHydrated(function () {
    dataReady.then(function () {
      try { run(); } catch (e) { if (window.console) console.error('[v2]', e); }
      document.documentElement.classList.add('v2-ready');
    });
  });
})();

/* ==========================================================================
   «Новые продукты» — поведение сайта (vanilla JS, без зависимостей).
   Каталог/карточки/бренды рендерятся из window.NP (data.js).
   Заявка «Сотрудничество» хранится в localStorage и отправляется через mailto
   на info@newprod.ru (серверной отправки нет — решение команды).
   ========================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var NP = window.NP;
  var LANG = (document.documentElement.lang || "ru").slice(0, 2);
  var EN = LANG === "en";
  var ROOT = document.documentElement.getAttribute("data-root") || "";
  var PAGE = document.body.getAttribute("data-page") || "";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Строки интерфейса ---------- */
  var T = {
    ru: {
      add: "Добавить в запрос", added: "В запросе — убрать", addedToast: "Добавлено в запрос", removedToast: "Убрано из запроса",
      open: "Открыть", photoSoon: "Фото готовится", products: ["продукт", "продукта", "продуктов"], positions: ["позиция", "позиции", "позиций"],
      any: "Любой", all: "Все", empty: "Список пуст. Можно отправить заявку без выбора продукции — опишите задачу в комментарии.",
      remove: "Убрать", format: "Формат", weight: "Масса нетто", storage: "Хранение", maker: "Изготовитель", ean: "Штрихкод",
      perServing: "на 100 г продукта", protein: "Белки", fat: "Жиры", carbs: "Углеводы", kcal: "ккал",
      tabs: ["Описание", "Состав", "Пищевая ценность", "Хранение и логистика"], prep: "Как приготовить", portion: "Порция",
      notFound: "Такой позиции нет в каталоге", notFoundText: "Возможно, ссылка устарела. Посмотрите весь ассортимент.", toCatalog: "Перейти в каталог",
      nothing: "Ничего не нашли", nothingText: "Попробуйте другой формат или сбросьте фильтры.", reset: "Сбросить фильтры",
      buyOnline: "Купить онлайн", whereBuy: "Где купить", specOnRequest: "Кратность и паллетизация — по запросу. Добавьте позицию в запрос, и отдел продаж пришлёт спецификацию.",
      tbd: "уточнить", related: "Ещё из линейки", copy: "Скопировать текст заявки", copied: "Текст скопирован",
      mailOpened: "Открываем почтовую программу. Если окно не появилось, скопируйте текст заявки и отправьте его на ", clear: "Очистить запрос",
      required: "Заполните это поле", contactErr: "Укажите телефон (от 10 цифр) или e-mail", consentErr: "Нужно согласие на обработку данных", whoErr: "Выберите, кто вы",
      formErr: "Проверьте выделенные поля.", mapError: "Карта не загрузилась. Список городов — рядом, он работает без карты.",
      subject: "Заявка с сайта", nutriNone: "Пищевая ценность для этой позиции уточняется."
    },
    en: {
      add: "Add to request", added: "In request — remove", addedToast: "Added to your request", removedToast: "Removed from request",
      open: "Open", photoSoon: "Photo coming soon", products: ["product", "products", "products"], positions: ["SKU", "SKUs", "SKUs"],
      any: "Any", all: "All", empty: "Your list is empty. You can still send a request — describe what you need in the comment.",
      remove: "Remove", format: "Pack", weight: "Net weight", storage: "Storage", maker: "Manufacturer", ean: "Barcode",
      perServing: "per 100 g of product", protein: "Protein", fat: "Fat", carbs: "Carbs", kcal: "kcal",
      tabs: ["Overview", "Ingredients", "Nutrition", "Storage & logistics"], prep: "Preparation", portion: "Serving",
      notFound: "This item is not in the catalogue", notFoundText: "The link may be outdated. Browse the full range.", toCatalog: "Go to products",
      nothing: "Nothing found", nothingText: "Try another pack or reset the filters.", reset: "Reset filters",
      buyOnline: "Buy online", whereBuy: "Where to buy", specOnRequest: "Case and pallet data on request — add the item to your request and our team will send the specification.",
      tbd: "to be confirmed", related: "More from this range", copy: "Copy request text", copied: "Text copied",
      mailOpened: "Opening your e-mail app. If nothing happens, copy the request text and send it to ", clear: "Clear request",
      required: "Please fill in this field", contactErr: "Enter a phone number (10+ digits) or e-mail", consentErr: "Consent is required", whoErr: "Please choose who you are",
      formErr: "Please check the highlighted fields.", mapError: "The map failed to load.", subject: "Website request", nutriNone: "Nutrition data to be confirmed."
    }
  }[LANG];

  /* ---------- Утилиты ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  /* Значение или пометка «уточнить» */
  function val(v) { if (v && typeof v === "object" && v.tbd) return '<mark class="tbd">' + T.tbd + ": " + esc(v.tbd) + "</mark>"; return esc(v); }
  function plain(v) { if (v && typeof v === "object" && v.tbd) return "[" + T.tbd + ": " + v.tbd + "]"; return v == null ? "" : String(v); }
  function plural(n, f) { if (EN) return n === 1 ? f[0] : f[1]; var a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return f[2]; if (b > 1 && b < 5) return f[1]; if (b === 1) return f[0]; return f[2]; }
  function img(p) { return ROOT + "assets/img/" + p; }
  function url(p) { return ROOT + (EN && !/^(en\/|\.\.)/.test(p) ? "en/" : "") + p; }
  function norm(s) { return String(s || "").toLowerCase().replace(/ё/g, "е"); }
  function qsParam(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function brandName(id) { var b = NP.BRANDS[id]; return b ? (EN && b.en ? b.en : b.name) : ""; }
  function pName(p) { return EN && p.nameEn ? p.nameEn : p.name; }
  function fmtName(f) { var x = NP.FORMATS[f]; return x ? (EN ? x.en : x.ru) : f; }
  function fmtShort(f) { var x = NP.FORMATS[f]; return x ? (EN ? x.en : x.short) : f; }
  function catName(id) { var c = NP.CATEGORIES.filter(function (x) { return x.id === id; })[0]; return c ? (EN ? c.en : c.ru) : ""; }
  function findProduct(id) { return NP.PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  function fmtOf(p, f) { return p.formats.filter(function (x) { return x.f === f; })[0] || p.formats[0]; }
  function weightOf(fo) { return EN && fo.weightEn ? fo.weightEn : fo.weight; }

  /* Короткие факты о продукте для английской версии */
  var FACT_EN = { "Без варки": "No cooking", "3 минуты": "3 minutes", "17% белка": "17% protein", "Золото «Агро-2025»": "Gold, Agro-2025", "Серебро «Агро-2025»": "Silver, Agro-2025",
    "Чечевица и горох": "Lentils & peas", "Без мясных ароматизаторов": "No meat flavourings", "5 вкусов": "5 flavours", "С оливками": "With olives", "6 порций": "6 servings",
    "Воздушный рис": "Puffed rice", "Без глютена": "Gluten-free", "Фигурки-медвежата": "Teddy-bear shapes", "Фруктовая глазурь": "Fruit glaze", "Без лактозы": "Lactose-free",
    "Без дрожжей": "Yeast-free", "Без масла": "No oil", "С фруктозой": "With fructose", "Воздушные крупы": "Puffed grains", "Клетчатка 2,3 г": "Fibre 2.3 g",
    "Грецкий орех": "Walnut", "Клетчатка 3 г": "Fibre 3 g", "Семечки": "Seeds", "Клетчатка 3,7 г": "Fibre 3.7 g", "Без добавок": "No additives", "Фасовка в разработке": "Pack in development", "Корица": "Cinnamon" };
  function factText(f) { return EN && FACT_EN[f] ? FACT_EN[f] : f; }
  /* ---------- Иконки (SVG-кодом) ---------- */
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 19c9 1 14-5 14-14C10 5 4 10 5 19z"/><path d="M5 19 14 10"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>',
    empty: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="28" cy="28" r="16"/><path d="m40 40 14 14M22 28h12"/></svg>'
  };

  /* Аккуратные SVG-заглушки для позиций без фото (дой-пак, B&B, ПЭТ без этикетки, ассорти) */
  function placeholder(kind, label) {
    var cap = esc(label || T.photoSoon);
    var shapes = {
      doy: '<path d="M70 40h100l8 18v150a14 14 0 0 1-14 14H76a14 14 0 0 1-14-14V58z" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><path d="M70 58h108" stroke="#1c5e35" stroke-width="2" stroke-dasharray="6 6"/><rect x="82" y="92" width="84" height="50" rx="8" fill="#e58a2e" opacity=".9"/><text x="124" y="122" text-anchor="middle" font-family="Sofia Sans Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="22" fill="#1d1b16">' + (EN ? "DOYPACK" : "ДОЙ-ПАК") + '</text>',
      box: '<path d="M64 52l60-20 60 20v140l-60 22-60-22z" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><path d="M64 52l60 20 60-20M124 72v142" stroke="#1c5e35" stroke-width="2"/><rect x="76" y="100" width="40" height="26" rx="4" fill="#e58a2e"/>',
      showbox: '<path d="M44 96h160v104H44z" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><path d="M44 96l20-40h120l20 40" fill="none" stroke="#1c5e35" stroke-width="3"/><g fill="#e58a2e"><rect x="64" y="64" width="26" height="50" rx="3"/><rect x="96" y="64" width="26" height="50" rx="3" opacity=".8"/><rect x="128" y="64" width="26" height="50" rx="3" opacity=".65"/><rect x="160" y="64" width="22" height="50" rx="3" opacity=".5"/></g>',
      pet: '<rect x="78" y="40" width="92" height="18" rx="5" fill="#1c5e35"/><rect x="70" y="58" width="108" height="150" rx="16" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><g fill="#dcd0b6">' + dots() + '</g>',
      "pet-flour": '<rect x="78" y="40" width="92" height="18" rx="5" fill="#1c5e35"/><rect x="70" y="58" width="108" height="150" rx="16" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><path d="M72 120c30-10 70 8 104-4v88a14 14 0 0 1-14 14H86a14 14 0 0 1-14-14z" fill="#ece3cf"/>',
      bb: '<path d="M70 46h108l-6 160H76z" fill="#fbf8f1" stroke="#1c5e35" stroke-width="3"/><path d="M70 46c18 12 90 12 108 0" fill="none" stroke="#1c5e35" stroke-width="2"/><text x="124" y="136" text-anchor="middle" font-family="Sofia Sans Extra Condensed,Arial Narrow,sans-serif" font-weight="900" font-size="40" fill="#1c5e35">B&amp;B</text>'
    };
    function dots() { var s = "", i, j; for (i = 0; i < 9; i++) for (j = 0; j < 6; j++) s += '<circle cx="' + (84 + j * 16 + (i % 2) * 8) + '" cy="' + (84 + i * 14) + '" r="5"/>'; return s; }
    return '<div class="ph" role="img" aria-label="' + cap + '"><svg viewBox="0 0 248 248" aria-hidden="true">' +
      '<circle cx="124" cy="124" r="118" fill="#eef5e9"/>' + (shapes[kind] || shapes.box) +
      '<text x="124" y="236" text-anchor="middle" font-family="Onest,Segoe UI,sans-serif" font-size="13" fill="#57524a">' + cap + "</text></svg></div>";
  }
  function picture(path, alt, cls, eager) {
    if (!path) return placeholder("box");
    if (path.indexOf("ph:") === 0) return placeholder(path.slice(3));
    return '<img src="' + img(path) + '" alt="' + esc(alt || "") + '"' + (cls ? ' class="' + cls + '"' : "") + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }

  /* ---------- Тосты ---------- */
  var toastRegion = null;
  function toast(msg, action) {
    if (!toastRegion) { toastRegion = document.createElement("div"); toastRegion.className = "toast-region"; toastRegion.setAttribute("role", "status"); toastRegion.setAttribute("aria-live", "polite"); document.body.appendChild(toastRegion); }
    var t = document.createElement("div"); t.className = "toast";
    t.innerHTML = '<span>' + esc(msg) + "</span>" + (action ? '<button type="button">' + esc(action.label) + "</button>" : "");
    if (action) $("button", t).addEventListener("click", function () { action.fn(); t.remove(); });
    toastRegion.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  /* ---------- Хранилище заявки (localStorage с защитой от ошибок) ---------- */
  var KEY = "np.request.v2";
  var Store = {
    items: [],
    load: function () { try { this.items = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (x) { return findProduct(x.pid); }); } catch (e) { this.items = []; } },
    save: function () { try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch (e) { /* приватный режим — список живёт до перезагрузки */ } this.emit(); },
    has: function (pid, f) { return this.items.some(function (x) { return x.pid === pid && x.f === f; }); },
    toggle: function (pid, f) {
      if (this.has(pid, f)) { this.items = this.items.filter(function (x) { return !(x.pid === pid && x.f === f); }); this.save(); return false; }
      this.items.push({ pid: pid, f: f }); this.save(); return true;
    },
    remove: function (i) { this.items.splice(i, 1); this.save(); },
    clear: function () { this.items = []; this.save(); },
    subs: [], on: function (fn) { this.subs.push(fn); }, emit: function () { this.subs.forEach(function (fn) { fn(); }); }
  };
  Store.load();
  window.addEventListener("storage", function (e) { if (e.key === KEY) { Store.load(); Store.emit(); } });

  function updateCounters(bump) {
    var n = Store.items.length;
    $$("[data-request-count]").forEach(function (el) {
      el.textContent = n; el.classList.toggle("has-items", n > 0);
      if (bump && !RM) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    });
    $$("[data-request-btn-label]").forEach(function (el) { el.setAttribute("aria-label", (EN ? "Request: " : "Заявка: ") + n + " " + plural(n, T.positions)); });
  }
  Store.on(function () { updateCounters(true); syncAddButtons(); });

  /* Состояние всех кнопок «Добавить в запрос» на странице */
  function syncAddButtons() {
    $$("[data-add]").forEach(function (b) {
      var on = Store.has(b.getAttribute("data-pid"), b.getAttribute("data-f"));
      b.classList.toggle("is-added", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      b.innerHTML = (on ? ICON.check : ICON.plus) + "<span>" + (on ? T.added : T.add) + "</span>";
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]"); if (!b) return;
    e.preventDefault();
    var p = findProduct(b.getAttribute("data-pid")), f = b.getAttribute("data-f");
    var on = Store.toggle(p.id, f);
    toast((on ? T.addedToast : T.removedToast) + ": " + pName(p) + " — " + fmtShort(f), on ? { label: EN ? "Open" : "Открыть", fn: openRequest } : null);
  });

  /* ---------- Шапка: тень при прокрутке, выпадающее меню, мобильное меню ---------- */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }
  $$("[data-dropdown]").forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute("aria-controls"));
    var wrap = btn.closest(".has-dropdown");
    function set(open) { btn.setAttribute("aria-expanded", open ? "true" : "false"); menu.classList.toggle("is-open", open); }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    wrap.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { set(false); btn.focus(); }
      if (e.key === "ArrowDown" && btn.getAttribute("aria-expanded") === "true") { e.preventDefault(); var links = $$("a", menu); var i = links.indexOf(document.activeElement); (links[i + 1] || links[0]).focus(); }
      if (e.key === "ArrowUp" && btn.getAttribute("aria-expanded") === "true") { e.preventDefault(); var l2 = $$("a", menu); var j = l2.indexOf(document.activeElement); (l2[j - 1] || l2[l2.length - 1]).focus(); }
    });
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) set(false); });
    wrap.addEventListener("focusout", function (e) { if (!wrap.contains(e.relatedTarget)) set(false); });
  });

  /* Ловушка фокуса для мобильного меню и модалок без <dialog> */
  function trapFocus(container, e) {
    var f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', container).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  var drawer = $("#drawer"), burger = $("[data-drawer-open]"), lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement; drawer.classList.add("is-open"); document.body.style.overflow = "hidden";
    /* setTimeout вместо rAF: класс и фокус применяются после display:block даже во фоновой вкладке */
    setTimeout(function () { drawer.classList.add("is-visible"); $(".drawer__top [data-drawer-close]", drawer).focus(); }, 20);
    burger.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    drawer.classList.remove("is-visible"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = "";
    setTimeout(function () { drawer.classList.remove("is-open"); }, RM ? 0 : 300); if (lastFocus) lastFocus.focus();
  }
  if (drawer && burger) {
    burger.addEventListener("click", openDrawer);
    $$("[data-drawer-close]", drawer).forEach(function (b) { b.addEventListener("click", closeDrawer); });
    drawer.addEventListener("keydown", function (e) { if (e.key === "Tab") trapFocus($(".drawer__panel", drawer), e); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer(); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { if (a.getAttribute("href").indexOf("#") !== 0) closeDrawer(); }); });
  }

  /* Отметка текущего раздела, если сборка не проставила aria-current */
  (function markCurrent() {
    var here = location.pathname.split("/").pop() || "index.html";
    $$(".main-nav a, .drawer nav a, .dropdown a").forEach(function (a) {
      var h = (a.getAttribute("href") || "").split("?")[0].split("/").pop();
      if (h === here && !a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
    });
    var section = document.body.getAttribute("data-section");
    if (section) $$('[data-nav="' + section + '"]').forEach(function (a) { a.classList.add("is-current"); });
  })();

  /* ---------- Модалка заявки «Сотрудничество» ---------- */
  var dlg = $("#request-dialog");
  function renderRequestList() {
    var list = $("[data-request-list]", dlg); if (!list) return;
    $("[data-request-total]", dlg).textContent = Store.items.length;
    if (!Store.items.length) { list.innerHTML = '<li class="req-empty">' + esc(T.empty) + "</li>"; return; }
    list.innerHTML = Store.items.map(function (it, i) {
      var p = findProduct(it.pid), fo = fmtOf(p, it.f);
      return '<li class="req-item">' + picture(fo.img, "", "") + '<div><strong>' + esc(pName(p)) + "</strong><small>" + esc(brandName(p.brand)) + " · " + esc(fmtName(it.f)) + "</small></div>" +
        '<button type="button" data-remove="' + i + '" aria-label="' + esc(T.remove + ": " + pName(p) + ", " + fmtName(it.f)) + '">' + ICON.x + "</button></li>";
    }).join("");
  }
  function openRequest(preset) {
    if (!dlg) return;
    renderRequestList();
    var form = $("form", dlg); resetFormState(form);
    if (preset && typeof preset === "string") { var r = $('input[name="who"][value="' + preset + '"]', form); if (r) r.checked = true; }
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    setTimeout(function () { var f = $("input[name='name']", dlg); if (f) f.focus(); }, 50);
  }
  if (dlg) {
    Store.on(renderRequestList);
    dlg.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-remove]"); if (rm) { Store.remove(+rm.getAttribute("data-remove")); return; }
      if (e.target === dlg) dlg.close(); /* клик по подложке */
    });
    $$("[data-dialog-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    var clearBtn = $("[data-request-clear]", dlg); if (clearBtn) clearBtn.addEventListener("click", function () { Store.clear(); });
  }
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-request-open]"); if (!o) return;
    e.preventDefault(); openRequest(o.getAttribute("data-who") || null);
  });

  /* ---------- Формы: валидация и отправка через mailto ---------- */
  function setErr(field, msg) {
    var wrap = field.closest(".field, .check, fieldset"); if (!wrap) return;
    wrap.classList.add("has-error"); field.setAttribute("aria-invalid", "true");
    var e = $(".field__error", wrap); if (e) e.textContent = msg;
  }
  function clearErr(field) { var wrap = field.closest(".field, .check, fieldset"); if (wrap) wrap.classList.remove("has-error"); field.removeAttribute("aria-invalid"); }
  function resetFormState(form) {
    if (!form) return;
    $$(".has-error", form).forEach(function (w) { w.classList.remove("has-error"); });
    $$("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });
    $$("[data-form-status]", form).forEach(function (s) { s.hidden = true; });
    var b = $("[type=submit]", form); if (b) b.classList.remove("is-loading");
  }
  function validate(form) {
    var ok = true, first = null;
    $$("[required]", form).forEach(function (f) {
      clearErr(f);
      var bad = f.type === "checkbox" ? !f.checked : f.type === "radio" ? !$('input[name="' + f.name + '"]:checked', form) : !f.value.trim();
      if (bad) { ok = false; setErr(f, f.type === "checkbox" ? T.consentErr : f.type === "radio" ? T.whoErr : T.required); first = first || f; }
    });
    var c = $('[name="contact"]', form);
    if (c && c.value.trim()) {
      var v = c.value.trim(), digits = v.replace(/\D/g, "");
      if (!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || digits.length >= 10)) { ok = false; setErr(c, T.contactErr); first = first || c; }
    }
    /* фокус — на первое по порядку поле с ошибкой */
    var firstBad = form.querySelector('[aria-invalid="true"]'); if (firstBad) firstBad.focus();
    return ok;
  }
  function composeMail(form) {
    var d = new FormData(form), lines = [];
    var whoEl = $('input[name="who"]:checked', form);
    var who = whoEl ? whoEl.getAttribute("data-label") || whoEl.value : (form.getAttribute("data-topic") || "");
    lines.push((EN ? "Who: " : "Кто пишет: ") + who);
    [["name", EN ? "Name" : "Имя"], ["company", EN ? "Company" : "Компания"], ["contact", EN ? "Phone / e-mail" : "Телефон / e-mail"], ["city", EN ? "City / country" : "Город / страна"]].forEach(function (k) { var v = d.get(k[0]); if (v) lines.push(k[1] + ": " + v); });
    if (form.hasAttribute("data-with-list") && Store.items.length) {
      lines.push("", EN ? "Products:" : "Продукция:");
      Store.items.forEach(function (it, i) { var p = findProduct(it.pid); lines.push((i + 1) + ". " + brandName(p.brand) + " — " + p.name + " — " + NP.FORMATS[it.f].ru); });
    }
    var c = d.get("message"); if (c) lines.push("", (EN ? "Comment: " : "Комментарий: ") + c);
    lines.push("", (EN ? "Sent from the website, page: " : "Отправлено с сайта, страница: ") + location.href.split("?")[0]);
    var subject = T.subject + (who ? ": " + who : "");
    return { subject: subject, body: lines.join("\n") };
  }
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-mail-form]"); if (!form) return;
    e.preventDefault();
    var status = $("[data-form-status]", form);
    if (status) status.hidden = true;
    if (!validate(form)) { if (status) { status.className = "alert alert--error"; status.innerHTML = ICON.alert + "<span>" + esc(T.formErr) + "</span>"; status.hidden = false; } return; }
    var btn = $("[type=submit]", form); btn.classList.add("is-loading");
    var m = composeMail(form);
    var href = "mailto:" + NP.CONFIG.email + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
    setTimeout(function () {
      btn.classList.remove("is-loading");
      window.location.href = href;
      if (status) {
        status.className = "alert alert--success"; status.hidden = false;
        status.innerHTML = ICON.check + '<div><p class="mb-0">' + esc(T.mailOpened) + '<a href="mailto:' + NP.CONFIG.email + '">' + NP.CONFIG.email + "</a>.</p>" +
          '<div class="cluster mt-4"><button type="button" class="btn btn--sm btn--ghost" data-copy>' + esc(T.copy) + "</button>" +
          (form.hasAttribute("data-with-list") && Store.items.length ? '<button type="button" class="btn btn--sm btn--ghost" data-clear-after>' + esc(T.clear) + "</button>" : "") + "</div></div>";
        $("[data-copy]", status).addEventListener("click", function () {
          var text = m.subject + "\n\n" + m.body;
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast(T.copied); }, function () {
            var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast(T.copied); } catch (er) { /* без буфера */ } ta.remove();
          });
        });
        var ca = $("[data-clear-after]", status); if (ca) ca.addEventListener("click", function () { Store.clear(); ca.remove(); });
      }
    }, 450);
  });
  document.addEventListener("input", function (e) { if (e.target.matches("[aria-invalid]")) clearErr(e.target); });
  document.addEventListener("change", function (e) { if (e.target.matches("input[type=checkbox], input[type=radio]")) { var f = e.target.closest("form"); if (f) $$('[name="' + e.target.name + '"]', f).forEach(clearErr); } });

  /* ---------- Табы (WAI-ARIA, стрелки) ---------- */
  function initTabs(root) {
    $$("[data-tabs]", root).forEach(function (wrap) {
      if (wrap.__tabs) return; wrap.__tabs = true;
      var tabs = $$('[role="tab"]', wrap);
      function select(t, focus) {
        tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; var p = document.getElementById(x.getAttribute("aria-controls")); if (p) p.hidden = !on; });
        if (focus) t.focus();
        wrap.dispatchEvent(new CustomEvent("tabchange", { detail: t.getAttribute("data-value") }));
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(t); });
        t.addEventListener("keydown", function (e) {
          var k = e.key, n = null;
          if (k === "ArrowRight") n = tabs[(i + 1) % tabs.length]; if (k === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
          if (k === "Home") n = tabs[0]; if (k === "End") n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n, true); }
        });
      });
    });
  }

  /* ---------- Карусель на scroll-snap ---------- */
  function initCarousels(root) {
    $$("[data-carousel]", root).forEach(function (c) {
      var track = $(".carousel__track", c), prev = $("[data-prev]", c), next = $("[data-next]", c);
      if (!track || !prev || !next) return;
      /* Если всё помещается — стрелки прячем */
      function upd() { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; c.classList.toggle("is-static", prev.disabled && next.disabled); }
      function step(d) { var item = track.firstElementChild; var w = item ? item.getBoundingClientRect().width + 16 : track.clientWidth; track.scrollBy({ left: d * w, behavior: RM ? "auto" : "smooth" }); }
      prev.addEventListener("click", function () { step(-1); }); next.addEventListener("click", function () { step(1); });
      track.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
    });
  }

  /* ---------- Лайтбокс для писем и дипломов ---------- */
  var lb = null;
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-lightbox]"); if (!t) return;
    e.preventDefault();
    if (!lb) {
      lb = document.createElement("dialog"); lb.className = "modal modal-lightbox"; lb.setAttribute("aria-label", EN ? "Document" : "Документ");
      lb.innerHTML = '<button type="button" class="icon-btn modal__close" aria-label="' + (EN ? "Close" : "Закрыть") + '">' + ICON.x + '</button><figure><img alt=""><figcaption></figcaption></figure>';
      document.body.appendChild(lb);
      $(".modal__close", lb).addEventListener("click", function () { lb.close(); });
      lb.addEventListener("click", function (ev) { if (ev.target === lb) lb.close(); });
    }
    $("img", lb).src = t.getAttribute("data-lightbox"); $("img", lb).alt = t.getAttribute("data-caption") || "";
    $("figcaption", lb).textContent = t.getAttribute("data-caption") || "";
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
  });

  /* ---------- Появление при прокрутке ---------- */
  function initReveal(root) {
    var els = $$(".reveal", root);
    if (!("IntersectionObserver" in window) || RM) { els.forEach(function (x) { x.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (ent) { ent.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (x) { io.observe(x); });
  }

  /* ---------- Соцсети и маркетплейсы из конфигурации (пустые ссылки скрыты) ---------- */
  function renderLinks() {
    var soc = NP.CONFIG.socials.filter(function (s) { return s.url; });
    $$("[data-socials]").forEach(function (el) {
      if (!soc.length) { var box = el.closest("[data-socials-box]"); if (box) box.hidden = true; return; }
      el.innerHTML = soc.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + '">' + esc(s.short) + "</a>"; }).join("");
      if (soc.some(function (s) { return s.meta; })) $$("[data-meta-note]").forEach(function (n) { n.hidden = false; });
    });
    /* Маркетплейсы: плашки с логотипами; без ссылки — неактивная плашка «ссылка скоро» */
    var mps = Object.keys(NP.CONFIG.marketplaces).map(function (k) { return NP.CONFIG.marketplaces[k]; });
    $$("[data-marketplaces]").forEach(function (el) {
      el.innerHTML = mps.map(function (m) {
        var name = EN && m.nameEn ? m.nameEn : m.name;
        var label = m.logo ? '<img class="mp-btn__logo" src="' + img(m.logo) + '" alt="' + esc(name) + '" height="22">' : '<span class="mp-dot" aria-hidden="true"></span>' + esc(name);
        if (!m.url) return '<span class="mp-btn mp-btn--soon">' + label + "<small>" + (EN ? "Store link coming soon" : "Ссылка на магазин скоро") + "</small></span>";
        return '<a class="mp-btn" href="' + esc(m.url) + '" target="_blank" rel="noopener" style="--mp:' + m.color + '">' + label + "<small>" + (EN ? "Official store" : "Официальный магазин") + "</small></a>";
      }).join("");
    });
  }

  /* ==========================================================================
     Карточка продукта (каталог, бренды, главная)
     ========================================================================== */
  /* Плашка «Скоро в продаже» для форматов с soon: true (новый дизайн стаканов) */
  function soonBadge(f) { var F = NP.FORMATS[f]; return F && F.soon ? '<span class="soon-badge">' + (EN ? "Coming soon" : "Скоро в продаже") + "</span>" : ""; }
  /* lock — карточка внутри подгруппы формата: без переключателя, заголовок h4 */
  function productCard(p, fSel, lock) {
    var fo = fSel ? fmtOf(p, fSel) : p.formats[0], hl = lock ? "h4" : "h3";
    var href = url("product.html") + "?id=" + p.id + "&f=" + fo.f;
    var fmts = p.formats.length > 1 && !lock
      ? '<div class="p-card__formats" role="group" aria-label="' + (EN ? "Pack" : "Формат упаковки") + '">' + p.formats.map(function (x) {
          return '<button type="button" class="fmt-btn" data-fmt="' + x.f + '" aria-pressed="' + (x.f === fo.f) + '">' + esc(fmtShort(x.f)) + "</button>"; }).join("") + "</div>"
      : '<div class="p-card__formats"><span class="fmt-tag">' + esc(fmtShort(fo.f)) + "</span></div>";
    return '<article class="p-card reveal" data-card="' + p.id + '">' +
      '<div class="p-card__media" data-media>' + picture(fo.img, pName(p) + ", " + fmtName(fo.f)) + soonBadge(fo.f) + "</div>" +
      '<div class="p-card__body"><span class="p-card__brand">' + esc(brandName(p.brand)) + (p.line ? " · " + esc(p.line) : "") + "</span>" +
      "<" + hl + ' class="p-card__title"><a href="' + href + '" data-link>' + esc(pName(p)) + "</a></" + hl + ">" +
      '<span class="p-card__meta" data-meta>' + esc(EN ? p.kindEn : p.kind) + " · " + val(weightOf(fo)) + "</span>" + fmts +
      '<button type="button" class="btn btn--sm btn--ghost" data-add data-pid="' + p.id + '" data-f="' + fo.f + '"></button></div></article>';
  }
  /* Переключение формата внутри карточки */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".p-card [data-fmt]"); if (!b) return;
    var card = b.closest("[data-card]"), p = findProduct(card.getAttribute("data-card")), fo = fmtOf(p, b.getAttribute("data-fmt"));
    $$("[data-fmt]", card).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    $("[data-media]", card).innerHTML = picture(fo.img, pName(p) + ", " + fmtName(fo.f)) + soonBadge(fo.f);
    $("[data-meta]", card).innerHTML = esc(EN ? p.kindEn : p.kind) + " · " + val(weightOf(fo));
    $("[data-link]", card).href = url("product.html") + "?id=" + p.id + "&f=" + fo.f;
    $("[data-add]", card).setAttribute("data-f", fo.f); syncAddButtons();
  });

  function mountProducts(el, list, fmt) {
    el.innerHTML = list.map(function (p) { return productCard(p, fmt); }).join("");
    syncAddButtons(); initReveal(el);
  }

  /* ==========================================================================
     Каталог: группы (бренды, у Street Lunch — упаковки), поиск, синхронизация с URL
     ========================================================================== */
  /* Группа каталога для бренда — для ссылок «в каталог» с якорем #grp-… */
  function groupOf(brand) { return NP.CATALOG_GROUPS.filter(function (g) { return g.brands.indexOf(brand) >= 0; })[0]; }
  function initCatalog() {
    var root = $("[data-catalog]"); if (!root) return;
    var state = { q: qsParam("q") || "" };
    var grid = $("[data-grid]", root);
    var countEl = $("[data-count]", root), search = $("[data-search]", root), groupsEl = $("[data-groups]", root), navEl = $("[data-group-nav]", root);
    if (search) search.value = state.q;

    function filtered() {
      var q = norm(state.q).trim();
      return NP.PRODUCTS.filter(function (p) {
        return !q || norm([p.name, p.nameEn, brandName(p.brand), NP.BRANDS[p.brand].ru, p.kind, p.line].join(" ")).indexOf(q) >= 0;
      });
    }
    /* Группы: бренды в порядке CATALOG_GROUPS; у Street Lunch — подгруппы по упаковке */
    function groupsHTML(list) {
      var nav = [];
      var html = NP.CATALOG_GROUPS.map(function (g) {
        var items = list.filter(function (p) { return g.brands.indexOf(p.brand) >= 0; });
        var title = EN ? g.en : g.ru, body = "", n = 0, subs = [];
        if (g.split) {
          body = g.split.map(function (f) {
            var F = NP.FORMATS[f], its = items.filter(function (p) { return p.formats.some(function (x) { return x.f === f; }); });
            if (!its.length) return "";
            n += its.length; subs.push([g.id + "-" + f, fmtShort(f)]);
            var head = '<div class="cat-sub__head"><h3 class="cat-sub__title" id="grp-' + g.id + "-" + f + '">' + esc(fmtName(f)) + '</h3><span class="small muted">' + esc(EN ? F.noteEn : F.note) +
              " · " + its.length + " " + plural(its.length, T.products) + "</span></div>";
            return '<div class="cat-sub">' + head + '<div class="product-grid">' + its.map(function (p) { return productCard(p, f, true); }).join("") + "</div></div>";
          }).join("");
        } else if (items.length) {
          n = items.length;
          body = '<div class="product-grid">' + items.map(function (p) { return productCard(p); }).join("") + "</div>";
        }
        if (!body) return "";
        nav.push({ id: g.id, t: title, subs: subs });
        var cnt = g.split ? n + " " + plural(n, T.positions) : n + " " + plural(n, T.products);
        return '<section class="cat-group" aria-labelledby="grp-' + g.id + '"><div class="cat-group__head"><h2 class="cat-group__title" id="grp-' + g.id + '">' + esc(title) + "</h2>" +
          '<span class="small muted">' + cnt + "</span>" + (EN ? "" : '<a class="link-arrow cat-group__more" href="brand.html?b=' + g.brands[0] + '">О бренде</a>') + "</div>" + body + "</section>";
      }).join("");
      return { html: html, nav: nav };
    }
    function render() {
      var list = filtered();
      var pos = list.reduce(function (s, p) { return s + p.formats.length; }, 0);
      countEl.textContent = list.length + " " + plural(list.length, T.products) + " · " + pos + " " + plural(pos, T.positions);
      if (!list.length) {
        var st = '<div class="state" role="status">' + ICON.empty + "<h3>" + esc(T.nothing) + "</h3><p>" + esc(T.nothingText) + '</p><button type="button" class="btn btn--ghost" data-reset>' + esc(T.reset) + "</button></div>";
        grid.innerHTML = st; grid.hidden = false; groupsEl.hidden = true; navEl.hidden = true;
      } else {
        var G = groupsHTML(list);
        grid.hidden = true; groupsEl.hidden = false; navEl.hidden = G.nav.length < 2;
        groupsEl.innerHTML = G.html; syncAddButtons(); initReveal(groupsEl);
        navEl.innerHTML = G.nav.map(function (g) {
          var a = '<a href="#grp-' + g.id + '">' + esc(g.t) + "</a>";
          return g.subs.length > 1 ? '<span class="group-nav__set">' + a + g.subs.map(function (s) { return '<a class="group-nav__sub" href="#grp-' + s[0] + '">' + esc(s[1]) + "</a>"; }).join("") + "</span>" : a;
        }).join("");
      }
      /* В адресе остаются поиск и якорь группы */
      var qs = new URLSearchParams();
      if (state.q) qs.set("q", state.q);
      try { history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs : "") + location.hash); } catch (e) { /* file:// */ }
    }
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-reset]")) { state.q = ""; if (search) search.value = ""; render(); }
    });
    var tmr; if (search) search.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { state.q = search.value; render(); }, 180); });
    render();
    /* Группы рисуются скриптом, поэтому к якорю из ссылки (#grp-…) прокручиваем после отрисовки */
    if (/^#grp-/.test(location.hash)) {
      var toHash = function () { var target = document.getElementById(location.hash.slice(1)); if (target) target.scrollIntoView({ block: "start", behavior: "instant" }); };
      toHash(); window.addEventListener("load", toHash, { once: true }); /* после загрузки картинок браузер мог сбросить позицию */
    }
  }

  /* ==========================================================================
     Страница продукта
     ========================================================================== */
  function initProduct() {
    var root = $("[data-product]"); if (!root) return;
    var p = findProduct(qsParam("id"));
    if (!p) {
      root.innerHTML = '<div class="state state--error" role="alert">' + ICON.alert + "<h2>" + esc(T.notFound) + "</h2><p>" + esc(T.notFoundText) + '</p><a class="btn" href="' + url("catalog.html") + '">' + esc(T.toCatalog) + "</a></div>";
      return;
    }
    var fSel = fmtOf(p, qsParam("f")).f;
    var B = NP.BRANDS[p.brand];
    document.title = pName(p) + " — " + brandName(p.brand) + (EN ? " | Novye Produkty" : " | Новые продукты");
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", brandName(p.brand) + " — " + pName(p) + ". " + p.formats.map(function (f) { return fmtName(f.f); }).join(", ") + ".");
    var crumbs = $("[data-crumbs]"); if (crumbs) crumbs.innerHTML = '<li><a href="' + url("index.html") + '">' + (EN ? "Home" : "Главная") + '</a></li><li><a href="' + url("catalog.html") + '">' + (EN ? "Products" : "Продукция") + '</a></li><li><a href="' + url("catalog.html") + "#grp-" + groupOf(p.brand).id + '">' + esc(EN ? groupOf(p.brand).en : groupOf(p.brand).ru) + '</a></li><li aria-current="page">' + esc(pName(p)) + "</li>";

    function galleryItems(f) {
      var fo = fmtOf(p, f), list = [{ src: fo.img, alt: pName(p) + ", " + fmtName(f), photo: false }];
      if (fo.extraImg) list.push({ src: fo.extraImg, alt: (EN ? "Single sachet" : "Порционный пакетик 40 г"), photo: false });
      p.formats.forEach(function (x) { if (x.f !== f && x.img.indexOf("ph:") !== 0) list.push({ src: x.img, alt: pName(p) + ", " + fmtName(x.f), photo: false, fmt: x.f }); });
      (p.gallery || []).forEach(function (g) { list.push({ src: g, alt: brandName(p.brand) + (EN ? " — lifestyle" : " — фото в жизни"), photo: g.indexOf("scenes/") === 0 }); });
      return list;
    }
    function nutritionHTML() {
      var n = p.nutrition; if (!n) return '<p class="muted">' + esc(T.nutriNone) + "</p>";
      var cells = [["p", T.protein, EN ? "g" : "г"], ["f", T.fat, EN ? "g" : "г"], ["c", T.carbs, EN ? "g" : "г"], ["kcal", T.kcal, ""]].filter(function (x) { return n[x[0]]; });
      return '<div class="nutri" style="grid-template-columns:repeat(' + cells.length + ',1fr)">' + cells.map(function (x) { return "<div><small>" + esc(x[1]) + '</small><span class="num">' + esc(n[x[0]]) + "</span><small>" + esc(x[2]) + "</small></div>"; }).join("") + '</div><p class="small muted mt-4">' + esc(T.perServing) + "</p>";
    }
    function logisticsHTML(f) {
      var fo = fmtOf(p, f), rows = [[T.format, esc(fmtName(f)) + ' <span class="muted">(' + esc(EN ? NP.FORMATS[f].noteEn : NP.FORMATS[f].note) + ")</span>"], [T.weight, val(weightOf(fo))]];
      if (fo.ean) rows.push([T.ean, esc(fo.ean)]);
      (fo.logi || []).forEach(function (r) { rows.push([esc(r[0]), esc(r[1])]); });
      rows.push([T.storage, val(EN && p.storageEn ? p.storageEn : p.storage)]);
      rows.push([T.maker, esc(EN ? "Novye Produkty LLC, Chelyabinsk, Russia" : p.maker)]);
      return '<table class="spec"><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + '</tbody></table><p class="small muted mt-4">' + esc(T.specOnRequest) + "</p>";
    }
    function buyHTML(f) {
      var oz = NP.CONFIG.marketplaces.ozon, mp = Object.keys(NP.CONFIG.marketplaces).map(function (k) { return NP.CONFIG.marketplaces[k]; }).filter(function (m) { return m.url; });
      var online = mp.map(function (m) { return '<a class="btn btn--ghost btn--sm" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(EN && m.nameEn ? m.nameEn : m.name) + "</a>"; }).join("");
      return '<div class="buy-box"><div class="buy-box__row"><button type="button" class="btn" data-add data-pid="' + p.id + '" data-f="' + f + '"></button>' +
        (EN ? '<a class="btn btn--ghost" href="' + url("contacts.html") + '">Contact sales</a></div>' : '<a class="btn btn--ghost" href="' + url("where.html") + '">' + esc(T.whereBuy) + "</a></div>") +
        (online ? '<small>' + esc(T.buyOnline) + ":</small><div class=\"buy-box__row\">" + online + "</div>" : "") +
        "<small>" + (EN ? "Request = a list of items for our sales team: prices and terms are sent individually." : "Запрос — список позиций для отдела продаж: цены и условия пришлём индивидуально.") + "</small></div>";
    }
    var factsHTML = '<div class="facts">' + (p.facts || []).map(function (f) { return '<span class="fact">' + ICON.leaf + esc(factText(f)) + "</span>"; }).join("") + "</div>";
    var fmtPicker = '<fieldset class="fmt-picker"><legend>' + (EN ? "Choose a pack" : "Формат упаковки") + '</legend><div class="fmt-options">' + p.formats.map(function (x) {
      return '<div class="fmt-option"><input type="radio" name="fmt" id="f-' + x.f + '" value="' + x.f + '"' + (x.f === fSel ? " checked" : "") + '><label for="f-' + x.f + '"><strong>' + esc(fmtName(x.f)) + "</strong><small>" + val(weightOf(x)) + "</small></label></div>"; }).join("") + "</div></fieldset>";
    var intro = (EN ? p.introEn : p.intro) || (EN ? B.taglineEn : B.lead);
    var desc = "<p>" + esc(intro) + "</p>" + (p.prep ? "<h3 class=\"h4 mt-5\">" + esc(T.prep) + "</h3><p>" + val(EN && p.prepEn ? p.prepEn : p.prep) + "</p>" : "") + (p.portion && !EN ? '<p><b>' + esc(T.portion) + ":</b> " + esc(p.portion) + "</p>" : "");
    var comp = (EN ? '<p class="small muted">' + "Ingredients as printed on the Russian label:" + "</p>" : "") + "<p>" + val(p.composition) + "</p>";

    root.innerHTML =
      '<div class="gallery"><div class="gallery__main" data-gmain></div><div class="gallery__thumbs" data-gthumbs role="group" aria-label="' + (EN ? "Photos" : "Фото") + '"></div></div>' +
      '<div class="product__info"><a class="product__brand" href="' + (EN ? url("catalog.html") + "?q=" + encodeURIComponent(B.name) : url("brand.html") + "?b=" + p.brand) + '">' + esc(brandName(p.brand)) + (p.line ? " · " + esc(p.line) : "") + "</a>" +
      '<h1 class="product__title">' + esc(pName(p)) + '</h1><p class="lead">' + esc(EN ? (p.taglineEn || B.taglineEn) : (p.tagline || B.tagline)) + "</p>" + factsHTML + fmtPicker + '<div data-buy></div>' +
      '<div class="tabs" data-tabs><div role="tablist" aria-label="' + (EN ? "Product details" : "О продукте") + '">' + T.tabs.map(function (t, i) { return '<button type="button" role="tab" id="pt-' + i + '" aria-controls="pp-' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(t) + "</button>"; }).join("") + "</div>" +
      '<div role="tabpanel" id="pp-0" aria-labelledby="pt-0">' + desc + "</div>" +
      '<div role="tabpanel" id="pp-1" aria-labelledby="pt-1" hidden>' + comp + "</div>" +
      '<div role="tabpanel" id="pp-2" aria-labelledby="pt-2" hidden>' + nutritionHTML() + "</div>" +
      '<div role="tabpanel" id="pp-3" aria-labelledby="pt-3" hidden data-logi></div></div></div>';

    function setFormat(f, push) {
      fSel = f;
      var items = galleryItems(f), main = $("[data-gmain]", root), thumbs = $("[data-gthumbs]", root);
      function show(i) {
        var it = items[i]; main.classList.toggle("is-photo", it.photo); main.innerHTML = picture(it.src, it.alt, "", i === 0) + (i === 0 ? soonBadge(fSel) : "");
        $$("button", thumbs).forEach(function (b, j) { b.setAttribute("aria-pressed", j === i); });
      }
      thumbs.innerHTML = items.length > 1 ? items.map(function (it, i) { return '<button type="button" aria-label="' + esc(it.alt) + '" aria-pressed="' + (i === 0) + '">' + picture(it.src, "") + "</button>"; }).join("") : "";
      $$("button", thumbs).forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
      show(0);
      $("[data-buy]", root).innerHTML = buyHTML(f);
      $("[data-logi]", root).innerHTML = logisticsHTML(f);
      syncAddButtons();
      if (push) try { history.replaceState(null, "", location.pathname + "?id=" + p.id + "&f=" + f); } catch (e) { /* file:// */ }
    }
    $$('input[name="fmt"]', root).forEach(function (r) { r.addEventListener("change", function () { setFormat(r.value, true); }); });
    setFormat(fSel, false);
    initTabs(root);

    var rel = $("[data-related]");
    if (rel) {
      var others = NP.PRODUCTS.filter(function (x) { return x.brand === p.brand && x.id !== p.id; }).slice(0, 4);
      if (others.length) mountProducts(rel, others); else rel.closest("section").hidden = true;
    }
  }

  /* ==========================================================================
     Страница бренда
     ========================================================================== */
  function initBrand() {
    var root = $("[data-brand-page]"); if (!root) return;
    var id = qsParam("b"), B = NP.BRANDS[id];
    if (!B) { root.innerHTML = '<div class="container section"><div class="state state--error" role="alert">' + ICON.alert + "<h2>" + (EN ? "Brand not found" : "Такого бренда нет") + '</h2><a class="btn" href="' + url("catalog.html") + '">' + esc(T.toCatalog) + "</a></div></div>"; return; }
    document.title = brandName(id) + " — " + (EN ? B.taglineEn : B.tagline) + (EN ? " | Novye Produkty" : " | Новые продукты");
    var hero = $("[data-brand-hero]");
    hero.style.setProperty("--brand-bg", B.color); hero.style.setProperty("--brand-fg", B.fg);
    /* Логотип бренда вместо текстового заголовка (alt — название, для читалок экрана) */
    $("[data-brand-name]").innerHTML = B.logo ? '<img class="brand-hero__logo" src="' + img(B.logo) + '" alt="' + esc(brandName(id)) + '">' : esc(brandName(id));
    $$("[data-brand-crumb]").forEach(function (el) { el.textContent = brandName(id); });
    /* Тема страницы: у Street Lunch и РисоМишек — оформление по листовкам, у остальных — общий герой в цветах бренда */
    root.setAttribute("data-theme", id); document.body.setAttribute("data-brand", id);
    $("[data-brand-tagline]").textContent = EN ? B.taglineEn : B.tagline;
    $("[data-brand-lead]").textContent = EN ? B.leadEn : B.lead;
    $("[data-brand-img]").innerHTML = B.hero ? '<img class="brand-hero__img" src="' + img(B.hero) + '" alt="' + esc(brandName(id)) + '" fetchpriority="high">' : '<img class="brand-hero__img" style="border-radius:24px;background:#fff;padding:24px" src="' + img(B.tile) + '" alt="' + esc(brandName(id)) + '">';
    $("[data-brand-catalog-link]").href = url("catalog.html") + "#grp-" + groupOf(id).id;
    var list = NP.PRODUCTS.filter(function (p) { return p.brand === id; });
    var countText = list.length + " " + plural(list.length, T.products) + " · " + list.reduce(function (s, p) { return s + p.formats.length; }, 0) + " " + plural(list.reduce(function (s, p) { return s + p.formats.length; }, 0), T.positions);
    $$("[data-brand-count]").forEach(function (el) { el.textContent = countText; });
    mountProducts($("[data-brand-grid]"), list);
    /* Показать блоки, относящиеся к бренду */
    $$("[data-for-brand]").forEach(function (el) { el.hidden = el.getAttribute("data-for-brand").split(" ").indexOf(id) < 0; });
    /* Лёгкий параллакс декора в первом экране: CSS читает --sy (прокрутка в px) */
    if (!RM) {
      var heroes = $$(".sl-hero, .rm-hero, .brand-hero", root).filter(function (h) { return !h.hidden; }), busy = false;
      window.addEventListener("scroll", function () {
        if (busy) return; busy = true;
        requestAnimationFrame(function () { heroes.forEach(function (h) { var r = h.getBoundingClientRect(); if (r.bottom > 0) h.style.setProperty("--sy", Math.round(Math.max(0, -r.top))); }); busy = false; });
      }, { passive: true });
    }
  }

  /* ==========================================================================
     Где купить: карта (Leaflet по требованию), фильтр по брендам, список городов
     ========================================================================== */
  /* Логотип сети (alt — название); если файла нет — аккуратная текстовая плашка */
  function retailLogo(r, cls) {
    cls = cls || "retail-logo";
    return r.logo ? '<img class="' + cls + (r.logoBg ? " retail-logo--on-color" : "") + '" src="' + img(r.logo) + '" alt="' + esc(r.name) + '"' + (r.logoBg ? ' style="background:' + r.logoBg + '"' : "") + ' loading="lazy" decoding="async">'
      : '<span class="' + cls + ' retail-logo--word">' + esc(r.name) + "</span>";
  }
  function initRetailStrip() {
    $$("[data-retail-strip]").forEach(function (el) {
      /* Белый логотип на фирменном цвете: красим всю плитку, а не маленькую подложку под картинкой */
      /* Порядок: по числу магазинов (Перекрёсток — первым), сети без данных — в конце */
      var sorted = NP.RETAIL.slice().sort(function (a, b) { return (b.stores || 0) - (a.stores || 0); });
      el.innerHTML = sorted.map(function (r) {
        if (r.logo && r.logoBg) return '<li class="retail-tile retail-tile--on-color" style="--tile-bg:' + r.logoBg + '">' + retailLogo({ logo: r.logo, name: r.name }) + "</li>";
        return '<li class="retail-tile">' + retailLogo(r) + "</li>";
      }).join("");
    });
  }

  function initWhere() {
    var root = $("[data-where]"); if (!root) return;
    var brand = "all", chipsEl = $("[data-brand-filter]", root), retailEl = $("[data-retail]", root), citiesEl = $("[data-cities]", root), mapEl = $("[data-map]", root);
    var map = null, layer = null;
    var brands = [["all", T.all], ["street-lunch", "Street Lunch"], ["risomishki", "РисоМишки"], ["hrumstik", "Хрумстик"]];
    function retailFor() { return NP.RETAIL.filter(function (r) { return brand === "all" || r.brands.indexOf(brand) >= 0; }); }
    function render() {
      chipsEl.innerHTML = brands.map(function (b) { return '<button type="button" class="chip" data-b="' + b[0] + '" aria-pressed="' + (brand === b[0]) + '">' + esc(b[1]) + "</button>"; }).join("");
      var rs = retailFor(), ids = rs.map(function (r) { return r.id; });
      retailEl.innerHTML = rs.map(function (r) {
        return '<li class="city retail-card"><h3 class="retail-card__logo">' + retailLogo(r) + "</h3><p>" + esc(r.type) + (r.region ? " · " + esc(r.region) : "") + (r.stores ? " · " + r.stores + " " + plural(r.stores, ["магазин", "магазина", "магазинов"]) : "") + "</p><p>" + esc(r.note) + "</p></li>"; }).join("");
      var cities = NP.CITIES.filter(function (c) { return c.retail.some(function (x) { return ids.indexOf(x) >= 0; }); });
      citiesEl.innerHTML = cities.map(function (c) {
        var chains = c.retail.filter(function (x) { return ids.indexOf(x) >= 0; }).map(function (x) { return NP.RETAIL.filter(function (r) { return r.id === x; })[0]; });
        return '<li class="city"><h3>' + esc(c.name) + '</h3><p class="retail-mini">' + chains.map(function (r) { return retailLogo(r, "retail-mini__logo"); }).join("") + "</p>" + (c.note ? "<p>" + esc(c.note) + "</p>" : "") + '<button type="button" class="btn btn--sm btn--ghost" data-city="' + c.id + '">' + (EN ? "Show on map" : "Показать на карте") + "</button></li>"; }).join("") || '<li class="state"><p>' + (EN ? "No cities for this brand yet." : "Для этого бренда городов пока нет.") + "</p></li>";
      drawMarkers(cities, ids);
    }
    function drawMarkers(cities, ids) {
      if (!map || !window.L) return;
      if (layer) layer.remove();
      layer = window.L.layerGroup().addTo(map);
      var icon = window.L.divIcon({ className: "", html: '<div class="np-marker"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
      cities.forEach(function (c) {
        var names = c.retail.filter(function (x) { return ids.indexOf(x) >= 0; }).map(function (x) { return NP.RETAIL.filter(function (r) { return r.id === x; })[0].name; });
        window.L.marker([c.lat, c.lon], { icon: icon, title: c.name, keyboard: true }).bindPopup("<b>" + esc(c.name) + "</b><br>" + esc(names.join(", "))).addTo(layer);
      });
    }
    function loadMap() {
      var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="; css.crossOrigin = ""; document.head.appendChild(css);
      var s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="; s.crossOrigin = ""; s.async = true;
      var fail = function () { $(".map__placeholder", mapEl).innerHTML = "<p>" + esc(T.mapError) + "</p>"; mapEl.setAttribute("aria-busy", "false"); };
      var to = setTimeout(fail, 12000);
      s.onerror = function () { clearTimeout(to); fail(); };
      s.onload = function () {
        clearTimeout(to);
        try {
          var host = document.createElement("div"); host.style.cssText = "position:absolute;inset:0"; mapEl.appendChild(host);
          map = window.L.map(host, { scrollWheelZoom: false, zoomControl: true }).setView([55.5, 48], 4);
          window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 12, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
          $(".map__placeholder", mapEl).remove(); mapEl.setAttribute("aria-busy", "false"); render();
        } catch (er) { fail(); }
      };
      document.head.appendChild(s);
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-b]"); if (b) { brand = b.getAttribute("data-b"); render(); return; }
      var c = e.target.closest("[data-city]");
      if (c && map) { var city = NP.CITIES.filter(function (x) { return x.id === c.getAttribute("data-city"); })[0]; map.setView([city.lat, city.lon], 9); mapEl.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); }
    });
    render();
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); loadMap(); } }, { rootMargin: "200px" }); io.observe(mapEl); } else loadMap();
  }

  /* ==========================================================================
     Новости, соцпроекты, FAQ, главная
     ========================================================================== */
  function newsCard(n) {
    /* Официальная плашка награды (например, «Новинка года») — поверх картинки; у шапки-обложки знак уже внутри */
    var badge = n.badge && !n.cover ? '<img class="n-card__badge" src="' + img(n.badge) + '" alt="" loading="lazy">' : "";
    var pic = '<div class="n-card__img">' + (n.cover ? newsCover(n) : n.img ? picture(n.img, n.title) : newsArt(n)) + badge + "</div>";
    return '<a class="n-card reveal" href="' + url("news-item.html") + "?id=" + n.id + '">' + pic + '<div class="n-card__meta"><span class="badge badge--soft">' + esc(NP.NEWS_TAGS[n.tag]) + "</span><time datetime=\"" + n.date + '">' + esc(n.dateText) + "</time></div><h3>" + esc(n.title) + "</h3><p>" + esc(n.excerpt) + "</p></a>";
  }
  /* Единая шапка новости по тематике (SVG 480×300, шрифты сайта).
     Слева — тип, название, крупный год, строки (даты/город/площадка или результат) и плашка;
     справа — цветная панель: у выставок декор (лист / кольцо), у наград — диплом или знак, у новинок — продукт. */
  function newsCover(n) {
    var c = n.cover, th = (NP.COVER_THEMES || {})[c.theme] || { c1: "#1c5e35", c2: "#e58a2e", deco: "leaf" };
    var W = 480, H = 300, PX = 330, X = 26, MAXW = PX - X - 20, id = "cv-" + n.id;
    var INK = "#1d1b16", GREY = "#57524a", CREAM = "#fbf8f1", RUB = "Rubik,Onest,Segoe UI,sans-serif", ON = "Onest,Segoe UI,sans-serif";
    function fit(s, max, k) { return Math.min(max, Math.floor(MAXW / (String(s).length * k))); }
    function txt(x, y, size, weight, fill, fam, s, extra) { return '<text x="' + x + '" y="' + y + '" font-family="' + fam + '" font-weight="' + weight + '" font-size="' + size + '" fill="' + fill + '"' + (extra || "") + ">" + esc(s) + "</text>"; }
    var kick = { expo: "Выставка", award: "Награда", launch: "Новинка" }[c.type] || "";
    var out = [txt(X, 40, 12, 700, th.c1, ON, kick.toUpperCase(), ' letter-spacing="2.4"')], y = 48;
    c.name.forEach(function (s) { var fs = fit(s, 30, .66); y += fs + 2; out.push(txt(X, y, fs, 800, c.type === "expo" ? th.c1 : INK, RUB, s)); });
    var ys = c.name.length > 1 ? 70 : 88; y += ys - 6;
    out.push(txt(X - 4, y, ys, 800, th.c1, RUB, c.year, ' letter-spacing="-2"'));
    (c.lines || []).forEach(function (s, i) {
      var fs = i === 0 ? fit(s, 24, .62) : fit(s, i === 1 ? 18 : 15, .58); y += i === 0 ? 32 : fs + 7;
      out.push(txt(X, y, fs, i === 0 ? 700 : i === 1 ? 600 : 500, i === 0 ? th.c1 : GREY, i === 0 ? RUB : ON, s));
    });
    if (c.pill) { var pw = Math.min(MAXW, Math.round(c.pill.length * 8.4 + 26)); y += 14; out.push('<rect x="' + X + '" y="' + y + '" width="' + pw + '" height="28" rx="7" fill="' + th.c1 + '"/>' + txt(X + 13, y + 19, 14, 700, "#fff", ON, c.pill)); }

    var panelFill = th.panel || (th.deco === "ring" ? th.c2 : th.c1), panel = '<rect x="' + PX + '" width="' + (W - PX) + '" height="' + H + '" fill="' + panelFill + '"/>';
    var shadow = '<filter id="' + id + '-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".28"/></filter>';
    if (c.type === "expo" && th.deco === "ring") {
      panel += '<circle cx="478" cy="150" r="104" fill="none" stroke="' + th.c1 + '" stroke-width="22" stroke-dasharray="150 34 92 34"/>';
    } else if (c.type === "expo") {
      panel += '<path d="M' + PX + ' 158C376 76 432 40 ' + (W + 10) + ' 24" fill="none" stroke="' + CREAM + '" stroke-width="9"/>' +
        '<path d="M318 ' + H + 'C326 236 384 204 472 196C466 262 414 ' + H + ' 318 ' + H + 'Z" fill="' + th.c2 + '" stroke="' + CREAM + '" stroke-width="7"/>' +
        '<path d="M' + (W - 58) + ' 0C' + (W - 52) + ' 34 ' + (W - 26) + ' 58 ' + W + ' 62V0Z" fill="' + th.c2 + '"/>';
    } else if (c.type === "award" && c.badge) {
      panel += '<image href="' + img(c.img) + '" x="338" y="72" width="134" height="150" preserveAspectRatio="xMidYMid meet"/>';
    } else if (c.type === "award") {
      var g = c.rotate ? 'translate(405 152) rotate(94)' : 'translate(405 150) rotate(4)';
      panel += '<circle cx="' + W + '" cy="' + H + '" r="96" fill="' + th.c2 + '" opacity=".55"/><g transform="' + g + '" filter="url(#' + id + '-sh)"><rect x="-52" y="-74" width="104" height="148" fill="#fff"/>' +
        '<image href="' + img(c.img) + '" x="-49" y="-71" width="98" height="142" preserveAspectRatio="xMidYMid slice"/></g>';
    } else if (c.type === "launch") {
      panel += '<circle cx="405" cy="150" r="88" fill="' + th.c2 + '"/><image href="' + img(c.img) + '" x="316" y="98" width="172" height="104" preserveAspectRatio="xMidYMid meet" filter="url(#' + id + '-sh)"/>';
    }
    var label = c.name.join(" ") + " " + c.year + ". " + (c.lines || []).join(", ") + (c.pill ? ". " + c.pill : "");
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(label) + '" style="width:100%;height:100%;display:block"><defs>' + shadow + '</defs><rect width="' + W + '" height="' + H + '" fill="' + CREAM + '"/>' + panel + out.join("") + "</svg>";
  }
  /* Обложка для новостей без фото и без шапки: типографика + звезда (SVG) */
  function newsArt(n) {
    var y = n.date.slice(0, 4);
    return '<svg viewBox="0 0 320 200" role="img" aria-label="' + esc(n.title) + '" style="width:100%;height:100%;display:block"><rect width="320" height="200" fill="#123620"/><g fill="rgba(243,184,108,.16)">' +
      Array.apply(null, Array(60)).map(function (_, i) { return '<circle cx="' + (12 + (i % 15) * 22) + '" cy="' + (14 + Math.floor(i / 15) * 22) + '" r="2"/>'; }).join("") +
      '</g><text x="20" y="178" font-family="Sofia Sans Extra Condensed,Arial Narrow,sans-serif" font-weight="900" font-size="104" fill="#fbf8f1">' + y + '</text><polygon points="280,24 288,48 314,48 293,63 301,88 280,73 259,88 267,63 246,48 272,48" fill="#e58a2e"/></svg>';
  }
  function initNews() {
    var list = $("[data-news-list]");
    if (list) {
      var limit = +list.getAttribute("data-limit") || 0, tag = "all", chipsEl = $("[data-news-tags]");
      var sorted = NP.NEWS.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      /* В карусели карточки видны сразу: reveal по скроллу страницы не срабатывает для скрытых сбоку слайдов */
      var inCarousel = list.classList.contains("carousel__track");
      var draw = function () {
        var items = sorted.filter(function (n) { return tag === "all" || n.tag === tag; }); if (limit) items = items.slice(0, limit);
        list.innerHTML = items.map(newsCard).join("");
        if (inCarousel) $$(".reveal", list).forEach(function (x) { x.classList.remove("reveal"); }); else initReveal(list);
        if (chipsEl) chipsEl.innerHTML = [["all", T.all]].concat(Object.keys(NP.NEWS_TAGS).filter(function (k) { return sorted.some(function (n) { return n.tag === k; }); }).map(function (k) { return [k, NP.NEWS_TAGS[k]]; }))
          .map(function (t) { return '<button type="button" class="chip" data-tag="' + t[0] + '" aria-pressed="' + (tag === t[0]) + '">' + esc(t[1]) + "</button>"; }).join("");
      };
      if (chipsEl) chipsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-tag]"); if (b) { tag = b.getAttribute("data-tag"); draw(); } });
      draw();
    }
    var item = $("[data-news-item]");
    if (item) {
      var n = NP.NEWS.filter(function (x) { return x.id === qsParam("id"); })[0];
      if (!n) { item.innerHTML = '<div class="state state--error" role="alert">' + ICON.alert + "<h2>Новость не найдена</h2><p>Возможно, ссылка устарела.</p><a class=\"btn\" href=\"news.html\">Все новости</a></div>"; return; }
      document.title = n.title + " | Новые продукты";
      $("[data-crumbs]").innerHTML = '<li><a href="index.html">Главная</a></li><li><a href="news.html">Новости</a></li><li aria-current="page">' + esc(n.title) + "</li>";
      item.innerHTML = '<div class="n-card__meta"><span class="badge badge--soft">' + esc(NP.NEWS_TAGS[n.tag]) + '</span><time datetime="' + n.date + '">' + esc(n.dateText) + '</time></div><h1 class="h1 mt-4' + (n.badge ? ' wf-title wf-title--h1">' + '<img class="wf-badge" src="' + img(n.badge) + '" alt="Знак «Новинка года 2025» выставки WorldFood Moscow" width="90" height="100">' : '">') + esc(n.title) + "</h1>" +
        (n.cover ? '<figure class="media media--cover mt-6">' + newsCover(n) + "</figure>" : '<figure class="media media--wide mt-6">' + (n.img ? picture(n.img, n.title, "", true) : newsArt(n)) + "</figure>") +
        '<div class="prose mt-6">' + n.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
        (n.cover && n.img ? '<p class="mt-5"><button type="button" class="btn btn--ghost" data-lightbox="' + img(n.img) + '" data-caption="' + esc(n.title) + '">' + esc(n.imgLabel || "Смотреть диплом") + "</button></p>" : "");
    }
  }
  /* ---------- Соцпроекты: как новости — фильтр по направлению, сетка карточек и страница проекта (social.html?id=…) ---------- */
  var SOCIAL_DIRS = ["army", "charity", "events"];
  function dirName(id) { var d = NP.DIRECTIONS.filter(function (x) { return x.id === id; })[0]; return d ? d.ru : ""; }
  /* Год для сортировки: первая четырёхзначная цифра; «уточнить» — считаем самым свежим */
  function projYear(p) { var m = typeof p.year === "string" ? p.year.match(/\d{4}/g) : null; return m ? +m[m.length - 1] : 9999; }
  function projectsSorted() { return NP.PROJECTS.slice().sort(function (a, b) { return projYear(b) - projYear(a); }); }
  function projectMedia(p) {
    if (p.docs) return '<div class="s-card__img s-card__img--doc s-card__img--' + p.dir + '">' + p.docs.slice(0, 2).map(function (d) { return picture(d.img, d.title); }).join("") + "</div>";
    var ph = p.photos.filter(function (x) { return x.img === p.cover; })[0] || p.photos[0];
    return '<div class="s-card__img">' + picture(ph.img, ph.alt) + "</div>";
  }
  function projectCard(p) {
    var year = typeof p.year === "string" ? "<span>" + esc(p.year) + "</span>" : "";
    return '<a class="n-card s-card" href="' + url("social.html") + "?id=" + p.id + '">' + projectMedia(p) + '<div class="n-card__meta"><span class="badge badge--soft">' + esc(dirName(p.dir)) + "</span>" + year + "</div><h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></a>";
  }
  function initSocial() {
    var root = $("[data-social]"); if (!root) return;
    var id = qsParam("id"), listView = $("[data-social-list]", root), itemView = $("[data-social-item]", root);
    function docHTML(d) { return '<button type="button" class="doc-card" data-lightbox="' + img(d.img) + '" data-caption="' + esc(d.title + (d.year ? ", " + d.year : "")) + '"><span class="doc-card__img">' + picture(d.img, d.title) + "</span><strong>" + esc(d.title) + "</strong>" + (d.year ? "<small>" + esc(d.year) + "</small>" : "") + "</button>"; }
    if (id) {
      var p = NP.PROJECTS.filter(function (x) { return x.id === id; })[0];
      listView.hidden = true; itemView.hidden = false;
      var art = $("[data-social-article]", itemView);
      if (!p) { art.innerHTML = '<div class="state state--error" role="alert">' + ICON.alert + '<h2>Проект не найден</h2><p>Возможно, ссылка устарела.</p><a class="btn" href="social.html">Все проекты</a></div>'; return; }
      document.title = p.title + " | Соцпроекты | Новые продукты";
      $("[data-crumbs]", itemView).innerHTML = '<li><a href="index.html">Главная</a></li><li><a href="social.html">Соцпроекты</a></li><li aria-current="page">' + esc(p.title) + "</li>";
      var media = p.docs ? '<h2 class="h4 mt-7 mb-4">' + (p.docs.length > 1 ? "Документы" : "Благодарственное письмо") + '</h2><div class="doc-grid">' + p.docs.map(docHTML).join("") + "</div>"
        : '<h2 class="h4 mt-7 mb-4">Фото</h2><div class="mosaic">' + p.photos.map(function (ph) { return '<figure><button type="button" class="mosaic__btn" data-lightbox="' + img(ph.img) + '" data-caption="' + esc(ph.alt) + '">' + picture(ph.img, ph.alt) + "</button></figure>"; }).join("") + "</div>";
      art.innerHTML = '<div class="n-card__meta"><span class="badge badge--soft">' + esc(dirName(p.dir)) + "</span><span>" + val(p.year) + '</span></div><h1 class="h1 mt-4">' + esc(p.title) + '</h1><div class="prose mt-6"><p>' + esc(p.text) + "</p></div>" + media;
      $("[data-social-more]", itemView).innerHTML = projectsSorted().filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(projectCard).join("");
      return;
    }
    var dir = qsParam("dir") || "all", chipsEl = $("[data-dir-chips]", root), list = $("[data-projects]", root);
    if (SOCIAL_DIRS.indexOf(dir) < 0) dir = "all";
    function draw() {
      chipsEl.innerHTML = [{ id: "all", ru: T.all }].concat(NP.DIRECTIONS.filter(function (d) { return SOCIAL_DIRS.indexOf(d.id) >= 0; })).map(function (d) {
        var n = d.id === "all" ? NP.PROJECTS.length : NP.PROJECTS.filter(function (p) { return p.dir === d.id; }).length;
        return '<button type="button" class="chip" data-dir="' + d.id + '" aria-pressed="' + (dir === d.id) + '">' + esc(d.ru) + '<span class="chip__n">' + n + "</span></button>"; }).join("");
      list.innerHTML = projectsSorted().filter(function (p) { return dir === "all" || p.dir === dir; }).map(projectCard).join("");
      initReveal(list);
    }
    chipsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-dir]"); if (!b) return; dir = b.getAttribute("data-dir"); draw(); try { history.replaceState(null, "", location.pathname + (dir !== "all" ? "?dir=" + dir : "")); } catch (er) { /* file:// */ } });
    draw();
  }
  function faqHTML(items) {
    return items.map(function (x) { return '<details><summary>' + esc(x.q) + '<span class="plus" aria-hidden="true">' + ICON.plus + '</span></summary><div class="faq__a"><p>' + esc(x.a) + "</p></div></details>"; }).join("");
  }
  function initFaq() {
    $$("[data-faq]").forEach(function (el) {
      var key = el.getAttribute("data-faq"), pick = el.getAttribute("data-pick");
      var items = key === "en" ? NP.FAQ_EN : (NP.FAQ[key] || []);
      if (pick) items = pick.split(",").map(function (i) { var p = i.split(":"); return NP.FAQ[p[0]][+p[1]]; });
      el.innerHTML = faqHTML(items);
    });
  }
  function initAwards() {
    var el = $("[data-awards]"); if (!el) return;
    el.innerHTML = NP.AWARDS.map(function (a) {
      return '<div class="award reveal"><span class="award__year">' + esc(a.year) + "</span><div><h3" + (a.badge ? ' class="wf-title"><img class="wf-badge" src="' + img(a.badge) + '" alt="" width="34" height="38" loading="lazy">' : ">") + esc(a.title) + "</h3>" + (a.text ? "<p>" + val(a.text) + "</p>" : "") +
        (a.img ? '<p class="mt-4"><button type="button" class="link-arrow" style="background:none;border:0;border-bottom:1.5px solid;cursor:pointer;padding:0 0 2px" data-lightbox="' + img(a.img) + '" data-caption="' + esc(a.title) + '">' + esc(a.imgLabel || "Смотреть диплом") + "</button></p>" : "") + "</div></div>";
    }).join(""); initReveal(el);
  }
  /* «100 лучших товаров России» — дипломы-карточки с лайтбоксом */
  function initBest100() {
    $$("[data-best100]").forEach(function (el) {
      el.innerHTML = (NP.BEST100 || []).map(function (a) {
        var L = EN && a.en ? a.en : a, t = L.title, d = L.doc, pr = L.product, br = L.brand || a.brand;
        var cap = EN ? d + ", “100 Best Goods of Russia” 2024 — " + t + ", " + br : d + " «100 лучших товаров России» 2024 — " + t + ", " + br;
        return '<button type="button" class="b100-card b100-card--' + a.tone + '" data-lightbox="' + img(a.img) + '" data-caption="' + esc(cap) + '">' +
          '<span class="b100-card__img">' + picture(a.img, cap) + "</span>" +
          '<span class="b100-card__title">' + esc(t) + '</span><span class="b100-card__brand">' + esc(br) + '</span><span class="b100-card__product">' + esc(pr) + "</span></button>";
      }).join("");
    });
  }
  /* Стена отзывов (Ozon): «сообщения» и карточки в духе Ozon вперемешку; ссылок на магазин нет.
     verbatim: true — настоящий текст отзыва (аватар с буквой author), иначе — пересказ без имени. */
  function initReviews() {
    var el = $("[data-reviews]"); if (!el || !NP.REVIEWS) return;
    var R = NP.REVIEWS, retold = R.wall.some(function (w) { return !w.verbatim; });
    function stars(n, label) { return '<span class="stars" style="--p:' + (n / 5 * 100) + '%" role="img" aria-label="' + label + '"></span>'; }
    var AVA = ["#dbe7f6", "#f6dde3", "#e0eed8", "#f7e8cc"];
    var person = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="4" fill="currentColor"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6z" fill="currentColor"/></svg>';
    var ROT = [-1.4, 0.9, -0.5, 1.2, -1, 0.6, 0.2, -0.8], SHIFT = [0, 18, -10, 26, 8, -14, 12, -4];
    el.innerHTML = '<div class="rwall__clip" id="rwall-clip"><ul class="rwall__list" aria-label="' + (retold ? "Отзывы покупателей в пересказе" : "Отзывы покупателей") + '">' + R.wall.map(function (w, i) {
      var meta = esc(brandName(w.brand)) + (w.flavor ? " · " + esc(w.flavor) : "");
      var style = ' style="--r:' + ROT[i % ROT.length] + "deg;--x:" + SHIFT[i % SHIFT.length] + 'px"';
      var ava = '<span class="rv__ava" style="--ava:' + AVA[i % AVA.length] + '"' + (w.verbatim && w.author ? ' aria-hidden="true"><b>' + esc(w.author.charAt(0)) + "</b>" : ">" + person) + "</span>";
      if (w.kind === "card") {
        return '<li class="rv rv--card reveal"' + style + ">" + (w.verbatim && w.author ? ava : "") + '<div class="rv__box">' + stars(w.stars, "Оценка " + w.stars + " из 5") + "<dl>" +
          (w.pros ? "<dt>Достоинства</dt><dd>" + esc(w.pros) + "</dd>" : "") + (w.cons ? "<dt>Недостатки</dt><dd>" + esc(w.cons) + "</dd>" : "") + (w.text ? "<dt>Комментарий</dt><dd>" + esc(w.text) + "</dd>" : "") +
          '</dl><span class="rv__meta"><img src="' + img("retail/ozon.svg") + '" alt="Ozon" width="44" height="12" loading="lazy">' + meta + "</span></div></li>";
      }
      return '<li class="rv rv--bubble reveal"' + style + ">" + ava + '<div class="rv__box"><p>' + esc(w.text) + '</p><span class="rv__meta">' + meta + "</span></div></li>";
    }).join("") + "</ul></div>";
    /* Длинная стена сворачивается: видна верхняя часть, остальное — по кнопке */
    var clip = $(".rwall__clip", el), more = document.createElement("button");
    more.type = "button"; more.className = "btn rwall__more"; more.setAttribute("aria-controls", "rwall-clip");
    function setOpen(open) {
      el.classList.toggle("is-collapsed", !open); more.setAttribute("aria-expanded", String(open));
      more.textContent = open ? "Свернуть отзывы" : "Показать все отзывы (" + R.wall.length + ")";
    }
    more.addEventListener("click", function () {
      var open = el.classList.contains("is-collapsed"); setOpen(open);
      if (!open) el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    });
    el.appendChild(more); setOpen(false);
    function check() { var tall = $(".rwall__list", el).scrollHeight > clip.clientHeight + 40 || !el.classList.contains("is-collapsed"); more.hidden = !tall; if (!tall) el.classList.remove("is-collapsed"); }
    /* «Кладка»: каждый отзыв ставим в самую короткую колонку — колонки заканчиваются почти вровень, без пустот.
       На телефоне (одна колонка) — обычный поток, как переписка. */
    var list = $(".rwall__list", el), lastKey = "";
    function layout() {
      var W = list.clientWidth, vw = window.innerWidth, n = vw < 640 ? 1 : vw < 1024 ? 2 : vw < 1440 ? 3 : 4, items = $$(".rv", list);
      if (n + ":" + W === lastKey) return; lastKey = n + ":" + W;
      if (n === 1) { list.classList.remove("is-masonry"); list.style.height = ""; items.forEach(function (li) { li.style.left = li.style.top = li.style.width = ""; }); check(); return; }
      var gap = W < 900 ? 18 : 26, colW = (W - gap * (n - 1)) / n, cols = [];
      for (var c = 0; c < n; c++) cols.push(0);
      list.classList.add("is-masonry");
      items.forEach(function (li) { li.style.width = colW + "px"; });
      items.forEach(function (li) {
        var k = cols.indexOf(Math.min.apply(null, cols));
        li.style.left = k * (colW + gap) + "px"; li.style.top = cols[k] + "px";
        cols[k] += li.offsetHeight + gap;
      });
      list.style.height = Math.max.apply(null, cols) - gap + "px";
      check();
    }
    var raf = 0;
    window.addEventListener("resize", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
    layout();
    /* Высоты меняются после загрузки шрифтов — пересчитываем */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastKey = ""; layout(); });
    window.addEventListener("load", function () { lastKey = ""; layout(); });
    $$("[data-reviews-note]").forEach(function (n) { n.textContent = "Отзывы покупателей с " + R.source + (retold ? " — в пересказе, без имён." : "."); });
    initReveal(el);
  }
  /* ---------- «О компании»: линия шкалы роста заполняется по мере прокрутки ---------- */
  function initGrowth() {
    var el = $("[data-grow]"); if (!el) return;
    if (RM) { el.style.setProperty("--p", 1); return; }
    var ticking = false;
    function upd() { ticking = false; var r = el.getBoundingClientRect(), vh = window.innerHeight; var p = (vh * 0.6 - r.top) / r.height; el.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3)); }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd); upd();
  }
  /* ---------- «Для партнёров»: подсветка текущего раздела в липком меню; кнопки разделов выбирают направление в форме ---------- */
  function initPartnerNav() {
    var nav = $("[data-pt-nav]"); if (!nav) return;
    var links = $$("a[href^='#']", nav), map = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("href").slice(1)); if (s) map[s.id] = a; });
    function mark(id) {
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      var a = map[id]; if (!a) return; a.setAttribute("aria-current", "true");
      var ul = a.parentNode.parentNode; if (ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: a.offsetLeft - 16, behavior: RM ? "auto" : "smooth" });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); }); }, { rootMargin: "-35% 0px -60% 0px" });
      Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    }
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pt-who]"); if (!b) return;
      var r = $('#form input[name="who"][value="' + b.getAttribute("data-pt-who") + '"]'); if (r) r.checked = true;
    });
    /* Старые адреса разделов (retail.html и т. п.) ведут сюда с якорем — радиокнопку выбираем и по нему */
    var who = { retail: "retail", stm: "stm", horeca: "b2g", "export": "export", suppliers: "supplier" }[location.hash.slice(1)];
    if (who) { var r0 = $('#form input[name="who"][value="' + who + '"]'); if (r0) r0.checked = true; }
  }
  /* ---------- Карта поставок из Челябинска (главная) ----------
     Контуры стран — NP_GEO (geo-export.js, проекция Ламберта); точки — по той же проекции.
     Экспорт — дуги в страны (точка — столица, подпись — страна); сети в России — города из NP.CITIES;
     маркетплейсы — пунктир до Владивостока (доставка по всей России). */
  function initExportMap() {
    var G = window.NP_GEO; if (!G) return;
    $$("[data-export-map]").forEach(function (el) {
      var p = G.proj, D = Math.PI / 180;
      function P(lon, lat) { var r = p.F / Math.pow(Math.tan(Math.PI / 4 + lat * D / 2), p.n), t = p.n * (lon - p.l0) * D; return [(r * Math.sin(t) - p.minX) * p.S, (-(p.r0 - r * Math.cos(t)) - p.minY) * p.S]; }
      function f(v) { return Math.round(v * 10) / 10; }
      function arc(a, b, k) {
        var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
        if (ny > 0) { nx = -nx; ny = -ny; }
        return "M" + f(a[0]) + " " + f(a[1]) + "Q" + f((a[0] + b[0]) / 2 + nx * L * k) + " " + f((a[1] + b[1]) / 2 + ny * L * k) + " " + f(b[0]) + " " + f(b[1]);
      }
      function pos(pt) { return "left:" + f(pt[0] / G.w * 100) + "%;top:" + f(pt[1] / G.h * 100) + "%"; }
      var hubCity = NP.CITIES.filter(function (c) { return c.id === "chelyabinsk"; })[0], hub = P(hubCity.lon, hubCity.lat);
      var EXPORT = [
        { id: "by", ru: "Беларусь", en: "Belarus", lon: 27.56, lat: 53.9 },
        { id: "kz", ru: "Казахстан", en: "Kazakhstan", lon: 71.43, lat: 51.17 },
        { id: "uz", ru: "Узбекистан", en: "Uzbekistan", lon: 69.28, lat: 41.31, left: true },
        { id: "kg", ru: "Кыргызстан", en: "Kyrgyzstan", lon: 74.59, lat: 42.87 }
      ];
      /* На карте — крупные города; остальные перечислены в легенде одной цифрой */
      var MAPC = ["moscow", "spb", "ekaterinburg", "rostov", "perm", "tyumen", "nnovgorod", "samara", "volgograd", "krasnodar", "kaliningrad"];
      var allCities = NP.CITIES.filter(function (c) { return c.id !== "chelyabinsk"; });
      var cities = allCities.filter(function (c) { return MAPC.indexOf(c.id) >= 0; }), restN = allCities.length - cities.length;
      var VLAD = { ru: "Владивосток", en: "Vladivostok", lon: 131.89, lat: 43.12 }, vlad = P(VLAD.lon, VLAD.lat);
      function nm(o) { return EN && o.en ? o.en : o.ru || o.name; }
      var routes = "", dots = "", pkts = "", labels = "";
      cities.forEach(function (c) {
        var pt = P(c.lon, c.lat);
        routes += '<path class="xmap__route xmap__route--ru" d="' + arc(hub, pt, 0.14) + '"/>';
        dots += '<circle class="xmap__dot" cx="' + f(pt[0]) + '" cy="' + f(pt[1]) + '" r="3.4"><title>' + esc(nm(c)) + "</title></circle>";
        var end = c.id === "kaliningrad", major = end || c.id === "moscow";
        if (major) labels += '<span class="xmap__label xmap__label--city' + (end ? " xmap__label--end" : "") + '" style="' + pos(pt) + '">' + esc(nm(c)) + "</span>";
      });
      routes += '<path class="xmap__route xmap__route--web" d="' + arc(hub, vlad, 0.16) + '"/>';
      dots += '<circle class="xmap__dot xmap__dot--web" cx="' + f(vlad[0]) + '" cy="' + f(vlad[1]) + '" r="4"/>';
      labels += '<span class="xmap__label xmap__label--city xmap__label--end xmap__label--l" style="' + pos(vlad) + '">' + esc(nm(VLAD)) + "</span>";
      EXPORT.forEach(function (x, i) {
        var pt = P(x.lon, x.lat), id = "xr-" + x.id;
        routes += '<path class="xmap__route xmap__route--ex" id="' + id + '" data-c="' + x.id + '" pathLength="1" style="transition-delay:' + (0.3 + i * 0.25) + 's" d="' + arc(hub, pt, x.id === "by" ? 0.12 : 0.22) + '"/>';
        dots += '<circle class="xmap__dot xmap__dot--ex" cx="' + f(pt[0]) + '" cy="' + f(pt[1]) + '" r="5.5"/>';
        if (!RM) pkts += '<circle class="xmap__pkt" r="3.2"><animateMotion dur="' + (2.6 + i * 0.4) + 's" begin="' + (1.8 + i * 0.3) + 's" repeatCount="indefinite"><mpath href="#' + id + '"/></animateMotion></circle>';
        labels += '<span class="xmap__label xmap__label--ex' + (x.left ? " xmap__label--l" : "") + '" data-c="' + x.id + '" style="' + pos(pt) + '">' + esc(nm(x)) + "<small>" + (EN ? "export" : "экспорт") + "</small></span>";
      });
      labels += '<span class="xmap__label xmap__label--hub" style="' + pos(hub) + '">' + (EN ? "Chelyabinsk" : "Челябинск") + "<small>" + (EN ? "our production" : "наше производство") + "</small></span>";
      var star = "M0-11L3.2-3.4 11.4-3.4 4.8 1.6 7.2 9.6 0 4.8-7.2 9.6-4.8 1.6-11.4-3.4-3.2-3.4Z";
      var wm = P(100, 63.5), title = EN
        ? "Delivery map: production in Chelyabinsk; export to Belarus, Kazakhstan, Uzbekistan and Kyrgyzstan; retail chains in " + cities.map(nm).join(", ") + "; marketplaces deliver across Russia."
        : "Карта поставок: производство в Челябинске; экспорт в Беларусь, Казахстан, Узбекистан и Кыргызстан; сети в городах: " + cities.map(nm).join(", ") + "; маркетплейсы — доставка по всей России до Владивостока.";
      el.innerHTML = '<div class="xmap__canvas"><svg class="xmap__svg" viewBox="0 0 ' + G.w + " " + G.h + '" role="img" aria-label="' + esc(title) + '">' +
        '<defs><radialGradient id="xmap-glow"><stop offset="0" stop-color="#f3b86c" stop-opacity=".5"/><stop offset="1" stop-color="#f3b86c" stop-opacity="0"/></radialGradient></defs>' +
        '<path class="xmap__other" d="' + G.paths.other + '"/><path class="xmap__ru" d="' + G.paths.ru + '"/>' +
        EXPORT.map(function (x) { return '<path class="xmap__ex" data-c="' + x.id + '" d="' + G.paths[x.id] + '"/>'; }).join("") +
        '<text class="xmap__wm" x="' + f(wm[0]) + '" y="' + f(wm[1]) + '">' + (EN ? "RUSSIA" : "РОССИЯ") + "</text>" +
        routes + dots + pkts +
        '<g transform="translate(' + f(hub[0]) + " " + f(hub[1]) + ')"><circle r="46" fill="url(#xmap-glow)"/><circle class="xmap__pulse" r="12"/><circle class="xmap__pulse xmap__pulse--2" r="12"/><circle r="13" class="xmap__hub"/><path class="xmap__star" d="' + star + '"/></g>' +
        '</svg><div class="xmap__labels" aria-hidden="true">' + labels + "</div></div>" +
        '<ul class="xmap__legend">' +
        '<li><span class="xmap__key xmap__key--hub" aria-hidden="true"></span><span><b>' + (EN ? "Production" : "Производство") + "</b>" + (EN ? "Chelyabinsk, since 2003" : "Челябинск, с 2003 года") + "</span></li>" +
        '<li><span class="xmap__key xmap__key--ex" aria-hidden="true"></span><span><b>' + (EN ? "Export" : "Экспорт") + "</b>" + EXPORT.map(nm).join(", ") + "</span></li>" +
        '<li><span class="xmap__key xmap__key--ru" aria-hidden="true"></span><span><b>' + (EN ? "Retail chains in Russia" : "Сети в России") + "</b>" + cities.map(nm).join(", ") + (restN > 0 ? (EN ? " and " + restN + " more cities" : " и ещё " + restN + " " + plural(restN, ["город", "города", "городов"])) : "") + "</span></li>" +
        '<li><span class="xmap__key xmap__key--web" aria-hidden="true"></span><span><b>' + (EN ? "Marketplaces" : "Маркетплейсы") + "</b>" + (EN ? "Delivery across Russia, from Kaliningrad to Vladivostok" : "Доставка по всей России — от Калининграда до Владивостока") + "</span></li></ul>";
      /* Наведение на подпись страны подсвечивает её контур и маршрут */
      $$(".xmap__label--ex", el).forEach(function (lbl) {
        var c = lbl.getAttribute("data-c");
        function hot(on) { $$('[data-c="' + c + '"]', el).forEach(function (x) { x.classList.toggle("is-hot", on); }); }
        lbl.addEventListener("mouseenter", function () { hot(true); }); lbl.addEventListener("mouseleave", function () { hot(false); });
      });
      if (!("IntersectionObserver" in window) || RM) { el.classList.add("is-in"); return; }
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { el.classList.add("is-in"); io.disconnect(); } }, { rootMargin: "0px 0px -15% 0px" });
      io.observe(el);
    });
  }
  /* Соцпроекты на главной — карусель: письма «веером» на подложке, события — фото */
  function initProjectStrip() {
    var el = $("[data-projects-strip]"); if (!el) return;
    el.innerHTML = projectsSorted().map(projectCard).join("");
  }
  /* ---------- Видео: обложка-кнопка, плеер подгружается только по клику ---------- */
  function initVideos() {
    var byId = {}; (NP.VIDEOS || []).forEach(function (v) { byId[v.id] = v; });
    $$("[data-videos]").forEach(function (el) {
      var list = el.getAttribute("data-videos").split(",").map(function (s) { return byId[s.trim()]; }).filter(Boolean);
      el.innerHTML = list.map(function (v) {
        var title = EN && v.titleEn ? v.titleEn : v.title;
        return '<figure class="video-card video-card--' + v.o + ' reveal"><button type="button" class="video-card__play" data-video="' + v.id + '" aria-label="' + esc((EN ? "Play video: " : "Смотреть видео: ") + title + ", " + v.dur) + '">' +
          '<img src="' + img("video/" + v.id + ".jpg") + '" alt="" loading="lazy" decoding="async"><span class="video-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>' +
          '<span class="video-card__dur" aria-hidden="true">' + esc(v.dur) + "</span></button><figcaption>" + esc(title) + "</figcaption></figure>";
      }).join(""); initReveal(el);
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-video]"); if (!b) return;
    var v = (NP.VIDEOS || []).filter(function (x) { return x.id === b.getAttribute("data-video"); })[0]; if (!v) return;
    var vid = document.createElement("video");
    vid.src = ROOT + "assets/video/" + v.id + ".mp4"; vid.poster = img("video/" + v.id + ".jpg");
    vid.controls = true; vid.playsInline = true; vid.preload = "auto"; vid.className = "video-card__player";
    vid.setAttribute("aria-label", EN && v.titleEn ? v.titleEn : v.title);
    b.replaceWith(vid); vid.focus();
    var pr = vid.play(); if (pr && pr.catch) pr.catch(function () { /* автозапуск запрещён — остаются кнопки плеера */ });
  });
  /* Одновременно играет только один ролик */
  document.addEventListener("play", function (e) { $$("video").forEach(function (x) { if (x !== e.target && !x.paused) x.pause(); }); }, true);

  function initFeatured() {
    $$("[data-featured]").forEach(function (el) {
      var ids = el.getAttribute("data-featured").split(",");
      var items = ids.map(function (s) { var p = s.split(":"); return { p: findProduct(p[0]), f: p[1] }; }).filter(function (x) { return x.p; });
      el.innerHTML = items.map(function (x) { return productCard(x.p, x.f); }).join(""); syncAddButtons(); initReveal(el);
    });
  }
  function initCounts() {
    var nP = NP.PRODUCTS.length, nPos = NP.PRODUCTS.reduce(function (s, p) { return s + p.formats.length; }, 0);
    $$("[data-count-products]").forEach(function (e) { e.textContent = nP; });
    $$("[data-count-positions]").forEach(function (e) { e.textContent = nPos; });
    /* Слова согласуются с числом: «35 продуктов», «68 позиций» */
    $$("[data-count-products-word]").forEach(function (e) { e.textContent = plural(nP, T.products); });
    $$("[data-count-positions-word]").forEach(function (e) { e.textContent = plural(nPos, T.positions); });
    $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
  }

  /* ---------- Запуск ---------- */
  renderLinks();
  initCounts();
  initFeatured();
  initFaq();
  initAwards();
  initBest100();
  initReviews();
  initProjectStrip();
  initExportMap();
  initPartnerNav();
  initGrowth();
  initVideos();
  initCatalog();
  initProduct();
  initBrand();
  initWhere();
  initRetailStrip();
  initNews();
  initSocial();
  initTabs(document);
  initCarousels(document);
  initReveal(document);
  updateCounters(false);
  syncAddButtons();
})();

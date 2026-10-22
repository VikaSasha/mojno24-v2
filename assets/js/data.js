/* ==========================================================================
   Данные сайта «Новые продукты». Единый источник для каталога, карточек,
   брендов, «Где купить», новостей, соцпроектов и FAQ (RU + EN).
   Факты — только из материалов папки «! Маркетинг» и этикеток.
   Пометка TBD("...") выводится на сайте как [уточнить: ...] (класс .tbd).
   ========================================================================== */
(function () {
  "use strict";
  var TBD = function (t) { return { tbd: t }; };

  /* ---------- Контакты и внешние ссылки ----------
     Пустая строка = ссылка ещё не прислана: кнопка/иконка не выводится. */
  var CONFIG = {
    company: "ООО «Новые продукты»",
    companyEn: "Novye Produkty LLC",
    phone: "+7 (904) 305-42-75",
    phoneHref: "tel:+79043054275",
    email: "info@newprod.ru",
    address: "454047, г. Челябинск, ул. Лазурная, д. 8",
    addressEn: "8 Lazurnaya St., Chelyabinsk 454047, Russia",
    requisites: { inn: "7453101828", kpp: "746001001", ogrn: "1037403884099" },
    hours: "с 8:00 до 17:00 по Челябинску (МСК+2)",
    hoursEn: "8:00–17:00 Chelyabinsk time (UTC+5)",
    marketplaces: {
      ozon: { name: "Ozon", url: "https://www.ozon.ru/seller/novye-produkty-3798560/", color: "#005bff", logo: "retail/ozon.svg" },
      wb:   { name: "Wildberries", url: "", color: "#a73afd", logo: "retail/wildberries.svg" },
      ym:   { name: "Яндекс Маркет", nameEn: "Yandex Market", url: "", color: "#ffcc00", logo: "retail/yandex-market.svg" }
    },
    /* Ссылки на соцсети пришлёт команда — до этого блоки соцсетей скрыты */
    socials: [
      { id: "vk", name: "ВКонтакте", short: "VK", url: "" },
      { id: "rutube", name: "Rutube", short: "Rutube", url: "" },
      { id: "dzen", name: "Дзен", short: "Дзен", url: "" },
      { id: "tiktok", name: "TikTok", short: "TikTok", url: "" },
      { id: "youtube", name: "YouTube", short: "YouTube", url: "" },
      { id: "instagram", name: "Instagram*", short: "Instagram*", url: "", meta: true }
    ],
    exportCountries: [
      { id: "ru", ru: "Россия", en: "Russia", home: true },
      { id: "by", ru: "Беларусь", en: "Belarus" },
      { id: "kz", ru: "Казахстан", en: "Kazakhstan" },
      { id: "uz", ru: "Узбекистан", en: "Uzbekistan" },
      { id: "kg", ru: "Кыргызстан", en: "Kyrgyzstan" }
    ]
  };

  /* ---------- Категории ---------- */
  var CATEGORIES = [
    { id: "soups", ru: "Супы, каши и пюре", en: "Soups, porridges & mash", short: "Супы и каши" },
    { id: "snacks", ru: "Снеки и десерты", en: "Snacks & desserts", short: "Снеки" },
    { id: "grains", ru: "Крупы и мука", en: "Grains & flour", short: "Крупы и мука" }
  ];

  /* ---------- Форматы упаковки ---------- */
  var FORMATS = {
    box:     { ru: "Коробка 240 г", short: "Коробка", note: "6 пакетиков по 40 г", en: "Box 240 g", noteEn: "6 sachets × 40 g",
               about: "Шесть порционных пакетиков по 40 г в картонной коробке — основной формат для полки супермаркета.",
               aboutEn: "Six 40 g sachets in a carton — the core format for supermarket shelves." },
    doy:     { ru: "Дой-пак", short: "Дой-пак", note: "5 пакетиков по 40 г", en: "Doypack", noteEn: "5 sachets × 40 g",
               about: "Пять порционных пакетиков по 40 г в мягкой упаковке — основной формат для маркетплейсов и экспорта.",
               aboutEn: "Five 40 g sachets in a flexible pack — the main format for marketplaces and export." },
    cup:     { ru: "Стакан", short: "Стакан", note: "одна порция, 50 г", en: "Cup", noteEn: "single serve, 50 g",
               about: "Одна порция в стакане — для офиса, дороги и магазинов у дома.",
               aboutEn: "One serving in a cup — for office, travel and convenience stores." },
    /* Новый дизайн стаканов Street Lunch: ещё не в продаже */
    cupnew:  { ru: "Стакан · новый дизайн", short: "Стакан, новый", note: "скоро в продаже", en: "Cup · new design", noteEn: "coming soon", soon: true,
               about: "Стакан Street Lunch в новом дизайне — скоро в продаже.",
               aboutEn: "Street Lunch cup in the new design — coming soon." },
    showbox: { ru: "Шоу-бокс", short: "Шоу-бокс", note: "25 пакетиков по 40 г", en: "Display box", noteEn: "25 sachets × 40 g",
               about: "25 порционных пакетиков по 40 г в выкладочной коробке — готовая выкладка у кассы и на полке.",
               aboutEn: "25 single 40 g sachets in a shelf-ready display box." },
    rmbox:   { ru: "Коробка", short: "Коробка", note: "13,5 × 13,5 × 6 см", en: "Box", noteEn: "13.5 × 13.5 × 6 cm",
               about: "Цветная коробка с прозрачным пакетом внутри, размер 13,5 × 13,5 × 6 см.",
               aboutEn: "Colour box with a clear inner bag, 13.5 × 13.5 × 6 cm." },
    bar:     { ru: "Батончик", short: "Батончик", note: "поштучно", en: "Bar", noteEn: "single",
               about: "Хрустящий батончик из воздушных круп в индивидуальной упаковке, продаётся поштучно.",
               aboutEn: "Crispy puffed-grain bar in an individual wrapper, sold by the piece." },
    pet:     { ru: "ПЭТ-банка", short: "ПЭТ-банка", note: "для маркетплейсов", en: "PET jar", noteEn: "for marketplaces",
               about: "Прозрачная ПЭТ-банка — фасовка для маркетплейсов, продукт виден покупателю.",
               aboutEn: "Clear PET jar — the marketplace pack, product visible to the shopper." },
    bb:      { ru: "Упаковка B&B", short: "B&B", note: "розница и опт", en: "B&B pack", noteEn: "retail & wholesale",
               about: "Тот же продукт в упаковке B&B — для розничных сетей и оптовых покупателей.",
               aboutEn: "The same product in B&B packaging — for retail chains and wholesale." }
  };
  var FORMAT_ORDER = ["box", "doy", "cup", "showbox", "rmbox", "bar", "pet", "bb"];

  /* ---------- Группы каталога (порядок — как на сайте) ----------
     split: подгруппы по форматам упаковки внутри бренда */
  var CATALOG_GROUPS = [
    { id: "risomishki", brands: ["risomishki"], ru: "РисоМишки", en: "RisoMishki" },
    { id: "street-lunch", brands: ["street-lunch"], ru: "Street Lunch", en: "Street Lunch", split: ["box", "cup", "cupnew", "doy", "showbox"] },
    { id: "nasha-kasha", brands: ["nasha-kasha"], ru: "Наша Каша", en: "Nasha Kasha" },
    { id: "hrumstik", brands: ["hrumstik"], ru: "Хрумстики", en: "Khrumstik bars" },
    { id: "krupy", brands: ["krupy"], ru: "Зерно и мука", en: "Grains & flour" }
  ];

  /* ---------- Бренды ---------- */
  var BRANDS = {
    "street-lunch": {
      name: "Street Lunch", ru: "Стрит Ланч", cat: "soups",
      tagline: "Суп-пюре без варки за 3 минуты",
      taglineEn: "Instant purée soup, ready in 3 minutes, no cooking",
      lead: "Гороховые и чечевичные супы-пюре и линейка «по-Уральски». Высыпать пакетик, залить кипятком, подождать три минуты — и горячий сытный обед готов там, где нет плиты.",
      leadEn: "Pea and lentil purée soups plus the “Ural-style” range. Pour a sachet, add boiling water, wait three minutes — a hot, filling lunch wherever there is no stove.",
      color: "#c8361e", fg: "#ffffff", hero: "cutouts/lg-sl-griby-box.png", tile: "products/sl-griby-box.jpg"
    },
    "risomishki": {
      name: "РисоМишки", ru: "РисоМишки", en: "RisoMishki", cat: "snacks",
      tagline: "Хрустящий десерт из воздушного риса",
      taglineEn: "Crispy puffed-rice dessert",
      lead: "Медвежата из воздушного риса в глазури — белой, тёмной, молочной и фруктовых. «Новинка года» WorldFood Moscow 2025 в категории «Кондитерские изделия».",
      leadEn: "Puffed-rice teddy bears in white, dark, milk and fruit glazes. “New Product of the Year” at WorldFood Moscow 2025, confectionery category.",
      color: "#1673b5", fg: "#ffffff", hero: "cutouts/lg-rm-mango.png", tile: "products/rm-mango.jpg"
    },
    "nasha-kasha": {
      name: "Наша Каша", ru: "Наша Каша", en: "Nasha Kasha", cat: "soups",
      tagline: "Гречневая каша-пюре без варки",
      taglineEn: "Instant buckwheat porridge",
      lead: "Гречневая каша-пюре в порционных пакетиках: шесть порций в коробке, готовится без варки.",
      leadEn: "Buckwheat porridge in single-serve sachets: six servings per box, no cooking needed.",
      color: "#9b2a2e", fg: "#ffffff", hero: "cutouts/lg-kasha-griby-box.png", tile: "products/kasha-griby-box.jpg", logo: "brand/nk-logo.png"
    },
    "hrumstik": {
      name: "Хрумстик", ru: "Хрумстик", en: "Khrumstik", cat: "snacks",
      tagline: "Батончики из воздушных круп с фруктозой",
      taglineEn: "Puffed-grain bars with fructose",
      lead: "Хрустящие батончики из воздушного риса, гречки, пшеницы и ячменя с курагой, корицей, орехом или семечками. Подслащены фруктозой.",
      leadEn: "Crispy bars of puffed rice, buckwheat, wheat and barley with dried apricot, cinnamon, walnut or seeds. Sweetened with fructose.",
      color: "#7a5a24", fg: "#ffffff", hero: null, tile: "products/hr-kuraga.jpg", logo: "brand/hr-logo.png"
    },
    "krupy": {
      name: "Крупы и мука", ru: "Крупы и мука", en: "Grains & flour", cat: "grains",
      tagline: "Чистые крупы и мука из бобовых и злаков",
      taglineEn: "Plain grains and pulse flours",
      lead: "Крупы и мука без добавок. Готовим две фасовки: ПЭТ-банку для маркетплейсов и упаковку B&B для сетей и опта.",
      leadEn: "Plain grains and flours with no additives. Two packs are in development: PET jars for marketplaces and B&B packs for retail and wholesale.",
      color: "#1c5e35", fg: "#ffffff", hero: null, tile: "products/pet-grechka.jpg"
    }
  };

  /* ---------- Общие тексты по линейкам ---------- */
  var SL_PREP = "Высыпьте пакетик (40 г) в чашку, залейте 250 мл кипятка или горячей воды, перемешайте и подождите 3 минуты.";
  var SL_PREP_EN = "Pour one 40 g sachet into a mug, add 250 ml of boiling or hot water, stir and wait 3 minutes.";
  var SL_STORE = "12 месяцев при температуре до +25 °C и относительной влажности воздуха не более 75%.";
  var SL_STORE_EN = "12 months at up to +25 °C and relative humidity no higher than 75%.";
  var RM_STORE = SL_STORE, RM_STORE_EN = SL_STORE_EN;
  var HR_STORE = "12 месяцев при температуре от +5 до +23 °C и относительной влажности воздуха не более 75%.";
  var HR_STORE_EN = "12 months at +5…+23 °C and relative humidity no higher than 75%.";
  var MAKER = "ООО «Новые продукты», г. Челябинск";

  /* Фото дой-паков есть не для всех вкусов (макеты из «Новой папки»); у остальных — заглушка */
  var DOY_IMG = { griby: "products/sl-griby-doy.jpg", govyadina: "products/sl-govyadina-doy.jpg", rebra: "products/sl-rebra-doy.jpg" };

  /* Шаблоны форматов Street Lunch: картинки по вкусу */
  function slFormats(key, list) {
    var map = {
      box:     { f: "box", img: "products/sl-" + key + "-box.jpg", weight: "240 г (6 × 40 г)", weightEn: "240 g (6 × 40 g)" },
      doy:     { f: "doy", img: DOY_IMG[key] || "ph:doy", weight: "200 г (5 × 40 г)", weightEn: "200 g (5 × 40 g)" },
      /* стакан в продаже — классический крафтовый дизайн; новый цветной дизайн — «скоро в продаже» */
      cup:     { f: "cup", img: "products/sl-" + key + "-cup-classic.jpg", weight: "50 г", weightEn: "50 g" },
      cupnew:  { f: "cupnew", img: "products/sl-" + key + "-cup.jpg", weight: "50 г", weightEn: "50 g" },
      showbox: { f: "showbox", img: "products/sl-" + key + "-showbox.jpg", weight: "1000 г (25 × 40 г)", weightEn: "1000 g (25 × 40 g)", extraImg: "products/sl-" + key + "-packet.jpg" }
    };
    return list.map(function (f) { return map[f]; });
  }

  /* ---------- Продукты (35 продуктов; позиции = продукт × формат) ---------- */
  var PRODUCTS = [
    /* Street Lunch */
    { id: "sl-griby", brand: "street-lunch", cat: "soups", name: "Гороховый с грибами", nameEn: "Pea soup with mushrooms", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: slFormats("griby", ["box", "doy", "cup", "cupnew", "showbox"]),
      composition: "Горох, отруби зерновые молотые, грибы белые сушёные, овощи сушёные: морковь, лук, чеснок, укроп, мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.",
      nutrition: { p: "17,6", f: "5,3", c: "57,2", kcal: "336" }, facts: ["Без варки", "3 минуты", "17% белка"], gallery: ["scenes/sl-desk.jpg"] },
    { id: "sl-govyadina", brand: "street-lunch", cat: "soups", name: "Гороховый с «говядиной»", nameEn: "Pea soup, beef flavour", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: slFormats("govyadina", ["box", "doy", "cupnew", "showbox"]),
      composition: "Горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон говяжий» ЭКО (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.",
      nutrition: { p: "17,5", f: "5,3", c: "57,1" }, facts: ["Без варки", "3 минуты", "17% белка"], gallery: ["scenes/sl-desk-duo.jpg"] },
    { id: "sl-kurica", brand: "street-lunch", cat: "soups", name: "Гороховый с «курицей»", nameEn: "Pea soup, chicken flavour", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: slFormats("kurica", ["box", "doy", "cupnew", "showbox"]),
      composition: "Горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон куриный» ЭКО (соль, сахар, порошок жира топлёного (куриный), ароматизатор «Курица», лук, сельдерей, куркума, фарш варёно-сушёный (куриный)), мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.",
      nutrition: { p: "17,5", f: "5,3", c: "57,1" }, facts: ["Без варки", "3 минуты", "Золото «Агро-2025»"], gallery: ["scenes/sl-box-green.jpg"] },
    { id: "sl-rebra", brand: "street-lunch", cat: "soups", name: "Чечевичный с «копчёными рёбрышками»", nameEn: "Lentil soup, smoked ribs flavour", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: slFormats("rebra", ["box", "doy", "cup", "cupnew", "showbox"]),
      composition: "Чечевица, горох, отруби зерновые молотые, овощи сушёные: морковь, лук, чеснок, укроп, перец чили, «Бульон говяжий» ЭКО (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), ароматизатор «Барбекю», мальтодекстрин, картофельные хлопья, соль, масло подсолнечное рафинированное.",
      nutrition: { p: "14,8", f: "3,6", c: "56,7", kcal: "318" }, facts: ["Без варки", "3 минуты", "Чечевица и горох"], gallery: ["scenes/sl-backpack.jpg"] },
    { id: "sl-ovoshchi", brand: "street-lunch", cat: "soups", name: "Гороховый с овощами", nameEn: "Pea soup with vegetables", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: slFormats("ovoshchi", ["box", "doy", "cup", "showbox"]),
      composition: "Горох, отруби зерновые молотые, овощи сушёные: тыква, морковь, томат, паприка, баклажан, сельдерей, лук жареный, укроп; масло подсолнечное рафинированное, мальтодекстрин, соль, лецитин подсолнечный.",
      nutrition: { p: "17,3", f: "5,3", c: "57,4", kcal: "334" }, facts: ["Без варки", "3 минуты", "Без мясных ароматизаторов"], gallery: ["scenes/sl-bowl.jpg"] },
    { id: "sl-assorti", brand: "street-lunch", cat: "soups", name: "Ассорти: 5 вкусов", nameEn: "Assorted: 5 flavours", kind: "Суп-пюре", kindEn: "Purée soup",
      formats: [{ f: "box", img: "ph:box", weight: "240 г", weightEn: "240 g" }, { f: "doy", img: "ph:doy", weight: "200 г (5 × 40 г)", weightEn: "200 g (5 × 40 g)" }, { f: "showbox", img: "ph:showbox", weight: "1000 г (25 × 40 г)", weightEn: "1000 g (25 × 40 g)" }],
      intro: "Пять вкусов в одной упаковке: грибы, «говядина», «курица», «копчёные рёбрышки» и овощи. Удобно, чтобы попробовать всю линейку.",
      introEn: "Five flavours in one pack: mushrooms, beef, chicken, smoked ribs and vegetables — the easy way to try the whole range.",
      composition: "Состав каждого вкуса — в его карточке: грибы, «говядина», «курица», «копчёные рёбрышки», овощи.",
      facts: ["5 вкусов", "Без варки", "3 минуты"], gallery: ["scenes/sl-desk-duo.jpg"] },
    { id: "sl-borshch", brand: "street-lunch", line: "По-Уральски", cat: "soups", name: "Борщ «по-Уральски»", nameEn: "Ural-style borscht", kind: "Суп быстрого приготовления", kindEn: "Instant soup",
      formats: [{ f: "box", img: "products/sl-borshch-box.jpg", weight: "240 г (6 пакетов)", weightEn: "240 g (6 sachets)" }, { f: "doy", img: "products/sl-borshch-doy.jpg", weight: "200 г (5 × 40 г)", weightEn: "200 g (5 × 40 g)" }, { f: "cup", img: "products/sl-borshch-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: "Картофельные хлопья, овощи сушёные: свёкла, капуста, томат, паприка, морковь, лук жареный, «Бульон говяжий ЭКО» (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), мальтодекстрин, перловка, усилитель вкуса и аромата E621, соль.",
      nutrition: { p: "10,3", f: "1,3", c: "58,4", kcal: "286,5" }, facts: ["Без варки", "3 минуты", "Серебро «Агро-2025»"], gallery: [] },
    { id: "sl-solyanka", brand: "street-lunch", line: "По-Уральски", cat: "soups", name: "Солянка «по-Уральски»", nameEn: "Ural-style solyanka", kind: "Суп быстрого приготовления", kindEn: "Instant soup",
      formats: [{ f: "box", img: "products/sl-solyanka-box.jpg", weight: "240 г (6 пакетов)", weightEn: "240 g (6 sachets)" }, { f: "doy", img: "products/sl-solyanka-doy.jpg", weight: "200 г (5 × 40 г)", weightEn: "200 g (5 × 40 g)" }, { f: "cup", img: "products/sl-solyanka-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: "Картофельные хлопья, овощи сушёные: томат, морковь, лук, паприка, баклажан, оливки, чеснок, «Бульон говяжий ЭКО» (соль, сахар, дрожжевой экстракт, ароматизатор «Говядина», чеснок, лавровый лист), мальтодекстрин, перловка, перец, соль.",
      nutrition: { p: "8,2", f: "4,3", c: "54,3", kcal: "288,7" }, facts: ["Без варки", "3 минуты", "С оливками"], gallery: [] },

    /* Street Lunch: позиции только в стакане (классический дизайн) — каши и пюре «по-Уральски» */
    { id: "sl-pyure", brand: "street-lunch", line: "По-Уральски", cat: "soups", name: "Пюре картофельное «по-Уральски»", nameEn: "Ural-style mashed potatoes", kind: "Пюре быстрого приготовления", kindEn: "Instant mash", cupOnly: true, tagline: "Пюре быстрого приготовления в стакане", taglineEn: "Instant mash in a cup", intro: "Картофельное пюре линейки «по-Уральски» в стакане Street Lunch — одна порция 50 г.", introEn: "Ural-style mashed potatoes in a Street Lunch cup — one 50 g serving.",
      formats: [{ f: "cup", img: "products/sl-pyure-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: TBD("состав пюре картофельного «по-Уральски»"), facts: ["Линейка «по-Уральски»", "В стакане"], gallery: [] },
    { id: "sl-kasha-gorokh", brand: "street-lunch", cat: "soups", name: "Каша гороховая с жареным луком", nameEn: "Pea porridge with fried onion", kind: "Каша быстрого приготовления", kindEn: "Instant porridge", cupOnly: true, tagline: "Каша быстрого приготовления в стакане", taglineEn: "Instant porridge in a cup", intro: "Гороховая каша с жареным луком в стакане Street Lunch — одна порция 50 г.", introEn: "Pea porridge with fried onion in a Street Lunch cup — one 50 g serving.",
      formats: [{ f: "cup", img: "products/sl-kasha-gorokh-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: TBD("состав каши гороховой с жареным луком"), facts: ["В стакане"], gallery: [] },
    { id: "sl-kasha-grech", brand: "street-lunch", cat: "soups", name: "Каша гречневая с мясом и зеленью", nameEn: "Buckwheat porridge with meat and herbs", kind: "Каша быстрого приготовления", kindEn: "Instant porridge", cupOnly: true, tagline: "Каша быстрого приготовления в стакане", taglineEn: "Instant porridge in a cup", intro: "Гречневая каша с мясом и зеленью в стакане Street Lunch — одна порция 50 г.", introEn: "Buckwheat porridge with meat and herbs in a Street Lunch cup — one 50 g serving.",
      formats: [{ f: "cup", img: "products/sl-kasha-grech-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: TBD("состав каши гречневой с мясом и зеленью"), facts: ["В стакане"], gallery: [] },
    { id: "sl-kasha-rizotto", brand: "street-lunch", cat: "soups", name: "Каша ризотто с белыми грибами", nameEn: "Risotto porridge with porcini", kind: "Каша быстрого приготовления", kindEn: "Instant porridge", cupOnly: true, tagline: "Каша быстрого приготовления в стакане", taglineEn: "Instant porridge in a cup", intro: "Каша-ризотто с белыми грибами в стакане Street Lunch — одна порция 50 г.", introEn: "Risotto-style porridge with porcini in a Street Lunch cup — one 50 g serving.",
      formats: [{ f: "cup", img: "products/sl-kasha-rizotto-cup-classic.jpg", weight: "50 г", weightEn: "50 g" }],
      composition: TBD("состав каши ризотто с белыми грибами"), facts: ["В стакане"], gallery: [] },

    /* Наша Каша */
    { id: "kasha-griby", brand: "nasha-kasha", cat: "soups", name: "Гречневая с грибами", nameEn: "Buckwheat with mushrooms", kind: "Каша-пюре", kindEn: "Instant porridge",
      formats: [{ f: "box", img: "products/kasha-griby-box.jpg", weight: "240 г (6 × 40 г)", weightEn: "240 g (6 × 40 g)" }],
      intro: "Гречневая каша-пюре в шести порционных пакетиках. Готовая порция — около 250 г.",
      introEn: "Buckwheat porridge in six single-serve sachets. About 250 g per prepared serving.",
      prep: TBD("время приготовления и объём воды для каши"), composition: TBD("состав каши «Гречневая с грибами»"), facts: ["Без варки", "6 порций"], gallery: [] },
    { id: "kasha-govyadina", brand: "nasha-kasha", cat: "soups", name: "Гречневая с «говядиной»", nameEn: "Buckwheat, beef flavour", kind: "Каша-пюре", kindEn: "Instant porridge",
      formats: [{ f: "box", img: "products/kasha-govyadina-box.jpg", weight: "240 г (6 × 40 г)", weightEn: "240 g (6 × 40 g)" }],
      intro: "Гречневая каша-пюре в шести порционных пакетиках. Готовая порция — около 250 г.",
      introEn: "Buckwheat porridge in six single-serve sachets. About 250 g per prepared serving.",
      prep: TBD("время приготовления и объём воды для каши"), composition: TBD("состав каши «Гречневая с говядиной»"), facts: ["Без варки", "6 порций"], gallery: [] },

    /* РисоМишки */
    { id: "rm-molochnaya", brand: "risomishki", cat: "snacks", name: "В молочной глазури", nameEn: "Milk glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-molochnaya.jpg", weight: "80 г", weightEn: "80 g" }],
      composition: TBD("состав РисоМишек в молочной глазури"), nutrition: { p: "4,9", f: "21", c: "63,4", kcal: "467" }, facts: ["Воздушный рис", "Без глютена", "Фигурки-медвежата"], gallery: ["scenes/rm-falling.jpg", "scenes/rm-desk.jpg"] },
    { id: "rm-temnaya", brand: "risomishki", cat: "snacks", name: "В тёмной глазури", nameEn: "Dark glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-temnaya.jpg", weight: "80 г", weightEn: "80 g" }],
      composition: TBD("состав РисоМишек в тёмной глазури"), nutrition: { p: "4,9", f: "23", c: "61,4", kcal: "475" }, facts: ["Воздушный рис", "Без глютена", "Фигурки-медвежата"], gallery: ["scenes/rm-choc-bowl.jpg", "scenes/rm-pattern.jpg"] },
    { id: "rm-belaya", brand: "risomishki", cat: "snacks", name: "В белой глазури", nameEn: "White glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-belaya.jpg", weight: "80 г", weightEn: "80 g" }],
      composition: TBD("состав РисоМишек в белой глазури"), nutrition: { p: "3,6", f: "23", c: "62,7", kcal: "474" }, facts: ["Воздушный рис", "Без глютена", "Золото «Агро-2025»"], gallery: ["scenes/rm-white-bowl.jpg", "scenes/rm-lunchbox.jpg"] },
    { id: "rm-apelsin", brand: "risomishki", cat: "snacks", name: "В глазури со вкусом апельсина", nameEn: "Orange-flavour glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-apelsin.jpg", weight: "80 г", weightEn: "80 g" }],
      composition: TBD("состав РисоМишек со вкусом апельсина"), nutrition: { p: "3,0", f: "21,6", c: "66,7", kcal: "470" }, facts: ["Воздушный рис", "Без глютена", "Фруктовая глазурь"], gallery: ["scenes/rm-desk.jpg"] },
    { id: "rm-malina", brand: "risomishki", cat: "snacks", name: "В глазури со вкусом малины", nameEn: "Raspberry-flavour glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-malina.jpg", weight: "80 г", weightEn: "80 g", ean: "4607032223665" }],
      composition: "Глазурь кондитерская со вкусом малины (сахар белый кристаллический свекловичный, заменитель масла какао лауринового типа (гидрогенизированные фракции пальмоядрового масла, эмульгаторы сорбитан тристеарат, лецитин), сыворотка сухая молочная, эмульгатор (соевый лецитин E322), комплексная пищевая добавка для окрашивания пищевых продуктов (глицерин растительный, лецитин соевый, краситель пищевой (E122), пропиленгликоль пищевой, консервант (сорбат калия), ароматизатор пищевой)), крупа рисовая шлифованная (рис круглозёрный), бурый рис, соль пищевая.",
      nutrition: { p: "3,0", f: "21,6", c: "66,7", kcal: "470" }, facts: ["Воздушный рис", "Без глютена", "Фруктовая глазурь"], gallery: ["scenes/rm-strawberry.jpg"] },
    { id: "rm-mango", brand: "risomishki", cat: "snacks", name: "В глазури со вкусом манго", nameEn: "Mango-flavour glaze", kind: "Хрустящий десерт", kindEn: "Crispy dessert",
      formats: [{ f: "rmbox", img: "products/rm-mango.jpg", weight: "80 г", weightEn: "80 g", ean: "4607032223672" }],
      composition: "Сахар, заменитель масла какао лауринового типа, сыворотка сухая молочная, эмульгатор (соевый лецитин E322), ароматизатор «Манго», красители натуральные: экстракт паприки E160c, турмерик; крупа рисовая шлифованная (рис круглозёрный), бурый рис, соль пищевая.",
      nutrition: { p: "3,0", f: "21,6", c: "66,7", kcal: "470" }, facts: ["Воздушный рис", "Без глютена", "Фруктовая глазурь"], gallery: ["scenes/rm-desk.jpg"] },
    { id: "rm-solenye", brand: "risomishki", cat: "snacks", name: "Хлебцы хрустящие солёные", nameEn: "Salted crispbread bears", kind: "Хлебцы без глазури", kindEn: "Unglazed crispbread",
      formats: [{ f: "rmbox", img: "products/rm-solenye.jpg", weight: "40 г", weightEn: "40 g" }],
      composition: "Рис шлифованный, бурый рис, гречка, зелёная гречка, соль.",
      nutrition: { kcal: "325" }, facts: ["Без глютена", "Без лактозы", "Без дрожжей", "Без масла"], gallery: [] },

    /* Хрумстик */
    { id: "hr-kuraga", brand: "hrumstik", cat: "snacks", name: "Многозерновой с курагой", nameEn: "Multigrain with dried apricot", kind: "Батончик с фруктозой", kindEn: "Bar with fructose",
      formats: [{ f: "bar", img: "products/hr-kuraga.jpg", weight: "45 г", weightEn: "45 g", ean: "4607032220510" }],
      composition: "Рис, пшеница, ячмень (перловка), гречка воздушные, курага, фруктоза кристаллическая, патока крахмальная карамельная, жир кулинарный фритюрный (дезодорированные растительные масла, в т. ч. модифицированные, антиокислитель E330), соль поваренная пищевая, эмульгатор лецитин соевый (E322), ароматизатор пищевой «Ванильный».",
      nutrition: { p: "4,4", f: "1,4", c: "73,0", kcal: "313" }, facts: ["С фруктозой", "Воздушные крупы", "Клетчатка 2,3 г"], gallery: ["products/hr-bar.jpg"] },
    { id: "hr-koritsa", brand: "hrumstik", cat: "snacks", name: "Многозерновой с корицей", nameEn: "Multigrain with cinnamon", kind: "Батончик с фруктозой", kindEn: "Bar with fructose",
      formats: [{ f: "bar", img: "products/hr-koritsa.jpg", weight: "40 г", weightEn: "40 g" }],
      composition: TBD("состав Хрумстика с корицей"), nutrition: { p: "5,0", f: "1,7", c: "76,8", kcal: "332" }, facts: ["С фруктозой", "Воздушные крупы", "Корица"], gallery: ["products/hr-bar.jpg"] },
    { id: "hr-orekh", brand: "hrumstik", cat: "snacks", name: "С грецким орехом и семенем подсолнечника", nameEn: "Walnut & sunflower seed", kind: "Батончик с фруктозой", kindEn: "Bar with fructose",
      formats: [{ f: "bar", img: "products/hr-orekh.jpg", weight: "50 г", weightEn: "50 g", ean: "4607032220503" }],
      composition: "Рис, пшеница воздушная, фруктоза кристаллическая, патока крахмальная карамельная, грецкий орех, семя подсолнечника, жир кулинарный фритюрный (дезодорированные растительные масла, в т. ч. модифицированные, антиокислитель E330), соль поваренная пищевая, эмульгатор лецитин соевый (E322), ароматизатор пищевой «Ванильный». Может содержать фрагменты скорлупы.",
      nutrition: { p: "7,0", f: "13,4", c: "63,0", kcal: "391" }, facts: ["С фруктозой", "Грецкий орех", "Клетчатка 3 г"], gallery: ["products/hr-bar.jpg"] },
    { id: "hr-tykva", brand: "hrumstik", cat: "snacks", name: "С семечками тыквы и подсолнечника", nameEn: "Pumpkin & sunflower seeds", kind: "Батончик с фруктозой", kindEn: "Bar with fructose",
      formats: [{ f: "bar", img: "products/hr-tykva.jpg", weight: "45 г", weightEn: "45 g", ean: "4607032220480" }],
      composition: "Рис, гречка (перловка) воздушные, фруктоза кристаллическая, патока крахмальная карамельная, семя тыквы, семя подсолнечника, жир кулинарный фритюрный (дезодорированные растительные масла, в т. ч. модифицированные, антиокислитель E330), соль поваренная пищевая, эмульгатор лецитин соевый (E322), ароматизатор пищевой «Ванильный».",
      nutrition: { p: "7,3", f: "10,4", c: "65,8", kcal: "379" }, facts: ["С фруктозой", "Семечки", "Клетчатка 3,7 г"], gallery: ["products/hr-bar.jpg"] }
  ];

  /* Крупы и мука: два формата (ПЭТ-банка и B&B) у каждого продукта */
  var GRAINS = [
    ["muka-gorokh", "Мука гороховая", "Pea flour", "flour"],
    ["muka-grechka", "Мука гречневая", "Buckwheat flour", "flour"],
    ["muka-yachmen", "Мука ячменная", "Barley flour", "flour"],
    ["muka-oves", "Мука овсяная", "Oat flour", "flour"],
    ["krupa-ris", "Рис чистый", "Plain rice", "grain", "products/pet-ris.jpg"],
    ["krupa-grechka", "Гречка чистая", "Plain buckwheat", "grain", "products/pet-grechka.jpg"],
    ["krupa-polba", "Полба чистая", "Plain spelt", "grain"],
    ["krupa-perlovka", "Перловка чистая", "Plain pearl barley", "grain"],
    ["krupa-polba-drob", "Полба дроблёная", "Cracked spelt", "grain", "products/pet-polba-drob.jpg"],
    ["krupa-pshenica", "Пшеница", "Wheat", "grain"]
  ];
  GRAINS.forEach(function (g) {
    PRODUCTS.push({
      id: g[0], brand: "krupy", cat: "grains", name: g[1], nameEn: g[2], kind: g[3] === "flour" ? "Мука" : "Крупа", kindEn: g[3] === "flour" ? "Flour" : "Grain",
      formats: [
        { f: "pet", img: g[4] || (g[3] === "flour" ? "ph:pet-flour" : "ph:pet"), weight: "фасовка в разработке", weightEn: "pack in development" },
        { f: "bb", img: "ph:bb", weight: "фасовка в разработке", weightEn: "pack in development" }
      ],
      intro: "Без добавок. Фасовка в разработке: ПЭТ-банка для маркетплейсов и упаковка B&B для сетей и опта. Масса упаковки появится на сайте, когда фасовка будет готова.",
      introEn: "No additives. Packs are in development: PET jar for marketplaces and B&B pack for retail and wholesale.",
      composition: g[1].replace(" чистый", "").replace(" чистая", "") + ".",
      facts: ["Без добавок", "Фасовка в разработке"], gallery: []
    });
  });

  /* Хранение и производитель по линейкам */
  PRODUCTS.forEach(function (p) {
    if (p.brand === "street-lunch" && p.cupOnly) { p.prep = TBD("способ приготовления в стакане"); p.storage = TBD("срок и условия хранения"); }
    else if (p.brand === "street-lunch") { p.prep = p.prep || SL_PREP; p.prepEn = SL_PREP_EN; p.storage = SL_STORE; p.storageEn = SL_STORE_EN; p.portion = "≈ 300 г готового супа из пакетика 40 г"; }
    if (p.brand === "nasha-kasha") { p.storage = SL_STORE; p.storageEn = SL_STORE_EN; p.portion = "≈ 250 г готовой каши"; }
    if (p.brand === "risomishki") { p.storage = RM_STORE; p.storageEn = RM_STORE_EN; }
    if (p.brand === "hrumstik") { p.storage = HR_STORE; p.storageEn = HR_STORE_EN; }
    if (p.brand === "krupy") { p.storage = TBD("срок и условия хранения круп и муки"); }
    p.maker = MAKER;
  });

  /* ---------- Где купить: сети и города (данные отдела продаж) ----------
     logo — файл в assets/img/retail (официальные логотипы сетей; без logo выводится название) */
  var RETAIL = [
    { id: "svetofor", logo: "retail/svetofor.png", name: "Светофор", type: "Федеральная сеть", brands: ["street-lunch"], note: "Супы-пюре Street Lunch в коробках по 240 г.", region: "Свердловская, Челябинская, Нижегородская и Ростовская области, Пермский и Краснодарский край, Адыгея", stores: 220 },
    { id: "globus", logo: "retail/globus.svg", name: "GLOBUS", type: "Федеральная сеть", brands: ["street-lunch"], note: "Сеть гипермаркетов.", region: "Москва" },
    { id: "lenta", logo: "retail/lenta.svg", name: "Лента", type: "Федеральная сеть", brands: ["street-lunch"], note: "Супы-пюре Street Lunch в стаканах." },
    { id: "perekrestok", logo: "retail/perekrestok.svg", name: "Перекрёсток", type: "Федеральная сеть", brands: ["risomishki"], note: "РисоМишки в белой и молочной глазури, 80 г.", region: "Москва, Санкт-Петербург, Екатеринбург, Тюмень, Нижний Новгород и ещё 100+ городов", stores: 306 },
    { id: "spar", logo: "retail/spar.svg", name: "SPAR Урал", type: "Региональная сеть", brands: [], note: "Сеть супермаркетов SPAR на Урале." },
    { id: "zhiznmart", logo: "retail/zhiznmart.svg", logoBg: "#00342a", name: "ЖизньМарт", type: "Региональная сеть", brands: ["risomishki"], note: "РисоМишки, в том числе под совместной маркой сети." },
    { id: "yagodka", name: "Ягодка", type: "Региональная сеть", brands: ["risomishki"], note: "Хрустящий десерт РисоМишки." },
    { id: "ariant", logo: "retail/ariant.png", name: "ТС Ариант", type: "Фирменная сеть", brands: ["risomishki"], note: "Фирменная сеть мясной продукции формата «магазин у дома»: 54 магазина в Челябинской области. Хрустящий десерт РисоМишки.", region: "Челябинская область" },
    { id: "mayak", name: "Маяк", type: "Региональная сеть", brands: [], note: "Сеть магазинов." },
    { id: "mindal", logo: "retail/mindal.png", name: "Миндаль", type: "Региональная сеть", brands: ["risomishki"], note: "РисоМишки в белой глазури.", stores: 20 },
    { id: "fitograd", name: "ФитоГрад", type: "Магазины здорового питания", brands: ["street-lunch", "hrumstik"], note: "Супы Street Lunch и батончики Хрумстик." },
    { id: "bazar", name: "Bazar Market", type: "Региональная сеть", brands: ["street-lunch"], note: "Супы-пюре Street Lunch в стаканах." },
    { id: "kantmarket", name: "КантМаркет", type: "Региональная сеть", brands: ["risomishki"], note: "Хрустящий десерт РисоМишки." }
  ];
  var CITIES = [
    /* Представленность по городам. Перекрёсток — адресная программа X5 (РисоМишки, 306 магазинов; в список — города от 3 магазинов
       и уже указанные), Светофор — выгрузки шести поставщиков сети на 06–20.10.2026: УралРитейлГрупп, Челябинск Ритейл, ПармаЛогистик,
       ЮГСЕРВИС, Приволжье Трейд, ЮгРитейлЛогистика (Street Lunch, 220 точек в 143 населённых пунктах). Остатки не учитываем. */
    { id: "chelyabinsk", name: "Челябинск", en: "Chelyabinsk", lat: 55.1644, lon: 61.4368, retail: ["svetofor", "perekrestok", "zhiznmart", "ariant", "mayak"], home: true, note: "Здесь наше производство и фирменный адрес: ул. Лазурная, 8. Светофор — 45 магазинов в Челябинской области, 8 из них в Челябинске." },
    { id: "moscow", name: "Москва", en: "Moscow", lat: 55.7558, lon: 37.6173, retail: ["perekrestok", "globus"], note: "Перекрёсток — 55 магазинов в Москве, а также магазины в Подмосковье: Видное, Подольск, Королёв, Люберцы, Серпухов и другие." },
    { id: "spb", name: "Санкт-Петербург", en: "Saint Petersburg", lat: 59.9343, lon: 30.3351, retail: ["perekrestok"], note: "Перекрёсток — 24 магазина в Петербурге и магазины в Ленинградской области." },
    { id: "ekaterinburg", name: "Екатеринбург", en: "Yekaterinburg", lat: 56.8389, lon: 60.6057, retail: ["perekrestok", "svetofor", "zhiznmart", "yagodka"], note: "Перекрёсток — 16 магазинов. Светофор — 63 магазина в Свердловской области: 10 в Екатеринбурге, а также Нижний Тагил, Каменск-Уральский, Первоуральск, Серов, Ревда, Асбест и ещё 37 населённых пунктов." },
    { id: "rostov", name: "Ростов-на-Дону", en: "Rostov-on-Don", lat: 47.2357, lon: 39.7015, retail: ["svetofor", "perekrestok"], note: "Перекрёсток — 4 магазина. Светофор — 7 магазинов в Ростовской области: Аксай, Новошахтинск, Константиновск, Чертково и другие." },
    { id: "perm", name: "Пермь", en: "Perm", lat: 58.0105, lon: 56.2502, retail: ["svetofor", "perekrestok", "fitograd"], note: "Светофор — 42 магазина в Пермском крае: 9 в Перми, а также Березники, Кунгур, Соликамск, Чайковский, Чусовой и ещё 21 населённый пункт. Перекрёсток — 4 магазина." },
    { id: "tyumen", name: "Тюмень", en: "Tyumen", lat: 57.1530, lon: 65.5343, retail: ["perekrestok"], note: "Перекрёсток — 9 магазинов." },
    { id: "tula", name: "Тула", en: "Tula", lat: 54.1931, lon: 37.6173, retail: ["perekrestok"], note: "Перекрёсток — 8 магазинов." },
    { id: "nnovgorod", name: "Нижний Новгород", en: "Nizhny Novgorod", lat: 56.3269, lon: 44.0059, retail: ["perekrestok", "svetofor"], note: "Перекрёсток — 8 магазинов. Светофор — 15 магазинов в Нижегородской области: 10 в Нижнем Новгороде, а также Дзержинск и Кстово." },
    { id: "volgograd", name: "Волгоград", en: "Volgograd", lat: 48.7080, lon: 44.5133, retail: ["perekrestok"], note: "Перекрёсток — 7 магазинов." },
    { id: "samara", name: "Самара", en: "Samara", lat: 53.1959, lon: 50.1002, retail: ["perekrestok"], note: "Перекрёсток — 7 магазинов." },
    { id: "voronezh", name: "Воронеж", en: "Voronezh", lat: 51.6608, lon: 39.2003, retail: ["perekrestok"], note: "Перекрёсток — 5 магазинов." },
    { id: "lipetsk", name: "Липецк", en: "Lipetsk", lat: 52.6031, lon: 39.5708, retail: ["perekrestok"], note: "Перекрёсток — 5 магазинов." },
    { id: "tver", name: "Тверь", en: "Tver", lat: 56.8587, lon: 35.9176, retail: ["perekrestok"], note: "Перекрёсток — 4 магазина." },
    { id: "izhevsk", name: "Ижевск", en: "Izhevsk", lat: 56.8526, lon: 53.2045, retail: ["perekrestok"], note: "Перекрёсток — 4 магазина." },
    { id: "ufa", name: "Уфа", en: "Ufa", lat: 54.7388, lon: 55.9721, retail: ["perekrestok"], note: "Перекрёсток — 3 магазина." },
    { id: "krasnodar", name: "Краснодар", en: "Krasnodar", lat: 45.0355, lon: 38.9753, retail: ["svetofor", "perekrestok"], note: "Светофор — 48 магазинов в Краснодарском крае и Адыгее: 6 в Краснодаре, а также Армавир, Белореченск, Кропоткин, Лабинск, Майкоп и ещё 25 населённых пунктов. Перекрёсток — 3 магазина." },
    { id: "yoshkar-ola", name: "Йошкар-Ола", en: "Yoshkar-Ola", lat: 56.6344, lon: 47.8999, retail: ["perekrestok"], note: "Перекрёсток — 3 магазина." },
    { id: "chelny", name: "Набережные Челны", en: "Naberezhnye Chelny", lat: 55.7436, lon: 52.3958, retail: ["perekrestok"], note: "Перекрёсток — 3 магазина." },
    { id: "ntagil", name: "Нижний Тагил", en: "Nizhny Tagil", lat: 57.9101, lon: 59.9813, retail: ["perekrestok", "svetofor"], note: "Перекрёсток — 3 магазина. Светофор — 3 магазина." },
    { id: "magnitogorsk", name: "Магнитогорск", en: "Magnitogorsk", lat: 53.4072, lon: 58.9791, retail: ["svetofor", "perekrestok"], note: "Светофор — 7 магазинов. Перекрёсток — 2 магазина." },
    { id: "kaliningrad", name: "Калининград", en: "Kaliningrad", lat: 54.7104, lon: 20.4522, retail: ["svetofor", "bazar"] }
  ];

  /* ---------- Новости ----------
     cover — единая шапка по тематике (рисуется в app.js, newsCover):
       expo   — выставка: name, year, lines [даты, город, площадка], pill (стенд);
       award  — награда: name, year, lines [результат…], pill (марка), img (диплом или знак);
       launch — новинка: name, year, lines, pill, img (продукт).
     theme — акцентные цвета из COVER_THEMES. */
  var COVER_THEMES = {
    interfood: { c1: "#d7262b", c2: "#f2c919", deco: "leaf" },
    worldfood: { c1: "#1d1b16", c2: "#a8c83a", deco: "ring" },
    prodexpo:  { c1: "#9b1c2a", c2: "#6fae45", deco: "leaf" },
    agroprom:  { c1: "#1c5e35", c2: "#e58a2e", deco: "leaf" },
    wfaward:   { c1: "#e2541c", c2: "#f6b23c", panel: "#fde3cf" },
    agro:      { c1: "#1c5e35", c2: "#e58a2e" },
    gold:      { c1: "#8a6a2f", c2: "#e0b04a" },
    best100:   { c1: "#6b6252", c2: "#c9b27a" },
    launch:    { c1: "#1673b5", c2: "#f3b86c" }
  };
  var NEWS = [
    { id: "worldfood-2026", date: "2026-09-18", dateText: "15–18 сентября 2026", tag: "expo", title: "WorldFood Moscow 2026: сертификат организаторов за экспозицию",
      cover: { type: "expo", theme: "worldfood", name: ["WorldFood Moscow"], year: "2026", lines: ["15–18 сентября", "Москва", "35-я выставка"], pill: "Сертификат ITE" },
      img: "awards/worldfood-2026-cert.jpg", imgLabel: "Смотреть сертификат", excerpt: "ITE Group отметила нашу экспозицию за актуальность и профессионализм.",
      body: ["С 15 по 18 сентября 2026 года компания участвовала в 35-й международной осенней выставке продуктов питания WorldFood Moscow.", "Организатор выставки, ITE Group, вручил нам сертификат: экспозиция «Новых продуктов» удостоена высокой оценки за актуальность и профессионализм."] },
    { id: "worldfood-2025", date: "2025-09-24", dateText: "Сентябрь 2025", tag: "awards", title: "РисоМишки — «Новинка года» на WorldFood Moscow 2025",
      cover: { type: "award", theme: "wfaward", name: ["WorldFood Moscow"], year: "2025", lines: ["«Новинка года»", "Кондитерские изделия"], pill: "РисоМишки", img: "awards/worldfood-2025.png", badge: true },
      img: "awards/worldfood-2025-diploma.jpg", badge: "awards/worldfood-2025.png", excerpt: "Хрустящий десерт из воздушного риса победил в категории «Кондитерские изделия».",
      body: ["На выставке WorldFood Moscow 2025 РисоМишки стали победителем конкурса «Новинка года» в номинации «Кондитерские изделия».", "Для нас это знак, что формат «десерт-фигурка» из воздушного риса нужен покупателям и рознице. Диплом и фото с церемонии — в разделе «О компании»."] },
    { id: "interfood-2025", date: "2025-10-24", dateText: "24 октября 2025", tag: "expo", title: "Приглашаем на InterFood Ural 2025 в Екатеринбурге",
      cover: { type: "expo", theme: "interfood", name: ["InterFood Ural"], year: "2025", lines: ["29–31 октября", "Екатеринбург", "МВЦ «Екатеринбург-ЭКСПО»"], pill: "Наш стенд I-613" },
      img: null, excerpt: "29–31 октября, МВЦ «Екатеринбург-ЭКСПО»: новинки, дегустации и выставочные условия для партнёров на стенде I-613.",
      body: ["Ждём партнёров и коллег на выставке InterFood Ural 2025 в Екатеринбурге: 29–31 октября, МВЦ «Екатеринбург-ЭКСПО», стенд № I-613.", "Покажем новую линейку, проведём дегустации и обсудим специальные выставочные условия для новых и действующих партнёров."] },
    { id: "agro-2025", date: "2025-08-15", dateText: "13–15 августа 2025", tag: "awards", title: "Три золота и два серебра на «Агро-2025» в Челябинске",
      cover: { type: "award", theme: "agro", name: ["Агро-2025"], year: "2025", lines: ["3 золота и 2 серебра", "Челябинск, 13–15 августа"], pill: "Дегустационный конкурс", img: "awards/agro-2025-rm.jpg" },
      img: "awards/agro-2025-rm.jpg", excerpt: "Золото — РисоМишки в белом шоколаде, Street Lunch гороховый с курицей и Хрумстик гречневый с фруктозой.",
      body: ["На выставке «Агро-2025» (Челябинск, 13–15 августа) наша продукция получила пять медалей.", "Золото: РисоМишки в белом шоколаде, суп-пюре Street Lunch гороховый с курицей, Хрумстик гречневый с фруктозой. Серебро: борщ «по-Уральски» и Хрумстик с кокосовой стружкой.", "Министерство сельского хозяйства Челябинской области также наградило компанию благодарственным письмом — за актуальность и профессионализм экспозиции."] },
    { id: "zolotaya-osen-2025", date: "2025-10-10", dateText: "2025", tag: "awards", title: "Дипломы «Золотой осени» для Street Lunch и РисоМишек",
      cover: { type: "award", theme: "gold", name: ["Золотая осень"], year: "2025", lines: ["Дипломы выставки", "для обеих марок"], pill: "Street Lunch и РисоМишки", img: "awards/zolotaya-osen-2025-sl.jpg", rotate: true },
      img: "awards/zolotaya-osen-2025-sl.jpg", excerpt: "Обе марки получили дипломы российской агропромышленной выставки.",
      body: ["Street Lunch и РисоМишки получили дипломы выставки «Золотая осень» 2025 года."] },
    { id: "100-best-2024", date: "2024-12-01", dateText: "2024", tag: "awards", title: "«100 лучших товаров России» и топ-20 Челябинской области",
      cover: { type: "award", theme: "best100", name: ["100 лучших", "товаров России"], year: "2024", lines: ["Лауреат, «Новинка»", "и дипломант конкурса"], pill: "РисоМишки и Street Lunch", img: "awards/rm-laureat.jpg" },
      img: "awards/rm-laureat.jpg", excerpt: "РисоМишки — лауреат и «Новинка», Street Lunch — дипломант конкурса.",
      body: ["В конкурсе «100 лучших товаров России» РисоМишкам присвоены звания лауреата и «Новинки», супы Street Lunch стали дипломантом.", "Наша продукция также вошла в «20 лучших товаров Челябинской области» 2024 года."] },
    { id: "worldfood-2024", date: "2024-09-17", dateText: "17–20 сентября 2024", tag: "expo", title: "WorldFood Moscow 2024: показываем РисоМишки",
      cover: { type: "expo", theme: "worldfood", name: ["WorldFood Moscow"], year: "2024", lines: ["17–20 сентября", "Москва", "Крокус Экспо"], pill: "Наш стенд A4153" },
      img: null, excerpt: "Стенд A4153, зал 14, павильон 3, «Крокус Экспо».",
      body: ["С 17 по 20 сентября компания участвовала в 33-й выставке WorldFood Moscow 2024 — стенд A4153, зал 14, павильон 3, МВЦ «Крокус Экспо».", "Представили новинку — РисоМишки, хрустящий рисовый десерт в шоколаде, — и супы-пюре Street Lunch."] },
    { id: "prodexpo-2023", date: "2023-02-04", dateText: "6–10 февраля 2023", tag: "expo", title: "«Продэкспо-2023»: стенд Челябинской области",
      cover: { type: "expo", theme: "prodexpo", name: ["Продэкспо"], year: "2023", lines: ["6–10 февраля", "Москва", "Экспоцентр"], pill: "Наш стенд 23E20" },
      img: null, excerpt: "Стенд № 23E20 в экспозиции Челябинской области.",
      body: ["Компания участвовала в 30-й выставке «Продэкспо-2023» на стенде № 23E20 в экспозиции Челябинской области."] },
    { id: "agroprom-2022", date: "2022-09-13", dateText: "13–15 сентября 2022", tag: "expo", title: "«Агропром Урал 2022» в Екатеринбурге",
      cover: { type: "expo", theme: "agroprom", name: ["Агропром Урал"], year: "2022", lines: ["13–15 сентября", "Екатеринбург", "МВЦ «Екатеринбург-ЭКСПО»"], pill: "Наш стенд X005" },
      img: null, excerpt: "МВЦ «Екатеринбург-ЭКСПО», стенд Челябинской области X005.",
      body: ["Участвовали в выставке «Агропром Урал 2022» в МВЦ «Екатеринбург-ЭКСПО» на стенде Челябинской области X005."] },
    { id: "prodexpo-2022", date: "2022-02-05", dateText: "Февраль 2022", tag: "launch", title: "Запустили хрустящие «Мишки в шоколаде»",
      cover: { type: "launch", theme: "launch", name: ["Мишки в шоколаде"], year: "2022", lines: ["Премьера продукта", "Продэкспо-2022, Москва"], pill: "Будущие РисоМишки", img: "brand/rm-choco.png" },
      img: null, excerpt: "Хлебцы из бурого и шлифованного риса в шоколадной глазури — будущие РисоМишки.",
      body: ["На «Продэкспо-2022» мы представили новый продукт — хрустящие хлебцы «Мишки в шоколаде» из бурого и шлифованного риса в шоколадной глазури.", "Позже продукт получил название РисоМишки."] },
    { id: "prodexpo-2019", date: "2019-02-04", dateText: "11–15 февраля 2019", tag: "expo", title: "«Продэкспо-2019» в «Экспоцентре»",
      cover: { type: "expo", theme: "prodexpo", name: ["Продэкспо"], year: "2019", lines: ["11–15 февраля", "Москва", "Экспоцентр"], pill: "Наш стенд 24А05" },
      img: null, excerpt: "Павильон № 2, зал 4, стенд 24А05.",
      body: ["Компания участвовала в 26-й выставке «Продэкспо» в ЦВК «Экспоцентр»: павильон № 2, зал 4, стенд 24А05.", "В международном конкурсе «Лучший продукт — 2019» наши сухие завтраки получили три награды: золотую звезду за лучший инновационный продукт и серебряную медаль — «Бобсы» из гороха, нута и чечевицы, серебряную медаль — Хрумстик из воздушного риса."] }
  ];
  var NEWS_TAGS = { awards: "Награды", expo: "Выставки", launch: "Новинки", company: "Компания" };

  /* ---------- Соцпроекты ---------- */
  var PROJECTS = [
    { id: "ural", dir: "army", year: "2023", title: "Гуманитарная помощь бригаде «Урал»",
      text: "Организовали сбор и доставку гуманитарной помощи подразделению войсковой части 01591 мотострелковой бригады «Урал», которое находится в зоне СВО.",
      docs: [{ img: "social/letter-ural-2023.jpg", title: "Благодарственное письмо, в/ч 01591", year: "2023" }] },
    { id: "bratstvo", dir: "army", year: "2023–2024", title: "Поддержка участников СВО и ветеранского движения",
      text: "Помогаем челябинскому отделению «Боевого братства»: поддерживаем участников СВО и их семьи, участвуем в патриотических мероприятиях.",
      docs: [{ img: "social/letter-bratstvo-2023.jpg", title: "Благодарственное письмо ЧОО ВООВ «Боевое братство»", year: "2023" },
             { img: "social/medal-bratstvo-2024.jpg", title: "Медаль «За помощь и содействие ветеранскому движению»", year: "23.01.2024" }] },
    { id: "veterany", dir: "charity", year: "2024", title: "Помощь ветеранам Центрального района Челябинска",
      text: "Благотворительная помощь ветеранам — людям старшего поколения Центрального района.",
      docs: [{ img: "social/letter-veterany-2024.jpg", title: "Благодарность Совета ветеранов Центрального района", year: "Апрель 2024" }] },
    { id: "obedy", dir: "charity", year: "2024", title: "Благотворительные обеды",
      text: "Помогаем организовывать благотворительные обеды вместе с Челябинским отделением Императорского православного палестинского общества и Свято-Троицким храмом.",
      docs: [{ img: "social/letter-ippo.jpg", title: "Благодарность Челябинского отделения ИППО", year: "2024" }] },
    { id: "miloserdie74", dir: "charity", year: "2023", title: "Новогодняя ёлка фонда «Милосердие74»",
      text: "Много лет помогаем кыштымскому благотворительному фонду «Милосердие74» с его программами. Каждый год поддерживаем «Новогоднюю ёлку» для детей из детских домов Кыштыма и соседних городов, детей с инвалидностью и детей из многодетных семей.",
      docs: [{ img: "social/letter-miloserdie74-2023.jpg", title: "Благодарственное письмо БФ «Милосердие74», Кыштым", year: "Декабрь 2023" }] },
    { id: "elka-2024", dir: "charity", year: "2023", title: "«Необыкновенная ёлка 2024»",
      text: "Поддержали новогодний проект челябинского благотворительного фонда «Прикосновение к жизни» для малышей из Дома ребёнка и детей в трудной жизненной ситуации.",
      docs: [{ img: "social/letter-prikosnovenie-2023.jpg", title: "Благодарность БФ «Прикосновение к жизни»", year: "2023" }] },
    { id: "miloserdie", dir: "charity", year: "2011", title: "Фонд «Милосердие без границ»",
      text: "Поддерживаем челябинский благотворительный фонд «Милосердие без границ».",
      docs: [{ img: "social/letter-miloserdie.jpg", title: "Благодарность фонда «Милосердие без границ»", year: "2011" }] },
    { id: "belyi-rynok", dir: "events", year: TBD("дата — 30 июня или 31 июля 2026?"), cover: "social/belyi-hall.jpg", title: "Детский праздник с РисоМишками на «Белом рынке»",
      text: "Семейное мероприятие в Челябинске: рисование, розыгрыш подарков и угощение РисоМишками для детей и родителей.",
      photos: [{ img: "social/belyi-pyramid.jpg", alt: "Пирамида из коробок РисоМишек на празднике" }, { img: "social/belyi-hall.jpg", alt: "Гости праздника в зале «Белого рынка»" }, { img: "social/belyi-table.jpg", alt: "Стол с угощением и коробками РисоМишек" }, { img: "social/belyi-stage.jpg", alt: "Сцена праздника" }] }
  ];
  var DIRECTIONS = [
    { id: "army", ru: "Помощь армии", text: "Гуманитарная помощь подразделениям и поддержка участников СВО и их семей." },
    { id: "charity", ru: "Благотворительность", text: "Ветераны, благотворительные обеды, фонды Челябинска." },
    { id: "events", ru: "Городские и детские события", text: "Праздники, дегустации и семейные мероприятия с нашими продуктами." },
    { id: "expo", ru: "Выставки", text: "Отраслевые выставки и конкурсы, где мы показываем новинки." }
  ];

  /* ---------- Видео (assets/video, обложки — assets/img/video) ----------
     o: "h" — горизонтальное 16:9, "v" — вертикальное 9:16. Субтитров пока нет. */
  var VIDEOS = [
    { id: "sl-prostota", brand: "street-lunch", o: "h", dur: "0:40", title: "Street Lunch: о простоте приготовления", titleEn: "Street Lunch: how easy it is to prepare" },
    { id: "sl-new-pack", brand: "street-lunch", o: "h", dur: "0:44", title: "Новая упаковка супов Street Lunch", titleEn: "New Street Lunch soup packaging" },
    { id: "sl-privale", brand: "street-lunch", o: "h", dur: "1:28", title: "Обед на привале", titleEn: "Lunch at a rest stop" },
    { id: "sl-semya", brand: "street-lunch", o: "h", dur: "1:29", title: "Обед для всей семьи", titleEn: "Lunch for the whole family" },
    { id: "sl-master", brand: "street-lunch", o: "h", dur: "0:58", title: "Уральский мастер", titleEn: "The Ural craftsman" },
    { id: "sl-packet-vert", brand: "street-lunch", o: "v", dur: "0:28", title: "Суп-пюре из пакетика", titleEn: "Purée soup from a sachet" },
    { id: "sl-cup-vert", brand: "street-lunch", o: "v", dur: "0:24", title: "Суп-пюре в стакане", titleEn: "Purée soup in a cup" },
    { id: "rm-spot-1", brand: "risomishki", o: "h", dur: "0:05", title: "РисоМишки в белом шоколаде — рекламный ролик", titleEn: "RisoMishki in white chocolate — ad spot" },
    { id: "rm-spot-2", brand: "risomishki", o: "h", dur: "0:05", title: "РисоМишки — рекламный ролик", titleEn: "RisoMishki — ad spot" },
    { id: "rm-mascot", brand: "risomishki", o: "v", dur: "0:18", title: "Медвежонок РисоМишек", titleEn: "The RisoMishki bear" },
    { id: "rm-review-1", brand: "risomishki", o: "v", dur: "1:49", title: "Отзыв: пробуем РисоМишки", titleEn: "Review: tasting RisoMishki" }
  ];
  /* ---------- Награды ---------- */
  var AWARDS = [
    { year: "2026", title: "WorldFood Moscow — сертификат организаторов", text: "ITE Group: за актуальность и профессионализм представленной экспозиции.", img: "awards/worldfood-2026-cert.jpg", imgLabel: "Смотреть сертификат" },
    { year: "2025", title: "WorldFood Moscow — «Новинка года»", text: "РисоМишки, номинация «Кондитерские изделия».", img: "awards/worldfood-2025-diploma.jpg", badge: "awards/worldfood-2025.png" },
    { year: "2025", title: "«Агро-2025», Челябинск — 3 золота и 2 серебра", text: "Золото: РисоМишки в белом шоколаде, Street Lunch гороховый с курицей, Хрумстик гречневый с фруктозой. Серебро: борщ «по-Уральски», Хрумстик с кокосовой стружкой.", img: "awards/agro-2025-rm.jpg" },
    { year: "2025", title: "«Золотая осень» — дипломы", text: "Street Lunch и РисоМишки.", img: "awards/zolotaya-osen-2025-sl.jpg" },
    { year: "2024", title: "«100 лучших товаров России»", text: "РисоМишки — лауреат и «Новинка», Street Lunch — дипломант.", img: "awards/rm-laureat.jpg", badge: "awards/100-best-emblem.png" },
    { year: "2024", title: "«20 лучших товаров Челябинской области»", text: "Street Lunch и РисоМишки.", img: "awards/top20-2024-sl.jpg" },
    { year: "2024", title: "«Агро-2024» — золотая и серебряная медали", text: "Золото — суп-пюре гороховый Street Lunch, серебро — хрустящий десерт РисоМишки в шоколаде.", img: "awards/agro-2024-sl.jpg" },
    { year: "2023", title: "«Продэкспо-2023» — диплом", text: "Участие в экспозиции Челябинской области." },
    { year: "2022", title: "«Агро-2022» и Межрегиональная агровыставка — дипломы", text: "" },
    { year: "2021", title: "«Петерфуд-2021» — диплом и сертификат конкурса «Выбор сетей»", text: "Сертификат получил суп-пюре гороховый с грибами Street Lunch. В выборе участвовали федеральные и региональные торговые сети.", img: "awards/peterfood-2021-vybor-setey.jpg", imgLabel: "Смотреть сертификат" },
    { year: "2019", title: "«Продэкспо-2019», конкурс «Лучший продукт — 2019»", text: "Золотая звезда за лучший инновационный продукт и две серебряные медали: сухие завтраки «Бобсы» и Хрумстик из воздушного риса.", img: "awards/prodexpo-2019-zvezda.jpg" },
    { year: "2011–2012", title: "«Продэкспо», «Экспоцентр», «Лучший продукт 2011»", text: "" },
    { year: "2005–2006", title: "Первые награды марок", text: "Хрумстик, «Вкусняка», «Настоящая каша», «Шокорех» и дипломы за упаковку." }
  ];
  /* Дипломы конкурса «100 лучших товаров России» 2024 (оригиналы: «НАШИ НАГРАДЫ!!!\награды 2024\100 лучших товаров») */
  var BEST100 = [
    { title: "Лауреат", doc: "Диплом", brand: "РисоМишки", product: "Хлебцы хрустящие «РисоМишки» в тёмном, молочном и белом шоколаде", img: "awards/rm-laureat.jpg", tone: "gold",
      en: { title: "Laureate", doc: "Diploma", brand: "RisoMishki", product: "RisoMishki crispy bites in dark, milk and white chocolate" } },
    { title: "Новинка", doc: "Свидетельство", brand: "РисоМишки", product: "Хлебцы хрустящие «РисоМишки» в тёмном, молочном и белом шоколаде", img: "awards/rm-novinka.jpg", tone: "green",
      en: { title: "Novelty", doc: "Certificate", brand: "RisoMishki", product: "RisoMishki crispy bites in dark, milk and white chocolate" } },
    { title: "Дипломант", doc: "Диплом", brand: "Street Lunch", product: "Супы быстрого приготовления, не требующие варки, торговой марки «Street Lunch»", img: "awards/sl-diplomant.jpg", tone: "silver",
      en: { title: "Diploma winner", doc: "Diploma", brand: "Street Lunch", product: "Street Lunch instant soups, no cooking required" } }
  ];

  /* ---------- Отзывы покупателей с Ozon (стена на главной) ----------
     kind: "card" — как карточка Ozon (stars, pros = достоинства, cons = недостатки, text = комментарий); "bubble" — короткое сообщение.
     Сейчас тексты — пересказ отзывов с оценкой 5★ без имён. Настоящий текст отзыва ставится с полем verbatim: true
     и author — первая буква имени (её покажет аватар); если все отзывы настоящие, подпись «в пересказе» исчезнет сама. */
  var REVIEWS = {
    source: "Ozon",
    wall: [
      { kind: "bubble", brand: "street-lunch", flavor: "гороховый с грибами", text: "Берёт суп с собой в поезд: вкус нравится, а сытости хватает надолго." },
      { kind: "card", brand: "risomishki", flavor: "малина", stars: 5, pros: "Насыщенный малиновый вкус, тают во рту", text: "Стали любимой сладостью к чаю. Собирается заказать ещё и попробовать другие вкусы." },
      { kind: "bubble", brand: "risomishki", flavor: "малина", text: "Понравились и детям, и жене: воздушный рис в глазури с ярким вкусом малины." },
      { kind: "card", brand: "street-lunch", flavor: "гороховый с грибами", stars: 5, pros: "Сытный и ароматный, порция — целый стакан", cons: "Вместо палочки хотелось бы ложку", text: "К качеству вопросов нет, суп рекомендует." },
      { kind: "bubble", brand: "street-lunch", flavor: "солянка", text: "Долго ждала солянку в продаже — и полюбила с первого стакана." },
      { kind: "card", brand: "risomishki", flavor: "молочный шоколад", stars: 5, pros: "Нежный молочный аромат, забавная форма мишек", text: "Называет их любимым лакомством — и к чаю, и просто похрустеть. Коробка закончилась за десять минут." },
      { kind: "bubble", brand: "risomishki", flavor: "молочный шоколад", text: "Из трёх вкусов ребёнок выбрал молочный шоколад. И к чаю — самое то." },
      { kind: "bubble", brand: "street-lunch", flavor: "борщ", text: "Удобно, когда живёшь один: кипяток — и обед готов. Кислинку у борща хвалит отдельно." },
      { kind: "card", brand: "street-lunch", flavor: "гороховый с грибами", stars: 5, pros: "Вкусно и очень сытно", text: "Пишет после трёх перекусов. Совет: заливать крутым кипятком и хорошо размешивать — так суп получается лучше." },
      { kind: "bubble", brand: "risomishki", flavor: "три вкуса", text: "Взяли сразу три вкуса — удобный перекус в школу и на прогулку." },
      { kind: "card", brand: "risomishki", flavor: "белый шоколад", stars: 5, pros: "Хрустят, приятная сладкая глазурь", text: "Брали ребёнку, а понравились всей семье. Жалеет, что не встречала их в обычных магазинах." },
      { kind: "bubble", brand: "street-lunch", flavor: "картофельное пюре «по-Уральски»", text: "Пюре хвалит: быстро, вкусно, соли в меру, упаковано аккуратно." },
      { kind: "bubble", brand: "risomishki", flavor: "малина", text: "Дети четырёх лет справились с целой пачкой в первый же день." },
      { kind: "card", brand: "street-lunch", flavor: "чечевичный с копчёными рёбрышками", stars: 5, pros: "И вкус, и упаковка — на высоте", text: "Собирается заказывать ещё и советует другим." },
      { kind: "bubble", brand: "risomishki", flavor: "апельсин", text: "Пришли вовремя и со свежим сроком годности — ребёнку апельсиновые мишки очень понравились." },
      { kind: "card", brand: "risomishki", flavor: "малина", stars: 5, pros: "Коробки доехали, хлебцы целые", text: "Искали перекус в школу: сыну-подростку понравились, почти всю пачку съел сам. Повторят заказ с другими вкусами." },
      { kind: "bubble", brand: "street-lunch", flavor: "гороховый с грибами", text: "Порадовала упаковка: стаканы приехали в картонной коробке, доставка быстрая." },
      { kind: "bubble", brand: "street-lunch", flavor: "ассорти", text: "Брала супы на природу — очень вкусные." },
      { kind: "card", brand: "risomishki", flavor: "молочный шоколад", stars: 5, pros: "Крупные мишки, вкусный шоколад", text: "Похожи на рисовые хлопья в шоколаде. Понравились всей семье — и взрослым, и детям." },
      { kind: "bubble", brand: "street-lunch", flavor: "чечевичный с копчёными рёбрышками", text: "Берёт не в первый раз: упаковано отлично, суп нравится." },
      { kind: "bubble", brand: "risomishki", flavor: "апельсин", text: "Глазурь свежая, вкус апельсина яркий и приятный." },
      { kind: "card", brand: "street-lunch", flavor: "гороховый с грибами", stars: 5, pros: "Насыщенный вкус", text: "Называет суп отличным и советует хотя бы попробовать." },
      { kind: "bubble", brand: "risomishki", flavor: "малина", text: "Свежие, тонкие и совсем не жёсткие." },
      { kind: "bubble", brand: "street-lunch", flavor: "гороховый с грибами", text: "Нравятся все супы линейки — заказывает часто." },
      { kind: "bubble", brand: "risomishki", flavor: "апельсин", text: "Из всех вкусов больше всего понравился апельсиновый, а глазурь не липнет к зубам." },
      { kind: "bubble", brand: "street-lunch", flavor: "чечевичный с копчёными рёбрышками", text: "Впечатление хорошее, упаковка отличная — советует." },
      { kind: "bubble", brand: "risomishki", flavor: "манго", text: "Хвалит вкус манго и доволен покупкой." }
    ]
  };

  /* ---------- FAQ ---------- */
  var FAQ = {
    product: [
      { q: "Как приготовить суп Street Lunch?", a: "Высыпьте пакетик (40 г) в чашку, залейте 250 мл кипятка или горячей воды, перемешайте и подождите 3 минуты. Варить не нужно." },
      { q: "Сколько хранится продукция?", a: "Супы Street Lunch, «по-Уральски» и РисоМишки — 12 месяцев при температуре до +25 °C и влажности не выше 75%. Батончики Хрумстик — 12 месяцев при +5…+23 °C." },
      { q: "Есть ли в супах консерванты и красители?", a: "В составах супов Street Lunch консервантов и красителей нет. Полный состав каждого вкуса — в карточке товара. Обратите внимание: в борщ «по-Уральски» входит усилитель вкуса E621." },
      { q: "Почему гороховый суп такой сытный?", a: "Основа — горох и чечевица. В 100 г сухого продукта около 17 г растительного белка, а из одного пакетика 40 г получается порция примерно 300 г готового супа." },
      { q: "Есть ли глютен в РисоМишках?", a: "Основа РисоМишек — рисовая крупа и бурый рис, на упаковке указано «без глютена». Солёные хлебцы РисоМишки — без глютена, лактозы, дрожжей и масла. Полный состав глазури смотрите в карточке товара." },
      { q: "Где производится продукция?", a: "На собственном производстве ООО «Новые продукты» в Челябинске. Компания работает с 2003 года." }
    ],
    buy: [
      { q: "Где купить в моём городе?", a: "Список сетей и карта городов — на странице «Где купить». Если вашего города нет, закажите на маркетплейсе с доставкой по России." },
      { q: "Есть ли продукция на маркетплейсах?", a: "Да, на Ozon — ссылка на странице «Где купить» и в карточках товаров. Ссылки на Wildberries и Яндекс Маркет появятся на сайте в ближайшее время." },
      { q: "В моём магазине нет вашей продукции. Что делать?", a: "Напишите нам название магазина и город — передадим отделу продаж. А пока можно заказать на маркетплейсе." },
      { q: "Как оставить отзыв или сообщить о проблеме с качеством?", a: "Напишите на info@newprod.ru: название продукта, дата изготовления с упаковки и фото. Ответим и разберёмся." }
    ],
    business: [
      { q: "Как стать партнёром?", a: "Соберите интересующие позиции в каталоге кнопкой «Добавить в запрос» и отправьте заявку — или напишите без выбора продукции. Отдел продаж свяжется с вами и подберёт условия." },
      { q: "Можно ли получить образцы?", a: "Да. Образцы для внутренней дегустации и оценки качества предоставляем бесплатно." },
      { q: "Какие документы вы предоставляете?", a: "Декларации о соответствии ЕАЭС, спецификации, макеты этикеток и органолептические характеристики. Продукция выпускается по ТУ. На супы Street Lunch есть добровольные сертификаты «Халяль» и «ЭКО», на РисоМишки — «ЭКО». Сканы — на странице «Документы»." },
      { q: "Работаете ли вы по ЭДО и с доставкой до РЦ?", a: "Да, работаем через электронный документооборот и организуем доставку на распределительные центры." },
      { q: "Производите ли вы под маркой сети (СТМ)?", a: "Да. Например, РисоМишки выпускаются для сети ЖизньМарт под совместной маркой. Подробнее — в разделе «Своя торговая марка» на странице «Для партнёров»." },
      { q: "Поставляете ли вы за рубеж?", a: "Да: в Беларусь, Казахстан, Узбекистан и Кыргызстан. На экспорт доступен весь ассортимент." },
      { q: "Почему на сайте нет цен и условий поставки?", a: "Условия зависят от объёма, канала и региона, поэтому мы готовим их индивидуально. Отправьте заявку — пришлём предложение." }
    ]
  };
  var FAQ_EN = [
    { q: "Do you export?", a: "Yes. We ship to Belarus, Kazakhstan, Uzbekistan and Kyrgyzstan, and the whole range is available for export." },
    { q: "Can we get samples?", a: "Yes, samples for internal tasting and quality checks are free of charge." },
    { q: "What documents do you provide?", a: "EAEU declarations of conformity, specifications, label artwork and organoleptic data. Products are made to Russian technical specifications (TU). Street Lunch soups hold voluntary Halal and ECO certificates; RisoMishki hold an ECO certificate." },
    { q: "Do you make private-label products?", a: "Yes. For example, RisoMishki are produced for the Russian retail chain ZhiznMart under a co-branded label." },
    { q: "Why are there no prices on the website?", a: "Terms depend on volume, channel and country, so we prepare an individual offer. Send a request and we will reply by e-mail." },
    { q: "How is Street Lunch soup prepared?", a: "Pour a 40 g sachet into a mug, add 250 ml of boiling water, stir and wait 3 minutes. No cooking needed." }
  ];

  window.NP = {
    TBD: TBD, CONFIG: CONFIG, CATEGORIES: CATEGORIES, FORMATS: FORMATS, FORMAT_ORDER: FORMAT_ORDER, CATALOG_GROUPS: CATALOG_GROUPS,
    BRANDS: BRANDS, PRODUCTS: PRODUCTS, RETAIL: RETAIL, CITIES: CITIES, NEWS: NEWS, NEWS_TAGS: NEWS_TAGS,
    PROJECTS: PROJECTS, DIRECTIONS: DIRECTIONS, COVER_THEMES: COVER_THEMES, AWARDS: AWARDS, BEST100: BEST100, REVIEWS: REVIEWS, VIDEOS: VIDEOS, FAQ: FAQ, FAQ_EN: FAQ_EN
  };
})();

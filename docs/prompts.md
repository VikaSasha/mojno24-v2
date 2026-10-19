# Промпты для съёмки и генерации недостающих изображений

На сайте сейчас стоят SVG-заглушки (дой-пак, ассорти, B&B, ПЭТ-банки без фото, мука) и SVG-схема вместо фото производства. Ниже — бриф для фотографа и промпты для генератора, чтобы новые кадры совпали со стилем сайта.

## Общий визуальный язык

- **Свет:** мягкий дневной, из окна слева; тени длинные, мягкие.
- **Фон для предметной съёмки:** чистый белый (#FFFFFF). Карточки каталога белые, поэтому фото на белом встаёт без обработки.
- **Фон для сцен:** тёплый кремовый (#FBF8F1 / #F5EFE2), натуральное дерево, лён. Акценты — зелёный #1C5E35 и оранжевый #E58A2E.
- **Ракурсы:** фронт; ¾ слева; ¾ справа; верх. Продукт занимает 70–80% кадра.
- **Формат:** JPEG от 2000 px по длинной стороне. Для вырезок — PNG с прозрачным фоном.
- **Нельзя:** перерисовывать упаковку, менять тексты на ней, добавлять несуществующие вкусы.

## 1. Предметная съёмка — что снять (приоритет)

| № | Что | Ракурсы | Куда на сайте |
|---|-----|---------|---------------|
| 1 | Дой-пак Street Lunch: грибы, говядина, курица, рёбрышки, овощи, ассорти, борщ, солянка | фронт, ¾ | карточки формата «Дой-пак» (8 шт.) |
| 2 | Коробка и шоу-бокс «Ассорти» | фронт, ¾ | карточка «Ассорти» |
| 3 | Упаковка B&B — 4 вида муки и 6 видов круп | фронт | формат «Упаковка B&B» (10 шт.) |
| 4 | ПЭТ-банки с этикеткой: полба, перловка, пшеница, 4 вида муки | фронт | формат «ПЭТ-банка» (7 шт.) |
| 5 | Хрумстик с корицей — батончик в упаковке и без | фронт, крупно | карточка «С корицей» |
| 6 | Стаканы «Стрит Ланч» — реальное фото (сейчас 3D-рендеры) | фронт, пара «стакан + крышка» | формат «Стакан» |

## 2. Репортаж с производства (для «О компании → Производство и качество»)

Генерировать производство нельзя: это выдаст несуществующее за реальное. Нужна съёмка на месте.

- Общий план цеха с фасовочной линией. Люди — в спецодежде, лица можно не показывать.
- Руки технолога с образцом супа-пюре или воздушного риса.
- Мешки с горохом и чечевицей на складе сырья.
- Фасовка пакетиков 40 г и сборка шоу-бокса.
- Готовая продукция на паллете.

## 3. Промпты для генерации атмосферных изображений

Подходят для Canva, Adobe Firefly или Midjourney. Продукт в них не участвует: только фон и атмосфера.

**Сырьё (для блока «Подход» и «Производство»), 16:9**
> Top-down editorial food still life of raw grains and legumes: small heaps and linen pouches of yellow split peas, red lentils, green lentils, buckwheat groats, white rice, puffed rice and spelt on a warm cream linen tablecloth, a few dried porcini mushrooms, a sprig of dill and a carrot slice, soft natural window light from the left, gentle long shadows, muted warm palette of cream, ochre and deep green, generous empty space on the right for text, realistic photography, no text, no logos, no packaging

**Южный Урал (для «О компании» и английской версии), 16:9**
> Wide calm landscape photograph of the South Ural region near Chelyabinsk in late summer: a ripening field of peas and grain in the foreground, a line of birch trees, low soft blue Ural hills on the horizon, early morning golden light, light haze, natural muted colours of ochre, sage green and pale sky blue, open sky in the upper third for headline text, documentary realistic style, no people, no buildings, no text

**Фон для РисоМишек (детская сцена без детей), 4:5**
> Bright playful flat-lay on a pale sky-blue table: colourful wooden toy blocks, crayons, a glass of milk and a small bowl, soft daylight, clean minimal composition with empty space in the centre for a product box, pastel blue, orange and white palette, realistic photography, no text, no logos, no people

**Обед в дороге (для B2G и Street Lunch), 4:5**
> Thermos mug and a bowl of thick yellow pea purée soup on a wooden bench outdoors in autumn birch forest, steam rising, soft overcast light, warm cream and forest green palette, space on the left for a product box, realistic photography, no text, no logos, no people

## 4. Как вставить готовые фото

1. Положите исходник в папку «! Маркетинг» с понятным именем.
2. Добавьте строку в `tools/export-images.ps1`, например:
   `Export (Src 'Дой-пак Грибы.jpg') 'products/sl-griby-doy.jpg' 720 'trim' -pad 0.03`
3. Запустите скрипт, затем в `assets/js/data.js` замените `img: "ph:doy"` на `img: "products/sl-griby-doy.jpg"`.

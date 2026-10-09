#!/usr/bin/env bash
# Сборка сайта для GitHub Pages (https://vikasasha.github.io/mojno24-v2/).
# Сайт написан «от корня» (/catalog, /_next/...), а на Pages он живёт в подпапке /mojno24-v2,
# поэтому в копии всех файлов, отслеживаемых git, к внутренним ссылкам добавляется префикс.
# Локальная версия при этом не меняется.
#
# Использование (Git Bash):  tools/build-pages.sh <папка-назначения> [префикс]
set -euo pipefail

OUT="${1:?Укажите папку для сборки}"
export P="${2:-/mojno24-v2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "$OUT"; mkdir -p "$OUT"
# только файлы из git (без резервных копий и загрузок), включая несохранённые в коммит правки
git -C "$ROOT" ls-files -z | (cd "$ROOT" && tar --null -T - -cf -) | tar -xf - -C "$OUT"

cd "$OUT"
# на публичном сайте не нужны админка, сервер и служебные файлы: сохранять там всё равно некуда
rm -rf admin tools v2/templates serve.ps1 README.md .gitignore .gitattributes ./*.cmd

TOP='_next|generated|editorial|journey|campaign|portfolio|v2|catalog|product|news|about|contacts|private-label|confidential|suppliers|karta-saita|gde-kupit|404|sitemap\.xml|robots\.txt|request'

# 1) ссылки на разделы и файлы сайта: "/catalog", (/generated/…), `/campaign/…` → с префиксом
rewrite_paths='s{(?<=[\x22\x27(\s,=`])/('"$TOP"')(?=[/\x22\x27?#)\s,\\`]|$)}{$ENV{P}/$1}g;'

# HTML: пути + ссылки на главную + запрет индексации копии (оригинал — mojno24.ru)
find . -name '*.html' -print0 | xargs -0 perl -pi -e "$rewrite_paths"'
  s{href="/"}{href="$ENV{P}/"}g;
  s{\\"href\\":\\"/\\"}{\\"href\\":\\"$ENV{P}/\\"}g;
  s{</head>}{<meta name="robots" content="noindex"/></head>};'

# скрипты и стили Next.js
find _next -name '*.js' -o -name '*.css' | tr '\n' '\0' | xargs -0 perl -pi -e "$rewrite_paths"

# шапка сайта: ссылка логотипа и проверки «это главная?» сравнивают адрес с "/"
perl -pi -e 's{href:"/"}{href:"$ENV{P}/"}g; s{"/"===e}{"$ENV{P}/"===e}g; s{"/"!==e}{"$ENV{P}/"!==e}g;' _next/static/chunks/app/layout-*.js
# кнопка «Назад» на странице ошибки
perl -pi -e 's{window\.location\.href="/"}{window.location.href="$ENV{P}/"}g;' _next/static/chunks/*.js

# GitHub Pages: не прогонять через Jekyll (иначе папка _next не опубликуется) и своя страница 404
touch .nojekyll
cp 404/index.html 404.html

echo "Готово: $(find . -type f | wc -l) файлов, $(du -sh . | cut -f1) → $OUT (префикс $P)"

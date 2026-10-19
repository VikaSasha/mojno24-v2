# Сборка общих блоков в страницы (без Node): шапка, мобильное меню, окно заявки, подвал.
# В каждой странице блоки обозначены маркерами <!--@header--> ... <!--/@header-->.
# Скрипт подставляет актуальный партиал между маркерами и проставляет aria-current
# пунктам меню, у которых data-nav совпадает с data-section страницы.
# Запуск: powershell -ExecutionPolicy Bypass -File tools\build.ps1
$ErrorActionPreference = 'Stop'
$site = Resolve-Path (Join-Path $PSScriptRoot '..')
$utf8 = New-Object Text.UTF8Encoding $false
$b2b = @('business','retail','private-label','b2g','export','suppliers','documents')

$pages = Get-ChildItem $site -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch '\\(partials|tools|assets)\\' }
foreach ($pg in $pages) {
  $html = [IO.File]::ReadAllText($pg.FullName, [Text.Encoding]::UTF8)
  $isEn = $pg.FullName -match '\\en\\'
  $suffix = if ($isEn) { '-en' } else { '' }
  $m = [regex]::Match($html, 'data-section="([^"]*)"')
  $section = if ($m.Success) { $m.Groups[1].Value } else { '' }
  foreach ($block in @('header','drawer','request','footer')) {
    $partPath = Join-Path $site "partials\$block$suffix.html"
    if (-not (Test-Path $partPath)) { continue }
    $part = [IO.File]::ReadAllText($partPath, [Text.Encoding]::UTF8).Trim()
    # активный пункт меню
    if ($section) {
      $part = [regex]::Replace($part, '(<a\b[^>]*\bdata-nav="' + [regex]::Escape($section) + '"[^>]*)>', '$1 aria-current="page">')
      if ($b2b -contains $section) { $part = $part -replace 'data-nav="business"', 'data-nav="business" data-active="true"' }
    }
    $pattern = '(?s)<!--@' + $block + '-->.*?<!--/@' + $block + '-->'
    if ($html -match $pattern) {
      $html = [regex]::Replace($html, $pattern, { param($x) "<!--@$block-->`n$part`n<!--/@$block-->" })
    }
  }
  [IO.File]::WriteAllText($pg.FullName, $html, $utf8)
  "собрано: " + $pg.FullName.Replace($site.Path + '\', '')
}

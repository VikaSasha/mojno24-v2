# Локальный сервер доработанной версии сайта «Новые продукты».
# Сайт: http://localhost:8124/   Админка: http://localhost:8124/admin/
# Кроме раздачи файлов умеет сохранять данные админки (каталог, новости, фото) и создавать страницы новых товаров и новостей.
param([int]$Port = 8124)
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'; '.avif'='image/avif'; '.svg'='image/svg+xml';
  '.gif'='image/gif'; '.ico'='image/x-icon'; '.ttf'='font/ttf'; '.woff'='font/woff'; '.woff2'='font/woff2'; '.otf'='font/otf';
  '.glb'='model/gltf-binary'; '.mp4'='video/mp4'; '.webm'='video/webm'; '.xml'='application/xml'; '.txt'='text/plain; charset=utf-8'; '.pdf'='application/pdf' }
$notFound = Join-Path $root '404\index.html'
$dataDir = Join-Path $root 'v2\data'
$uploadDir = Join-Path $root 'v2\img\uploads'

function Send-Bytes($c, [int]$code, [string]$type, [byte[]]$bytes) {
  $c.Response.StatusCode = $code; $c.Response.ContentType = $type
  $c.Response.Headers['Cache-Control'] = 'no-store'
  $c.Response.ContentLength64 = $bytes.Length
  try { $c.Response.OutputStream.Write($bytes, 0, $bytes.Length) } catch {}
  $c.Response.Close()
}
function Send-Json($c, [int]$code, $obj) { Send-Bytes $c $code 'application/json; charset=utf-8' ($utf8.GetBytes(($obj | ConvertTo-Json -Compress -Depth 5))) }
function Read-Body($c) { $ms = New-Object System.IO.MemoryStream; $c.Request.InputStream.CopyTo($ms); return , $ms.ToArray() }
function Safe-Slug([string]$s) { return (($s + '').ToLower() -replace '[^a-z0-9-]', '').Trim('-') }
# заголовок попадает и в HTML, и в данные Next.js внутри строки JS — убираем опасные символы
function Clean-Title([string]$s) { return (($s + '') -replace '["\\<>&\r\n]', ' ' -replace '\s+', ' ').Trim() }
function Is-Managed([string]$file, [string]$type) {
  if (-not (Test-Path -LiteralPath $file)) { return $false }
  return ([IO.File]::ReadAllText($file, $utf8)).Contains('<meta name="v2-page" content="' + $type + '"/>')
}
function Backup-Data([string]$name) {
  $src = Join-Path $dataDir $name
  if (Test-Path -LiteralPath $src) {
    $dst = Join-Path $dataDir ('backup\' + [IO.Path]::GetFileNameWithoutExtension($name) + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')
    Copy-Item -LiteralPath $src $dst -Force
    # храним последние 40 копий каждого файла
    Get-ChildItem (Join-Path $dataDir 'backup') -Filter ([IO.Path]::GetFileNameWithoutExtension($name) + '-*.json') | Sort-Object Name -Descending | Select-Object -Skip 40 | Remove-Item -Force
  }
}

# Создаёт/обновляет страницы /<section>/<slug>/ из шаблона и удаляет созданные ранее страницы, которых больше нет в данных.
# Страницы исходного сайта (без метки v2-page) никогда не перезаписываются.
function Build-Pages([string]$type, [string]$section, $items) {
  $tpl = [IO.File]::ReadAllText((Join-Path $root "v2\templates\$type.html"), $utf8)
  $want = @{}; $made = 0; $skipped = @()
  foreach ($it in $items) {
    $s = Safe-Slug $it.slug; if (-not $s) { continue }
    $dir = Join-Path $root "$section\$s"; $file = Join-Path $dir 'index.html'
    if ((Test-Path -LiteralPath $file) -and -not (Is-Managed $file $type)) { $skipped += $s; continue }
    $want[$s] = 1
    $title = Clean-Title $it.title; if (-not $title) { $title = 'Новые продукты' }
    New-Item -ItemType Directory -Force $dir | Out-Null
    [IO.File]::WriteAllText($file, $tpl.Replace('__TITLE__', $title).Replace('__PATH__', "$section/$s"), $utf8); $made++
  }
  $removed = 0
  Get-ChildItem -LiteralPath (Join-Path $root $section) -Directory | ForEach-Object {
    $f = Join-Path $_.FullName 'index.html'
    if (-not $want.ContainsKey($_.Name) -and (Is-Managed $f $type)) { Remove-Item -LiteralPath $_.FullName -Recurse -Force; $removed++ }
  }
  return @{ pages = $made; removed = $removed; skipped = $skipped }
}

function Save-Catalog($c, [string]$text) {
  try { $obj = $text | ConvertFrom-Json } catch { return Send-Json $c 400 @{ error = 'Некорректный JSON' } }
  if ($null -eq $obj.products) { return Send-Json $c 400 @{ error = 'Нет списка products' } }
  Backup-Data 'catalog.json'
  [IO.File]::WriteAllText((Join-Path $dataDir 'catalog.json'), $text, $utf8)
  $items = @($obj.products | ForEach-Object {
    $t = @($_.b, $_.n) -join ' '; if ($_.meta) { $t += ', ' + $_.meta }; if ($_.title) { $t = $_.title }
    @{ slug = $_.s; title = $t } })
  $r = Build-Pages 'product' 'product' $items
  Send-Json $c 200 @{ ok = $true; pages = $r.pages; removed = $r.removed; skipped = $r.skipped }
}
function Save-News($c, [string]$text) {
  try { $obj = $text | ConvertFrom-Json } catch { return Send-Json $c 400 @{ error = 'Некорректный JSON' } }
  Backup-Data 'news.json'
  [IO.File]::WriteAllText((Join-Path $dataDir 'news.json'), $text, $utf8)
  $items = @(@($obj) | Where-Object { $_ -and $_.s } | ForEach-Object { @{ slug = $_.s; title = $_.title } })
  $r = Build-Pages 'news' 'news' $items
  Send-Json $c 200 @{ ok = $true; pages = $r.pages; removed = $r.removed; skipped = $r.skipped }
}
function Save-Where($c, [string]$text) {
  try { $obj = $text | ConvertFrom-Json } catch { return Send-Json $c 400 @{ error = 'Некорректный JSON' } }
  if ($null -eq $obj.partners) { return Send-Json $c 400 @{ error = 'Нет списка partners' } }
  Backup-Data 'where.json'
  [IO.File]::WriteAllText((Join-Path $dataDir 'where.json'), $text, $utf8)
  Send-Json $c 200 @{ ok = $true }
}
function Save-Upload($c, [byte[]]$bytes) {
  if ($bytes.Length -lt 16 -or $bytes.Length -gt 15MB) { return Send-Json $c 400 @{ error = 'Файл пустой или больше 15 МБ' } }
  $ext = if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) { '.jpg' } elseif ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) { '.png' } elseif ($bytes[8] -eq 0x57 -and $bytes[9] -eq 0x45) { '.webp' } else { $null }
  if (-not $ext) { return Send-Json $c 400 @{ error = 'Нужен JPG, PNG или WebP' } }
  $base = Safe-Slug $c.Request.QueryString['name']; if (-not $base) { $base = 'image' }
  if ($base.Length -gt 60) { $base = $base.Substring(0, 60) }
  $name = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + (Get-Random -Maximum 9999) + '-' + $base + $ext
  New-Item -ItemType Directory -Force $uploadDir | Out-Null
  [IO.File]::WriteAllBytes((Join-Path $uploadDir $name), $bytes)
  Send-Json $c 200 @{ ok = $true; path = '/v2/img/uploads/' + $name }
}

$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
try { $l.Start() } catch {
  Write-Host "Порт $Port занят — возможно, сервер уже запущен. Откройте http://localhost:$Port/ в браузере." -ForegroundColor Yellow
  Start-Sleep -Seconds 6; exit 1
}
Write-Host "Сайт:    http://localhost:$Port/"
Write-Host "Админка: http://localhost:$Port/admin/"
Write-Host "(не закрывайте это окно, пока работаете с сайтом; Ctrl+C — остановить)"

while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath)
    $method = $c.Request.HttpMethod

    # ---------- API админки ----------
    if ($p.StartsWith('/api/')) {
      if ($p -eq '/api/ping') { Send-Json $c 200 @{ ok = $true }; continue }
      # защита от запросов с чужих сайтов: нужен свой заголовок (браузер не пошлёт его с другого домена без разрешения)
      $origin = $c.Request.Headers['Origin']
      if ($c.Request.Headers['X-V2-Admin'] -ne '1' -or ($origin -and $origin -ne "http://localhost:$Port")) { Send-Json $c 403 @{ error = 'Запрещено' }; continue }
      $body = Read-Body $c
      if ($p -eq '/api/catalog' -and $method -eq 'PUT') { Save-Catalog $c ($utf8.GetString($body)); continue }
      if ($p -eq '/api/news' -and $method -eq 'PUT') { Save-News $c ($utf8.GetString($body)); continue }
      if ($p -eq '/api/where' -and $method -eq 'PUT') { Save-Where $c ($utf8.GetString($body)); continue }
      if ($p -eq '/api/upload' -and $method -eq 'POST') { Save-Upload $c $body; continue }
      Send-Json $c 404 @{ error = 'Неизвестный запрос' }; continue
    }

    # ---------- статика ----------
    $f = Join-Path $root ($p.TrimStart('/') -replace '/', '\')
    if (Test-Path -LiteralPath $f -PathType Container) { $f = Join-Path $f 'index.html' }
    $code = 200
    if (-not (Test-Path -LiteralPath $f -PathType Leaf)) {
      if ([IO.Path]::GetExtension($p) -eq '' -and (Test-Path -LiteralPath $notFound)) { $f = $notFound; $code = 404 }
      else { $c.Response.StatusCode = 404; $c.Response.Close(); continue }
    }
    $b = [IO.File]::ReadAllBytes($f)
    $ext = [IO.Path]::GetExtension($f).ToLower()
    $type = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    # заменённые фото лежат под старыми именами .webp, но внутри JPEG/PNG — отдаём правильный тип
    if ($b.Length -gt 4 -and $type -like 'image/*') {
      if ($b[0] -eq 0xFF -and $b[1] -eq 0xD8) { $type = 'image/jpeg' } elseif ($b[0] -eq 0x89 -and $b[1] -eq 0x50) { $type = 'image/png' }
    }
    $c.Response.StatusCode = $code; $c.Response.ContentType = $type; $c.Response.ContentLength64 = $b.Length
    if ($p.StartsWith('/v2/data/') -or $p.StartsWith('/admin')) { $c.Response.Headers['Cache-Control'] = 'no-store' }
    try { $c.Response.OutputStream.Write($b, 0, $b.Length) } catch {}
    $c.Response.Close()
  } catch {
    Write-Host ("Ошибка: " + $_.Exception.Message) -ForegroundColor Red
    try { $c.Response.StatusCode = 500; $c.Response.Close() } catch {}
  }
}

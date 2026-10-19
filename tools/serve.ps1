# Локальный просмотр сайта: http://localhost:8140/  (Ctrl+C — остановить)
# Только раздача статических файлов; на хостинге компании сервер не нужен.
# Поддерживает HTTP Range (206) — без этого браузер не может перематывать видео.
param([int]$Port = 8140)
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml'; '.pdf'='application/pdf'; '.txt'='text/plain; charset=utf-8'; '.xml'='application/xml';
  '.ico'='image/x-icon'; '.webmanifest'='application/manifest+json'; '.woff2'='font/woff2'; '.zip'='application/zip'; '.mp4'='video/mp4'; '.vtt'='text/vtt' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Сайт: http://localhost:$Port/"
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath)
    $f = Join-Path $root ($p.TrimStart('/') -replace '/', '\')
    if (Test-Path -LiteralPath $f -PathType Container) { $f = Join-Path $f 'index.html' }
    $code = 200
    if (-not (Test-Path -LiteralPath $f -PathType Leaf)) { $f = Join-Path $root '404.html'; $code = 404 }
    $ext = [IO.Path]::GetExtension($f).ToLower()
    $c.Response.ContentType = $(if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' })
    $c.Response.Headers['Cache-Control'] = 'no-store'
    $c.Response.Headers['Accept-Ranges'] = 'bytes'
    $fs = [IO.File]::OpenRead($f); $len = $fs.Length; $start = 0; $end = $len - 1
    $range = $c.Request.Headers['Range']
    if ($code -eq 200 -and $range -match '^bytes=(\d*)-(\d*)$') {
      if ($Matches[1] -ne '') { $start = [long]$Matches[1] }
      if ($Matches[2] -ne '') { $end = [Math]::Min([long]$Matches[2], $len - 1) } elseif ($Matches[1] -eq '') { $start = 0 }
      $code = 206; $c.Response.Headers['Content-Range'] = "bytes $start-$end/$len"
    }
    $c.Response.StatusCode = $code
    $count = $end - $start + 1; $c.Response.ContentLength64 = $count
    $fs.Seek($start, 'Begin') | Out-Null
    $buf = New-Object byte[] 65536; $left = $count
    while ($left -gt 0) { $n = $fs.Read($buf, 0, [Math]::Min($buf.Length, $left)); if ($n -le 0) { break }; $c.Response.OutputStream.Write($buf, 0, $n); $left -= $n }
    $fs.Close()
  } catch { try { if ($fs) { $fs.Close() } } catch {} }
  finally { try { $c.Response.Close() } catch {} }
}

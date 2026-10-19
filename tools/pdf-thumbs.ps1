# Рендер первой страницы PDF в JPEG через встроенный в Windows 10 Windows.Data.Pdf (без внешних программ).
# Используется для превью благодарственных писем и дипломов в разделе «Соцпроекты» / «Награды».
param([string[]]$Pairs)  # "исходный.pdf|выходной.jpg"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTaskGeneric.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
function AwaitAction($op) { $m = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1; $t = $m.Invoke($null, @($op)); $t.Wait(-1) | Out-Null }

foreach ($p in $Pairs) {
  $src, $dst = $p -split '\|'
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($src)) ([Windows.Storage.StorageFile])
  $doc  = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
  $page = $doc.GetPage(0)
  $ms = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $opt = New-Object Windows.Data.Pdf.PdfPageRenderOptions
  $opt.DestinationWidth = 900
  AwaitAction ($page.RenderToStreamAsync($ms, $opt))
  $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($ms)
  $img = [Drawing.Image]::FromStream($net)
  New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
  $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]80)
  $img.Save($dst, $codec, $ep)
  "{0}  {1}x{2}  {3} KB" -f (Split-Path $dst -Leaf), $img.Width, $img.Height, [int]((Get-Item $dst).Length/1KB)
  $img.Dispose(); $net.Dispose(); $page.Dispose()
}

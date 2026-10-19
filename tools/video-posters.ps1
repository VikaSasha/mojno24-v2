# Кадр-обложка (poster) для видео через Windows.Storage (миниатюра проводника), без ffmpeg.
param([string[]]$Pairs, [int]$Size = 1280)  # "видео.mp4|обложка.jpg"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.FileProperties.ThumbnailMode, Windows.Storage, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
foreach ($p in $Pairs) {
  $src, $dst = $p -split '\|'
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($src)) ([Windows.Storage.StorageFile])
  $th = Await ($file.GetThumbnailAsync([Windows.Storage.FileProperties.ThumbnailMode]::SingleItem, [uint32]$Size, [Windows.Storage.FileProperties.ThumbnailOptions]::ResizeThumbnail)) ([Windows.Storage.FileProperties.StorageItemThumbnail])
  $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($th)
  $img = [Drawing.Image]::FromStream($net)
  New-Item -ItemType Directory -Force (Split-Path $dst) | Out-Null
  $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]80)
  $img.Save($dst, $codec, $ep)
  "{0}  {1}x{2}  {3} KB" -f (Split-Path $dst -Leaf), $img.Width, $img.Height, [int]((Get-Item $dst).Length/1KB)
  $img.Dispose(); $net.Dispose()
}

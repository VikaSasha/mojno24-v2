# Перекодирование видео для сайта встроенным в Windows MediaTranscoder (H.264 + AAC, без ffmpeg).
# Параметры: пары "исходник.mp4|результат.mp4", целевая ширина/высота и битрейт.
param([string]$Src, [string]$Dst, [int]$Width = 1280, [int]$Height = 720, [int]$Kbps = 1600)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime]
$null = [Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime]

$ext = [System.WindowsRuntimeSystemExtensions].GetMethods()
$asTaskOp = ($ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskActP = ($ext | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncActionWithProgress`1' })[0]
function Await($op, [Type]$t) { $task = $asTaskOp.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }

$in = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Src)) ([Windows.Storage.StorageFile])
$dir = Split-Path $Dst; New-Item -ItemType Directory -Force $dir | Out-Null
$folder = Await ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($dir)) ([Windows.Storage.StorageFolder])
$out = Await ($folder.CreateFileAsync((Split-Path $Dst -Leaf), [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])

$profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD720p)
$profile.Video.Width = [uint32]$Width; $profile.Video.Height = [uint32]$Height
$profile.Video.Bitrate = [uint32]($Kbps * 1000)
$profile.Audio.Bitrate = [uint32]96000

$tc = New-Object Windows.Media.Transcoding.MediaTranscoder
$tc.HardwareAccelerationEnabled = $true
$prep = Await ($tc.PrepareFileTranscodeAsync($in, $out, $profile)) ([Windows.Media.Transcoding.PrepareTranscodeResult])
if (-not $prep.CanTranscode) { throw "Нельзя перекодировать: $($prep.FailureReason)" }
$task = $asTaskActP.MakeGenericMethod([double]).Invoke($null, @($prep.TranscodeAsync()))
$task.Wait(-1) | Out-Null
"{0}  ->  {1:N1} MB" -f (Split-Path $Dst -Leaf), ((Get-Item $Dst).Length/1MB)

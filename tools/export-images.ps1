# Экспорт изображений для сайта из папки «! Маркетинг».
# Запуск: powershell -ExecutionPolicy Bypass -File tools\export-images.ps1
# Исходники не меняются; результат кладётся в assets\img. Продуктовые фото — max 720 px,
# сцены — max 1600 px, JPEG q≈80. PNG с прозрачностью обрезается по альфа-каналу.
Add-Type -AssemblyName System.Drawing
$MK   = "C:\Users\123\Desktop\! Маркетинг"
$OUT  = Join-Path $PSScriptRoot "..\assets\img" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $OUT) { $OUT = Join-Path $PSScriptRoot "..\assets\img"; New-Item -ItemType Directory -Force $OUT | Out-Null; $OUT = Resolve-Path $OUT }
$OUT  = $OUT.Path
$CUT  = "C:\Users\123\AppData\Local\Temp\claude\C--Users-123-Desktop------------\b2bda48c-9386-4624-9c83-93b22011ee5e\scratchpad\cut"

function Src([string]$name, [string]$under = $MK) {
  $f = Get-ChildItem -LiteralPath $under -Recurse -File -ErrorAction SilentlyContinue |
       Where-Object { $_.Name -eq $name -and $_.FullName -notmatch '\\(mojno24|novye-produkty|Новая папка)' } | Select-Object -First 1
  if (-not $f) { throw "Не найден исходник: $name" }
  $f.FullName
}
function Codec($mime) { [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq $mime } }

# Рамка непрозрачного/небелого содержимого (в пикселях исходника)
function Content-Rect($bmp, [bool]$alpha, [int]$thr = 244) {
  $s = [Math]::Min(1.0, 500.0 / [Math]::Max($bmp.Width, $bmp.Height))
  $sm = New-Object Drawing.Bitmap $bmp, ([int]($bmp.Width*$s)), ([int]($bmp.Height*$s))
  $minX=$sm.Width; $minY=$sm.Height; $maxX=0; $maxY=0
  for ($y=0; $y -lt $sm.Height; $y++) { for ($x=0; $x -lt $sm.Width; $x++) {
    $c = $sm.GetPixel($x,$y)
    $hit = if ($alpha) { $c.A -gt 12 } else { ($c.R -lt $thr -or $c.G -lt $thr -or $c.B -lt $thr) }
    if ($hit) { if($x -lt $minX){$minX=$x}; if($x -gt $maxX){$maxX=$x}; if($y -lt $minY){$minY=$y}; if($y -gt $maxY){$maxY=$y} } } }
  $sm.Dispose()
  if ($maxX -le $minX) { return New-Object Drawing.Rectangle 0,0,$bmp.Width,$bmp.Height }
  $x0=[int]([Math]::Max(0,($minX-1)/$s)); $y0=[int]([Math]::Max(0,($minY-1)/$s))
  $x1=[int]([Math]::Min($bmp.Width,($maxX+2)/$s)); $y1=[int]([Math]::Min($bmp.Height,($maxY+2)/$s))
  New-Object Drawing.Rectangle $x0,$y0,($x1-$x0),($y1-$y0)
}

# mode: 'trim' — обрезать по содержимому (+pad), 'cover' — кадр под пропорцию (ratio w/h, фокус fx,fy), 'fit' — как есть
function Export([string]$src, [string]$rel, [int]$max, [string]$mode = 'fit', [double]$ratio = 0, [double]$fx = 0.5, [double]$fy = 0.5, [double]$pad = 0.06, [int]$q = 80) {
  $out = Join-Path $OUT $rel; New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  $img = [Drawing.Image]::FromFile($src)
  $hasAlpha = [Drawing.Image]::IsAlphaPixelFormat($img.PixelFormat)
  $bmp = New-Object Drawing.Bitmap $img; $img.Dispose()
  $png = $out.ToLower().EndsWith('.png')
  $r = New-Object Drawing.Rectangle 0,0,$bmp.Width,$bmp.Height
  if ($mode -eq 'trim') {
    # прозрачный исходник обрезаем по альфе, остальные — по «небелому»; в JPEG прозрачность ложится на белый
    $r = Content-Rect $bmp $hasAlpha
    $p = [int]([Math]::Max($r.Width,$r.Height)*$pad)
    $r = New-Object Drawing.Rectangle ($r.X-$p), ($r.Y-$p), ($r.Width+2*$p), ($r.Height+2*$p)
  } elseif ($mode -eq 'cover') {
    $w=$bmp.Width; $h=$bmp.Height
    if ($w/$h -gt $ratio) { $nw=[int]($h*$ratio); $x=[int](($w-$nw)*$fx); $r = New-Object Drawing.Rectangle $x,0,$nw,$h }
    else { $nh=[int]($w/$ratio); $y=[int](($h-$nh)*$fy); $r = New-Object Drawing.Rectangle 0,$y,$w,$nh }
  }
  $k = [Math]::Min(1.0, $max / [Math]::Max($r.Width,$r.Height))
  $W=[int][Math]::Round($r.Width*$k); $H=[int][Math]::Round($r.Height*$k)
  $dst = New-Object Drawing.Bitmap $W,$H,([Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode='HighQualityBicubic'; $g.PixelOffsetMode='HighQuality'; $g.CompositingQuality='HighQuality'; $g.SmoothingMode='HighQuality'
  if ($png) { $g.Clear([Drawing.Color]::Transparent) } else { $g.Clear([Drawing.Color]::White) }
  $g.DrawImage($bmp, (New-Object Drawing.Rectangle 0,0,$W,$H), $r.X,$r.Y,$r.Width,$r.Height, [Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $bmp.Dispose()
  if ($png) { $dst.Save($out, [Drawing.Imaging.ImageFormat]::Png) }
  else { $ep = New-Object Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$q); $dst.Save($out, (Codec 'image/jpeg'), $ep) }
  $dst.Dispose()
  "{0,-38} {1}x{2}  {3} KB" -f $rel, $W, $H, [int]((Get-Item $out).Length/1KB)
}

# ---------- Продукты: Street Lunch, коробки (цветной дизайн «Стрит Ланч», прозрачные рендеры) ----------
Export (Src 'SL_Грибы.png')    'products/sl-griby-box.jpg'      720 'trim' -pad 0.02
Export (Src 'SL_Говядина.png') 'products/sl-govyadina-box.jpg'  720 'trim' -pad 0.02
Export (Src 'SL_Курица.png')   'products/sl-kurica-box.jpg'     720 'trim' -pad 0.02
Export (Src 'SL_Овощи.png')    'products/sl-ovoshchi-box.jpg'   720 'trim' -pad 0.02
Export (Src 'SL_Ребра.png')    'products/sl-rebra-box.jpg'      720 'trim' -pad 0.02
Export (Src 'SL-борщ.png')     'products/sl-borshch-box.jpg'    720 'trim' -pad 0.02
Export (Src 'SL-солянка.png')  'products/sl-solyanka-box.jpg'   720 'trim' -pad 0.02
# Шоу-бокс 25 пакетиков (крафт-пакетики) и одиночные пакетики
Export (Src 'IMG_0343.jpg' "$MK\! Пакетики") 'products/sl-griby-showbox.jpg'     720 'trim' -pad 0.03
Export (Src 'IMG_0346.jpg' "$MK\! Пакетики") 'products/sl-govyadina-showbox.jpg' 720 'trim' -pad 0.03
Export (Src 'IMG_0345.jpg' "$MK\! Пакетики") 'products/sl-kurica-showbox.jpg'    720 'trim' -pad 0.03
Export (Src 'IMG_0344.jpg' "$MK\! Пакетики") 'products/sl-ovoshchi-showbox.jpg'  720 'trim' -pad 0.03
Export (Src 'IMG_0342.jpg' "$MK\! Пакетики") 'products/sl-rebra-showbox.jpg'     720 'trim' -pad 0.03
Export (Src 'IMG_0338.jpg' "$MK\! Пакетики") 'products/sl-griby-packet.jpg'      720 'trim' -pad 0.03
Export (Src 'IMG_0341.jpg' "$MK\! Пакетики") 'products/sl-govyadina-packet.jpg'  720 'trim' -pad 0.03
Export (Src 'IMG_0340.jpg' "$MK\! Пакетики") 'products/sl-kurica-packet.jpg'     720 'trim' -pad 0.03
Export (Src 'IMG_0339.jpg' "$MK\! Пакетики") 'products/sl-ovoshchi-packet.jpg'   720 'trim' -pad 0.03
Export (Src 'IMG_0337.jpg' "$MK\! Пакетики") 'products/sl-rebra-packet.jpg'      720 'trim' -pad 0.03
# Стаканы — вырезаны в Adobe (Photoshop API), цветной дизайн «Стрит Ланч»
Export "$CUT\cup-griby.png"     'products/sl-griby-cup.jpg'     720 'trim' -pad 0.02
Export "$CUT\cup-govyadina.png" 'products/sl-govyadina-cup.jpg' 720 'trim' -pad 0.02
Export "$CUT\cup-kurica.png"    'products/sl-kurica-cup.jpg'    720 'trim' -pad 0.02
Export "$CUT\cup-rebra.png"     'products/sl-rebra-cup.jpg'     720 'trim' -pad 0.02
# Наша Каша
Export (Src 'Наша Каша грибы.png')       'products/kasha-griby-box.jpg'     720 'trim' -pad 0.02
Export (Src 'Наша Каша с говядиной.png') 'products/kasha-govyadina-box.jpg' 720 'trim' -pad 0.02
# РисоМишки
Export (Src 'Рисомишки_Апельсин.png' "$MK\! Рисомишки") 'products/rm-apelsin.jpg' 720 'trim' -pad 0.02
Export (Src 'Рисомишки_Малина.png'   "$MK\! Рисомишки") 'products/rm-malina.jpg'  720 'trim' -pad 0.02
Export (Src 'Рисомишки_Манго.png'    "$MK\! Рисомишки") 'products/rm-mango.jpg'   720 'trim' -pad 0.02
Export (Src 'Рисомишки-соленые (1).png' "$MK\! Рисомишки") 'products/rm-solenye.jpg' 720 'trim' -pad 0.02
Export (Src 'Layer 3.jpg' "$MK\! Рисомишки") 'products/rm-belaya.jpg'     720 'trim' -pad 0.03
Export (Src 'Layer 6.jpg' "$MK\! Рисомишки") 'products/rm-temnaya.jpg'    720 'trim' -pad 0.03
Export (Src 'Layer 8.jpg' "$MK\! Рисомишки") 'products/rm-molochnaya.jpg' 720 'trim' -pad 0.03
# Хрумстик (батончик в упаковке; без упаковки — для страницы бренда)
Export (Src 'ХрКурага1.jpg' "$MK\! Хрумстики") 'products/hr-kuraga.jpg' 720 'trim' -pad 0.04
Export (Src 'ХрК1.jpg'      "$MK\! Хрумстики") 'products/hr-koritsa.jpg' 720 'trim' -pad 0.04
Export (Src 'ХрО1.jpg'      "$MK\! Хрумстики") 'products/hr-orekh.jpg'  720 'trim' -pad 0.04
Export (Src 'ХрТ1.jpg'      "$MK\! Хрумстики") 'products/hr-tykva.jpg'  720 'trim' -pad 0.04
Export (Src 'ХрКурага2.jpg' "$MK\! Хрумстики") 'products/hr-bar.jpg'    720 'trim' -pad 0.06
# Крупы в ПЭТ-банке (есть 3 из 6)
Export (Src 'banka_1.jpg') 'products/pet-grechka.jpg'    720 'trim' -pad 0.05
Export (Src 'banka_2.jpg') 'products/pet-ris.jpg'        720 'trim' -pad 0.05
Export (Src 'banka_3.jpg') 'products/pet-polba-drob.jpg' 720 'trim' -pad 0.05

# ---------- Сцены и атмосфера ----------
Export (Src 'DSC_5973 копия.jpg') 'scenes/sl-desk-duo.jpg'   1600 'cover' 0.8 0.5 0.55
Export (Src 'DSC_5959 копия.jpg') 'scenes/sl-desk.jpg'       1600 'cover' 0.8 0.5 0.5
Export (Src 'DSC_5984 копия.jpg') 'scenes/sl-bowl.jpg'       1600 'cover' 0.8 0.5 0.5
Export (Src 'DSC_5988 копия.jpg') 'scenes/sl-backpack.jpg'   1600 'cover' 0.8 0.5 0.5
Export (Src 'DSC_6000 копия.jpg') 'scenes/sl-box-green.jpg'  1600 'cover' 0.8 0.5 0.5
Export (Src 'П ГГ 01_02.jpg')     'scenes/sl-packet.jpg'     1400 'fit'
Export (Src 'DSC_5906 копия.jpg') 'scenes/rm-white-bowl.jpg' 1600 'cover' 0.8 0.5 0.6
Export (Src 'DSC_5920 копия.jpg') 'scenes/rm-choc-bowl.jpg'  1600 'cover' 0.8 0.5 0.6
Export (Src 'DSC_5931 копия.jpg') 'scenes/rm-desk.jpg'       1600 'cover' 0.8 0.5 0.5
Export (Src 'DSC_5911 копия.jpg') 'scenes/rm-lunchbox.jpg'   1600 'cover' 0.8 0.5 0.6
Export (Src 'РМ тём 1.jpg')       'scenes/rm-pattern.jpg'    1600 'fit'
Export (Src 'РМ мол 1.jpg')       'scenes/rm-falling.jpg'    1600 'fit'
Export (Src 'DSC_1870.jpg')       'scenes/rm-strawberry.jpg' 1600 'cover' 1.5 0.5 0.5
Export (Src '0e4e0efa-175b-4ad6-9661-5450de378895.jpg') 'brand/rm-bear-brown.jpg' 900 'trim' -pad 0.04
Export (Src 'e3d9ee36-76a3-4b76-a731-533093ac18c9.jpg') 'brand/rm-bear-light.jpg' 900 'trim' -pad 0.04
Export (Src 'ЛОГО РисоМишки.jpg') 'brand/rm-logo.jpg' 900 'fit'
# СТМ-кейс ЖизньМарт и полки
Export (Src 'РМ ЖМ 1.jpg') 'scenes/stm-zhm-1.jpg' 1400 'fit'
Export (Src 'РМ ЖМ 2.jpg') 'scenes/stm-zhm-2.jpg' 1400 'fit'
Export (Src 'РИСОМИШКИ ЖМ1.jpg') 'shelves/zhm-1.jpg' 1200 'fit'
Export (Src 'РИСОМИШКИ ЖМ3.jpg') 'shelves/zhm-3.jpg' 1200 'fit'
Export (Src '5287457728014443981.jpg') 'shelves/rm-shelf-1.jpg' 1200 'fit'
Export (Src '5287457728014443988.jpg') 'shelves/rm-shelf-2.jpg' 1200 'fit'
# Соцпроекты: «Белый рынок» — только кадры без крупных лиц детей
Export (Src '8ae5de70-b32d-4e7c-91d7-b09ea831ba55.jpg') 'social/belyi-pyramid.jpg' 1200 'fit'
Export (Src '543fbe31-2b60-4b11-9b9a-58f9a646b1cc.jpg') 'social/belyi-hall.jpg'    1400 'fit'
Export (Src 'f291c78b-146c-43d6-9217-0963e44c17c3.jpg') 'social/belyi-table.jpg'   1200 'fit'
Export (Src '55b7ba52-2140-459e-b213-918fa769f877.jpg') 'social/belyi-stage.jpg'   1400 'fit'
# Награды
Export (Src 'WF_NG_orange_infoline_25 (1).png' "$MK\НАШИ НАГРАДЫ!!!") 'awards/worldfood-2025.png' 600 'trim' -pad 0.02
Export (Src 'рисомишки лауреат_page-0001.jpg')   'awards/rm-laureat.jpg'   900 'fit'
Export (Src 'рисомишки Новинка_page-0001.jpg')   'awards/rm-novinka.jpg'   900 'fit'
Export (Src 'стрит ланч дипломант_page-0001.jpg') 'awards/sl-diplomant.jpg' 900 'fit'

# ---------- Прозрачные вырезки для композиций (герой, страницы брендов) ----------
Export (Src 'SL_Грибы.png')    'cutouts/sl-griby-box.png' 360 'trim' -pad 0.01
Export (Src 'SL_Курица.png')   'cutouts/sl-kurica-box.png' 360 'trim' -pad 0.01
Export (Src 'SL-борщ.png')     'cutouts/sl-borshch-box.png' 360 'trim' -pad 0.01
Export "$CUT\cup-rebra.png"   'cutouts/sl-rebra-cup.png' 360 'trim' -pad 0.01
Export (Src 'Наша Каша грибы.png') 'cutouts/kasha-griby-box.png' 360 'trim' -pad 0.01
Export (Src 'Рисомишки_Манго.png' "$MK\! Рисомишки")  'cutouts/rm-mango.png' 360 'trim' -pad 0.01
Export (Src 'Рисомишки_Малина.png' "$MK\! Рисомишки") 'cutouts/rm-malina.png' 360 'trim' -pad 0.01

# Крупные вырезки только для первого экрана страниц брендов (грузятся только там)
Export (Src 'SL_Грибы.png')    'cutouts/lg-sl-griby-box.png'    560 'trim' -pad 0.01
Export (Src 'Наша Каша грибы.png') 'cutouts/lg-kasha-griby-box.png' 560 'trim' -pad 0.01
Export (Src 'Рисомишки_Манго.png' "$MK\! Рисомишки") 'cutouts/lg-rm-mango.png' 560 'trim' -pad 0.01

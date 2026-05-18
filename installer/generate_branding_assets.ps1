param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "generated\branding")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Brush {
  param(
    [int]$A,
    [int]$R,
    [int]$G,
    [int]$B
  )

  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($A, $R, $G, $B))
}

function Draw-NodeField {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)]
    [int]$Width,
    [Parameter(Mandatory = $true)]
    [int]$Height,
    [int]$Columns,
    [int]$Rows,
    [int]$OffsetX,
    [int]$OffsetY,
    [int]$SpacingX,
    [int]$SpacingY
  )

  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(52, 90, 148, 224), 1.0)
  $nodeBrush = New-Brush -A 255 -R 88 -G 166 -B 255
  try {
    for ($row = 0; $row -lt $Rows; $row++) {
      for ($column = 0; $column -lt $Columns; $column++) {
        $x = $OffsetX + ($column * $SpacingX)
        $y = $OffsetY + ($row * $SpacingY)

        if ($column -lt ($Columns - 1)) {
          $Graphics.DrawLine($linePen, $x, $y, $x + $SpacingX, $y)
        }

        if ($row -lt ($Rows - 1)) {
          $Graphics.DrawLine($linePen, $x, $y, $x, $y + $SpacingY)
        }

        $Graphics.FillEllipse($nodeBrush, $x - 3, $y - 3, 6, 6)
      }
    }
  }
  finally {
    $linePen.Dispose()
    $nodeBrush.Dispose()
  }
}

function New-BitmapGraphics {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Width,
    [Parameter(Mandatory = $true)]
    [int]$Height
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return [pscustomobject]@{ Bitmap = $bitmap; Graphics = $graphics }
}

function Write-BannerImage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $surface = New-BitmapGraphics -Width 493 -Height 58
  $bitmap = $surface.Bitmap
  $graphics = $surface.Graphics

  $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, 493, 58)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($backgroundRect, [System.Drawing.Color]::FromArgb(17, 25, 42), [System.Drawing.Color]::FromArgb(7, 12, 22), 0.0)
  $accentBrush = New-Brush -A 255 -R 88 -G 166 -B 255
  $titleBrush = New-Brush -A 255 -R 239 -G 243 -B 250
  $subtitleBrush = New-Brush -A 255 -R 150 -G 180 -B 220
  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 15.0, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 8.0, [System.Drawing.FontStyle]::Regular)
  try {
    $graphics.FillRectangle($gradient, $backgroundRect)
    $graphics.FillRectangle($accentBrush, 0, 0, 8, 58)
    $graphics.DrawString("Simla", $titleFont, $titleBrush, 260, 9)
    $graphics.DrawString("Deterministic worlds.", $subtitleFont, $subtitleBrush, 322, 15)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $titleFont.Dispose()
    $subtitleFont.Dispose()
    $gradient.Dispose()
    $accentBrush.Dispose()
    $titleBrush.Dispose()
    $subtitleBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function Write-DialogImage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $surface = New-BitmapGraphics -Width 493 -Height 312
  $bitmap = $surface.Bitmap
  $graphics = $surface.Graphics

  $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, 493, 312)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush($backgroundRect, [System.Drawing.Color]::FromArgb(238, 243, 250), [System.Drawing.Color]::FromArgb(197, 214, 239), 90.0)
  $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glowPath.AddEllipse(260, -10, 220, 220)
  $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
  $rightPanelBrush = New-Brush -A 255 -R 18 -G 25 -B 40
  $safeZoneBrush = New-Brush -A 210 -R 249 -G 251 -B 254
  $accentPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 88, 166, 255), 2.2)
  $subtlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 131, 155, 194), 1.2)
  try {
    $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(100, 77, 134, 228)
    $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 77, 134, 228))

    $graphics.FillRectangle($gradient, $backgroundRect)
    $graphics.FillRectangle($safeZoneBrush, 18, 18, 292, 140)
    $graphics.FillEllipse($glowBrush, 250, -10, 220, 220)
    $graphics.FillRectangle($rightPanelBrush, 316, 0, 177, 312)
    Draw-NodeField -Graphics $graphics -Width 493 -Height 312 -Columns 5 -Rows 5 -OffsetX 350 -OffsetY 64 -SpacingX 28 -SpacingY 30
    $graphics.DrawLine($accentPen, 32, 258, 284, 258)
    $graphics.DrawLine($subtlePen, 32, 274, 240, 274)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $gradient.Dispose()
    $glowPath.Dispose()
    $glowBrush.Dispose()
    $rightPanelBrush.Dispose()
    $safeZoneBrush.Dispose()
    $accentPen.Dispose()
    $subtlePen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$bannerPath = Join-Path $OutputDirectory "WixUIBanner.png"
$dialogPath = Join-Path $OutputDirectory "WixUIDialog.png"

Write-BannerImage -Path $bannerPath
Write-DialogImage -Path $dialogPath

Write-Host "Installer branding assets ready:" -ForegroundColor Green
Write-Host "  Banner: $bannerPath"
Write-Host "  Dialog: $dialogPath"
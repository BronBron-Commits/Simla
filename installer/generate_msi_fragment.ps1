param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "generated\RepoFiles.wxs")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function New-SafeId {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Prefix,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $sha1 = [System.Security.Cryptography.SHA1]::Create()
  try {
    $hashBytes = $sha1.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Value))
  }
  finally {
    $sha1.Dispose()
  }

  $hash = ([System.BitConverter]::ToString($hashBytes) -replace "-", "").Substring(0, 8)
  $sanitized = ($Value -replace "[^A-Za-z0-9_]", "_").Trim("_")
  if ([string]::IsNullOrWhiteSpace($sanitized)) {
    $sanitized = "root"
  }
  if ($sanitized[0] -match "[0-9]") {
    $sanitized = "_" + $sanitized
  }
  if ($sanitized.Length -gt 40) {
    $sanitized = $sanitized.Substring(0, 40)
  }

  return "${Prefix}_${sanitized}_$hash"
}

function Add-DirectoryNode {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Map,
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$RelativeDir
  )

  if ($Map.ContainsKey($RelativeDir)) {
    return $Map[$RelativeDir]
  }

  if ([string]::IsNullOrEmpty($RelativeDir)) {
    $node = [ordered]@{
      Id = "INSTALLFOLDER"
      Name = "Simla"
      RelativeDir = ""
      Children = [System.Collections.Generic.List[object]]::new()
    }
    $Map[$RelativeDir] = $node
    return $node
  }

  $parts = $RelativeDir -split "/"
  $name = $parts[-1]
  $parentDir = if ($parts.Length -gt 1) { ($parts[0..($parts.Length - 2)] -join "/") } else { "" }
  $parent = Add-DirectoryNode -Map $Map -RelativeDir $parentDir

  $node = [ordered]@{
    Id = New-SafeId -Prefix "DIR" -Value $RelativeDir
    Name = $name
    RelativeDir = $RelativeDir
    Children = [System.Collections.Generic.List[object]]::new()
  }
  $Map[$RelativeDir] = $node
  [void]$parent.Children.Add($node)
  return $node
}

function Write-DirectoryXml {
  param(
    [Parameter(Mandatory = $true)]
    [System.Text.StringBuilder]$Builder,
    [Parameter(Mandatory = $true)]
    $Node,
    [int]$Indent = 4
  )

  foreach ($child in ($Node.Children | Sort-Object Name)) {
    $spaces = " " * $Indent
    [void]$Builder.AppendLine(('{0}<Directory Id="{1}" Name="{2}">' -f $spaces, $child.Id, $child.Name))
    Write-DirectoryXml -Builder $Builder -Node $child -Indent ($Indent + 2)
    [void]$Builder.AppendLine("${spaces}</Directory>")
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$launcherFiles = @(
  "simla-run.cmd",
  "simla-serve.cmd",
  "simla-repl.cmd",
  "simla-docs.cmd",
  "simla-demo-voxel_world.cmd",
  "simla-demo-sim3d.cmd",
  "simla-demo-rwx_viewer.cmd",
  "simla-demo-first_person.cmd"
)
$missingLaunchers = @($launcherFiles | Where-Object { -not (Test-Path (Join-Path $repoRoot $_)) })
if ($missingLaunchers.Count -gt 0) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repoRoot "install_windows.ps1") -SkipNpmInstall
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to generate launcher files required for the MSI build."
  }
}

$trackedFiles = & git -C $repoRoot ls-files
if ($LASTEXITCODE -ne 0) {
  throw "git ls-files failed while generating the MSI fragment."
}

$allFiles = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($file in $trackedFiles) {
  [void]$allFiles.Add(($file -replace "\\", "/"))
}
foreach ($launcher in $launcherFiles) {
  [void]$allFiles.Add($launcher)
}

$excludePatterns = @(
  '^\.github/',
  '^installer/',
  '^node_modules/',
  '^\.venv/',
  '^\.tmp/',
  '^tmp/',
  '^server_error\.log$'
)

$files = $allFiles | Where-Object {
  $path = $_
  -not ($excludePatterns | Where-Object { $path -match $_ })
} | Sort-Object

$directoryMap = @{}
$rootNode = Add-DirectoryNode -Map $directoryMap -RelativeDir ""

foreach ($file in $files) {
  $relativeDir = Split-Path -Parent $file
  if ($relativeDir -eq ".") {
    $relativeDir = ""
  }
  [void](Add-DirectoryNode -Map $directoryMap -RelativeDir (($relativeDir -replace "\\", "/").TrimStart(".")))
}

$builder = [System.Text.StringBuilder]::new()
[void]$builder.AppendLine('<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">')
[void]$builder.AppendLine('  <Fragment>')
[void]$builder.AppendLine('    <DirectoryRef Id="INSTALLFOLDER">')
Write-DirectoryXml -Builder $builder -Node $rootNode -Indent 6
[void]$builder.AppendLine('    </DirectoryRef>')
[void]$builder.AppendLine('  </Fragment>')
[void]$builder.AppendLine('  <Fragment>')
[void]$builder.AppendLine('    <ComponentGroup Id="RepoFiles">')

foreach ($file in $files) {
  $relativeDir = Split-Path -Parent $file
  if ($relativeDir -eq ".") {
    $relativeDir = ""
  }
  $normalizedDir = ($relativeDir -replace "\\", "/").TrimStart(".")
  $directoryId = if ([string]::IsNullOrEmpty($normalizedDir)) { "INSTALLFOLDER" } else { $directoryMap[$normalizedDir].Id }
  $componentId = New-SafeId -Prefix "CMP" -Value $file
  $fileId = New-SafeId -Prefix "FIL" -Value $file
  $source = '$(var.RepoRoot)\' + ($file -replace '/', '\')
  [void]$builder.AppendLine(('      <Component Id="{0}" Directory="{1}" Guid="*">' -f $componentId, $directoryId))
  [void]$builder.AppendLine(('        <File Id="{0}" Source="{1}" KeyPath="yes" />' -f $fileId, $source))
  [void]$builder.AppendLine('      </Component>')
}

[void]$builder.AppendLine('    </ComponentGroup>')
[void]$builder.AppendLine('  </Fragment>')
[void]$builder.AppendLine('</Wix>')

Set-Content -Path $OutputPath -Value $builder.ToString() -Encoding UTF8
Write-Host "Generated MSI fragment: $OutputPath"
Write-Host "Harvested file count: $($files.Count)"
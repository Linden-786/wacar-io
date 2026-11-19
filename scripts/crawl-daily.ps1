# Daily inventory crawl for Windows. Pulls main, crawls the dealer sites, and
# if the result passes the checks, commits the new snapshot and pushes it to
# main (which redeploys wacar.io). Run by the "Wacar daily crawl" scheduled
# task; see scripts/install-crawl-task.ps1. Logs go to logs\crawl-<date>.log.
$ErrorActionPreference = 'Continue'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo
New-Item -ItemType Directory -Force -Path "$repo\logs" | Out-Null
$log = "$repo\logs\crawl-$(Get-Date -Format yyyy-MM-dd).log"

function Say($text) { "$(Get-Date -Format HH:mm:ss) $text" | Tee-Object -FilePath $log -Append }
function Run($label, [scriptblock]$command) {
  Say "> $label"
  & $command 2>&1 | ForEach-Object { "$_" } | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -ne 0) { throw "$label failed (exit code $LASTEXITCODE)" }
}

try {
  Run 'git fetch' { git fetch origin main }
  Run 'git checkout main' { git checkout main }
  Run 'discard leftovers from a failed run' { git checkout -- data }
  Run 'git pull' { git pull --ff-only origin main }
  Run 'npm ci' { npm ci --no-audit --no-fund }

  $before = (npx tsx crawler/check.ts --count | Select-Object -Last 1)
  if ($LASTEXITCODE -ne 0) { throw 'could not read the current snapshot' }
  Say "Cars for sale before: $before"

  Run 'crawl' { npm run crawl }
  Run 'check the result' { npx tsx crawler/check.ts $before }

  git diff --quiet -- data
  if ($LASTEXITCODE -eq 0) { Say 'No changes to publish.'; exit 0 }
  Run 'git add' { git add data/inventory.json.gz data/crawl-report.json }
  Run 'git commit' { git commit -m "Daily inventory crawl $(Get-Date -Format yyyy-MM-dd)" }
  Run 'git push' { git push origin main }
  Say 'Published.'
} catch {
  Say "FAILED: $_"
  # leave the repository clean so tomorrow's run starts from what is live
  git checkout -- data 2>&1 | Out-Null
  exit 1
}

# keep a month of logs
Get-ChildItem "$repo\logs" -Filter 'crawl-*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item

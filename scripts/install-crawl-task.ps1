# One-time setup on the Windows PC: registers a scheduled task that runs
# scripts\crawl-daily.ps1 every day at 4:00 am under your own account.
#   powershell -ExecutionPolicy Bypass -File scripts\install-crawl-task.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\install-crawl-task.ps1 -At 5:30am
# Remove it again with:  Unregister-ScheduledTask -TaskName 'Wacar daily crawl'
param([string]$At = '4:00am')

$script = Join-Path $PSScriptRoot 'crawl-daily.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At $At
# Runs in your signed-in session (a locked screen is fine) so git can use your saved GitHub sign-in.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 4) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Wacar daily crawl' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Crawls dealer sites and publishes the snapshot to wacar.io' -Force | Out-Null
Write-Host "Registered 'Wacar daily crawl' to run daily at $At."
Write-Host "Test it now with:  Start-ScheduledTask -TaskName 'Wacar daily crawl'   (log: logs\crawl-<date>.log)"

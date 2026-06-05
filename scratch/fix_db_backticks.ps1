$file = "g:\Development\Clik OPtics n\db.ts"
$content = [System.IO.File]::ReadAllText($file)
$lines = $content.Split("`n")

# Fix each corrupted line by index (0-based)
# Line 1231: const res = await fetch(`/api/network/olt/${olt.id}/refresh`, {
$lines[1230] = "      const res = await fetch(``/api/network/olt/`${olt.id}/refresh``, {`r"

# Line 1278: commandSent: `Resetting password for ONU ${onu.id}`,
$lines[1277] = "      commandSent: ``Resetting password for ONU `${onu.id}``,`r"

# Line 1284: const response = await fetch(`/api/network/olt/${olt.id}/reset-onu-password`, {
$lines[1283] = "      const response = await fetch(``/api/network/olt/`${olt.id}/reset-onu-password``, {`r"

# Line 1299: commandSent: `Resetting password for ONU ${onu.id}`,
$lines[1298] = "        commandSent: ``Resetting password for ONU `${onu.id}``,`r"

# Line 1313: commandSent: `Resetting password for ONU ${onu.id}`,
$lines[1312] = "        commandSent: ``Resetting password for ONU `${onu.id}``,`r"

# Line 1330: const res = await fetch(`/api/network/olt/health`, {
$lines[1329] = "      const res = await fetch(``/api/network/olt/health``, {`r"

# Line 1364: const response = await fetch(`/api/network/olt/${olt.id}/connect`, {
$lines[1363] = "      const response = await fetch(``/api/network/olt/`${olt.id}/connect``, {`r"

# Line 1424: commandSent: `Changing WiFi for ONU ${onu.id} to SSID: ${ssid}`,
$lines[1423] = "      commandSent: ``Changing WiFi for ONU `${onu.id} to SSID: `${ssid}``,`r"

# Line 1430: const response = await fetch(`/api/network/olt/${olt.id}/vsol-wifi-change`, {
$lines[1429] = "      const response = await fetch(``/api/network/olt/`${olt.id}/vsol-wifi-change``, {`r"

# Line 1445: commandSent: `Changing WiFi for ONU ${onu.id} to SSID: ${ssid}`,
$lines[1444] = "        commandSent: ``Changing WiFi for ONU `${onu.id} to SSID: `${ssid}``,`r"

# Line 1459: commandSent: `Changing WiFi for ONU ${onu.id} to SSID: ${ssid}`,
$lines[1458] = "        commandSent: ``Changing WiFi for ONU `${onu.id} to SSID: `${ssid}``,`r"

# Line 1495: action: `onu_device_${action}`,
$lines[1494] = "      action: ``onu_device_`${action}``,`r"

# Line 1496: commandSent: `Setting MAC filter ${action} for MAC ${normalizedMac} on ONU ${onu.id}`,
$lines[1495] = "      commandSent: ``Setting MAC filter `${action} for MAC `${normalizedMac} on ONU `${onu.id}``,`r"

# Line 1502: const response = await fetch(`/api/olt/${olt.id}/onu/${onu.id}/device/${normalizedMac}/${action}`, {
$lines[1501] = "      const response = await fetch(``/api/olt/`${olt.id}/onu/`${onu.id}/device/`${normalizedMac}/`${action}``, {`r"

# Line 1515: action: `onu_device_${action}`,
$lines[1514] = "        action: ``onu_device_`${action}``,`r"

# Line 1516: commandSent: `Setting MAC filter ${action} for MAC ${normalizedMac} on ONU ${onu.id}`,
$lines[1515] = "        commandSent: ``Setting MAC filter `${action} for MAC `${normalizedMac} on ONU `${onu.id}``,`r"

# Line 1529: action: `onu_device_${action}`,
$lines[1528] = "        action: ``onu_device_`${action}``,`r"

# Line 1530: commandSent: `Setting MAC filter ${action} for MAC ${normalizedMac} on ONU ${onu.id}`,
$lines[1529] = "        commandSent: ``Setting MAC filter `${action} for MAC `${normalizedMac} on ONU `${onu.id}``,`r"

$result = $lines -join "`n"
[System.IO.File]::WriteAllText($file, $result)
Write-Host "Done - fixed all 18 corrupted lines"

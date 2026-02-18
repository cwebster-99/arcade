$RawInput = [Console]::In.ReadToEnd()
$HookInput = $RawInput | ConvertFrom-Json
$ToolName = $HookInput.tool_name

$EditTools = @('replace_string_in_file', 'multi_replace_string_in_file', 'create_file')
if ($EditTools -contains $ToolName) {
    $Files = @()
    if ($HookInput.tool_input.filePath) {
        $Files = @($HookInput.tool_input.filePath)
    } elseif ($HookInput.tool_input.replacements) {
        $Files = @($HookInput.tool_input.replacements | ForEach-Object { $_.filePath } | Select-Object -Unique)
    }

    foreach ($File in $Files) {
        if (Test-Path $File) {
            npx prettier --write $File 2>$null | Out-Null
        }
    }
}

Write-Output '{"continue":true}'

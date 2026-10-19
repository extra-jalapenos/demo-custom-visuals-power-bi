# About this repo
This is a repo to learn working with the PBVIZ library to configure custom visuals using NodeJS + D3.js

## Global setup (once)
1. Install NodeJS: please look up how to install NodeJS, this doesn't belong here.
2. install pbiviz package globally using `npm i -g powerbi-visuals-tools@latest`
3. Check whether it successfully installed by running `pbiviz` -- the help should appear instead of "unknown keyword" or something
4. to serve the visual infos via a secure server, we have to create a self-signed SSL certificate. Run `pbiviz install-cert` *in a powershell terminal*
5. To get Powershell (non-Windows, command pwsh): go here: https://apps.microsoft.com/detail/9mz1snwt0n5d?hl=de-DE&gl=DE
6. Note your passphrase just to be sure in your passwordmanager

### getting Powershell
in case you get "pwsh is not a known command", you have the wrong / old PowerShell.
https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows?view=powershell-7.6#winget
`winget search --id Microsoft.PowerShell --exact`
`winget install --id Microsoft.PowerShell --source winget`

## Enable dev tools in workspace
1. Go to your workspace, doesn't matter if prod or not
2. click on workspace -> gear icon -> developer settings or go to https://app.powerbi.com/user/user-settings/developer-settings?experience=power-bi
3. This will be checked already. Disable and re-able it. No idea why.
4. To check whether this works, go to any report. Under visualizations, you'll have a "developer visual" (german: visuelles Entwicklerelement) indicated with a small icon containg a tag symbol `</>`
5. If it doesn't show up, run `pbiviz install-cert` again, because if you run it without having one, it will only generate it. Make sure you see a note about installing it.
6. Go to app.powerbi.com in your report.
7. If you don't see the visual, check the dev console. If "ERR CERTIFICATE INVALID" shows up, go to localhost:8080/assets and be like "yeah i know this is unsafe, show advanced".

# Add author
Added author and email to pbiviz.json

# Enabled DEV mode
https://learn.microsoft.com/en-us/power-bi/developer/visuals/environment-setup?tabs=service#enable-developer-mode


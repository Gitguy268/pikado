# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's private reporting form: <https://github.com/Gitguy268/pikado/security/advisories/new>

Include what you found, how to reproduce it, and the browser and version you used. You should get a reply within a week. Please give the fix time to ship before you publish details.

## Scope

Pikado has no backend and no accounts. Three things reach the network, all described at the top of the README: Generative Fill with your own API key, web fonts from Google Fonts, and an image dragged in from another browser tab. The most useful reports are about:

- a crafted PSD, PNG, HEIC or ICC file that hangs the tab, reads out of bounds or runs script (the parsers read untrusted bytes);
- anything that sends part of a document, or a stored API key, somewhere you did not choose;
- the Docker image and the GitHub Actions workflows in this repository.

## Supported versions

Only the latest version on the `main` branch is supported.

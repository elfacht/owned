# Changelog

People change, projects change, everything changes for a reason.

## Unreleased
### Added
- `.htpasswd` and `license.key` to `.gitignore`.
- [CpFieldInspect](https://github.com/mmikkel/CpFieldInspect-Craft) plugin
- [Migration Manager](https://github.com/Firstborn/Craft-Migration-Manager/) plugin
- [Craft CMS Scripts](https://github.com/nystudio107/craft-scripts)
- Webpack for JavaScript

## Removed
- Architect plugin for Migration Manager plugin.

### Changed
- Updated README instructions.

## 1.0.0
### Added
- Changelog
- Rewrite condition for asset versions in `app/web/.htaccess`.
- Global URL scheme in `app/config/general.php`
- Adding gzip settings to htaccess.
- Adding maintenance template.
- Adding `setup` option in config.php for default setup.
- Adding JSON for fields setup.

### Removed
- Removed `sendPoweredByHeader`
- Removed `license.key` to generate a new one automatically.

### Changed
- Updating Craft to `3.0.22`.
- Updating plugins.

### Fixed
- Settings include
- Critical CSS condition
- Deny `.git/HEAD` from public access via htaccess.

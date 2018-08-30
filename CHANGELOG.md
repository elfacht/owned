# Changelog

People change, projects change, everything changes for a reason.

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

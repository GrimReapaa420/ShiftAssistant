# Changelog

## [1.0.2] - 2026-01-05

### Fixed
- Fixed Home Assistant ingress double-slash 404 issue
- Added proper ProxyFix middleware with x_prefix support
- Improved path normalization for ingress routing
- Added explicit '//' route handler as fallback

## [1.0.1] - 2026-01-04

### Fixed
- Added `init: false` for S6 overlay v3 compatibility
- Fixed database initialization app context issue

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Shift calendar with intuitive click-to-select workflow
- Shift templates with custom colors and times
- Maximum 2 shifts per day support
- Day notes feature (tied to calendar days)
- ICS feed for Home Assistant calendar integration
- REST API for automation
- Webhook support
- Multi-user support with admin mode
- SQLite, PostgreSQL, and MySQL database support
- Ingress support for seamless Home Assistant integration

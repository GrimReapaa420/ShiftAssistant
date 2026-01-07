# Changelog

## [1.0.10] - 2026-01-07

### Changed
- Calendar sidebar is now collapsible (collapsed by default on mobile)
- Improved mobile scaling to prevent Sunday column from being cut off

### Fixed
- Fixed timezone issue in note date display (was showing wrong date in some timezones)
- Removed yellow dot indicator for notes (notes now display as transparent overlay)
- Cache-busted all assets to v1.0.10 to force refresh

## [1.0.9] - 2026-01-05

### Added
- Note position selector (Top, Center, Bottom) in note creation modal
- Default note position is now Top
- Multi-line note support with proper line breaks
- Cache-busting version parameters for CSS and JavaScript files
- Automatic database migration for existing databases (adds position column)

### Changed
- Increased calendar day height for better space utilization
- Notes now overlay the entire day cell with transparent yellow background
- Single-click to add notes (when no shift template is selected)
- Year view shows shift colors in mini calendar previews

### Fixed
- Today button now works correctly
- Month selection in year view jumps to correct month
- Calendar starts on Monday (ingress version was lagging due to caching)
- Docker/SQLite databases now auto-migrate to add new position column

## [1.0.3] - 2026-01-05

### Fixed
- Fixed API calls using relative paths for ingress compatibility
- Admin mode now only activates when accessed via HA ingress
- Auto-login for ingress admin mode (no login required in HA)
- Fixed calendar not loading due to API path issues

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

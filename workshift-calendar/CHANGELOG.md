# Changelog

## 1.4.0

- **FIXED: Home Assistant ingress "Not Found" error**
  - Added `<base>` tag that dynamically sets correct ingress path
  - All static assets now use relative paths that work with base tag
  - IngressMiddleware correctly sets SCRIPT_NAME from X-Ingress-Path
- **FIXED: Dropdown menu now works in Home Assistant**
  - Bundled Bootstrap CSS/JS locally (CDN blocked by HA CSP)
  - Icons now served from local vendor folder
- **IMPROVED: Configuration options**
  - Removed `admin_mode` from config (internal feature only)
  - Added `port` setting (configurable 1024-65535, default 8099)
  - S6 run script now reads port from config dynamically
- JavaScript API calls use relative paths for ingress compatibility

## 1.3.0

- **FIXED: Home Assistant ingress web interface**
  - Using Flask's url_for() for all internal links and static assets
  - JavaScript API calls use relative paths (`./api/...`) for ingress compatibility
  - Changed ingress_port to 8099 (default HA ingress port)
- **FIXED: Configuration tab now shows options**
  - Added `log_level` (debug/info/warning/error) option
- **FIXED: S6 startup crashes**
  - Added `init: false` to config.yaml for S6 v3 compatibility
  - Updated finish script with proper SIGTERM handling
- **FIXED: Removed webui parameter** (conflicts with ingress)
- Improved gunicorn startup with proper logging

## 1.2.0

- Initial ingress fixes (incomplete)
- Custom WSGI middleware (removed in 1.3.0)

## 1.1.0

- Added gunicorn production server
- Initial ingress path detection

## 1.0.0

- Initial release
- Click-to-select shift placement workflow
- Maximum 2 shifts per calendar day
- Day notes tied to calendar days (not shifts)
- ICS feed for Remote Calendar integration
- REST API with full CRUD operations
- Webhook endpoint for Home Assistant automations
- Admin mode for multi-user viewing
- Local username/password authentication
- Mobile-responsive design

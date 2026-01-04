# Changelog

## 1.2.0

- Fixed Home Assistant ingress web interface support
  - X-Ingress-Path header properly handled for all URLs
  - Static assets and API calls work correctly in HA panel
  - Admin sidebar functional within ingress interface
- Removed webui config (conflicts with ingress)
- Added ingress_stream for better websocket support
- Improved logging in gunicorn startup
- Version bump for fresh installation

## 1.1.0

- Added gunicorn production server
- Improved ingress path detection
- Fixed URL generation for templates

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
- Home Assistant ingress support
- S6 overlay process management

# WorkShift Calendar

A powerful shift calendar web application designed for Home Assistant integration.

## Overview

WorkShift Calendar is a Flask-based web application that allows users to:
- Manage work shifts with an intuitive calendar interface
- Create reusable shift templates for quick scheduling
- Integrate with Home Assistant via ICS feeds, REST API, and webhooks
- Run as a Docker container for self-hosting
- Admin mode for Docker deployments (view/switch between users)

## Project Structure

```
/
├── app.py              # Flask app initialization with SQLAlchemy
├── main.py             # Application entry point
├── models.py           # Database models (User, Calendar, Shift, ShiftTemplate, DayNote)
├── routes.py           # API routes and page handlers
├── local_auth.py       # Local username/password authentication
├── templates/          # Jinja2 HTML templates
│   ├── base.html       # Base template with navigation
│   ├── landing.html    # Landing page for unauthenticated users
│   ├── login.html      # Login form
│   ├── register.html   # Registration form
│   ├── dashboard.html  # Main calendar view (with admin sidebar)
│   ├── templates.html  # Shift template management
│   └── settings.html   # Calendar settings and API info
├── static/
│   ├── css/style.css   # Custom styles
│   └── js/calendar.js  # Calendar interaction logic
├── Dockerfile          # Docker configuration with configurable port
├── docker-compose.yml  # Docker Compose for full stack
├── requirements.txt    # Python dependencies
└── hassio-addon/       # Home Assistant Add-on Package
    ├── repository.json # Add-on repository metadata
    ├── README.md       # Repository readme
    └── workshift-calendar/
        ├── config.yaml     # Add-on configuration with ingress
        ├── build.yaml      # Multi-arch build settings
        ├── Dockerfile      # HA base image Dockerfile
        ├── run.sh          # Bashio entry script
        ├── DOCS.md         # Detailed documentation
        ├── README.md       # Add-on readme
        ├── CHANGELOG.md    # Version history
        ├── icon.png        # Add-on icon
        ├── logo.png        # Add-on logo
        └── translations/
            └── en.yaml     # English translations
```

## Key Features

### User Authentication
- Local username/password authentication (offline-capable)
- Session-based authentication with Flask-Login
- Secure password hashing with Werkzeug

### Calendar System
- Multiple calendars per user
- Maximum 2 shifts per calendar day with horizontal split coloring
- Click-to-select workflow: select template, click day to place shift
- Custom calendar grid (no external dependencies)
- Day notes tied to calendar days (not shifts)

### Shift Templates
- Create reusable templates with start/end times and colors
- Collapsible template bar below calendar
- "Remove" button as first option for deleting shifts
- Click template to activate, click calendar day to place

### Day Notes
- Notes are tied to calendar days, not individual shifts
- Yellow indicator shows when a day has a note
- Notes persist even when shifts are removed
- Available in ICS feed and external API

### Docker Admin Mode
- When `ADMIN_MODE=true` environment variable is set:
  - Admin sidebar appears showing all users
  - Click any user to view their calendar
  - Useful for Home Assistant dashboard integration
  - Port is configurable via `PORT` environment variable

### Home Assistant Integration

#### ICS Feed (Remote Calendar)
- Each calendar has a unique ICS feed URL
- Add to Home Assistant via Settings > Integrations > Remote Calendar
- URL format: `{base_url}/ics/{api_key}.ics`
- Day notes are included in event descriptions

#### REST API
- Full CRUD operations for events
- Base URL: `/api/v1/calendar/{api_key}/events`
- GET: List events with optional date range (includes day notes as description)
- POST: Create new event (description creates/updates day note)
- PUT/DELETE: Update/delete specific event

#### Webhook
- Receive events from Home Assistant automations
- URL format: `/webhook/{api_key}`
- Supports create/delete actions

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Flask session secret key

Optional:
- `ADMIN_MODE` - Set to "true" to enable admin mode (Docker deployments)
- `PORT` - Custom port (default: 5000)

## Running Locally

### With Docker
```bash
# Default port 5000
docker-compose up --build

# Custom port
PORT=8080 docker-compose up --build
```

### Without Docker
```bash
pip install -r requirements.txt
python main.py
```

## API Reference

### Internal API (requires authentication)

```
GET/POST   /api/calendars          - List/create calendars
GET/PUT/DELETE /api/calendars/{id} - Calendar operations
GET/POST   /api/templates          - List/create templates
GET/PUT/DELETE /api/templates/{id} - Template operations
GET/POST   /api/shifts             - List/create shifts (max 2 per day)
GET/PUT/DELETE /api/shifts/{id}    - Shift operations
POST       /api/shifts/from-template - Create shift from template
GET/POST   /api/day-notes          - List/create day notes
GET/PUT/DELETE /api/day-notes/{id} - Day note operations
```

### External API (uses api_key)

```
GET/POST   /api/v1/calendar/{api_key}/events      - List/create events
GET/PUT/DELETE /api/v1/calendar/{api_key}/events/{id} - Event operations
POST       /webhook/{api_key}                      - Webhook endpoint
GET        /ics/{api_key}.ics                      - ICS feed
```

### Admin Routes (Docker mode only)

```
GET  /admin/switch-user/{user_id}  - Switch view to specified user
POST /admin/delete-user/{user_id}  - Delete user with cascade (removes all data)
```

## Home Assistant Add-on Installation

### As Home Assistant Add-on (Recommended)

1. Copy the `hassio-addon` folder to a GitHub repository
2. In Home Assistant, go to Settings > Add-ons > Add-on Store
3. Click the three dots menu (top right) > Repositories
4. Add your repository URL
5. Find "WorkShift Calendar" and install

### Add-on Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `log_level` | Logging level (debug, info, warning, error) | `info` |
| `admin_mode` | Enable admin mode to view all users | `true` |
| `session_secret` | Custom session secret (auto-generated if empty) | (empty) |
| `external_url` | External URL for API integrations (e.g., `http://192.168.1.100:8099`) | (empty) |

### External URL Configuration (Required for Integrations)

For ICS feeds, REST API, and webhook integrations to work, users must configure `external_url`:

1. Go to add-on Configuration tab
2. Set `external_url` to Home Assistant's external IP with port 8099 (e.g., `http://192.168.1.100:8099`)
3. Ensure port 8099 is exposed in Network settings

**Note**: This is a known limitation of Home Assistant add-ons - the Supervisor API does not expose external network information to add-ons, so automatic detection is not possible. The Settings page disables copy buttons until this is configured to prevent users from copying invalid URLs.

### Ingress Support

The add-on uses Home Assistant Ingress for seamless integration:
- No separate authentication required (uses HA authentication)
- Embedded in Home Assistant UI via "OPEN WEB UI"
- All URLs use X-Ingress-Path header for proper routing
- Listens on port 8099 (internal), only accessible from HA Supervisor

## Recent Changes

- **Version 1.0.11** - Fixed Home Assistant ingress static file loading with `<base>` tag; entire left sidebar now fully collapsible (admin panel + calendars) with localStorage persistence; scoped CSS to dashboard only to prevent regressions
- **Version 1.0.10** - Collapsible calendar sidebar; improved mobile scaling; fixed timezone issue in notes
- **Version 1.0.9** - Note position selector (Top/Center/Bottom); increased calendar height; single-click for notes; cache-busting for JS/CSS; multi-line notes with line breaks
- **Calendar UI Enhancements (v1.0.7)** - Calendar now starts on Monday; click month header for year view with navigation; double-click day to add notes; notes display as transparent overlay on shifts
- **Navigation Renaming** - "Templates" renamed to "Shifts", "Settings" renamed to "API"
- **API Documentation** - Added comprehensive API endpoint table and documentation in the API page
- **Admin User Deletion** - Admin mode can now delete users with cascade delete of all their data
- **XSS Security Fix** - Note content is now properly escaped to prevent injection attacks
- **Fixed Ingress API Routing (v1.0.5)** - Inject `window.API_BASE` from Flask's `request.script_root` to ensure correct API paths in both ingress and external access modes
- **Fixed HA Add-on for S6 Overlay v3** - Added critical `init: false` to config.yaml required by modern HA base images
- **Changed repository.json to repository.yaml** - Official HA docs require repository.yaml format
- **Updated URLs to user's GitHub** - https://github.com/GrimReapaa420/ShiftAssistant
- **Version bump to 1.0.1** - Reflects add-on configuration fixes
- **Local Build Add-on** - Removed `image:` field from config.yaml so Home Assistant builds the image locally instead of pulling from ghcr.io
- **Fixed Navbar Dropdown** - Removed conflicting CSS that was overriding navbar styles
- **External URL Configuration** - Added configurable `external_url` option for integration URLs, with disabled copy buttons until configured
- **Simplified Ingress Handling** - Removed manual ingress_path prefixing, now uses Flask url_for() and relative URLs in JavaScript
- **Home Assistant Add-on Package** - Full add-on with ingress support for Home Assistant OS
- Added DayNote model for notes tied to calendar days (not shifts)
- Docker configuration with configurable PORT and ADMIN_MODE
- Admin sidebar for Docker mode - lists all users, click to switch view
- Removed notes field from Shift model (migrated to DayNote)
- Optimistic UI updates for faster shift placement
- Mobile-responsive design with touch-friendly interface
- Per-day pending operations for better concurrent editing
- Updated Bootstrap Icons CDN to 1.11.3 for proper icon display

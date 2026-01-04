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
├── repository.yaml          # Home Assistant add-on repository metadata
├── workshift-calendar/      # Home Assistant add-on folder
│   ├── config.yaml          # Add-on configuration for HA
│   ├── build.yaml           # Multi-arch build settings
│   ├── Dockerfile           # Add-on container definition
│   ├── run.sh               # Startup script with bashio
│   ├── DOCS.md              # User documentation
│   ├── CHANGELOG.md         # Version history
│   ├── translations/en.yaml # English translations
│   └── [app files]          # Copy of application files
├── app.py              # Flask app initialization with SQLAlchemy
├── main.py             # Application entry point
├── models.py           # Database models (User, Calendar, Shift, ShiftTemplate, DayNote)
├── routes.py           # API routes and page handlers
├── local_auth.py       # Local username/password authentication
├── templates/          # Jinja2 HTML templates
├── static/             # CSS and JavaScript
├── Dockerfile          # Standalone Docker configuration
├── docker-compose.yml  # Docker Compose for full stack
└── requirements.txt    # Python dependencies
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

## Installation

### As Home Assistant Add-on (Recommended)

1. Go to **Settings > Add-ons > Add-on Store**
2. Click the three dots (top right) > **Repositories**
3. Add your GitHub repository URL: `https://github.com/your-username/workshift-calendar`
4. Click **Add**, then find "WorkShift Calendar" in the store
5. Click **Install**

### Standalone Docker
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
GET /admin/switch-user/{user_id} - Switch view to specified user
```

## Recent Changes

- Added Home Assistant add-on repository structure (repository.yaml, config.yaml, build.yaml)
- Added DayNote model for notes tied to calendar days (not shifts)
- Docker configuration with configurable PORT and ADMIN_MODE
- Admin sidebar for Docker mode - lists all users, click to switch view
- Removed notes field from Shift model (migrated to DayNote)
- Optimistic UI updates for faster shift placement
- Mobile-responsive design with touch-friendly interface
- Per-day pending operations for better concurrent editing

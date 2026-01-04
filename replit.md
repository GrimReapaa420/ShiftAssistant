# WorkShift Calendar

A powerful shift calendar web application designed for Home Assistant integration.

## Overview

WorkShift Calendar is a Flask-based web application that allows users to:
- Manage work shifts with an intuitive calendar interface
- Create reusable shift templates for quick scheduling
- Integrate with Home Assistant via ICS feeds, REST API, and webhooks
- Run as a Docker container for self-hosting

## Project Structure

```
/
├── app.py              # Flask app initialization with SQLAlchemy
├── main.py             # Application entry point
├── models.py           # Database models (User, Calendar, Shift, ShiftTemplate)
├── routes.py           # API routes and page handlers
├── local_auth.py       # Local username/password authentication
├── templates/          # Jinja2 HTML templates
│   ├── base.html       # Base template with navigation
│   ├── landing.html    # Landing page for unauthenticated users
│   ├── login.html      # Login form
│   ├── register.html   # Registration form
│   ├── dashboard.html  # Main calendar view
│   ├── templates.html  # Shift template management
│   └── settings.html   # Calendar settings and API info
├── static/
│   ├── css/style.css   # Custom styles
│   └── js/calendar.js  # Calendar interaction logic
├── Dockerfile          # Docker configuration
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

### Shift Templates
- Create reusable templates with start/end times and colors
- Collapsible template bar below calendar
- "Remove" button as first option for deleting shifts
- Click template to activate, click calendar day to place

### Home Assistant Integration

#### ICS Feed (Remote Calendar)
- Each calendar has a unique ICS feed URL
- Add to Home Assistant via Settings > Integrations > Remote Calendar
- URL format: `{base_url}/ics/{api_key}.ics`

#### REST API
- Full CRUD operations for events
- Base URL: `/api/v1/calendar/{api_key}/events`
- GET: List events with optional date range
- POST: Create new event
- PUT/DELETE: Update/delete specific event

#### Webhook
- Receive events from Home Assistant automations
- URL format: `/webhook/{api_key}`
- Supports create/delete actions

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Flask session secret key

## Running Locally

### With Docker
```bash
docker-compose up --build
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
```

### External API (uses api_key)

```
GET/POST   /api/v1/calendar/{api_key}/events      - List/create events
GET/PUT/DELETE /api/v1/calendar/{api_key}/events/{id} - Event operations
POST       /webhook/{api_key}                      - Webhook endpoint
GET        /ics/{api_key}.ics                      - ICS feed
```

## Recent Changes

- Replaced Replit Auth with local username/password authentication
- Redesigned Shift model with date/time fields and position tracking
- Implemented click-to-select workflow (no drag-and-drop)
- Added 2-shift-per-day limit with backend enforcement
- Collapsible template bar with Remove button as first option

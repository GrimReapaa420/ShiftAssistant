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
├── replit_auth.py      # Replit OpenID Connect authentication
├── templates/          # Jinja2 HTML templates
│   ├── base.html       # Base template with navigation
│   ├── landing.html    # Landing page for unauthenticated users
│   ├── dashboard.html  # Main calendar view
│   ├── templates.html  # Shift template management
│   └── settings.html   # Calendar settings and API info
├── static/
│   ├── css/style.css   # Custom styles
│   └── js/             # JavaScript for calendar and UI
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose for full stack
└── requirements.txt    # Python dependencies
```

## Key Features

### User Authentication
- Uses Replit Auth for secure login (supports Google, GitHub, email)
- Session-based authentication with database storage

### Calendar System
- Multiple calendars per user
- Color-coded shifts
- Drag-and-drop editing via FullCalendar.js
- Notes support for each shift

### Shift Templates
- Create reusable templates with start/end times
- Drag templates onto calendar for quick shift creation
- Templates preserve color and description

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
- `REPL_ID` - Replit app ID (auto-set in Replit environment)

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
GET/POST   /api/shifts             - List/create shifts
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

- Initial implementation with full feature set
- Home Assistant compatible ICS feed
- REST API and Webhook support
- Docker configuration for self-hosting

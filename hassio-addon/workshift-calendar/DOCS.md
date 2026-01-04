# WorkShift Calendar

A powerful shift calendar designed for Home Assistant integration. Manage your work schedules with an intuitive calendar interface and seamlessly sync with Home Assistant.

## Features

- **Intuitive Calendar Interface**: Click-to-select workflow for quick shift placement
- **Shift Templates**: Create reusable templates with start/end times and colors
- **Maximum 2 Shifts Per Day**: Clear horizontal split coloring for multiple shifts
- **Day Notes**: Add notes to calendar days (tied to days, not individual shifts)
- **Multi-User Support**: Admin mode allows viewing and managing all users' calendars
- **Home Assistant Integration**:
  - ICS Feed for calendar integration
  - REST API for automation
  - Webhook support for event-driven updates

## Installation

1. Add this repository to your Home Assistant add-on store
2. Install the WorkShift Calendar add-on
3. Start the add-on
4. Click "OPEN WEB UI" to access the calendar

## Configuration

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `log_level` | Logging level (debug, info, warning, error) | `info` |
| `admin_mode` | Enable admin mode to view all users | `true` |
| `session_secret` | Custom session secret (auto-generated if empty) | (empty) |
| `external_url` | External URL for API integrations (e.g., `http://192.168.1.100:8099`) | (empty) |

### External URL Configuration

For Home Assistant integrations (ICS feed, REST API, webhooks), you need to configure the `external_url` option:

1. Go to the add-on Configuration tab
2. Set `external_url` to your Home Assistant's external IP with port 8099
   - Example: `http://192.168.1.100:8099`
3. Make sure port 8099 is exposed in the Network section
4. The Settings page will then show working integration URLs

### Database

The add-on automatically detects and uses available database services:

1. **PostgreSQL** (if available via Home Assistant services)
2. **MySQL** (if available via Home Assistant services)
3. **SQLite** (fallback, stored in `/data/db/workshift.db`)

Data is persisted in the `/data` directory across restarts and updates.

## Usage

### Creating Shift Templates

1. Navigate to the "Templates" page
2. Click "Add Template"
3. Set the template name, start time, end time, and color
4. Save the template

### Adding Shifts to Calendar

1. On the main calendar view, expand the template bar
2. Click on a template to select it
3. Click on a calendar day to place the shift
4. To remove a shift, click "Remove" in the template bar, then click the shift

### Day Notes

- Click the note icon on any day to add a note
- Notes are tied to calendar days, not individual shifts
- Yellow indicator shows when a day has a note

## Home Assistant Integration

### ICS Feed

Add your calendar to Home Assistant:

1. Go to Settings > Calendar page in WorkShift
2. Copy the ICS feed URL
3. In Home Assistant, go to Settings > Devices & Services
4. Add "Remote Calendar" integration
5. Paste the ICS URL

### REST API

Use the REST API for automation:

```yaml
rest_command:
  create_shift:
    url: "http://your-ha-instance:8099/api/v1/calendar/YOUR_API_KEY/events"
    method: POST
    content_type: application/json
    payload: '{"title": "Work", "date": "2024-01-15", "start_time": "09:00", "end_time": "17:00"}'
```

### Webhook

Receive events in automations:

```yaml
automation:
  - trigger:
      - platform: webhook
        webhook_id: workshift_update
    action:
      - service: rest_command.create_shift
```

## API Endpoints

### External API (uses api_key)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/calendar/{api_key}/events` | GET | List events |
| `/api/v1/calendar/{api_key}/events` | POST | Create event |
| `/api/v1/calendar/{api_key}/events/{id}` | PUT | Update event |
| `/api/v1/calendar/{api_key}/events/{id}` | DELETE | Delete event |
| `/webhook/{api_key}` | POST | Webhook endpoint |
| `/ics/{api_key}.ics` | GET | ICS calendar feed |

## Support

For issues and feature requests, please visit the GitHub repository.

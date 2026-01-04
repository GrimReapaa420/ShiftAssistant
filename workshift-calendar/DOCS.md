# WorkShift Calendar

A powerful shift calendar web application designed for Home Assistant integration.

## Features

- Easy shift management with click-to-place workflow
- Reusable shift templates for quick scheduling
- ICS feed for Remote Calendar integration
- REST API for automation
- Webhook support for receiving events
- Admin mode for viewing all users' calendars
- Day notes tied to calendar days (not individual shifts)

## Configuration

### Option: `admin_mode`

Enable admin mode to see all users and switch between their calendars. Useful for household dashboards where you want to view everyone's schedule.

Default: `true`

## Usage

After installation, the add-on will be available in the Home Assistant sidebar as "WorkShift".

### First Time Setup

1. Click the "WorkShift" panel in the sidebar
2. Register a new account with username and password
3. Create shift templates for your recurring shifts
4. Click a template, then click calendar days to place shifts

### Home Assistant Integration

#### ICS Calendar (Remote Calendar)

1. Go to **Settings > Devices & Services > Add Integration**
2. Search for "Local Calendar" or "Remote Calendar"
3. Enter your calendar's ICS URL from the Settings page

The ICS URL format is: `http://homeassistant.local:5000/ics/{api_key}.ics`

You can find your API key in the add-on's Settings page.

#### REST API

Use the REST API for automation:

```yaml
rest_command:
  add_shift:
    url: "http://homeassistant.local:5000/api/v1/calendar/YOUR_API_KEY/events"
    method: POST
    content_type: "application/json"
    payload: '{"title": "Work", "date": "{{ now().strftime("%Y-%m-%d") }}", "start_time": "09:00", "end_time": "17:00"}'
```

#### Webhook

Receive events from automations:

```yaml
automation:
  - alias: "Add shift from button"
    trigger:
      - platform: state
        entity_id: input_button.add_shift
    action:
      - service: rest_command.add_shift
```

## Data Storage

All data is stored in `/data/workshift.db` (SQLite database). This persists across add-on restarts and updates.

## Troubleshooting

### Can't access the web interface

Make sure the add-on is started and check the logs for any errors.

### Shifts not appearing

Try refreshing the page or check that you have the correct calendar selected.

## Support

For issues and feature requests, please visit the GitHub repository.

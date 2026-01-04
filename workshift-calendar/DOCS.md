# WorkShift Calendar

A powerful shift calendar web application designed for Home Assistant integration.

## Features

- **Easy shift management** with click-to-place workflow
- **Reusable shift templates** for quick scheduling
- **ICS feed** for Remote Calendar integration
- **REST API** for automation
- **Webhook support** for receiving events
- **Admin mode** for viewing all users' calendars

## Configuration

### Option: `admin_mode`

Enable admin mode to see all users and switch between their calendars. Useful for household dashboards.

## Home Assistant Integration

### ICS Calendar (Remote Calendar)

1. Go to Settings > Devices & Services > Add Integration
2. Search for "Remote Calendar" or "Local Calendar"
3. Enter your calendar's ICS URL from the Settings page

### REST API

Use the REST API for automation:

```yaml
rest_command:
  add_shift:
    url: "http://homeassistant.local:5000/api/v1/calendar/YOUR_API_KEY/events"
    method: POST
    content_type: "application/json"
    payload: '{"title": "Work", "date": "2025-01-15", "start_time": "09:00", "end_time": "17:00"}'
```

### Webhook

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

## Support

For issues and feature requests, please visit the GitHub repository.

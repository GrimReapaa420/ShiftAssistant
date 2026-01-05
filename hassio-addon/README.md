# WorkShift Calendar Add-on Repository

Home Assistant add-on repository for WorkShift Calendar.

## Add-ons

### WorkShift Calendar

A powerful shift calendar for managing work schedules with Home Assistant integration.

**Features:**
- Shift templates for quick scheduling
- ICS feeds for Home Assistant calendar integration
- REST API for automations
- Webhook support
- Admin mode for multi-user viewing

## Installation

1. Click the button below to add this repository to your Home Assistant:

   [![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FGrimReapaa420%2FShiftAssistant)

2. Or manually add the repository URL in Home Assistant:
   - Go to Settings > Add-ons > Add-on Store
   - Click the three dots menu (top right)
   - Select "Repositories"
   - Add: `https://github.com/GrimReapaa420/ShiftAssistant`

3. Find "WorkShift Calendar" in the add-on store and install it

## Repository Structure

This add-on repository follows the official Home Assistant add-on structure:

```
ShiftAssistant/              (repository root)
├── repository.yaml          (required - repository metadata)
├── README.md                (repository readme)
└── workshift-calendar/      (add-on folder - name matches slug)
    ├── config.yaml          (add-on configuration)
    ├── build.yaml           (multi-arch build settings)
    ├── Dockerfile           (container definition)
    ├── run.sh               (startup script)
    ├── app.py               (Flask application)
    ├── routes.py            (API routes)
    ├── models.py            (database models)
    ├── local_auth.py        (authentication)
    ├── requirements.txt     (Python dependencies)
    ├── static/              (CSS, JS assets)
    ├── templates/           (HTML templates)
    ├── translations/        (UI translations)
    ├── DOCS.md              (documentation)
    ├── CHANGELOG.md         (version history)
    ├── icon.png             (256x256 add-on icon)
    └── logo.png             (256x256 add-on logo)
```

## Configuration

After installation, configure the add-on:

| Option | Description | Default |
|--------|-------------|---------|
| `log_level` | Logging level (debug, info, warning, error) | `info` |
| `admin_mode` | Enable admin mode to view all users | `true` |
| `session_secret` | Custom session secret (auto-generated if empty) | (empty) |
| `external_url` | External URL for API integrations | (empty) |

### External URL (Required for Integrations)

For ICS feeds, REST API, and webhook integrations to work externally, configure `external_url`:
1. Go to add-on Configuration tab
2. Set `external_url` to your Home Assistant's external address with port 8099
   - Example: `http://192.168.1.100:8099`
3. Expose port 8099 in Network settings

## Support

For issues and feature requests, visit:
https://github.com/GrimReapaa420/ShiftAssistant/issues

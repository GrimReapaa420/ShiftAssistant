from flask import render_template, request, jsonify, session, Response
from datetime import datetime, timedelta
from app import app, db
from replit_auth import require_login, make_replit_blueprint
from flask_login import current_user
from models import Calendar, ShiftTemplate, Shift
from icalendar import Calendar as ICalendar, Event as ICalEvent
import pytz

app.register_blueprint(make_replit_blueprint(), url_prefix="/auth")


@app.before_request
def make_session_permanent():
    session.permanent = True


@app.after_request
def add_cache_control(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/')
def index():
    if current_user.is_authenticated:
        calendars = Calendar.query.filter_by(user_id=current_user.id).all()
        if not calendars:
            default_calendar = Calendar(
                user_id=current_user.id,
                name='My Shifts',
                is_default=True
            )
            db.session.add(default_calendar)
            db.session.commit()
            calendars = [default_calendar]
        templates = ShiftTemplate.query.filter_by(user_id=current_user.id).all()
        return render_template('dashboard.html', user=current_user, calendars=calendars, templates=templates)
    return render_template('landing.html')


@app.route('/templates')
@require_login
def templates_page():
    templates = ShiftTemplate.query.filter_by(user_id=current_user.id).all()
    return render_template('templates.html', user=current_user, templates=templates)


@app.route('/settings')
@require_login
def settings_page():
    calendars = Calendar.query.filter_by(user_id=current_user.id).all()
    return render_template('settings.html', user=current_user, calendars=calendars)


@app.route('/api/calendars', methods=['GET', 'POST'])
@require_login
def api_calendars():
    if request.method == 'GET':
        calendars = Calendar.query.filter_by(user_id=current_user.id).all()
        return jsonify([{
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'color': c.color,
            'api_key': c.api_key,
            'is_default': c.is_default
        } for c in calendars])
    
    data = request.get_json()
    calendar = Calendar(
        user_id=current_user.id,
        name=data.get('name', 'New Calendar'),
        description=data.get('description'),
        color=data.get('color', '#3788d8')
    )
    db.session.add(calendar)
    db.session.commit()
    return jsonify({'id': calendar.id, 'api_key': calendar.api_key}), 201


@app.route('/api/calendars/<calendar_id>', methods=['GET', 'PUT', 'DELETE'])
@require_login
def api_calendar(calendar_id):
    calendar = Calendar.query.filter_by(id=calendar_id, user_id=current_user.id).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': calendar.id,
            'name': calendar.name,
            'description': calendar.description,
            'color': calendar.color,
            'api_key': calendar.api_key,
            'is_default': calendar.is_default
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        calendar.name = data.get('name', calendar.name)
        calendar.description = data.get('description', calendar.description)
        calendar.color = data.get('color', calendar.color)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        db.session.delete(calendar)
        db.session.commit()
        return jsonify({'success': True})


@app.route('/api/templates', methods=['GET', 'POST'])
@require_login
def api_templates():
    if request.method == 'GET':
        templates = ShiftTemplate.query.filter_by(user_id=current_user.id).all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'start_time': t.start_time.strftime('%H:%M'),
            'end_time': t.end_time.strftime('%H:%M'),
            'color': t.color,
            'description': t.description
        } for t in templates])
    
    data = request.get_json()
    template = ShiftTemplate(
        user_id=current_user.id,
        name=data.get('name', 'New Template'),
        start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
        end_time=datetime.strptime(data['end_time'], '%H:%M').time(),
        color=data.get('color', '#3788d8'),
        description=data.get('description')
    )
    db.session.add(template)
    db.session.commit()
    return jsonify({'id': template.id}), 201


@app.route('/api/templates/<template_id>', methods=['GET', 'PUT', 'DELETE'])
@require_login
def api_template(template_id):
    template = ShiftTemplate.query.filter_by(id=template_id, user_id=current_user.id).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': template.id,
            'name': template.name,
            'start_time': template.start_time.strftime('%H:%M'),
            'end_time': template.end_time.strftime('%H:%M'),
            'color': template.color,
            'description': template.description
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        template.name = data.get('name', template.name)
        if 'start_time' in data:
            template.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data:
            template.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        template.color = data.get('color', template.color)
        template.description = data.get('description', template.description)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        db.session.delete(template)
        db.session.commit()
        return jsonify({'success': True})


@app.route('/api/shifts', methods=['GET', 'POST'])
@require_login
def api_shifts():
    if request.method == 'GET':
        calendar_id = request.args.get('calendar_id')
        start = request.args.get('start')
        end = request.args.get('end')
        
        query = Shift.query.join(Calendar).filter(Calendar.user_id == current_user.id)
        if calendar_id:
            query = query.filter(Shift.calendar_id == calendar_id)
        if start:
            query = query.filter(Shift.start_datetime >= datetime.fromisoformat(start.replace('Z', '')))
        if end:
            query = query.filter(Shift.end_datetime <= datetime.fromisoformat(end.replace('Z', '')))
        
        shifts = query.all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'start': s.start_datetime.isoformat(),
            'end': s.end_datetime.isoformat(),
            'color': s.color,
            'allDay': s.all_day,
            'extendedProps': {
                'calendar_id': s.calendar_id,
                'notes': s.notes,
                'template_id': s.template_id
            }
        } for s in shifts])
    
    data = request.get_json()
    calendar = Calendar.query.filter_by(id=data['calendar_id'], user_id=current_user.id).first_or_404()
    
    shift = Shift(
        calendar_id=calendar.id,
        title=data.get('title', 'Shift'),
        start_datetime=datetime.fromisoformat(data['start'].replace('Z', '')),
        end_datetime=datetime.fromisoformat(data['end'].replace('Z', '')),
        notes=data.get('notes'),
        color=data.get('color', '#3788d8'),
        all_day=data.get('allDay', False),
        template_id=data.get('template_id')
    )
    db.session.add(shift)
    db.session.commit()
    return jsonify({'id': shift.id}), 201


@app.route('/api/shifts/<shift_id>', methods=['GET', 'PUT', 'DELETE'])
@require_login
def api_shift(shift_id):
    shift = Shift.query.join(Calendar).filter(
        Shift.id == shift_id,
        Calendar.user_id == current_user.id
    ).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': shift.id,
            'title': shift.title,
            'start': shift.start_datetime.isoformat(),
            'end': shift.end_datetime.isoformat(),
            'color': shift.color,
            'allDay': shift.all_day,
            'notes': shift.notes,
            'calendar_id': shift.calendar_id,
            'template_id': shift.template_id
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        shift.title = data.get('title', shift.title)
        if 'start' in data:
            shift.start_datetime = datetime.fromisoformat(data['start'].replace('Z', ''))
        if 'end' in data:
            shift.end_datetime = datetime.fromisoformat(data['end'].replace('Z', ''))
        shift.notes = data.get('notes', shift.notes)
        shift.color = data.get('color', shift.color)
        shift.all_day = data.get('allDay', shift.all_day)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        db.session.delete(shift)
        db.session.commit()
        return jsonify({'success': True})


@app.route('/api/shifts/from-template', methods=['POST'])
@require_login
def create_shift_from_template():
    data = request.get_json()
    template = ShiftTemplate.query.filter_by(id=data['template_id'], user_id=current_user.id).first_or_404()
    calendar = Calendar.query.filter_by(id=data['calendar_id'], user_id=current_user.id).first_or_404()
    
    date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    start_datetime = datetime.combine(date, template.start_time)
    end_datetime = datetime.combine(date, template.end_time)
    
    if end_datetime <= start_datetime:
        end_datetime += timedelta(days=1)
    
    shift = Shift(
        calendar_id=calendar.id,
        template_id=template.id,
        title=template.name,
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        color=template.color,
        notes=template.description
    )
    db.session.add(shift)
    db.session.commit()
    return jsonify({'id': shift.id}), 201


@app.route('/ics/<api_key>.ics')
def ics_feed(api_key):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    
    cal = ICalendar()
    cal.add('prodid', '-//WorkShift Calendar//EN')
    cal.add('version', '2.0')
    cal.add('calscale', 'GREGORIAN')
    cal.add('method', 'PUBLISH')
    cal.add('x-wr-calname', calendar.name)
    
    shifts = Shift.query.filter_by(calendar_id=calendar.id).all()
    for shift in shifts:
        event = ICalEvent()
        event.add('summary', shift.title)
        event.add('dtstart', shift.start_datetime)
        event.add('dtend', shift.end_datetime)
        event.add('uid', f'{shift.id}@workshift')
        if shift.notes:
            event.add('description', shift.notes)
        cal.add_component(event)
    
    response = Response(cal.to_ical(), mimetype='text/calendar')
    response.headers['Content-Disposition'] = f'attachment; filename="{calendar.name}.ics"'
    return response


@app.route('/api/v1/calendar/<api_key>/events', methods=['GET', 'POST'])
def external_api_events(api_key):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    
    if request.method == 'GET':
        start = request.args.get('start')
        end = request.args.get('end')
        
        query = Shift.query.filter_by(calendar_id=calendar.id)
        if start:
            query = query.filter(Shift.start_datetime >= datetime.fromisoformat(start.replace('Z', '')))
        if end:
            query = query.filter(Shift.end_datetime <= datetime.fromisoformat(end.replace('Z', '')))
        
        shifts = query.all()
        return jsonify({
            'calendar': {
                'id': calendar.id,
                'name': calendar.name
            },
            'events': [{
                'id': s.id,
                'summary': s.title,
                'start': s.start_datetime.isoformat(),
                'end': s.end_datetime.isoformat(),
                'description': s.notes,
                'all_day': s.all_day
            } for s in shifts]
        })
    
    data = request.get_json()
    shift = Shift(
        calendar_id=calendar.id,
        title=data.get('summary', data.get('title', 'Shift')),
        start_datetime=datetime.fromisoformat(data['start'].replace('Z', '')),
        end_datetime=datetime.fromisoformat(data['end'].replace('Z', '')),
        notes=data.get('description'),
        all_day=data.get('all_day', False)
    )
    db.session.add(shift)
    db.session.commit()
    return jsonify({'id': shift.id, 'status': 'created'}), 201


@app.route('/api/v1/calendar/<api_key>/events/<event_id>', methods=['GET', 'PUT', 'DELETE'])
def external_api_event(api_key, event_id):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    shift = Shift.query.filter_by(id=event_id, calendar_id=calendar.id).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': shift.id,
            'summary': shift.title,
            'start': shift.start_datetime.isoformat(),
            'end': shift.end_datetime.isoformat(),
            'description': shift.notes,
            'all_day': shift.all_day
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        shift.title = data.get('summary', data.get('title', shift.title))
        if 'start' in data:
            shift.start_datetime = datetime.fromisoformat(data['start'].replace('Z', ''))
        if 'end' in data:
            shift.end_datetime = datetime.fromisoformat(data['end'].replace('Z', ''))
        shift.notes = data.get('description', shift.notes)
        shift.all_day = data.get('all_day', shift.all_day)
        db.session.commit()
        return jsonify({'status': 'updated'})
    
    if request.method == 'DELETE':
        db.session.delete(shift)
        db.session.commit()
        return jsonify({'status': 'deleted'})


@app.route('/webhook/<api_key>', methods=['POST'])
def webhook_receiver(api_key):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    data = request.get_json()
    
    action = data.get('action', 'create')
    
    if action == 'create':
        shift = Shift(
            calendar_id=calendar.id,
            title=data.get('summary', data.get('title', 'Shift')),
            start_datetime=datetime.fromisoformat(data['start'].replace('Z', '')),
            end_datetime=datetime.fromisoformat(data['end'].replace('Z', '')),
            notes=data.get('description'),
            all_day=data.get('all_day', False)
        )
        db.session.add(shift)
        db.session.commit()
        return jsonify({'status': 'created', 'id': shift.id}), 201
    
    elif action == 'delete':
        event_id = data.get('event_id')
        shift = Shift.query.filter_by(id=event_id, calendar_id=calendar.id).first()
        if shift:
            db.session.delete(shift)
            db.session.commit()
            return jsonify({'status': 'deleted'})
        return jsonify({'status': 'not_found'}), 404
    
    return jsonify({'status': 'unknown_action'}), 400


@app.errorhandler(403)
def forbidden(e):
    return render_template('403.html'), 403


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

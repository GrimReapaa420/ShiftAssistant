from flask import render_template, request, jsonify, session, Response, redirect, url_for, flash
from datetime import datetime, timedelta, date
from app import app, db
from local_auth import require_login
from flask_login import current_user, login_user, logout_user
from models import Calendar, ShiftTemplate, Shift, User, DayNote
from icalendar import Calendar as ICalendar, Event as ICalEvent
import os

def is_admin_mode():
    return os.environ.get('ADMIN_MODE', '').lower() == 'true'

def get_view_user():
    if is_admin_mode() and current_user.is_authenticated:
        view_user_id = session.get('admin_view_user_id')
        if view_user_id:
            user = User.query.get(view_user_id)
            if user:
                return user
    return current_user if current_user.is_authenticated else None


@app.before_request
def normalize_path():
    if request.path != '/' and request.path.endswith('/'):
        return redirect(request.path.rstrip('/'))
    if '//' in request.path:
        normalized = request.path.replace('//', '/')
        return redirect(normalized)

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
@app.route('//')
def index():
    if current_user.is_authenticated:
        view_user = get_view_user()
        calendars = Calendar.query.filter_by(user_id=view_user.id).all()
        if not calendars:
            default_calendar = Calendar(
                user_id=view_user.id,
                name='My Shifts',
                is_default=True
            )
            db.session.add(default_calendar)
            db.session.commit()
            calendars = [default_calendar]
        templates_query = ShiftTemplate.query.filter_by(user_id=view_user.id).all()
        templates = [{
            'id': t.id,
            'name': t.name,
            'start_time': t.start_time.strftime('%H:%M') if t.start_time else None,
            'end_time': t.end_time.strftime('%H:%M') if t.end_time else None,
            'color': t.color
        } for t in templates_query]
        
        all_users = None
        if is_admin_mode():
            all_users = User.query.order_by(User.username).all()
        
        return render_template('dashboard.html', 
                               user=current_user, 
                               view_user=view_user,
                               calendars=calendars, 
                               templates=templates,
                               admin_mode=is_admin_mode(),
                               all_users=all_users)
    return render_template('landing.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            next_url = session.pop('next_url', None)
            return redirect(next_url or url_for('index'))
        flash('Invalid username or password', 'error')
    
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if len(username) < 3:
            flash('Username must be at least 3 characters', 'error')
        elif len(password) < 4:
            flash('Password must be at least 4 characters', 'error')
        elif password != confirm_password:
            flash('Passwords do not match', 'error')
        elif User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
        else:
            user = User(username=username)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            return redirect(url_for('index'))
    
    return render_template('register.html')


@app.route('/logout')
def logout():
    session.pop('admin_view_user_id', None)
    logout_user()
    return redirect(url_for('index'))


@app.route('/admin/switch-user/<user_id>')
@require_login
def admin_switch_user(user_id):
    if not is_admin_mode():
        return redirect(url_for('index'))
    
    user = User.query.get(user_id)
    if user:
        session['admin_view_user_id'] = user_id
    return redirect(url_for('index'))


@app.route('/templates')
@require_login
def templates_page():
    view_user = get_view_user()
    templates = ShiftTemplate.query.filter_by(user_id=view_user.id).all()
    return render_template('templates.html', user=current_user, view_user=view_user, templates=templates, admin_mode=is_admin_mode())


@app.route('/settings')
@require_login
def settings_page():
    from app import INGRESS_MODE
    view_user = get_view_user()
    calendars = Calendar.query.filter_by(user_id=view_user.id).all()
    external_url = os.environ.get('EXTERNAL_URL', '').strip()
    if external_url:
        external_base_url = external_url.rstrip('/')
    elif INGRESS_MODE:
        external_base_url = "http://<YOUR_HA_IP>:8099"
    else:
        external_base_url = request.url_root.rstrip('/')
    return render_template('settings.html', user=current_user, view_user=view_user, calendars=calendars, admin_mode=is_admin_mode(), external_base_url=external_base_url)


@app.route('/api/calendars', methods=['GET', 'POST'])
@require_login
def api_calendars():
    view_user = get_view_user()
    if request.method == 'GET':
        calendars = Calendar.query.filter_by(user_id=view_user.id).all()
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
        user_id=view_user.id,
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
    view_user = get_view_user()
    calendar = Calendar.query.filter_by(id=calendar_id, user_id=view_user.id).first_or_404()
    
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
    view_user = get_view_user()
    if request.method == 'GET':
        templates = ShiftTemplate.query.filter_by(user_id=view_user.id).all()
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
        user_id=view_user.id,
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
    view_user = get_view_user()
    template = ShiftTemplate.query.filter_by(id=template_id, user_id=view_user.id).first_or_404()
    
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
    view_user = get_view_user()
    if request.method == 'GET':
        calendar_id = request.args.get('calendar_id')
        start = request.args.get('start')
        end = request.args.get('end')
        
        query = Shift.query.join(Calendar).filter(Calendar.user_id == view_user.id)
        if calendar_id:
            query = query.filter(Shift.calendar_id == calendar_id)
        if start:
            start_date = datetime.fromisoformat(start.replace('Z', '')).date()
            query = query.filter(Shift.shift_date >= start_date)
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '')).date()
            query = query.filter(Shift.shift_date <= end_date)
        
        shifts = query.order_by(Shift.shift_date, Shift.position).all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'date': s.shift_date.isoformat(),
            'start_time': s.start_time.strftime('%H:%M'),
            'end_time': s.end_time.strftime('%H:%M'),
            'color': s.color,
            'position': s.position,
            'calendar_id': s.calendar_id,
            'template_id': s.template_id
        } for s in shifts])
    
    data = request.get_json()
    calendar = Calendar.query.filter_by(id=data['calendar_id'], user_id=view_user.id).first_or_404()
    
    shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    existing_shifts = Shift.query.filter_by(calendar_id=calendar.id, shift_date=shift_date).count()
    
    if existing_shifts >= 2:
        return jsonify({'error': 'Maximum 2 shifts per day'}), 409
    
    shift = Shift(
        calendar_id=calendar.id,
        title=data.get('title', 'Shift'),
        shift_date=shift_date,
        start_time=datetime.strptime(data.get('start_time', '09:00'), '%H:%M').time(),
        end_time=datetime.strptime(data.get('end_time', '17:00'), '%H:%M').time(),
        color=data.get('color', '#3788d8'),
        position=existing_shifts,
        template_id=data.get('template_id')
    )
    db.session.add(shift)
    db.session.commit()
    return jsonify({'id': shift.id}), 201


@app.route('/api/shifts/<shift_id>', methods=['GET', 'PUT', 'DELETE'])
@require_login
def api_shift(shift_id):
    view_user = get_view_user()
    shift = Shift.query.join(Calendar).filter(
        Shift.id == shift_id,
        Calendar.user_id == view_user.id
    ).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': shift.id,
            'title': shift.title,
            'date': shift.shift_date.isoformat(),
            'start_time': shift.start_time.strftime('%H:%M'),
            'end_time': shift.end_time.strftime('%H:%M'),
            'color': shift.color,
            'position': shift.position,
            'calendar_id': shift.calendar_id,
            'template_id': shift.template_id
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        shift.title = data.get('title', shift.title)
        if 'date' in data:
            shift.shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'start_time' in data:
            shift.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data:
            shift.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        shift.color = data.get('color', shift.color)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        calendar_id = shift.calendar_id
        shift_date = shift.shift_date
        db.session.delete(shift)
        remaining = Shift.query.filter_by(calendar_id=calendar_id, shift_date=shift_date).order_by(Shift.position).all()
        for i, s in enumerate(remaining):
            s.position = i
        db.session.commit()
        return jsonify({'success': True})


@app.route('/api/shifts/from-template', methods=['POST'])
@require_login
def create_shift_from_template():
    view_user = get_view_user()
    data = request.get_json()
    template = ShiftTemplate.query.filter_by(id=data['template_id'], user_id=view_user.id).first_or_404()
    calendar = Calendar.query.filter_by(id=data['calendar_id'], user_id=view_user.id).first_or_404()
    
    shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    existing_shifts = Shift.query.filter_by(calendar_id=calendar.id, shift_date=shift_date).count()
    
    if existing_shifts >= 2:
        return jsonify({'error': 'Maximum 2 shifts per day'}), 409
    
    shift = Shift(
        calendar_id=calendar.id,
        template_id=template.id,
        title=template.name,
        shift_date=shift_date,
        start_time=template.start_time,
        end_time=template.end_time,
        color=template.color,
        position=existing_shifts
    )
    db.session.add(shift)
    db.session.commit()
    return jsonify({
        'id': shift.id,
        'title': shift.title,
        'date': shift.shift_date.isoformat(),
        'start_time': shift.start_time.strftime('%H:%M'),
        'end_time': shift.end_time.strftime('%H:%M'),
        'color': shift.color,
        'position': shift.position,
        'calendar_id': shift.calendar_id,
        'template_id': shift.template_id
    }), 201


@app.route('/api/shifts/by-date/<date_str>', methods=['DELETE'])
@require_login
def delete_shift_by_date(date_str):
    view_user = get_view_user()
    data = request.get_json()
    calendar_id = data.get('calendar_id')
    position = data.get('position', 0)
    
    shift_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    shift = Shift.query.join(Calendar).filter(
        Calendar.user_id == view_user.id,
        Shift.calendar_id == calendar_id,
        Shift.shift_date == shift_date,
        Shift.position == position
    ).first_or_404()
    
    db.session.delete(shift)
    remaining = Shift.query.filter_by(calendar_id=calendar_id, shift_date=shift_date).order_by(Shift.position).all()
    for i, s in enumerate(remaining):
        s.position = i
    db.session.commit()
    return jsonify({'success': True})


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
    day_notes = {n.note_date: n.content for n in DayNote.query.filter_by(calendar_id=calendar.id).all()}
    
    for shift in shifts:
        event = ICalEvent()
        event.add('summary', shift.title)
        start_dt = datetime.combine(shift.shift_date, shift.start_time)
        end_dt = datetime.combine(shift.shift_date, shift.end_time)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)
        event.add('dtstart', start_dt)
        event.add('dtend', end_dt)
        event.add('uid', f'{shift.id}@workshift')
        if shift.shift_date in day_notes:
            event.add('description', day_notes[shift.shift_date])
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
            start_date = datetime.fromisoformat(start.replace('Z', '')).date()
            query = query.filter(Shift.shift_date >= start_date)
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '')).date()
            query = query.filter(Shift.shift_date <= end_date)
        
        shifts = query.order_by(Shift.shift_date, Shift.position).all()
        day_notes = {n.note_date: n.content for n in DayNote.query.filter_by(calendar_id=calendar.id).all()}
        
        return jsonify({
            'calendar': {'id': calendar.id, 'name': calendar.name},
            'events': [{
                'id': s.id,
                'summary': s.title,
                'date': s.shift_date.isoformat(),
                'start_time': s.start_time.strftime('%H:%M'),
                'end_time': s.end_time.strftime('%H:%M'),
                'description': day_notes.get(s.shift_date),
                'position': s.position
            } for s in shifts]
        })
    
    data = request.get_json()
    shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date() if 'date' in data else datetime.fromisoformat(data['start'].replace('Z', '')).date()
    existing = Shift.query.filter_by(calendar_id=calendar.id, shift_date=shift_date).count()
    
    if existing >= 2:
        return jsonify({'error': 'Maximum 2 shifts per day'}), 409
    
    shift = Shift(
        calendar_id=calendar.id,
        title=data.get('summary', data.get('title', 'Shift')),
        shift_date=shift_date,
        start_time=datetime.strptime(data.get('start_time', '09:00'), '%H:%M').time(),
        end_time=datetime.strptime(data.get('end_time', '17:00'), '%H:%M').time(),
        position=existing
    )
    db.session.add(shift)
    db.session.commit()
    
    if data.get('description'):
        note = DayNote.query.filter_by(calendar_id=calendar.id, note_date=shift_date).first()
        if note:
            note.content = data['description']
        else:
            note = DayNote(calendar_id=calendar.id, note_date=shift_date, content=data['description'])
            db.session.add(note)
        db.session.commit()
    
    return jsonify({'id': shift.id, 'status': 'created'}), 201


@app.route('/api/v1/calendar/<api_key>/events/<event_id>', methods=['GET', 'PUT', 'DELETE'])
def external_api_event(api_key, event_id):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    shift = Shift.query.filter_by(id=event_id, calendar_id=calendar.id).first_or_404()
    
    if request.method == 'GET':
        day_note = DayNote.query.filter_by(calendar_id=calendar.id, note_date=shift.shift_date).first()
        return jsonify({
            'id': shift.id,
            'summary': shift.title,
            'date': shift.shift_date.isoformat(),
            'start_time': shift.start_time.strftime('%H:%M'),
            'end_time': shift.end_time.strftime('%H:%M'),
            'description': day_note.content if day_note else None,
            'position': shift.position
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        shift.title = data.get('summary', data.get('title', shift.title))
        if 'date' in data:
            shift.shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'start_time' in data:
            shift.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data:
            shift.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        db.session.commit()
        
        if 'description' in data:
            day_note = DayNote.query.filter_by(calendar_id=calendar.id, note_date=shift.shift_date).first()
            if day_note:
                day_note.content = data['description']
            else:
                day_note = DayNote(calendar_id=calendar.id, note_date=shift.shift_date, content=data['description'])
                db.session.add(day_note)
            db.session.commit()
        
        return jsonify({'status': 'updated'})
    
    if request.method == 'DELETE':
        calendar_id = shift.calendar_id
        shift_date = shift.shift_date
        db.session.delete(shift)
        remaining = Shift.query.filter_by(calendar_id=calendar_id, shift_date=shift_date).order_by(Shift.position).all()
        for i, s in enumerate(remaining):
            s.position = i
        db.session.commit()
        return jsonify({'status': 'deleted'})


@app.route('/webhook/<api_key>', methods=['POST'])
def webhook_receiver(api_key):
    calendar = Calendar.query.filter_by(api_key=api_key).first_or_404()
    data = request.get_json()
    
    action = data.get('action', 'create')
    
    if action == 'create':
        shift_date = datetime.strptime(data['date'], '%Y-%m-%d').date() if 'date' in data else datetime.fromisoformat(data['start'].replace('Z', '')).date()
        existing = Shift.query.filter_by(calendar_id=calendar.id, shift_date=shift_date).count()
        
        if existing >= 2:
            return jsonify({'error': 'Maximum 2 shifts per day'}), 409
        
        shift = Shift(
            calendar_id=calendar.id,
            title=data.get('summary', data.get('title', 'Shift')),
            shift_date=shift_date,
            start_time=datetime.strptime(data.get('start_time', '09:00'), '%H:%M').time(),
            end_time=datetime.strptime(data.get('end_time', '17:00'), '%H:%M').time(),
            position=existing
        )
        db.session.add(shift)
        db.session.commit()
        
        if data.get('description'):
            note = DayNote.query.filter_by(calendar_id=calendar.id, note_date=shift_date).first()
            if note:
                note.content = data['description']
            else:
                note = DayNote(calendar_id=calendar.id, note_date=shift_date, content=data['description'])
                db.session.add(note)
            db.session.commit()
        
        return jsonify({'status': 'created', 'id': shift.id}), 201
    
    elif action == 'delete':
        event_id = data.get('event_id')
        shift = Shift.query.filter_by(id=event_id, calendar_id=calendar.id).first()
        if shift:
            calendar_id = shift.calendar_id
            shift_date = shift.shift_date
            db.session.delete(shift)
            remaining = Shift.query.filter_by(calendar_id=calendar_id, shift_date=shift_date).order_by(Shift.position).all()
            for i, s in enumerate(remaining):
                s.position = i
            db.session.commit()
            return jsonify({'status': 'deleted'})
        return jsonify({'status': 'not_found'}), 404
    
    return jsonify({'status': 'unknown_action'}), 400


@app.route('/api/day-notes', methods=['GET', 'POST'])
@require_login
def api_day_notes():
    view_user = get_view_user()
    if request.method == 'GET':
        calendar_id = request.args.get('calendar_id')
        start = request.args.get('start')
        end = request.args.get('end')
        
        query = DayNote.query.join(Calendar).filter(Calendar.user_id == view_user.id)
        if calendar_id:
            query = query.filter(DayNote.calendar_id == calendar_id)
        if start:
            start_date = datetime.fromisoformat(start.replace('Z', '')).date()
            query = query.filter(DayNote.note_date >= start_date)
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '')).date()
            query = query.filter(DayNote.note_date <= end_date)
        
        notes = query.order_by(DayNote.note_date).all()
        return jsonify([{
            'id': n.id,
            'date': n.note_date.isoformat(),
            'content': n.content,
            'calendar_id': n.calendar_id
        } for n in notes])
    
    data = request.get_json()
    calendar = Calendar.query.filter_by(id=data['calendar_id'], user_id=view_user.id).first_or_404()
    note_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    
    existing = DayNote.query.filter_by(calendar_id=calendar.id, note_date=note_date).first()
    if existing:
        existing.content = data['content']
        db.session.commit()
        return jsonify({'id': existing.id, 'updated': True})
    
    note = DayNote(
        calendar_id=calendar.id,
        note_date=note_date,
        content=data['content']
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({'id': note.id}), 201


@app.route('/api/day-notes/<note_id>', methods=['GET', 'PUT', 'DELETE'])
@require_login
def api_day_note(note_id):
    view_user = get_view_user()
    note = DayNote.query.join(Calendar).filter(
        DayNote.id == note_id,
        Calendar.user_id == view_user.id
    ).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': note.id,
            'date': note.note_date.isoformat(),
            'content': note.content,
            'calendar_id': note.calendar_id
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        note.content = data.get('content', note.content)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        db.session.delete(note)
        db.session.commit()
        return jsonify({'success': True})


@app.errorhandler(403)
def forbidden(e):
    return render_template('403.html'), 403


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

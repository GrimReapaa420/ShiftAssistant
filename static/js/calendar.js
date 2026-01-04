document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const shiftModal = new bootstrap.Modal(document.getElementById('shiftModal'));
    
    let selectedCalendars = [];
    document.querySelectorAll('.calendar-toggle').forEach(cb => {
        if (cb.checked) {
            selectedCalendars.push(cb.dataset.calendarId);
        }
    });
    
    const containerEl = document.getElementById('templateList');
    if (containerEl) {
        new FullCalendar.Draggable(containerEl, {
            itemSelector: '.template-item',
            eventData: function(eventEl) {
                return {
                    title: eventEl.dataset.templateName,
                    duration: { hours: 8 },
                    color: eventEl.dataset.templateColor
                };
            }
        });
    }
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        nowIndicator: true,
        droppable: true,
        
        events: function(info, successCallback, failureCallback) {
            const params = new URLSearchParams({
                start: info.startStr,
                end: info.endStr
            });
            
            fetch('/api/shifts?' + params.toString())
                .then(response => response.json())
                .then(events => {
                    const filteredEvents = events.filter(e => 
                        selectedCalendars.includes(e.extendedProps.calendar_id)
                    );
                    successCallback(filteredEvents);
                })
                .catch(err => {
                    console.error('Failed to fetch events:', err);
                    failureCallback(err);
                });
        },
        
        select: function(info) {
            openShiftModal(null, info.start, info.end, info.allDay);
        },
        
        eventClick: function(info) {
            openShiftModal(info.event);
        },
        
        eventDrop: function(info) {
            updateShift(info.event.id, {
                start: info.event.start.toISOString(),
                end: (info.event.end || info.event.start).toISOString()
            });
        },
        
        eventResize: function(info) {
            updateShift(info.event.id, {
                start: info.event.start.toISOString(),
                end: info.event.end.toISOString()
            });
        },
        
        drop: function(info) {
            const templateId = info.draggedEl.dataset.templateId;
            const calendarId = document.querySelector('.calendar-toggle:checked')?.dataset.calendarId;
            
            if (templateId && calendarId) {
                createShiftFromTemplate(templateId, calendarId, info.dateStr);
            }
        }
    });
    
    calendar.render();
    
    document.querySelectorAll('.calendar-toggle').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                selectedCalendars.push(this.dataset.calendarId);
            } else {
                selectedCalendars = selectedCalendars.filter(id => id !== this.dataset.calendarId);
            }
            calendar.refetchEvents();
        });
    });
    
    function openShiftModal(event, start, end, allDay) {
        const form = document.getElementById('shiftForm');
        form.reset();
        
        if (event) {
            document.getElementById('shiftModalTitle').textContent = 'Edit Shift';
            document.getElementById('shiftId').value = event.id;
            document.getElementById('shiftTitle').value = event.title;
            document.getElementById('shiftStart').value = formatDateTimeLocal(event.start);
            document.getElementById('shiftEnd').value = formatDateTimeLocal(event.end || event.start);
            document.getElementById('shiftColor').value = event.backgroundColor || '#3788d8';
            document.getElementById('shiftNotes').value = event.extendedProps?.notes || '';
            document.getElementById('shiftCalendar').value = event.extendedProps?.calendar_id || '';
            document.getElementById('deleteShift').style.display = 'block';
        } else {
            document.getElementById('shiftModalTitle').textContent = 'Add Shift';
            document.getElementById('shiftId').value = '';
            document.getElementById('shiftStart').value = formatDateTimeLocal(start);
            
            if (allDay) {
                const endDate = new Date(start);
                endDate.setHours(17, 0, 0);
                document.getElementById('shiftStart').value = formatDateTimeLocal(new Date(start.setHours(9, 0, 0)));
                document.getElementById('shiftEnd').value = formatDateTimeLocal(endDate);
            } else {
                document.getElementById('shiftEnd').value = formatDateTimeLocal(end);
            }
            
            document.getElementById('deleteShift').style.display = 'none';
        }
        
        shiftModal.show();
    }
    
    function formatDateTimeLocal(date) {
        if (!date) return '';
        const d = new Date(date);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    
    document.getElementById('saveShift').addEventListener('click', function() {
        const id = document.getElementById('shiftId').value;
        const data = {
            title: document.getElementById('shiftTitle').value,
            calendar_id: document.getElementById('shiftCalendar').value,
            start: document.getElementById('shiftStart').value,
            end: document.getElementById('shiftEnd').value,
            color: document.getElementById('shiftColor').value,
            notes: document.getElementById('shiftNotes').value
        };
        
        if (id) {
            updateShift(id, data);
        } else {
            createShift(data);
        }
        
        shiftModal.hide();
    });
    
    document.getElementById('deleteShift').addEventListener('click', function() {
        const id = document.getElementById('shiftId').value;
        if (id && confirm('Are you sure you want to delete this shift?')) {
            deleteShift(id);
            shiftModal.hide();
        }
    });
    
    function createShift(data) {
        fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => calendar.refetchEvents())
        .catch(err => console.error('Failed to create shift:', err));
    }
    
    function updateShift(id, data) {
        fetch(`/api/shifts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => calendar.refetchEvents())
        .catch(err => console.error('Failed to update shift:', err));
    }
    
    function deleteShift(id) {
        fetch(`/api/shifts/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(() => calendar.refetchEvents())
        .catch(err => console.error('Failed to delete shift:', err));
    }
    
    function createShiftFromTemplate(templateId, calendarId, date) {
        fetch('/api/shifts/from-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: templateId,
                calendar_id: calendarId,
                date: date
            })
        })
        .then(response => response.json())
        .then(() => calendar.refetchEvents())
        .catch(err => console.error('Failed to create shift from template:', err));
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('shiftCalendar');
    if (!calendarEl) return;
    
    let currentDate = new Date();
    let activeTemplate = null;
    let removeMode = false;
    let shifts = [];
    let dayNotes = {};
    let pendingOperations = new Set();
    
    function getActiveCalendarId() {
        const checked = document.querySelector('.calendar-select:checked');
        return checked ? checked.dataset.calendarId : null;
    }
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        
        let html = `
            <div class="calendar-nav">
                <button class="btn btn-outline-secondary btn-sm" id="prevMonth">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <h5>${monthNames[month]} ${year}</h5>
                <div class="nav-buttons">
                    <button class="btn btn-outline-secondary btn-sm" id="todayBtn">Today</button>
                    <button class="btn btn-outline-secondary btn-sm" id="nextMonth">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="shift-calendar-grid">
        `;
        
        dayNames.forEach(day => {
            html += `<div class="calendar-header">${day}</div>`;
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateStr = current.toISOString().split('T')[0];
            const isOtherMonth = current.getMonth() !== month;
            const isToday = current.getTime() === today.getTime();
            const isPending = pendingOperations.has(dateStr);
            const hasNote = dayNotes[dateStr];
            
            const dayShifts = shifts.filter(s => s.date === dateStr).sort((a, b) => a.position - b.position);
            
            let shiftsHtml = '';
            if (dayShifts.length > 0) {
                shiftsHtml = '<div class="day-shifts-container">';
                dayShifts.forEach((shift) => {
                    const pendingClass = shift.pending ? 'pending' : '';
                    shiftsHtml += `
                        <div class="day-shift ${pendingClass}" 
                             style="background-color: ${shift.color}" 
                             data-shift-id="${shift.id}">
                            <span class="shift-name">${shift.title}</span>
                        </div>
                    `;
                });
                shiftsHtml += '</div>';
            }
            
            const paintClass = activeTemplate && !isPending ? 'paint-mode' : '';
            const removeClass = removeMode ? 'remove-mode' : '';
            const pendingClass = isPending ? 'day-pending' : '';
            const noteIndicator = hasNote ? '<div class="day-note-indicator" title="Has note"></div>' : '';
            
            html += `
                <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${paintClass} ${removeClass} ${pendingClass} ${hasNote ? 'has-note' : ''}" 
                     data-date="${dateStr}">
                    <div class="day-number">${current.getDate()}</div>
                    ${noteIndicator}
                    ${shiftsHtml}
                </div>
            `;
            
            current.setDate(current.getDate() + 1);
        }
        
        html += '</div>';
        calendarEl.innerHTML = html;
        
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadShifts();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadShifts();
        });
        
        document.getElementById('todayBtn').addEventListener('click', () => {
            currentDate = new Date();
            loadShifts();
        });
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', handleDayClick);
        });
        
        document.querySelectorAll('.day-shift').forEach(shift => {
            shift.addEventListener('click', handleShiftClick);
        });
    }
    
    function handleDayClick(e) {
        if (e.target.closest('.day-shift')) return;
        
        const dateStr = e.currentTarget.dataset.date;
        const calendarId = getActiveCalendarId();
        
        if (!calendarId) return;
        if (removeMode) return;
        if (pendingOperations.has(dateStr)) return;
        
        if (activeTemplate) {
            const dayShifts = shifts.filter(s => s.date === dateStr);
            if (dayShifts.length >= 2) {
                showToast('Maximum 2 shifts per day', 'warning');
                return;
            }
            
            const tempId = 'temp-' + Date.now();
            const tempShift = {
                id: tempId,
                date: dateStr,
                title: activeTemplate.name,
                start_time: activeTemplate.start_time,
                end_time: activeTemplate.end_time,
                color: activeTemplate.color,
                position: dayShifts.length,
                pending: true
            };
            shifts.push(tempShift);
            pendingOperations.add(dateStr);
            renderCalendar();
            
            createShiftFromTemplate(activeTemplate.id, calendarId, dateStr, tempId);
        }
    }
    
    function handleShiftClick(e) {
        e.stopPropagation();
        
        const shiftEl = e.currentTarget;
        const shiftId = shiftEl.dataset.shiftId;
        
        if (shiftId.startsWith('temp-')) return;
        
        if (removeMode) {
            const shift = shifts.find(s => s.id === shiftId);
            if (shift && pendingOperations.has(shift.date)) return;
            
            shiftEl.classList.add('removing');
            deleteShift(shiftId);
        }
    }
    
    function loadShifts() {
        const calendarId = getActiveCalendarId();
        if (!calendarId) {
            shifts = [];
            dayNotes = {};
            renderCalendar();
            return;
        }
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const end = new Date(year, month + 2, 0).toISOString().split('T')[0];
        
        Promise.all([
            fetch(`/api/shifts?calendar_id=${calendarId}&start=${start}&end=${end}`).then(res => res.json()),
            fetch(`/api/day-notes?calendar_id=${calendarId}&start=${start}&end=${end}`).then(res => res.json())
        ])
        .then(([shiftsData, notesData]) => {
            shifts = shiftsData;
            dayNotes = {};
            notesData.forEach(n => {
                dayNotes[n.date] = n;
            });
            pendingOperations.clear();
            renderCalendar();
        })
        .catch(err => console.error('Failed to load data:', err));
    }
    
    function createShiftFromTemplate(templateId, calendarId, dateStr, tempId) {
        fetch('/api/shifts/from-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: templateId,
                calendar_id: calendarId,
                date: dateStr
            })
        })
        .then(res => {
            if (res.status === 409) {
                shifts = shifts.filter(s => s.id !== tempId);
                pendingOperations.delete(dateStr);
                renderCalendar();
                showToast('Maximum 2 shifts per day', 'warning');
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (data && data.id) {
                const idx = shifts.findIndex(s => s.id === tempId);
                if (idx !== -1) {
                    shifts[idx] = {
                        id: data.id,
                        title: data.title,
                        date: data.date,
                        start_time: data.start_time,
                        end_time: data.end_time,
                        color: data.color,
                        position: data.position,
                        calendar_id: data.calendar_id,
                        notes: data.notes,
                        template_id: data.template_id,
                        pending: false
                    };
                }
            }
            pendingOperations.delete(dateStr);
            renderCalendar();
        })
        .catch(err => {
            console.error('Failed to create shift:', err);
            shifts = shifts.filter(s => s.id !== tempId);
            pendingOperations.delete(dateStr);
            renderCalendar();
            showToast('Failed to create shift', 'error');
        });
    }
    
    function deleteShift(shiftId) {
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) return;
        
        const dateStr = shift.date;
        pendingOperations.add(dateStr);
        
        const originalShifts = [...shifts];
        shifts = shifts.filter(s => s.id !== shiftId);
        renderCalendar();
        
        fetch(`/api/shifts/${shiftId}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Failed to delete');
                return res.json();
            })
            .then(() => {
                pendingOperations.delete(dateStr);
                renderCalendar();
            })
            .catch(err => {
                console.error('Failed to delete shift:', err);
                shifts = originalShifts;
                pendingOperations.delete(dateStr);
                renderCalendar();
                showToast('Failed to delete shift', 'error');
            });
    }
    
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    const templateToggle = document.getElementById('templateBarToggle');
    const templateBar = document.getElementById('templateBar');
    const chevron = templateToggle?.querySelector('.template-chevron');
    
    if (templateToggle) {
        templateBar.classList.add('show');
        chevron?.classList.add('expanded');
        
        templateToggle.addEventListener('click', () => {
            const isExpanded = templateBar.classList.contains('show');
            if (isExpanded) {
                templateBar.classList.remove('show');
                chevron?.classList.remove('expanded');
            } else {
                templateBar.classList.add('show');
                chevron?.classList.add('expanded');
            }
        });
    }
    
    const activeIndicator = document.getElementById('activeIndicator');
    const activeTemplateName = document.getElementById('activeTemplateName');
    const clearActiveBtn = document.getElementById('clearActive');
    
    function setActiveTemplate(template) {
        activeTemplate = template;
        removeMode = false;
        
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('active');
        });
        
        if (template) {
            const card = document.querySelector(`[data-template-id="${template.id}"]`);
            card?.classList.add('active');
            activeTemplateName.textContent = `${template.name}`;
            activeIndicator.style.display = 'flex';
            activeIndicator.classList.remove('remove-mode');
        } else {
            activeIndicator.style.display = 'none';
        }
        renderCalendar();
    }
    
    function setRemoveMode(enabled) {
        removeMode = enabled;
        activeTemplate = null;
        
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('active');
        });
        
        if (enabled) {
            document.querySelector('.remove-template')?.classList.add('active');
            activeTemplateName.textContent = 'Tap shift to remove';
            activeIndicator.style.display = 'flex';
            activeIndicator.classList.add('remove-mode');
        } else {
            activeIndicator.style.display = 'none';
        }
        renderCalendar();
    }
    
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.action === 'remove') {
                setRemoveMode(!removeMode);
            } else {
                const templateId = card.dataset.templateId;
                const template = {
                    id: templateId,
                    name: card.dataset.templateName,
                    start_time: card.dataset.templateStart,
                    end_time: card.dataset.templateEnd,
                    color: card.dataset.templateColor
                };
                
                if (activeTemplate && activeTemplate.id === templateId) {
                    setActiveTemplate(null);
                } else {
                    setActiveTemplate(template);
                }
            }
        });
    });
    
    clearActiveBtn?.addEventListener('click', () => {
        setActiveTemplate(null);
        setRemoveMode(false);
    });
    
    document.querySelectorAll('.calendar-select').forEach(radio => {
        radio.addEventListener('change', loadShifts);
    });
    
    loadShifts();
});

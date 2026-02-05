document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('shiftCalendar');
    if (!calendarEl) return;
    
    let currentDate = new Date();
    let activeTemplate = null;
    let removeMode = false;
    let shifts = [];
    let dayNotes = {};
    let pendingOperations = new Set();
    let viewMode = 'month';
    
    function formatLocalDate(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }
    
    function getActiveCalendarId() {
        const checked = document.querySelector('.calendar-select:checked');
        return checked ? checked.dataset.calendarId : null;
    }
    
    function getShiftColorsForDate(year, month, day) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const dayShifts = shifts.filter(function(s) { return s.date === dateStr; });
        return dayShifts.map(function(s) { return s.color; });
    }
    
    function generateMiniCalendar(year, monthIdx) {
        const firstDay = new Date(year, monthIdx, 1);
        const startDayOfWeek = firstDay.getDay();
        const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        
        const today = new Date();
        const isCurrentMonth = today.getMonth() === monthIdx && today.getFullYear() === year;
        const todayDate = today.getDate();
        
        let html = '<div class="mini-calendar-grid">';
        html += '<div class="mini-header">M</div><div class="mini-header">T</div><div class="mini-header">W</div><div class="mini-header">T</div><div class="mini-header">F</div><div class="mini-header">S</div><div class="mini-header">S</div>';
        
        let current = new Date(firstDay);
        current.setDate(current.getDate() - daysToSubtract);
        
        for (let i = 0; i < 42; i++) {
            const isOtherMonth = current.getMonth() !== monthIdx;
            const isToday = isCurrentMonth && current.getDate() === todayDate && current.getMonth() === monthIdx;
            const shiftColors = isOtherMonth ? [] : getShiftColorsForDate(year, current.getMonth(), current.getDate());
            
            let bgStyle = '';
            if (shiftColors.length === 1) {
                bgStyle = 'background:' + shiftColors[0] + ';color:white;';
            } else if (shiftColors.length === 2) {
                bgStyle = 'background:linear-gradient(90deg,' + shiftColors[0] + ' 50%,' + shiftColors[1] + ' 50%);color:white;';
            }
            
            html += '<div class="mini-day ' + (isOtherMonth ? 'other' : '') + ' ' + (isToday ? 'today' : '') + '" style="' + bgStyle + '">' + current.getDate() + '</div>';
            current.setDate(current.getDate() + 1);
        }
        
        html += '</div>';
        return html;
    }
    
    function renderYearView() {
        const year = currentDate.getFullYear();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        let html = '<div class="calendar-nav">' +
            '<button class="btn btn-outline-secondary btn-sm" id="prevYear">' +
                '<i class="bi bi-chevron-left"></i>' +
            '</button>' +
            '<h5 class="year-title" id="yearTitle">' + year + '</h5>' +
            '<div class="nav-buttons">' +
                '<button class="btn btn-outline-secondary btn-sm" id="todayBtn">Today</button>' +
                '<button class="btn btn-outline-secondary btn-sm" id="nextYear">' +
                    '<i class="bi bi-chevron-right"></i>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="year-grid">';
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        for (let idx = 0; idx < 12; idx++) {
            const isCurrentMonth = currentMonth === idx && currentYear === year;
            html += '<div class="year-month-card ' + (isCurrentMonth ? 'current-month' : '') + '" data-month="' + idx + '">' +
                '<div class="year-month-title">' + monthNames[idx] + '</div>' +
                generateMiniCalendar(year, idx) +
            '</div>';
        }
        
        html += '</div>';
        calendarEl.innerHTML = html;
        
        document.getElementById('prevYear').onclick = function(e) {
            e.preventDefault();
            currentDate.setFullYear(currentDate.getFullYear() - 1);
            renderYearView();
        };
        
        document.getElementById('nextYear').onclick = function(e) {
            e.preventDefault();
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            renderYearView();
        };
        
        document.getElementById('todayBtn').onclick = function(e) {
            e.preventDefault();
            currentDate = new Date();
            viewMode = 'month';
            loadShifts();
        };
        
        var monthCards = document.querySelectorAll('.year-month-card');
        for (var i = 0; i < monthCards.length; i++) {
            (function(card) {
                card.onclick = function(e) {
                    e.preventDefault();
                    var monthIdx = parseInt(card.getAttribute('data-month'));
                    currentDate.setMonth(monthIdx);
                    viewMode = 'month';
                    loadShifts();
                };
            })(monthCards[i]);
        }
    }
    
    function renderCalendar() {
        if (viewMode === 'year') {
            renderYearView();
            return;
        }
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        
        let html = '<div class="calendar-nav">' +
            '<button class="btn btn-outline-secondary btn-sm" id="prevMonth">' +
                '<i class="bi bi-chevron-left"></i>' +
            '</button>' +
            '<h5 class="month-title" id="monthTitle">' + monthNames[month] + ' ' + year + '</h5>' +
            '<div class="nav-buttons">' +
                '<button class="btn btn-outline-secondary btn-sm" id="todayBtn">Today</button>' +
                '<button class="btn btn-outline-secondary btn-sm" id="nextMonth">' +
                    '<i class="bi bi-chevron-right"></i>' +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div class="shift-calendar-grid">';
        
        for (var d = 0; d < dayNames.length; d++) {
            html += '<div class="calendar-header">' + dayNames[d] + '</div>';
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let current = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
            const isOtherMonth = current.getMonth() !== month;
            const isToday = current.getTime() === today.getTime();
            const isPending = pendingOperations.has(dateStr);
            const noteData = dayNotes[dateStr];
            
            const dayShifts = shifts.filter(function(s) { return s.date === dateStr; }).sort(function(a, b) { return a.position - b.position; });
            
            let shiftsHtml = '';
            if (dayShifts.length > 0) {
                shiftsHtml = '<div class="day-shifts-container">';
                for (var si = 0; si < dayShifts.length; si++) {
                    var shift = dayShifts[si];
                    var pendingShiftClass = shift.pending ? 'pending' : '';
                    shiftsHtml += '<div class="day-shift ' + pendingShiftClass + '" style="background-color:' + shift.color + '" data-shift-id="' + shift.id + '">' +
                        '<span class="shift-name">' + shift.title + '</span>' +
                    '</div>';
                }
                shiftsHtml += '</div>';
            }
            
            let noteOverlay = '';
            if (noteData && noteData.content) {
                var escapedContent = noteData.content
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;')
                    .replace(/\n/g, '<br>');
                var notePos = noteData.position || 'top';
                noteOverlay = '<div class="day-note-overlay note-pos-' + notePos + '">' + escapedContent + '</div>';
            }
            
            var paintClass = activeTemplate && !isPending ? 'paint-mode' : '';
            var removeClassVal = removeMode ? 'remove-mode' : '';
            var pendingClass = isPending ? 'day-pending' : '';
            var hasNoteClass = noteData ? 'has-note' : '';
            
            html += '<div class="calendar-day ' + (isOtherMonth ? 'other-month' : '') + ' ' + (isToday ? 'today' : '') + ' ' + paintClass + ' ' + removeClassVal + ' ' + pendingClass + ' ' + hasNoteClass + '" data-date="' + dateStr + '">' +
                '<div class="day-number">' + current.getDate() + '</div>' +
                shiftsHtml +
                noteOverlay +
            '</div>';
            
            current.setDate(current.getDate() + 1);
        }
        
        html += '</div>';
        calendarEl.innerHTML = html;
        
        document.getElementById('prevMonth').onclick = function(e) {
            e.preventDefault();
            currentDate.setMonth(currentDate.getMonth() - 1);
            loadShifts();
        };
        
        document.getElementById('nextMonth').onclick = function(e) {
            e.preventDefault();
            currentDate.setMonth(currentDate.getMonth() + 1);
            loadShifts();
        };
        
        document.getElementById('todayBtn').onclick = function(e) {
            e.preventDefault();
            currentDate = new Date();
            loadShifts();
        };
        
        document.getElementById('monthTitle').onclick = function(e) {
            e.preventDefault();
            viewMode = 'year';
            loadYearShifts();
        };
        
        var days = document.querySelectorAll('.calendar-day');
        for (var di = 0; di < days.length; di++) {
            (function(day) {
                day.onclick = handleDayClick;
            })(days[di]);
        }
        
        var shiftEls = document.querySelectorAll('.day-shift');
        for (var shi = 0; shi < shiftEls.length; shi++) {
            (function(shift) {
                shift.onclick = handleShiftClick;
            })(shiftEls[shi]);
        }
    }
    
    function handleDayClick(e) {
        var dayEl = e.currentTarget;
        var dateStr = dayEl.getAttribute('data-date');
        var calendarId = getActiveCalendarId();
        
        if (!calendarId) return;
        if (pendingOperations.has(dateStr)) return;
        
        if (removeMode) {
            return;
        }
        
        if (activeTemplate) {
            if (e.target.closest('.day-shift')) {
                return;
            }
            var dayShifts = shifts.filter(function(s) { return s.date === dateStr; });
            if (dayShifts.length >= 2) {
                showToast('Maximum 2 shifts per day', 'warning');
                return;
            }
            
            var tempId = 'temp-' + Date.now();
            var tempShift = {
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
        } else {
            showNoteModal(dateStr, calendarId);
        }
    }
    
    function showNoteModal(dateStr, calendarId) {
        var existingNote = dayNotes[dateStr];
        var noteContent = existingNote ? existingNote.content : '';
        var noteId = existingNote ? existingNote.id : null;
        var notePosition = existingNote ? (existingNote.position || 'top') : 'top';
        
        var existingModal = document.getElementById('noteModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        var modalHtml = '<div class="modal fade" id="noteModal" tabindex="-1">' +
            '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title">Note for ' + dateStr + '</h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                        '<textarea class="form-control mb-3" id="noteContent" rows="4" placeholder="Add a note for this day...">' + noteContent + '</textarea>' +
                        '<div class="d-flex align-items-center">' +
                            '<label class="me-2 text-muted small">Position:</label>' +
                            '<div class="btn-group btn-group-sm" role="group">' +
                                '<input type="radio" class="btn-check" name="notePosition" id="posTop" value="top"' + (notePosition === 'top' ? ' checked' : '') + '>' +
                                '<label class="btn btn-outline-secondary" for="posTop">Top</label>' +
                                '<input type="radio" class="btn-check" name="notePosition" id="posCenter" value="center"' + (notePosition === 'center' ? ' checked' : '') + '>' +
                                '<label class="btn btn-outline-secondary" for="posCenter">Center</label>' +
                                '<input type="radio" class="btn-check" name="notePosition" id="posBottom" value="bottom"' + (notePosition === 'bottom' ? ' checked' : '') + '>' +
                                '<label class="btn btn-outline-secondary" for="posBottom">Bottom</label>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        (noteId ? '<button type="button" class="btn btn-danger me-auto" id="deleteNote">Delete</button>' : '') +
                        '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>' +
                        '<button type="button" class="btn btn-primary" id="saveNote">Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        var modalEl = document.getElementById('noteModal');
        var modal = new bootstrap.Modal(modalEl);
        modal.show();
        
        document.getElementById('saveNote').onclick = function() {
            var content = document.getElementById('noteContent').value.trim();
            var position = document.querySelector('input[name="notePosition"]:checked').value;
            if (content) {
                saveNote(calendarId, dateStr, content, noteId, position);
            } else if (noteId) {
                deleteNote(noteId, dateStr);
            }
            modal.hide();
        };
        
        var deleteBtn = document.getElementById('deleteNote');
        if (deleteBtn) {
            deleteBtn.onclick = function() {
                if (noteId) {
                    deleteNote(noteId, dateStr);
                }
                modal.hide();
            };
        }
        
        modalEl.addEventListener('hidden.bs.modal', function() {
            modalEl.remove();
        });
    }
    
    function saveNote(calendarId, dateStr, content, noteId, position) {
        var url = noteId ? window.API_BASE + 'api/day-notes/' + noteId : window.API_BASE + 'api/day-notes';
        var method = noteId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calendar_id: calendarId,
                date: dateStr,
                content: content,
                position: position
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            dayNotes[dateStr] = { id: data.id || noteId, date: dateStr, content: content, position: position };
            renderCalendar();
            showToast('Note saved', 'success');
        })
        .catch(function(err) {
            console.error('Failed to save note:', err);
            showToast('Failed to save note', 'error');
        });
    }
    
    function deleteNote(noteId, dateStr) {
        fetch(window.API_BASE + 'api/day-notes/' + noteId, { method: 'DELETE' })
            .then(function(res) { return res.json(); })
            .then(function() {
                delete dayNotes[dateStr];
                renderCalendar();
                showToast('Note deleted', 'success');
            })
            .catch(function(err) {
                console.error('Failed to delete note:', err);
                showToast('Failed to delete note', 'error');
            });
    }
    
    function handleShiftClick(e) {
        e.stopPropagation();
        
        var shiftEl = e.currentTarget;
        var shiftId = shiftEl.getAttribute('data-shift-id');
        var dayEl = shiftEl.closest('.calendar-day');
        var dateStr = dayEl ? dayEl.getAttribute('data-date') : null;
        var calendarId = getActiveCalendarId();
        
        if (shiftId.indexOf('temp-') === 0) return;
        
        if (removeMode) {
            var shift = shifts.find(function(s) { return s.id == shiftId; });
            if (shift && pendingOperations.has(shift.date)) return;
            
            shiftEl.classList.add('removing');
            deleteShift(shiftId);
        } else if (activeTemplate && dateStr && calendarId) {
            // Place second shift when clicking on existing shift with template active
            if (pendingOperations.has(dateStr)) return;
            var dayShifts = shifts.filter(function(s) { return s.date === dateStr; });
            if (dayShifts.length >= 2) {
                showToast('Maximum 2 shifts per day', 'warning');
                return;
            }
            var tempId = 'temp-' + Date.now();
            var tempShift = {
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
        } else if (!activeTemplate && dateStr && calendarId) {
            showNoteModal(dateStr, calendarId);
        }
    }
    
    function loadYearShifts() {
        var calendarId = getActiveCalendarId();
        if (!calendarId) {
            shifts = [];
            dayNotes = {};
            renderCalendar();
            return;
        }
        
        var year = currentDate.getFullYear();
        var start = year + '-01-01';
        var end = year + '-12-31';
        
        fetch(window.API_BASE + 'api/shifts?calendar_id=' + calendarId + '&start=' + start + '&end=' + end)
            .then(function(res) { return res.json(); })
            .then(function(shiftsData) {
                shifts = shiftsData;
                pendingOperations.clear();
                renderCalendar();
            })
            .catch(function(err) { console.error('Failed to load shifts:', err); });
    }
    
    function loadShifts() {
        var calendarId = getActiveCalendarId();
        if (!calendarId) {
            shifts = [];
            dayNotes = {};
            renderCalendar();
            return;
        }
        
        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();
        var start = formatLocalDate(new Date(year, month - 1, 1));
        var end = formatLocalDate(new Date(year, month + 2, 0));
        
        Promise.all([
            fetch(window.API_BASE + 'api/shifts?calendar_id=' + calendarId + '&start=' + start + '&end=' + end).then(function(res) { return res.json(); }),
            fetch(window.API_BASE + 'api/day-notes?calendar_id=' + calendarId + '&start=' + start + '&end=' + end).then(function(res) { return res.json(); })
        ])
        .then(function(results) {
            shifts = results[0];
            dayNotes = {};
            results[1].forEach(function(n) {
                dayNotes[n.date] = n;
            });
            pendingOperations.clear();
            renderCalendar();
        })
        .catch(function(err) { console.error('Failed to load data:', err); });
    }
    
    function createShiftFromTemplate(templateId, calendarId, dateStr, tempId) {
        fetch(window.API_BASE + 'api/shifts/from-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                template_id: templateId,
                calendar_id: calendarId,
                date: dateStr
            })
        })
        .then(function(res) {
            if (res.status === 409) {
                shifts = shifts.filter(function(s) { return s.id !== tempId; });
                pendingOperations.delete(dateStr);
                renderCalendar();
                showToast('Maximum 2 shifts per day', 'warning');
                return null;
            }
            return res.json();
        })
        .then(function(data) {
            if (data && data.id) {
                var idx = shifts.findIndex(function(s) { return s.id === tempId; });
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
        .catch(function(err) {
            console.error('Failed to create shift:', err);
            shifts = shifts.filter(function(s) { return s.id !== tempId; });
            pendingOperations.delete(dateStr);
            renderCalendar();
            showToast('Failed to create shift', 'error');
        });
    }
    
    function deleteShift(shiftId) {
        var shift = shifts.find(function(s) { return s.id == shiftId; });
        if (!shift) return;
        
        var dateStr = shift.date;
        pendingOperations.add(dateStr);
        
        var originalShifts = shifts.slice();
        shifts = shifts.filter(function(s) { return s.id != shiftId; });
        renderCalendar();
        
        fetch(window.API_BASE + 'api/shifts/' + shiftId, { method: 'DELETE' })
            .then(function(res) {
                if (!res.ok) throw new Error('Failed to delete');
                return res.json();
            })
            .then(function() {
                pendingOperations.delete(dateStr);
                renderCalendar();
            })
            .catch(function(err) {
                console.error('Failed to delete shift:', err);
                shifts = originalShifts;
                pendingOperations.delete(dateStr);
                renderCalendar();
                showToast('Failed to delete shift', 'error');
            });
    }
    
    function showToast(message, type) {
        type = type || 'info';
        var existing = document.querySelector('.toast-message');
        if (existing) existing.remove();
        
        var toast = document.createElement('div');
        toast.className = 'toast-message toast-' + type;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2000);
    }
    
    var templateToggle = document.getElementById('templateBarToggle');
    var templateBar = document.getElementById('templateBar');
    var chevron = templateToggle ? templateToggle.querySelector('.template-chevron') : null;
    
    if (templateToggle) {
        templateBar.classList.add('show');
        if (chevron) chevron.classList.add('expanded');
        
        templateToggle.onclick = function() {
            var isExpanded = templateBar.classList.contains('show');
            if (isExpanded) {
                templateBar.classList.remove('show');
                if (chevron) chevron.classList.remove('expanded');
            } else {
                templateBar.classList.add('show');
                if (chevron) chevron.classList.add('expanded');
            }
        };
    }
    
    var activeIndicator = document.getElementById('activeIndicator');
    var activeTemplateName = document.getElementById('activeTemplateName');
    var clearActiveBtn = document.getElementById('clearActive');
    
    function setActiveTemplate(template) {
        activeTemplate = template;
        removeMode = false;
        
        var cards = document.querySelectorAll('.template-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('active');
        }
        
        if (template) {
            var card = document.querySelector('[data-template-id="' + template.id + '"]');
            if (card) card.classList.add('active');
            activeTemplateName.textContent = template.name;
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
        
        var cards = document.querySelectorAll('.template-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('active');
        }
        
        if (enabled) {
            var removeCard = document.querySelector('.remove-template');
            if (removeCard) removeCard.classList.add('active');
            activeTemplateName.textContent = 'Tap shift to remove';
            activeIndicator.style.display = 'flex';
            activeIndicator.classList.add('remove-mode');
        } else {
            activeIndicator.style.display = 'none';
        }
        renderCalendar();
    }
    
    var templateCards = document.querySelectorAll('.template-card');
    for (var tc = 0; tc < templateCards.length; tc++) {
        (function(card) {
            card.onclick = function() {
                if (card.getAttribute('data-action') === 'remove') {
                    setRemoveMode(!removeMode);
                } else {
                    var templateId = card.getAttribute('data-template-id');
                    var template = {
                        id: templateId,
                        name: card.getAttribute('data-template-name'),
                        start_time: card.getAttribute('data-template-start'),
                        end_time: card.getAttribute('data-template-end'),
                        color: card.getAttribute('data-template-color')
                    };
                    
                    if (activeTemplate && activeTemplate.id === templateId) {
                        setActiveTemplate(null);
                    } else {
                        setActiveTemplate(template);
                    }
                }
            };
        })(templateCards[tc]);
    }
    
    if (clearActiveBtn) {
        clearActiveBtn.onclick = function() {
            setActiveTemplate(null);
            setRemoveMode(false);
        };
    }
    
    var calendarSelects = document.querySelectorAll('.calendar-select');
    for (var cs = 0; cs < calendarSelects.length; cs++) {
        calendarSelects[cs].onchange = loadShifts;
    }
    
    loadShifts();
});

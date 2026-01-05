document.addEventListener('DOMContentLoaded', function() {
    const modal = new bootstrap.Modal(document.getElementById('calendarModal'));
    
    document.getElementById('addCalendar').addEventListener('click', function() {
        document.getElementById('calendarModalTitle').textContent = 'Add Calendar';
        document.getElementById('calendarForm').reset();
        document.getElementById('calendarId').value = '';
        document.getElementById('calendarColor').value = '#3788d8';
        modal.show();
    });
    
    document.querySelectorAll('.edit-calendar').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('calendarModalTitle').textContent = 'Edit Calendar';
            document.getElementById('calendarId').value = this.dataset.calendarId;
            document.getElementById('calendarName').value = this.dataset.calendarName;
            document.getElementById('calendarDesc').value = this.dataset.calendarDesc;
            document.getElementById('calendarColor').value = this.dataset.calendarColor;
            modal.show();
        });
    });
    
    document.querySelectorAll('.delete-calendar').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this calendar? All shifts in this calendar will be deleted.')) {
                fetch(`./api/calendars/${this.dataset.calendarId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(() => location.reload())
                .catch(err => console.error('Failed to delete calendar:', err));
            }
        });
    });
    
    document.getElementById('saveCalendar').addEventListener('click', function() {
        const id = document.getElementById('calendarId').value;
        const data = {
            name: document.getElementById('calendarName').value,
            description: document.getElementById('calendarDesc').value,
            color: document.getElementById('calendarColor').value
        };
        
        const url = id ? `./api/calendars/${id}` : './api/calendars';
        const method = id ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => location.reload())
        .catch(err => console.error('Failed to save calendar:', err));
    });
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const inputGroup = this.closest('.input-group');
            const input = inputGroup.querySelector('input');
            const text = input.value;
            navigator.clipboard.writeText(text).then(() => {
                const icon = this.querySelector('i');
                icon.className = 'bi bi-check';
                setTimeout(() => {
                    icon.className = 'bi bi-clipboard';
                }, 2000);
            });
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = new bootstrap.Modal(document.getElementById('templateModal'));
    
    document.querySelectorAll('.edit-template').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('templateModalTitle').textContent = 'Edit Template';
            document.getElementById('templateId').value = this.dataset.templateId;
            document.getElementById('templateName').value = this.dataset.templateName;
            document.getElementById('templateStart').value = this.dataset.templateStart;
            document.getElementById('templateEnd').value = this.dataset.templateEnd;
            document.getElementById('templateColor').value = this.dataset.templateColor;
            document.getElementById('templateDesc').value = this.dataset.templateDesc;
            modal.show();
        });
    });
    
    document.querySelectorAll('.delete-template').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this template?')) {
                fetch(`${window.API_BASE}api/templates/${this.dataset.templateId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(() => location.reload())
                .catch(err => console.error('Failed to delete template:', err));
            }
        });
    });
    
    document.getElementById('templateModal').addEventListener('show.bs.modal', function(e) {
        if (!e.relatedTarget || !e.relatedTarget.classList.contains('edit-template')) {
            document.getElementById('templateModalTitle').textContent = 'Create Template';
            document.getElementById('templateForm').reset();
            document.getElementById('templateId').value = '';
            document.getElementById('templateColor').value = '#3788d8';
        }
    });
    
    document.getElementById('saveTemplate').addEventListener('click', function() {
        const id = document.getElementById('templateId').value;
        const data = {
            name: document.getElementById('templateName').value,
            start_time: document.getElementById('templateStart').value,
            end_time: document.getElementById('templateEnd').value,
            color: document.getElementById('templateColor').value,
            description: document.getElementById('templateDesc').value
        };
        
        const url = id ? `${window.API_BASE}api/templates/${id}` : `${window.API_BASE}api/templates`;
        const method = id ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(() => location.reload())
        .catch(err => console.error('Failed to save template:', err));
    });
});

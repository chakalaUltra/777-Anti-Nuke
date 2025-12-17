document.addEventListener('DOMContentLoaded', function() {
    initChannelSelectors();
    initForms();
    initToggleOptions();
    initQuestions();
    initColorPicker();
});

function initChannelSelectors() {
    const selectors = document.querySelectorAll('.channel-selector');
    
    selectors.forEach(selector => {
        const btn = selector.querySelector('.channel-select-btn');
        const dropdown = selector.querySelector('.channel-dropdown');
        const options = selector.querySelectorAll('.channel-option');
        const selectedSpan = selector.querySelector('.selected-channel');
        const hiddenInput = selector.querySelector('input[type="hidden"]');
        const logType = selector.dataset.logType;
        const fieldName = selector.dataset.field;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.channel-selector.open').forEach(s => {
                if (s !== selector) s.classList.remove('open');
            });
            selector.classList.toggle('open');
        });
        
        options.forEach(option => {
            option.addEventListener('click', async () => {
                const value = option.dataset.value;
                const text = option.textContent.trim();
                
                selectedSpan.textContent = value ? text : 'Click to choose channel';
                selector.classList.remove('open');
                
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                
                if (logType && typeof guildId !== 'undefined') {
                    try {
                        const response = await fetch(`/api/guild/${guildId}/logs`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ logType, channelId: value })
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            showToast('Channel updated successfully!', 'success');
                        } else {
                            showToast('Failed to update channel', 'error');
                        }
                    } catch (error) {
                        showToast('An error occurred', 'error');
                    }
                }
            });
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.channel-selector.open').forEach(s => {
            s.classList.remove('open');
        });
    });
}

function initForms() {
    const generalForm = document.getElementById('general-settings-form');
    if (generalForm) {
        generalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(generalForm);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch(`/api/guild/${guildId}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.success) {
                    showToast('Settings saved successfully!', 'success');
                } else {
                    showToast('Failed to save settings', 'error');
                }
            } catch (error) {
                showToast('An error occurred', 'error');
            }
        });
    }
    
    const ticketForm = document.getElementById('ticket-config-form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(ticketForm);
            const data = {};
            
            data.panelTitle = formData.get('panelTitle');
            data.panelDescription = formData.get('panelDescription');
            data.panelColor = formData.get('panelColor');
            data.panelChannelId = formData.get('panelChannelId');
            data.ticketCategoryId = formData.get('ticketCategoryId');
            data.closedCategoryId = formData.get('closedCategoryId');
            data.logChannelId = formData.get('logChannelId');
            data.welcomeMessage = formData.get('welcomeMessage');
            
            data.supportRoles = formData.getAll('supportRoles');
            
            data.pingSupportOnCreate = ticketForm.querySelector('input[name="pingSupportOnCreate"]').checked;
            data.dmTranscript = ticketForm.querySelector('input[name="dmTranscript"]').checked;
            data.askQuestions = ticketForm.querySelector('input[name="askQuestions"]').checked;
            
            const questionInputs = ticketForm.querySelectorAll('input[name="questions[]"]');
            data.questions = Array.from(questionInputs)
                .map(input => input.value.trim())
                .filter(q => q.length > 0);
            
            try {
                const response = await fetch(`/api/guild/${guildId}/tickets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.success) {
                    showToast('Ticket configuration saved!', 'success');
                } else {
                    showToast(result.error || 'Failed to save configuration', 'error');
                }
            } catch (error) {
                showToast('An error occurred', 'error');
            }
        });
    }
    
    const sendPanelBtn = document.getElementById('sendPanelBtn');
    if (sendPanelBtn) {
        sendPanelBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/guild/${guildId}/tickets/send-panel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                if (result.success) {
                    showToast('Ticket panel sent successfully!', 'success');
                } else {
                    showToast(result.error || 'Failed to send panel', 'error');
                }
            } catch (error) {
                showToast('An error occurred', 'error');
            }
        });
    }
}

function initToggleOptions() {
    const askQuestionsToggle = document.querySelector('input[name="askQuestions"]');
    const questionsSection = document.getElementById('questionsSection');
    
    if (askQuestionsToggle && questionsSection) {
        askQuestionsToggle.addEventListener('change', () => {
            questionsSection.style.display = askQuestionsToggle.checked ? 'block' : 'none';
        });
    }
}

function initQuestions() {
    const addBtn = document.getElementById('addQuestionBtn');
    const container = document.getElementById('questionsContainer');
    
    if (addBtn && container) {
        addBtn.addEventListener('click', () => {
            const count = container.querySelectorAll('.question-input').length;
            if (count >= 5) {
                showToast('Maximum 5 questions allowed', 'error');
                return;
            }
            
            const div = document.createElement('div');
            div.className = 'question-input';
            div.innerHTML = `
                <input type="text" name="questions[]" placeholder="Question ${count + 1}">
                <button type="button" class="remove-question-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            container.appendChild(div);
            
            div.querySelector('.remove-question-btn').addEventListener('click', () => {
                div.remove();
            });
        });
        
        container.querySelectorAll('.remove-question-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.question-input').remove();
            });
        });
    }
}

function initColorPicker() {
    const colorPicker = document.getElementById('panelColorPicker');
    const colorInput = document.getElementById('panelColor');
    
    if (colorPicker && colorInput) {
        colorPicker.addEventListener('input', () => {
            colorInput.value = colorPicker.value;
        });
        
        colorInput.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(colorInput.value)) {
                colorPicker.value = colorInput.value;
            }
        });
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const newToast = document.createElement('div');
        newToast.id = 'toast';
        newToast.className = 'toast';
        document.body.appendChild(newToast);
    }
    
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

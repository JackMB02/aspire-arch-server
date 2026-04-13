/**
 * Draft Manager - Frontend JavaScript Utility
 * Integrates draft saving functionality into web forms
 * 
 * Usage: 
 * const draftManager = new DraftManager({
 *   apiUrl: 'http://localhost:4000/api',
 *   formType: 'membership',
 *   formElement: document.getElementById('myForm')
 * });
 */

class DraftManager {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || '/api';
    this.formType = options.formType || 'contact';
    this.formElement = options.formElement;
    this.sessionId = this.getSessionId();
    this.currentDraftId = null;
    this.autosaveInterval = options.autosaveInterval || 0; // 0 = disabled
    this.autosaveIntervalId = null;
    this.enableNotifications = options.enableNotifications !== false;
    
    this.init();
  }

  init() {
    if (!this.formElement) {
      console.warn('DraftManager: No form element provided');
      return;
    }

    this.setupEventListeners();
    this.checkForExistingDrafts();
    
    if (this.autosaveInterval > 0) {
      this.startAutosave();
    }
  }

  /**
   * Setup form event listeners
   */
  setupEventListeners() {
    // Listen for form input changes
    this.formElement.addEventListener('change', () => {
      this.markAsModified();
    });

    this.formElement.addEventListener('input', () => {
      this.markAsModified();
    });
  }

  /**
   * Get or create a unique session ID for this browser
   */
  getSessionId() {
    const key = 'draft_session_id';
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  /**
   * Get email from form, or generate one from session ID
   */
  getEmailForDraft() {
    const emailInput = this.formElement?.querySelector('[type="email"]');
    if (emailInput?.value) {
      return emailInput.value;
    }
    // Use session ID as pseudo-email for draft identification
    return `draft+${this.sessionId}@local`;
  }

  /**
   * Mark form as modified
   */
  markAsModified() {
    localStorage.setItem(
      `form_modified_${this.formType}`,
      new Date().toISOString()
    );
  }

  /**
   * Collect all form data
   */
  collectFormData() {
    const formData = {};
    const inputs = this.formElement.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        formData[input.name || input.id] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[input.name] = input.value;
        }
      } else if (input.name || input.id) {
        formData[input.name || input.id] = input.value;
      }
    });

    return formData;
  }

  /**
   * Populate form with data
   */
  populateFormData(data) {
    const inputs = this.formElement.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const fieldName = input.name || input.id;
      if (fieldName in data) {
        if (input.type === 'checkbox') {
          input.checked = data[fieldName];
        } else if (input.type === 'radio') {
          if (input.value === data[fieldName]) {
            input.checked = true;
          }
        } else {
          input.value = data[fieldName];
        }
      }
    });
  }

  /**
   * Save draft to server
   */
  async saveDraft(draftName = null) {
    try {
      const formData = this.collectFormData();
      const email = this.getEmailForDraft();
      
      const payload = {
        email: email,
        form_type: this.formType,
        form_data: formData,
        draft_name: draftName || `${this.formType} Draft - ${new Date().toLocaleDateString()}`,
        draft_id: this.currentDraftId || null
      };

      const endpoint = `${this.apiUrl}/${this.formType}/save-draft`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        this.currentDraftId = data.draft_id;
        localStorage.setItem(
          `draft_id_${this.formType}`,
          this.currentDraftId
        );
        
        this.showNotification(
          '✅ ' + (this.currentDraftId ? 'Draft saved!' : 'Draft created!'),
          'success'
        );
        
        return data;
      } else {
        throw new Error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Draft save error:', error);
      this.showNotification(
        '❌ Failed to save draft: ' + error.message,
        'error'
      );
      return null;
    }
  }

  /**
   * Load draft from server
   */
  async loadDraft(draftId) {
    try {
      const response = await fetch(
        `${this.apiUrl}/drafts/${draftId}`
      );

      const data = await response.json();

      if (data.success) {
        this.currentDraftId = draftId;
        this.populateFormData(data.draft.form_data);
        this.showNotification(
          '✅ Draft loaded successfully!',
          'success'
        );
        return data.draft;
      } else {
        throw new Error(data.error || 'Failed to load draft');
      }
    } catch (error) {
      console.error('Draft load error:', error);
      this.showNotification(
        '❌ Failed to load draft: ' + error.message,
        'error'
      );
      return null;
    }
  }

  /**
   * Get user's saved drafts
   */
  async getUserDrafts() {
    try {
      const email = this.getEmailForDraft();
      const response = await fetch(
        `${this.apiUrl}/drafts/user/${encodeURIComponent(email)}/${encodeURIComponent(this.formType)}`
      );

      const data = await response.json();

      if (data.success) {
        return data.drafts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user drafts:', error);
      return [];
    }
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId) {
    try {
      const email = this.getEmailForDraft();
      const response = await fetch(
        `${this.apiUrl}/drafts/${draftId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email })
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showNotification('✅ Draft deleted', 'success');
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Draft delete error:', error);
      this.showNotification(
        '❌ Failed to delete draft: ' + error.message,
        'error'
      );
      return false;
    }
  }

  /**
   * Check for existing drafts on page load
   */
  async checkForExistingDrafts() {
    const storedDraftId = localStorage.getItem(`draft_id_${this.formType}`);
    
    if (storedDraftId) {
      this.currentDraftId = storedDraftId;
      
      // Show option to restore draft
      const shouldRestore = confirm(
        '📝 You have a saved draft for this form. Would you like to restore it?'
      );
      
      if (shouldRestore) {
        await this.loadDraft(storedDraftId);
      } else {
        localStorage.removeItem(`draft_id_${this.formType}`);
        this.currentDraftId = null;
      }
    }
  }

  /**
   * Start autosave interval
   */
  startAutosave() {
    this.autosaveIntervalId = setInterval(async () => {
      const lastModified = localStorage.getItem(
        `form_modified_${this.formType}`
      );
      
      if (lastModified) {
        await this.saveDraft();
      }
    }, this.autosaveInterval * 1000);
  }

  /**
   * Stop autosave interval
   */
  stopAutosave() {
    if (this.autosaveIntervalId) {
      clearInterval(this.autosaveIntervalId);
      this.autosaveIntervalId = null;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (!this.enableNotifications) return;

    // Try to find existing notification container
    let container = document.getElementById('draft-notifications');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'draft-notifications';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: sans-serif;
      `;
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const bgColor = {
      success: '#27ae60',
      error: '#e74c3c',
      info: '#3498db'
    }[type] || '#3498db';

    notification.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    container.appendChild(notification);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    if (!document.querySelector('style[data-draft-animation]')) {
      style.setAttribute('data-draft-animation', 'true');
      document.head.appendChild(style);
    }

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Create and show draft list UI
   */
  createDraftListUI() {
    const container = document.createElement('div');
    container.id = 'draft-list-ui';
    container.style.cssText = `
      background: rgba(0,0,0,0.5);
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #3498db;
    `;

    const title = document.createElement('h4');
    title.textContent = '📋 Your Saved Drafts';
    title.style.cssText = 'margin: 0 0 10px 0; color: #ecf0f1;';
    container.appendChild(title);

    const listDiv = document.createElement('div');
    listDiv.id = 'draft-list';
    listDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    container.appendChild(listDiv);

    return container;
  }

  /**
   * Refresh draft list display
   */
  async refreshDraftList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const drafts = await this.getUserDrafts();
    const listDiv = container.querySelector('#draft-list');
    
    if (!listDiv) return;

    listDiv.innerHTML = '';

    if (drafts.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'No saved drafts yet';
      emptyMsg.style.cssText = 'color: #95a5a6; margin: 0;';
      listDiv.appendChild(emptyMsg);
      return;
    }

    drafts.forEach(draft => {
      const draftItem = document.createElement('div');
      draftItem.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.05);
        padding: 10px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.1);
      `;

      const info = document.createElement('div');
      info.innerHTML = `
        <div style="color: #ecf0f1; font-weight: 500;">${draft.draft_name || 'Untitled Draft'}</div>
        <div style="color: #95a5a6; font-size: 0.85em;">
          Saved: ${new Date(draft.updated_at).toLocaleDateString()}
        </div>
      `;

      const actions = document.createElement('div');
      actions.style.cssText = 'display: flex; gap: 8px;';

      const loadBtn = document.createElement('button');
      loadBtn.textContent = '📂 Load';
      loadBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
      `;
      loadBtn.onclick = () => this.loadDraft(draft.id);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️ Delete';
      deleteBtn.style.cssText = `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85em;
      `;
      deleteBtn.onclick = async () => {
        if (confirm('Delete this draft?')) {
          await this.deleteDraft(draft.id);
          this.refreshDraftList(containerId);
        }
      };

      actions.appendChild(loadBtn);
      actions.appendChild(deleteBtn);

      draftItem.appendChild(info);
      draftItem.appendChild(actions);
      listDiv.appendChild(draftItem);
    });
  }

  /**
   * Clear stored draft info
   */
  clearStoredDraft() {
    localStorage.removeItem(`draft_id_${this.formType}`);
    localStorage.removeItem(`draft_user_email_${this.formType}`);
    localStorage.removeItem(`form_modified_${this.formType}`);
    this.currentDraftId = null;
  }

  /**
   * Destroy instance and cleanup
   */
  destroy() {
    this.stopAutosave();
    this.clearStoredDraft();
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DraftManager;
}

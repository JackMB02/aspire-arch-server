# 📝 Draft Saving System - Frontend Integration Guide

Complete guide to integrate the draft saving system into your web forms.

## 📦 Files Included

1. **draft-manager.js** - Main JavaScript library that handles all draft operations
2. **draft-examples.html** - Live examples showing different form implementations
3. Backend API endpoints (already implemented at `/api/drafts/` and form-specific endpoints)

## 🚀 Quick Start

### 1. Include the Library

Add this to your HTML `<head>` or before closing `</body>`:

```html
<script src="/path/to/draft-manager.js"></script>
```

### 2. Initialize on Your Form

```html
<form id="myForm">
    <input type="text" name="name" placeholder="Name" />
    <input type="email" name="email" placeholder="Email" />
    <textarea name="message" placeholder="Message"></textarea>
    <button type="submit">Submit</button>
    <button type="button" onclick="myDraftManager.saveDraft()">Save as Draft</button>
</form>

<script src="/draft-manager.js"></script>
<script>
    // Initialize DraftManager for your form
    const myDraftManager = new DraftManager({
        apiUrl: '/api',                          // Your API base URL
        formType: 'contact',                     // Unique form identifier
        formElement: document.getElementById('myForm'),
        enableNotifications: true                // Show notifications
    });

    // Handle form submission
    document.getElementById('myForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = myDraftManager.collectFormData();
        
        // Submit to your API
        const response = await fetch('/api/contact/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Clear draft after successful submission
            myDraftManager.clearStoredDraft();
            alert('Form submitted successfully!');
        }
    });
</script>
```

## 🎯 Configuration Options

```javascript
const draftManager = new DraftManager({
    // Required
    formType: 'membership',                      // Form type identifier
    formElement: document.getElementById('form'), // The form element
    apiUrl: '/api',                             // API base URL (default: '/api')
    
    // Optional
    email: 'user@example.com',                  // Pre-set email (auto-detected from form if not set)
    enableNotifications: true,                  // Show toast notifications (default: true)
    autosaveInterval: 60                        // Auto-save interval in seconds (default: 0 = disabled)
});
```

## 📚 Available Methods

### Save Draft

```javascript
// Manual save
await myDraftManager.saveDraft();

// Save with custom name
await myDraftManager.saveDraft('My Draft - Project Proposal');
```

### Load/Get Drafts

```javascript
// Get all user's drafts for this form type
const drafts = await myDraftManager.getUserDrafts();

// Load a specific draft
await myDraftManager.loadDraft(draftId);

// Load draft by ID from saved data
const draft = await myDraftManager.loadDraft(123);
```

### Delete Draft

```javascript
await myDraftManager.deleteDraft(draftId);
```

### Manage Form Data

```javascript
// Collect form data
const data = myDraftManager.collectFormData();
// Returns: { name: '', email: '', message: '' }

// Populate form with data
myDraftManager.populateFormData({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'My message'
});
```

### Auto-Save

```javascript
// Enable auto-save every 60 seconds
myDraftManager.autosaveInterval = 60;
myDraftManager.startAutosave();

// Stop auto-save
myDraftManager.stopAutosave();
```

### Cleanup

```javascript
// Clear stored draft information
myDraftManager.clearStoredDraft();

// Destroy instance and cleanup
myDraftManager.destroy();
```

## 💡 Real-World Examples

### Example 1: Simple Contact Form

```html
<form id="contactForm">
    <input type="text" name="name" required />
    <input type="email" name="email" required />
    <textarea name="message" required></textarea>
    
    <button type="button" onclick="contactMgr.saveDraft()">💾 Save Draft</button>
    <button type="submit">✉️ Submit</button>
</form>

<script>
    const contactMgr = new DraftManager({
        formType: 'contact',
        formElement: document.getElementById('contactForm')
    });

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = contactMgr.collectFormData();
        
        // Submit form
        const res = await fetch('/api/contact/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            contactMgr.clearStoredDraft();
        }
    });
</script>
```

### Example 2: Multi-Step Form with Auto-Save

```javascript
const membershipMgr = new DraftManager({
    formType: 'membership',
    formElement: document.getElementById('membershipForm'),
    autosaveInterval: 30      // Auto-save every 30 seconds
});

// Show draft recovery on page load (handled automatically)
// User will be prompted to restore draft if one exists
```

### Example 3: Draft List with Load/Delete

```html
<button onclick="showDrafts()">📋 View My Saved Drafts</button>

<div id="draftList"></div>

<script>
    async function showDrafts() {
        const drafts = await myDraftManager.getUserDrafts();
        const container = document.getElementById('draftList');
        
        if (drafts.length === 0) {
            container.innerHTML = '<p>No drafts found</p>';
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
        drafts.forEach(draft => {
            html += `
                <div style="padding: 10px; background: #f0f0f0; border-radius: 4px;">
                    <strong>${draft.draft_name}</strong>
                    <div style="font-size: 0.9em; color: #666;">
                        Saved: ${new Date(draft.updated_at).toLocaleDateString()}
                    </div>
                    <div style="display: flex; gap: 5px; margin-top: 8px;">
                        <button onclick="myDraftManager.loadDraft('${draft.id}')">Load</button>
                        <button onclick="myDraftManager.deleteDraft('${draft.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
</script>
```

## 🔌 Form Types & Endpoints

The system supports these form types:

| Form Type | Endpoint | Save Endpoint |
|-----------|----------|---------------|
| contact | `/api/contact` | `POST /api/contact/save-draft` |
| membership | `/api/get-involved` | `POST /api/get-involved/membership/save-draft` |
| donation | `/api/get-involved` | `POST /api/get-involved/donate/save-draft` |
| feedback | `/api/get-involved` | `POST /api/get-involved/feedback/save-draft` |
| idea | `/api/get-involved` | `POST /api/get-involved/ideas/save-draft` |
| partnership | `/api/get-involved` | `POST /api/get-involved/partnership/save-draft` |

## 📍 Required Form Fields

Every form must have an **email field** for draft identification:

```html
<!-- Required: Email field -->
<input type="email" name="email" required />

<!-- Recommended: Name field -->
<input type="text" name="name" />

<!-- Other fields as needed -->
```

The email field is used to:
- Identify the user
- Retrieve their saved drafts
- Locate drafts server-side

## 🔍 How It Works

### Local Storage

DraftManager uses browser localStorage to store:
- Current draft ID: `draft_id_{formType}`
- User email: `draft_user_email_{formType}`
- Form modification flag: `form_modified_{formType}`

### Server-Side

Drafts are stored in the `form_drafts` database table with:
- User's email (required)
- Form type (contact, membership, etc.)
- Complete form data (JSONB)
- Draft name (optional)
- Status (draft, submitted, abandoned)
- Timestamps

### Draft Recovery

On page load, DraftManager automatically:
1. Checks for saved draft in localStorage
2. Prompts user: "You have a saved draft. Restore it?"
3. If yes, loads draft and populates form fields
4. If no, clears localStorage

## ⚙️ Advanced Configuration

### Custom API URL

```javascript
const draftMgr = new DraftManager({
    formType: 'contact',
    formElement: document.getElementById('form'),
    apiUrl: 'https://api.example.com:3000/api'  // Custom API endpoint
});
```

### Disable Notifications

```javascript
const draftMgr = new DraftManager({
    formType: 'contact',
    formElement: document.getElementById('form'),
    enableNotifications: false  // Silent mode
});
```

### Auto-Save Configuration

```javascript
const draftMgr = new DraftManager({
    formType: 'membership',
    formElement: document.getElementById('form'),
    autosaveInterval: 45  // Auto-save every 45 seconds
});

// Manual control
draftMgr.startAutosave();   // Start auto-saving
draftMgr.stopAutosave();    // Stop auto-saving
```

## 🛡️ Error Handling

```javascript
try {
    const result = await myDraftManager.saveDraft();
    if (!result) {
        console.warn('Draft save failed');
    }
} catch (error) {
    console.error('Draft operation failed:', error);
}
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Drafts not saving | Check email field has value |
| CORS errors | Configure CORS on backend |
| localStorage disabled | Use code without auto-recovery |
| Form fields not populating | Ensure field names match in code |
| Drafts lost on tab close | Enable autosaveInterval |

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome mobile)

**Requirements:**
- localStorage support
- Fetch API support
- ES6+ JavaScript

## 🧪 Testing

### Test Draft Save

```javascript
// 1. Fill form
document.getElementById('email').value = 'test@example.com';
document.getElementById('name').value = 'Test User';

// 2. Save draft
await draftManager.saveDraft('Test Draft');

// 3. Check localStorage
console.log(localStorage.getItem('draft_id_contact'));

// 4. Check server (DevTools Network tab)
// Should see POST request to /api/contact/save-draft
```

### Test Draft Load

```javascript
// 1. Clear current form
document.getElementById('form').reset();

// 2. Load specific draft
await draftManager.loadDraft(123);

// 3. Verify form is populated
console.log(draftManager.collectFormData());
```

## 📊 Monitoring & Analytics

Track draft usage:

```javascript
// Log draft saves
draftManager.addEventListener('save', (event) => {
    analytics.track('draft_saved', {
        formType: event.formType,
        draftId: event.draftId
    });
});

// Log draft loads
draftManager.addEventListener('load', (event) => {
    analytics.track('draft_loaded', {
        formType: event.formType,
        draftId: event.draftId
    });
});
```

## 🎓 Best Practices

1. **Always include email field** - Required for draft identification
2. **Enable auto-save for long forms** - Prevents data loss
3. **Clear drafts after submission** - Avoid confusion with old data
4. **Test draft recovery** - Ensure cross-browser compatibility
5. **Provide visual feedback** - Show notifications for user actions
6. **Handle errors gracefully** - Display helpful error messages
7. **Respect user privacy** - Don't store sensitive data in localStorage
8. **Cleanup on destroy** - Call `draftManager.destroy()` when done

## 🚨 Security Considerations

- Drafts are stored in localStorage (client-side) - not encrypted
- Don't store highly sensitive data (credit cards, SSN, etc.)
- Email is used for identification - validate on backend
- Database stores form data as JSONB - ensure proper access control
- CORS configured appropriately for your domain

## 📞 Support & Troubleshooting

### Check Browser Console

```javascript
// Enable verbose logging
window.DRAFT_DEBUG = true;

// Check what's in localStorage
console.table(JSON.parse(JSON.stringify(localStorage)));

// Check network requests in DevTools
// Network tab > filter by "save-draft"
```

### Common Log Messages

```
✅ Draft saved!           // Success
❌ Draft load failed      // Error
📝 Draft recovered       // Recovery from localStorage
⚠️  Form modified        // Change detected
```

## 🔄 API Reference

### Save Draft Endpoint

```
POST /api/{formType}/save-draft
Content-Type: application/json

{
    "email": "user@example.com",
    "name": "John Doe",
    "message": "My message",
    ...rest of form fields
}

Response:
{
    "success": true,
    "message": "Draft saved!",
    "draft_id": 123
}
```

### Get Drafts Endpoint

```
GET /api/drafts/user/{email}/{formType}

Response:
{
    "success": true,
    "drafts": [
        {
            "id": 123,
            "email": "user@example.com",
            "form_type": "contact",
            "draft_name": "My Draft",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:35:00Z"
        }
    ]
}
```

## 📄 License

This draft saving system is provided as part of the ASPIRE Design Lab platform.

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Production Ready

For issues or questions, contact the development team.

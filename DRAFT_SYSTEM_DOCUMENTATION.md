# Form Draft Saving Implementation

## Overview
A comprehensive draft-saving system has been added to the ASPIRE Design Lab application. Users can now save incomplete forms as drafts and return to complete them later.

## What Was Added

### 1. Database Changes
- **New Table**: `form_drafts` in PostgreSQL
  - Auto-incremented ID
  - Email identification for users
  - Form type classification (contact, membership, donation, feedback, idea, partnership)
  - JSONB field for storing complete form data
  - Status tracking (draft, submitted, abandoned)
  - Timestamps for creation and last update
  - Email + form_type index for fast retrieval

### 2. New Route File: `/routes/drafts.js`
Core draft management endpoints:

#### Save/Update Draft
```
POST /api/drafts/save
Body: {
  "email": "user@example.com",
  "form_type": "membership",
  "form_data": { /* entire form data object */ },
  "draft_name": "My Membership Draft",
  "draft_id": null  // for updates, provide existing ID
}
Response: Draft ID and metadata
```

#### Get User's Drafts by Form Type
```
GET /api/drafts/user/:email/:form_type
Response: List of all drafts for that form type
```

#### Get Specific Draft
```
GET /api/drafts/:draft_id
Response: Complete draft with all form data
```

#### Get All User Drafts (Grouped by Form Type)
```
GET /api/drafts/user/:email
Response: All user drafts organized by form type
```

#### Update Draft
```
POST /api/drafts/save (with draft_id in body)
Response: Updated draft confirmation
```

#### Delete Draft
```
DELETE /api/drafts/:draft_id
Body: { "email": "user@example.com" }
Response: Deletion confirmation
```

#### Submit Draft as Complete Form
```
POST /api/drafts/:draft_id/submit
Body: { "email": "user@example.com" }
Response: Marked as submitted
```

#### Cleanup Old Abandoned Drafts
```
POST /api/drafts/cleanup/abandoned
(scheduled task - marks drafts older than 30 days as abandoned)
Response: Count of archived drafts
```

### 3. Updated Form Routes

#### Contact Form (`/routes/contact.js`)
- Added: `POST /api/contact/save-draft`
- Saves contact information as draft
- Requires only email to save

#### Get Involved Forms (`/routes/get-involved.js`)
Draft endpoints added for all forms:
- `POST /api/get-involved/membership/save-draft` - Membership applications
- `POST /api/get-involved/donate/save-draft` - Donations
- `POST /api/get-involved/feedback/save-draft` - User feedback
- `POST /api/get-involved/ideas/save-draft` - Idea submissions
- `POST /api/get-involved/partnership/save-draft` - Partnership inquiries

### 4. Main Application Update (`index.js`)
- Imported drafts routes module
- Registered: `app.use("/api/drafts", draftsRoutes)`
- No caching applied to drafts (user-specific data)

## How It Works

### User Workflow
1. **Start Form**: User begins filling out a form (e.g., membership application)
2. **Save Draft**: User clicks "Save as Draft" button
   - Frontend sends partial/complete form data via `POST /api/{form}/save-draft`
   - Draft is saved with unique ID to database
3. **Return Later**: User can:
   - List all their drafts: `GET /api/drafts/user/:email/:form_type`
   - Load specific draft: `GET /api/drafts/:draft_id`
   - Continue editing and save again with same ID
4. **Complete & Submit**: 
   - User fills remaining fields
   - Saves draft one final time, or
   - Submits complete form to original endpoint (e.g., `POST /api/get-involved/membership`)

## Form Types Supported for Drafts

| Form Type | Endpoint Base | Save Draft Route |
|-----------|---------------|------------------|
| Contact | `/api/contact` | `POST /api/contact/save-draft` |
| Membership | `/api/get-involved` | `POST /api/get-involved/membership/save-draft` |
| Donation | `/api/get-involved` | `POST /api/get-involved/donate/save-draft` |
| Feedback | `/api/get-involved` | `POST /api/get-involved/feedback/save-draft` |
| Idea | `/api/get-involved` | `POST /api/get-involved/ideas/save-draft` |
| Partnership | `/api/get-involved` | `POST /api/get-involved/partnership/save-draft` |

## Example Frontend Implementation

### Save Draft
```javascript
async function saveDraft(formType, formData) {
  const response = await fetch(`/api/${formType}/save-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('Draft saved:', data.draft_id);
    // Store draft_id locally for future updates
    localStorage.setItem(`draft_${formType}_id`, data.draft_id);
  }
}

// Call when Save Draft button is clicked
saveDraft('contact', {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'My message...'
});
```

### Load Draft
```javascript
async function loadDraft(draftId) {
  const response = await fetch(`/api/drafts/${draftId}`);
  const data = await response.json();
  
  if (data.success) {
    // Populate form fields with draft data
    populateFormFields(data.draft.form_data);
  }
}
```

### Get User's Drafts
```javascript
async function getUserDrafts(email, formType) {
  const response = await fetch(
    `/api/drafts/user/${email}/${formType}`
  );
  const data = await response.json();
  
  if (data.success) {
    // Display list of available drafts
    displayDraftsList(data.drafts);
  }
}
```

## Database Schema

```sql
CREATE TABLE form_drafts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  form_type VARCHAR(100) NOT NULL,
  form_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  draft_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_form_drafts_email_type ON form_drafts(email, form_type);
```

## Features

✅ **Draft Persistence**: Unlimited drafts per user per form type
✅ **Flexible Storage**: JSONB field stores any form data structure
✅ **Named Drafts**: Optionally name drafts for organization
✅ **Status Tracking**: Draft, submitted, and abandoned states
✅ **Quick Retrieval**: Indexed by email + form_type for fast queries
✅ **Auto-cleanup**: Old drafts (30+ days) can be marked as abandoned
✅ **Clear Separation**: Form-specific save-draft endpoints
✅ **User-specific**: Each user's drafts are email-identified

## Important Notes

- ✅ **No changes to existing form submission endpoints** - All original functionality preserved
- ✅ **Email-based identification** - Drafts are tied to user's email address
- ✅ **Flexible error handling** - Partial data can be saved; complete validation still happens at submission
- ✅ **Production-ready** - Includes proper error handling and logging
- ✅ **Performance optimized** - Database index on frequently queried columns

## Next Steps for Frontend Integration

1. Add "Save as Draft" buttons to all forms
2. Call appropriate `save-draft` endpoint with form data
3. Store returned `draft_id` for later updates
4. Add "Load Draft" or "My Drafts" view to retrieve saved drafts
5. On form load, check if draft exists and offer to load it
6. Allow updating draft or submitting as final submission

## Testing Endpoints

### Save a contact draft
```bash
curl -X POST http://localhost:4000/api/contact/save-draft \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Draft message"
  }'
```

### Get user's contact drafts
```bash
curl http://localhost:4000/api/drafts/user/john@example.com/contact
```

### Load specific draft
```bash
curl http://localhost:4000/api/drafts/1
```

### Delete draft
```bash
curl -X DELETE http://localhost:4000/api/drafts/1 \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

## Cleanup Task (Optional Scheduled)

To periodically mark old drafts as abandoned:
```javascript
// Can be automated with node-cron or similar
setInterval(async () => {
  const response = await fetch(
    'http://localhost:4000/api/drafts/cleanup/abandoned',
    { method: 'POST' }
  );
  console.log(await response.json());
}, 24 * 60 * 60 * 1000); // Daily
```

---

**Version**: 1.0  
**Date**: April 2026  
**Status**: Ready for Frontend Integration

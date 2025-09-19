# Visitor Tracking & Notification System

This system automatically tracks website visitors and sends notifications to their email/ID when they visit your website.

## Features

- ✅ **Automatic Visitor Tracking**: Captures visitor information when they visit your website
- ✅ **Email Notifications**: Sends welcome emails to visitors with their email address
- ✅ **WhatsApp Notifications**: Sends WhatsApp messages if phone number is available
- ✅ **User Identification**: Links visitors to existing user accounts via email or user ID
- ✅ **Admin Dashboard**: View visitor statistics and manage notifications
- ✅ **Event Tracking**: Optional click and scroll event tracking
- ✅ **Notification Management**: Users can view and manage their notifications

## Database Setup

1. Run the migration script to create the necessary tables:

```sql
-- Execute the contents of config/migrations.sql in your PostgreSQL database
psql -U your_username -d your_database -f config/migrations.sql
```

This will create:
- `visitors` table: Stores visitor information
- `notifications` table: Stores notification records
- Indexes for better performance

## Environment Variables

Add these variables to your `.env` file:

```env
# Email configuration (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourwebsite.com

# WhatsApp configuration (optional)
TWILIO_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user" // optional: "admin" or "user" (default: "user")
}

POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Track Visitor
```
POST /api/visitors/track
Content-Type: application/json

{
  "email": "user@example.com",
  "userId": 123,
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1",
  "pageUrl": "https://yoursite.com/products",
  "referrer": "https://google.com"
}
```

### Admin Endpoints (Admin Only)
```
GET /api/admin/dashboard
Authorization: Bearer <admin-token>

GET /api/admin/users?page=1&limit=10&search=john&role=user
Authorization: Bearer <admin-token>

PATCH /api/admin/users/:userId/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "admin"
}

DELETE /api/admin/users/:userId
Authorization: Bearer <admin-token>

POST /api/admin/create-admin
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}

GET /api/admin/statistics?days=30
Authorization: Bearer <admin-token>
```

### User Notifications
```
GET /api/visitors/notifications/:userId
Authorization: Bearer <user-token>

PATCH /api/visitors/notifications/:notificationId/read
Authorization: Bearer <user-token>
```

## Frontend Integration

### Method 1: Include the Tracking Script

Add this to your HTML pages:

```html
<script src="/public/visitor-tracker.js"></script>
<script>
    // Optional: Set user information
    VisitorTracker.setUserInfo({
        email: 'user@example.com',
        userId: 123
    });
</script>
```

### Method 2: Manual Tracking

```javascript
// Track a visitor manually
fetch('/api/visitors/track', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'user@example.com',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
    })
});
```

## Configuration Options

The visitor tracker script supports these configuration options:

```javascript
VisitorTracker.config = {
    apiUrl: 'http://localhost:3000/api/visitors',
    trackOnLoad: true,      // Track visitors on page load
    trackOnClick: false,    // Track click events
    trackOnScroll: false    // Track scroll events
};
```

## Usage Examples

### For Authenticated Users

```javascript
// When user logs in, set their information
VisitorTracker.setUserInfo({
    email: user.email,
    userId: user.id
});

// The system will automatically track their visits
```

### For Anonymous Visitors

```javascript
// Track anonymous visitors (email only)
fetch('/api/visitors/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'visitor@example.com',
        pageUrl: window.location.href
    })
});
```

### Admin Dashboard

```javascript
// Get visitor statistics
fetch('/api/visitors/stats', {
    headers: {
        'Authorization': 'Bearer ' + adminToken
    }
})
.then(response => response.json())
.then(data => {
    console.log('Visitor stats:', data);
});
```

## Creating Admin Users

### Method 1: Using the Script (Recommended)
```bash
node scripts/create-admin.js
```

### Method 2: Register with Role
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com", 
    "password": "password123",
    "role": "admin"
  }'
```

### Method 3: Create Admin via API (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "password123"
  }'
```

## Testing

1. Create an admin user:
```bash
node scripts/create-admin.js
```

2. Start your server:
```bash
npm start
```

3. Open the demo page:
```
http://localhost:3000/index.html
```

4. Enter an email address and click "Set User Info & Track Visit"
5. Check your email for the welcome notification!

6. Test admin functionality:
   - Login with admin credentials
   - Access admin dashboard: `GET /api/admin/dashboard`
   - View all users: `GET /api/admin/users`
   - View visitor statistics: `GET /api/admin/statistics`

## Customization

### Custom Notification Templates

Edit `utils/email.js` to customize the email template:

```javascript
const mailOptions = {
    // ... your custom HTML template
    html: `
        <div style="your-custom-styles">
            <h1>Welcome to Your Website!</h1>
            <p>${message}</p>
            <!-- Add your custom content -->
        </div>
    `
};
```

### Custom Notification Types

Add new notification types in `controllers/visitorController.js`:

```javascript
const notificationTypes = {
    'welcome_visit': 'Welcome to our website!',
    'special_offer': 'Special offer just for you!',
    'product_recommendation': 'Recommended products for you'
};
```

## Security Considerations

- Rate limiting is applied to prevent spam
- Input validation using Joi schemas
- SQL injection protection with parameterized queries
- CORS configuration for cross-origin requests
- Admin-only access to sensitive endpoints

## Troubleshooting

### Email Notifications Not Working
- Check your email configuration in `.env`
- Verify SMTP credentials
- Check server logs for email errors

### WhatsApp Notifications Not Working
- Verify Twilio credentials
- Ensure phone numbers include country code
- Check Twilio account balance

### Database Issues
- Ensure PostgreSQL is running
- Check database connection in `config/db.js`
- Verify table creation with migration script

## Support

For issues or questions, check the server logs and ensure all dependencies are properly installed:

```bash
npm install
```

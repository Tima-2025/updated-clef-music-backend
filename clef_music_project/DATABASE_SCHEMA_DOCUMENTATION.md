# 📊 Complete Database Schema Documentation

This document describes all the database tables, relationships, and features in your e-commerce project.

## 🗂️ **Table Overview**

### **Core Tables**
1. **users** - User accounts and authentication
2. **categories** - Product categories
3. **products** - Product catalog
4. **addresses** - User shipping/billing addresses
5. **cart_items** - Shopping cart items
6. **orders** - Customer orders
7. **order_items** - Individual items within orders

### **Visitor Tracking & Notifications**
8. **visitors** - Website visitor tracking
9. **notifications** - Email/WhatsApp notifications
10. **product_inquiries** - Product inquiry system

---

## 📋 **Detailed Table Schemas**

### **1. USERS Table**
```sql
users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ User authentication and authorization
- ✅ Role-based access (admin/user)
- ✅ Email verification support
- ✅ Phone number for WhatsApp notifications
- ✅ Soft delete with is_active flag

---

### **2. CATEGORIES Table**
```sql
categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Hierarchical category management
- ✅ Sort ordering for display
- ✅ Category images support
- ✅ Enable/disable categories

---

### **3. PRODUCTS Table**
```sql
products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    sku VARCHAR(100) UNIQUE,
    weight DECIMAL(8,2),
    dimensions VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Complete product information
- ✅ Inventory management with stock tracking
- ✅ SKU for product identification
- ✅ Physical attributes (weight, dimensions)
- ✅ Featured products support
- ✅ Price validation (non-negative)

---

### **4. ADDRESSES Table**
```sql
addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    address_type VARCHAR(20) DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Multiple addresses per user
- ✅ Default address support
- ✅ Shipping and billing address types
- ✅ International address support

---

### **5. CART_ITEMS Table**
```sql
cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
)
```

**Features:**
- ✅ One cart per user
- ✅ Unique constraint prevents duplicate items
- ✅ Quantity validation
- ✅ Automatic cleanup when user/product deleted

---

### **6. ORDERS Table**
```sql
orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    shipping_address_id INTEGER REFERENCES addresses(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Complete order lifecycle management
- ✅ Automatic order number generation
- ✅ Payment status tracking
- ✅ Shipping tracking support
- ✅ Order notes and methods

---

### **7. ORDER_ITEMS Table**
```sql
order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Historical price tracking
- ✅ Order item details preservation
- ✅ Quantity validation

---

### **8. VISITORS Table**
```sql
visitors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    page_url TEXT,
    referrer TEXT,
    session_id VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Comprehensive visitor tracking
- ✅ Anonymous and registered visitor support
- ✅ Geographic information
- ✅ Device and browser detection
- ✅ Session tracking

---

### **9. NOTIFICATIONS Table**
```sql
notifications (
    id SERIAL PRIMARY KEY,
    visitor_id INTEGER REFERENCES visitors(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'promotion', 'update', 'alert', 'welcome_visit', 'order_update')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'failed')),
    channel VARCHAR(20) DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'sms', 'push')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP
)
```

**Features:**
- ✅ Multi-channel notifications (email, WhatsApp, SMS, push)
- ✅ Notification status tracking
- ✅ Read/unread status
- ✅ Multiple notification types

---

### **10. PRODUCT_INQUIRIES Table**
```sql
product_inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    message TEXT,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Features:**
- ✅ Product inquiry management
- ✅ Status tracking for customer service
- ✅ Phone number for follow-up

---

## 🔗 **Relationships & Foreign Keys**

```
users (1) ──── (N) addresses
users (1) ──── (N) cart_items
users (1) ──── (N) orders
users (1) ──── (N) visitors
users (1) ──── (N) notifications
users (1) ──── (N) product_inquiries

categories (1) ──── (N) products

products (1) ──── (N) cart_items
products (1) ──── (N) order_items
products (1) ──── (N) product_inquiries

addresses (1) ──── (N) orders

orders (1) ──── (N) order_items

visitors (1) ──── (N) notifications
```

---

## 🚀 **Advanced Features**

### **Indexes for Performance**
- Email lookups (users, visitors, notifications)
- Product searches (name, category, price, stock)
- Order queries (user, status, date)
- Visitor analytics (date, location, device)

### **Triggers & Functions**
- **Auto-update timestamps**: `updated_at` fields automatically updated
- **Order number generation**: Automatic unique order numbers
- **Data validation**: CHECK constraints ensure data integrity

### **Views for Common Queries**
- `products_with_categories` - Products with category details
- `order_details` - Orders with user and address information
- `cart_items_with_products` - Cart items with product details

---

## 📊 **Sample Data**

The schema includes sample data for testing:
- 5 product categories
- 5 sample products
- Ready for immediate testing

---

## 🛠️ **How to Use**

### **1. Setup Complete Database**
```bash
node scripts/setup-complete-database.js
```

### **2. Setup Only Visitor Tracking Tables**
```bash
node scripts/run-migrations.js
```

### **3. Create Admin User**
```bash
node scripts/create-admin.js
```

---

## 🔧 **Maintenance**

### **Backup Database**
```bash
pg_dump -U your_username -d your_database > backup.sql
```

### **Restore Database**
```bash
psql -U your_username -d your_database < backup.sql
```

### **Monitor Performance**
- Check query execution plans
- Monitor index usage
- Analyze slow queries

---

## 📈 **Scaling Considerations**

### **For High Traffic**
- Add database connection pooling
- Implement read replicas
- Use Redis for session management
- Add CDN for product images

### **For Large Datasets**
- Partition large tables by date
- Implement data archiving
- Use database sharding
- Optimize query patterns

---

## 🎯 **Next Steps**

1. **Run the complete schema setup**
2. **Test all functionality**
3. **Add your real data**
4. **Configure email notifications**
5. **Deploy to production**

Your e-commerce database is now ready for production use! 🚀

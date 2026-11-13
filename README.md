# Atlantic Leather Backend API

Express.js backend API with MySQL database for Atlantic Leather e-commerce platform.

## Features

- ✅ Authentication with JWT
- ✅ Products CRUD operations
- ✅ Orders management with status workflow
- ✅ Customers management
- ✅ Categories CRUD
- ✅ Stock management
- ✅ MySQL database integration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=atlantis_leather
DB_PORT=3306

JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Set Up MySQL Database

1. Make sure MySQL is running
2. Create the database:
```sql
CREATE DATABASE atlantis_leather;
```

3. Run migrations to create tables:
```bash
npm run migrate
```

This will:
- Create all necessary tables
- Create default admin user (email: admin@atlanticleather.com, password: Admin@2024)

### 4. Start the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products (with filters: ?filter=published&category=1&search=leather)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/publish` - Toggle published status
- `PATCH /api/products/:id/feature` - Toggle featured status

### Orders
- `GET /api/orders` - Get all orders (with filters: ?filter=pending|confirmed|paid)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order (from cart)
- `PATCH /api/orders/:id/confirm` - Confirm order (reserves stock)
- `PATCH /api/orders/:id/paid` - Mark order as paid
- `PATCH /api/orders/:id/status` - Update order status

### Customers
- `GET /api/customers` - Get all customers (with filters: ?filter=ordered|paid)
- `GET /api/customers/:id` - Get single customer

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Stock
- `GET /api/stock/overview` - Get stock statistics
- `GET /api/stock/products` - Get products with stock info (?filter=low|out)
- `PATCH /api/stock/products/:id` - Update product stock

## Database Schema

### Tables
- `admins` - Admin users
- `categories` - Product categories
- `products` - Products
- `customers` - Customer information
- `orders` - Orders
- `order_items` - Order line items

## Authentication

All routes except `/api/auth/login` and `/api/health` require authentication via JWT token. The token is sent via:
1. HTTP-only cookie (`authToken`)
2. Authorization header (`Bearer TOKEN`)

## Default Admin Credentials

- Email: `admin@atlanticleather.com`
- Password: `Admin@2024`

**⚠️ Change these credentials after first login!**

## Development

The server runs with nodemon in development mode for automatic restarts on file changes.

## Production

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origin
4. Use HTTPS
5. Set up proper MySQL user with limited permissions


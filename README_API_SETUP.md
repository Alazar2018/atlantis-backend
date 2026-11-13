# Public API Setup Guide

This guide explains how to set up and use the public API for the Atlantic Leather e-commerce platform.

## Overview

The public API uses API key authentication to access public endpoints for products, categories, and order placement. This allows the frontend website to fetch data from the backend database instead of using localStorage.

## Setting Up API Keys

### Step 1: Create an API Key

1. Log in to the admin panel
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Enter a name for the API key (e.g., "Frontend Website")
5. Click **Create API Key**
6. **IMPORTANT**: Copy both the Public Key and Private Key immediately. The private key will only be shown once.

### Step 2: Configure Frontend Environment

Add the public API key to your frontend `.env.local` file:

```env
NEXT_PUBLIC_API_KEY=your_public_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API Endpoints

All public endpoints require the `X-API-Key` header with your public key.

### Base URL
```
/api/public
```

### Endpoints

#### 1. Get All Categories
```
GET /api/public/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Leather Bags",
    "description": "High-quality leather bags",
    "image_url": "https://..."
  }
]
```

#### 2. Get All Products
```
GET /api/public/products?category=1&search=bag&featured=true
```

**Query Parameters:**
- `category` (optional): Filter by category ID
- `search` (optional): Search term
- `featured` (optional): Set to `true` to get only featured products

**Response:**
```json
[
  {
    "id": "1",
    "name": "Premium Leather Bag",
    "description": "...",
    "price": 4500.00,
    "salePrice": null,
    "isOnSale": false,
    "stock": 50,
    "introImage": "https://...",
    "images": ["https://..."],
    "isFeatured": true,
    "category": {
      "id": 1,
      "name": "Leather Bags"
    }
  }
]
```

#### 3. Get Single Product
```
GET /api/public/products/:id
```

#### 4. Get Featured Products
```
GET /api/public/products/featured
```

#### 5. Create Order
```
POST /api/public/orders
```

**Request Body:**
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+251912345678",
    "address": "123 Main St, Addis Ababa"
  },
  "items": [
    {
      "product_id": "1",
      "quantity": 2,
      "size": "42",
      "color": "brown"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 123,
    "total": 9000.00,
    "status": "pending"
  }
}
```

## Frontend Integration

The frontend automatically uses the API key from `NEXT_PUBLIC_API_KEY` environment variable when making requests to `/api/public/*` endpoints.

### Example Usage

```typescript
// Fetch products
const products = await fetch('/api/public/products', {
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
  }
});

// Create order
const order = await fetch('/api/public/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
  },
  body: JSON.stringify(orderData)
});
```

## Security Notes

1. **Public Keys**: Can be exposed in frontend code - they're meant to be public
2. **Private Keys**: Keep secret - used for server-to-server authentication (future use)
3. **API Key Management**: You can activate/deactivate or delete API keys from the admin panel
4. **Rate Limiting**: Consider implementing rate limiting for production (not yet implemented)

## Troubleshooting

### 401 Unauthorized Error
- Check that `NEXT_PUBLIC_API_KEY` is set correctly
- Verify the API key is active in the admin panel
- Ensure the `X-API-Key` header is being sent

### Products Not Showing
- Verify products are published (`is_published = true`)
- Check that products exist in the database
- Ensure the API key has proper permissions (currently all active keys have full access)

### Orders Not Creating
- Verify customer information is complete
- Check that product IDs exist and are published
- Ensure sufficient stock is available
- Validate that quantities don't exceed stock levels


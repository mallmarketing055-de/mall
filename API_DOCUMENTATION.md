# Customer Authentication API Documentation

## Overview
This API provides authentication endpoints for customer registration and login, supporting both Arabic and English inputs.

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### 1. Customer Registration
**POST** `/customers/signup`

Register a new customer account with optional profile picture upload.

#### Content Type
- **With Profile Picture**: `multipart/form-data`
- **Without Profile Picture**: `application/json`

#### Request Body (JSON - without profile picture)
```json
{
    "name": "أحمد محمد",
    "username": "ahmed123",
    "email": "ahmed@example.com",
    "password": "password123",
    "phone": "+201234567890",
    "Address": "123 شارع النيل، القاهرة، مصر",
    "DOB": "1990-05-15",
    "Gender": "ذكر",
    "communicationType": "كلاهما"
}
```

#### Request Body (Form Data - with profile picture)
```
Content-Type: multipart/form-data

Fields:
- name: أحمد محمد
- username: ahmed123
- email: ahmed@example.com
- password: password123
- phone: +201234567890
- Address: 123 شارع النيل، القاهرة، مصر
- DOB: 1990-05-15
- Gender: ذكر
- communicationType: كلاهما
- profilePicture: [IMAGE FILE] (jpg, jpeg, png, gif, webp - max 5MB)
```

#### Field Descriptions
- **name**: Customer's full name (2-50 characters)
- **username**: Unique username (3-30 characters, alphanumeric and underscore only)
- **email**: Valid email address
- **password**: Password (minimum 6 characters, must contain letters and numbers)
- **phone**: Valid phone number
- **Address**: Customer's address (5-200 characters)
- **DOB**: Date of birth (YYYY-MM-DD format)
- **Gender**: Gender (`male`, `female`, `ذكر`, `أنثى`)
- **communicationType**: Preferred communication method (`email`, `phone`, `both`, `بريد إلكتروني`, `هاتف`, `كلاهما`)
- **profilePicture**: Profile picture file upload (optional, max 5MB, image formats only)

#### Success Response (201)
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "user_id",
            "name": "أحمد محمد",
            "username": "ahmed123",
            "email": "ahmed@example.com",
            "phone": "+201234567890",
            "Address": "123 شارع النيل، القاهرة، مصر",
            "DOB": "1990-05-15T00:00:00.000Z",
            "Gender": "ذكر",
            "communicationType": "كلاهما",
          profilePicture: {
            filename: "profile-1234567890-123456789.jpg",
            url: "/api/uploads/profile-pictures/profile-1234567890-123456789.jpg"
          }
        },
        "token": "jwt_token_here"
    }
}
```

### 2. Customer Login
**POST** `/customers/signin`

Authenticate a customer and receive a JWT token.

#### Request Body
```json
{
    "username": "ahmed123",
    "password": "password123"
}
```

#### Success Response (200)
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": "user_id",
            "name": "أحمد محمد",
            "username": "ahmed123",
            "email": "ahmed@example.com",
            "phone": "+201234567890",
            "Address": "123 شارع النيل، القاهرة، مصر",
            "DOB": "1990-05-15T00:00:00.000Z",
            "Gender": "ذكر",
            "communicationType": "كلاهما"
        },
        "token": "jwt_token_here"
    }
}
```

### 3. Get Customer Profile
**GET** `/customers/profile`

Get the authenticated customer's profile information.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "user": {
            "id": "user_id",
            "name": "أحمد محمد",
            "username": "ahmed123",
            "email": "ahmed@example.com",
            "phone": "+201234567890",
            "Address": "123 شارع النيل، القاهرة، مصر",
            "DOB": "1990-05-15T00:00:00.000Z",
            "Gender": "ذكر",
            "communicationType": "كلاهما",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### 4. Update Customer Profile
**PUT** `/customers/profile`

Update the authenticated customer's profile information. All fields are optional - only provided fields will be updated.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
    "name": "أحمد محمد المحدث",
    "username": "ahmed_updated",
    "email": "ahmed.updated@example.com",
    "phone": "+201234567899",
    "Address": "456 شارع الجديد، الجيزة، مصر",
    "DOB": "1990-06-20",
    "Gender": "ذكر",
    "communicationType": "email"
}
```

#### Field Descriptions
- **name**: Customer's full name (2-50 characters) - optional
- **username**: Unique username (3-30 characters, alphanumeric and underscore only) - optional
- **email**: Valid email address - optional
- **phone**: Valid phone number - optional
- **Address**: Customer's address (5-200 characters) - optional
- **DOB**: Date of birth (YYYY-MM-DD format) - optional
- **Gender**: Gender (`male`, `female`, `ذكر`, `أنثى`) - optional
- **communicationType**: Preferred communication method (`email`, `phone`, `both`, `بريد إلكتروني`, `هاتف`, `كلاهما`) - optional

#### Success Response (200)
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "user": {
            "id": "user_id",
            "name": "أحمد محمد المحدث",
            "username": "ahmed_updated",
            "email": "ahmed.updated@example.com",
            "phone": "+201234567899",
            "Address": "456 شارع الجديد، الجيزة، مصر",
            "DOB": "1990-06-20T00:00:00.000Z",
            "Gender": "ذكر",
            "communicationType": "email",
            "profilePicture": {
                "filename": "profile-1234567890-123456789.jpg",
                "url": "/api/uploads/profile-pictures/profile-1234567890-123456789.jpg"
            },
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-02T00:00:00.000Z"
        }
    }
}
```

### 6. Update Profile Picture
**PUT** `/customers/profile/picture`

Update the authenticated customer's profile picture.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### Request Body
```
Form Data:
- profilePicture: [IMAGE FILE] (jpg, jpeg, png, gif, webp - max 5MB)
```

#### Success Response (200)
```json
{
    "success": true,
    "message": "Profile picture updated successfully",
    "data": {
        "profilePicture": {
            "filename": "profile-1234567890-123456789.jpg",
            "url": "/api/uploads/profile-pictures/profile-1234567890-123456789.jpg",
            "originalName": "my-photo.jpg",
            "size": 245760,
            "uploadDate": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### 7. Access Profile Picture
**GET** `/uploads/profile-pictures/{filename}`

Access uploaded profile pictures directly.

#### Example
```
GET /api/uploads/profile-pictures/profile-1234567890-123456789.jpg
```

### 9. Submit Contact Form
**POST** `/contact/submit`

Submit a contact form message. This is a public endpoint that doesn't require authentication.

#### Request Body
```json
{
    "email": "customer@example.com",
    "idNumber": "123456789",
    "communicationType": "كلاهما",
    "message": "أريد الاستفسار عن خدماتكم. هل يمكنكم مساعدتي في فهم كيفية استخدام النظام؟",
    "phone": "+201234567890",
    "priority": "medium"
}
```

#### Field Descriptions
- **email**: Valid email address (required)
- **idNumber**: ID number (5-20 characters, alphanumeric, required)
- **communicationType**: Preferred communication method (required)
- **message**: Message content (10-1000 characters, required)
- **phone**: Phone number (optional)
- **priority**: Priority level (`low`, `medium`, `high`, `urgent`) - optional, defaults to `medium`

#### Success Response (201)
```json
{
    "success": true,
    "message": "Your message has been submitted successfully. We will get back to you soon.",
    "data": {
        "contactId": "contact_id",
        "submittedAt": "2024-01-01T00:00:00.000Z",
        "status": "pending",
        "priority": "medium"
    }
}
```

### 10. Get Contact Messages (Admin Only)
**GET** `/contact/messages`

Get all contact messages with optional filtering and pagination.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Query Parameters
- `status`: Filter by status (`pending`, `in_progress`, `resolved`, `closed`)
- `priority`: Filter by priority (`low`, `medium`, `high`, `urgent`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Success Response (200)
```json
{
    "success": true,
    "message": "Contact messages retrieved successfully",
    "data": {
        "contacts": [...],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalContacts": 50,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

### 11. Get Single Contact Message (Admin Only)
**GET** `/contact/messages/{id}`

Get a specific contact message by ID.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

### 12. Update Contact Status (Admin Only)
**PUT** `/contact/messages/{id}`

Update contact message status and add admin response.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Request Body
```json
{
    "status": "in_progress",
    "priority": "high",
    "adminResponse": "Thank you for contacting us. We are investigating your issue."
}
```

### 13. Get Contact Statistics (Admin Only)
**GET** `/contact/stats`

Get contact message statistics and analytics.

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

### 15. Add Item to Cart
**POST** `/cart/add`

Add an item to the customer's shopping cart.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
    "productId": "12255",
    "productName": "Automatic Washing Machine",
    "productNameArabic": "غسالة أوتوماتيك",
    "price": 8090,
    "quantity": 1,
    "unit": "نقطة",
    "image": "washing_machine.jpg"
}
```

#### Field Descriptions
- **productId**: Unique product identifier (required)
- **productName**: Product name in English (required)
- **productNameArabic**: Product name in Arabic (required)
- **price**: Product price (required, must be non-negative)
- **quantity**: Quantity to add (optional, defaults to 1)
- **unit**: Unit of measurement (optional, defaults to "نقطة")
- **image**: Product image filename (optional)

#### Success Response (200)
```json
{
    "success": true,
    "message": "Item added to cart successfully",
    "data": {
        "cart": {
            "cartId": "cart_id",
            "totalItems": 2,
            "totalAmount": 12590,
            "items": [...],
            "updatedAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### 16. View Cart
**GET** `/cart/view`

View the customer's current shopping cart.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
    "success": true,
    "message": "Cart retrieved successfully",
    "data": {
        "cart": {
            "cartId": "cart_id",
            "totalItems": 2,
            "totalAmount": 12590,
            "items": [
                {
                    "productId": "12255",
                    "productName": "Automatic Washing Machine",
                    "productNameArabic": "غسالة أوتوماتيك",
                    "price": 8090,
                    "quantity": 1,
                    "unit": "نقطة",
                    "image": "washing_machine.jpg",
                    "subtotal": 8090
                }
            ],
            "deliveryAddress": null,
            "status": "active",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### 17. Update Cart Item
**PUT** `/cart/update`

Update the quantity of an item in the cart.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
    "productId": "12255",
    "quantity": 3
}
```

#### Field Descriptions
- **productId**: Product ID to update (required)
- **quantity**: New quantity (required, 0 to remove item)

#### Success Response (200)
```json
{
    "success": true,
    "message": "Item updated in cart successfully",
    "data": {
        "cart": {
            "cartId": "cart_id",
            "totalItems": 3,
            "totalAmount": 24270,
            "items": [...],
            "updatedAt": "2024-01-01T00:00:00.000Z"
        }
    }
}
```

### 18. Remove Item from Cart
**DELETE** `/cart/remove/{productId}`

Remove a specific item from the cart.

#### Headers
```
Authorization: Bearer <jwt_token>
```

### 19. Clear Cart
**DELETE** `/cart/clear`

Remove all items from the cart.

#### Headers
```
Authorization: Bearer <jwt_token>
```

### 20. Health Check
**GET** `/health`

Check if the server is running.

#### Success Response (200)
```json
{
    "success": true,
    "message": "Server is running",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

### Validation Error (400)
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg": "Email is invalid",
            "param": "email",
            "location": "body"
        }
    ]
}
```

### User Already Exists (409)
```json
{
    "success": false,
    "message": "User with this username or email already exists"
}
```

```json
{
    "success": false,
    "message": "Username already exists"
}
```

```json
{
    "success": false,
    "message": "Email already exists"
}
```

### Invalid Credentials (401)
```json
{
    "success": false,
    "message": "Invalid username or password"
}
```

### Unauthorized (401)
```json
{
    "success": false,
    "message": "Access denied. No token provided."
}
```

### File Upload Errors (400)
```json
{
    "success": false,
    "message": "File too large. Maximum size is 5MB."
}
```

```json
{
    "success": false,
    "message": "Only image files (jpg, jpeg, png, gif, webp) are allowed."
}
```

```json
{
    "success": false,
    "message": "No file uploaded"
}
```

### Internal Server Error (500)
```json
{
    "success": false,
    "message": "Internal server error",
    "error": "Error details"
}
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. After successful login or registration, include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 1 hour.

## File Upload Features
- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Maximum file size**: 5MB
- **Storage**: Local file system in `uploads/profile-pictures/`
- **Automatic filename generation**: Prevents conflicts with unique timestamps
- **Old file cleanup**: Automatically deletes previous profile pictures when updated

## Testing
Use the provided HTTP files in the `HTTPS` folder to test the API endpoints:
- `signup.http` - Test customer registration (with and without profile picture)
- `login.http` - Test customer login
- `customer-profile.http` - Test getting customer profile
- `update-profile.http` - Test updating customer profile information
- `profile-picture.http` - Test profile picture upload and access
- `contact-us.http` - Test contact form submission and admin management
- `cart.http` - Test cart management (add, view, update items)

### Testing File Uploads
1. Create a `test-images` folder in your project root
2. Add sample image files (profile.jpg, new-profile.jpg)
3. Use the multipart/form-data examples in the HTTP files
4. For testing tools like Postman or Insomnia, select "form-data" and upload actual image files

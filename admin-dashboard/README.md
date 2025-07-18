# Admin Dashboard

A React.js admin dashboard for managing the e-commerce platform with authentication and comprehensive management features.

## Features

### 🔐 **Authentication**
- Admin login with JWT authentication
- Secure session management
- Auto-logout on token expiration

### 👥 **Admin Management**
- Create new admin accounts
- View all admins
- Update admin information (username, email, password)
- Delete admin accounts

### 📦 **Product Management**
- View all products with search and pagination
- Add new products (name, Arabic name, description, price, category, stock)
- Update existing products
- Delete products (soft delete)
- Product search and filtering

### 👤 **User Management**
- View all customers with search functionality
- View detailed customer information
- Delete customer accounts
- User statistics and analytics

### 💳 **Transaction Management**
- View all transactions with advanced filtering
- Search transactions by ID, user, or amount
- Filter by status, type, date range, amount range
- View detailed transaction information
- Export transactions to CSV
- Transaction statistics and analytics

### 📊 **Dashboard Overview**
- Real-time statistics cards
- Recent transactions display
- Growth metrics and analytics

## Tech Stack

- **Frontend**: React 18, React Router DOM 6
- **Styling**: CSS3 with custom components
- **Icons**: React Icons
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Authentication**: JWT tokens

## Installation

1. **Navigate to the admin dashboard directory:**
   ```bash
   cd admin-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3001
   ```

## Configuration

The dashboard is configured to connect to the backend API running on `http://localhost:3000`. If your backend is running on a different port, update the `proxy` setting in `package.json` or set the `REACT_APP_API_URL` environment variable.

## API Endpoints Used

### Admin APIs
- `POST /api/Admin/signin` - Admin login
- `POST /api/Admin/signup` - Create admin
- `GET /api/Admin/all` - Get all admins
- `PUT /api/Admin/:id` - Update admin
- `DELETE /api/Admin/:id` - Delete admin

### Product APIs
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### User APIs
- `GET /api/customers/all` - Get all customers
- `GET /api/customers/admin/:id` - Get customer by ID
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/stats/overview` - Get user statistics

### Transaction APIs
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `GET /api/transactions/user/:userId` - Get user transactions
- `GET /api/transactions/export/csv` - Export transactions
- `GET /api/transactions/stats/overview` - Get transaction statistics

## Admin Model

The admin model contains only the essential fields as requested:

```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed)
}
```

## Usage

### First Time Setup

1. **Start the backend server** (make sure it's running on port 3000)
2. **Create the first admin account** using the signup API or through the registration form
3. **Login to the dashboard** using admin credentials

### Navigation

- **Dashboard**: Overview with statistics and recent transactions
- **Admin Management**: Manage admin accounts
- **Products**: Manage product catalog
- **Users**: Manage customer accounts
- **Transactions**: View and manage all transactions

### Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Data refreshes automatically
- **Search & Filter**: Advanced search and filtering capabilities
- **Export Functionality**: Export data to CSV format
- **Secure Authentication**: JWT-based authentication with auto-logout

## Security Features

- JWT token authentication
- Automatic token refresh
- Secure password hashing (bcrypt)
- Admin-only access control
- Session timeout handling

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Project Structure

```
admin-dashboard/
├── public/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── services/           # API services
│   ├── App.js             # Main app component
│   └── index.js           # Entry point
├── package.json
└── README.md
```

## Production Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Serve the built files** using a web server like Nginx or Apache

3. **Configure environment variables** for production API endpoints

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

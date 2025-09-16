# 💰 ExpenseSplitter - Split Expenses with Friends

A modern, full-stack expense splitting application built with Next.js, Prisma, MongoDB, and Tailwind CSS. Perfect for roommates, friends, and groups who want to track and split shared expenses.

## ✨ Features

- **👥 Group Management**: Create groups and add members
- **💰 Expense Tracking**: Add expenses with flexible splitting options
- **⚖️ Smart Splitting**: Equal splits or custom amounts/percentages
- **💸 Settlement Management**: Track debts and mark payments
- **📊 Real-time Stats**: Live updates on balances and totals
- **🔐 User Authentication**: Secure login and registration
- **📱 Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- npm or yarn

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd expensesplitter
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="mongodb://localhost:27017/expensesplitter"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
expensesplitter/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth/              # Authentication APIs
│   │   ├── groups/            # Group management
│   │   ├── expenses/          # Expense tracking
│   │   ├── settlements/       # Settlement management
│   │   └── users/             # User management
│   ├── components/            # React components
│   │   ├── auth/              # Login/Register forms
│   │   ├── groups/            # Group components
│   │   ├── expenses/          # Expense components
│   │   ├── settlements/       # Settlement components
│   │   └── layout/            # Navigation and layout
│   ├── dashboard/             # Main dashboard page
│   ├── login/                 # Login page
│   └── register/              # Registration page
├── prisma/                    # Database schema
├── lib/                       # Utility functions
└── public/                    # Static assets
```

## 📊 Database Schema

### Core Models
- **User**: Authentication and profile data
- **Group**: Expense groups with members
- **GroupMember**: Junction table for user-group relationships
- **Expense**: Individual expenses with splits
- **ExpenseSplit**: How expenses are divided among users
- **Settlement**: Debt tracking between users

### Key Relationships
- Users can belong to multiple groups
- Groups can have multiple members
- Expenses belong to groups and have multiple splits
- Settlements track debts between group members

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Groups
- `GET /api/groups` - Fetch user's groups
- `POST /api/groups` - Create new group

### Expenses
- `GET /api/expenses` - Fetch user's expenses
- `POST /api/expenses` - Create new expense

### Settlements
- `GET /api/settlements` - Fetch user's settlements
- `POST /api/settlements` - Create new settlement
- `PATCH /api/settlements` - Update settlement status

### Users
- `GET /api/users` - Fetch all users for group creation

## 🎨 UI Components

### Forms
- **CreateGroupForm**: Modal for creating groups with member selection
- **CreateExpenseForm**: Modal for adding expenses with split management
- **LoginForm/RegisterForm**: Authentication forms

### Lists
- **GroupsList**: Display groups with member counts and details
- **ExpensesList**: Show expenses with filtering and split details
- **SettlementsList**: Manage settlements with status updates

### Layout
- **Navigation**: Header with user menu and navigation
- **UserProfile**: Sidebar with user information and stats

## 💡 Usage Examples

### Creating a Group
1. Click "Create Group" button
2. Enter group name and description
3. Select members from the user list
4. Submit to create the group

### Adding an Expense
1. Click "Add Expense" button
2. Fill in title, amount, and select group
3. Choose split type (equal or custom)
4. Adjust individual amounts if needed
5. Submit to create the expense

### Managing Settlements
1. View pending settlements in the Settlements section
2. Mark settlements as completed when paid
3. Cancel settlements if needed
4. Filter by group to see group-specific settlements

## 🛠️ Development

### Adding New Features
1. Update Prisma schema if needed
2. Create API endpoints in `app/api/`
3. Build React components in `app/components/`
4. Update dashboard page to include new features

### Database Changes
```bash
# After schema changes
npx prisma generate
npx prisma db push
```

### Styling
The app uses Tailwind CSS. Add custom styles in `app/globals.css`.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- User authorization checks
- Input validation and sanitization

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
- Set `DATABASE_URL` environment variable
- Ensure MongoDB is accessible
- Run `npm run build` and serve the output

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your environment variables
3. Ensure MongoDB is running
4. Check that Prisma client is generated

## 🎯 Roadmap

- [ ] Push notifications for settlements
- [ ] Expense categories and tags
- [ ] Recurring expenses
- [ ] Export to CSV/PDF
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] Expense photos and receipts
- [ ] Group invitations via email

---

**Happy expense splitting! 🎉** 

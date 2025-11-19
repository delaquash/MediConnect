# 🏥 MediConnect - Healthcare Appointment Management System

A full-stack healthcare appointment management platform that connects patients with doctors, enabling seamless appointment booking, profile management, and payment processing.

![MediConnect Banner](./assets/banner.png)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 👥 For Patients (Users)
- 🔐 Secure authentication (register/login with OTP verification)
- 👨‍⚕️ Browse available doctors by specialty
- 📅 Book appointments with available time slots
- 💳 Online payment via Paystack
- 📊 View appointment history
- ❌ Cancel appointments
- 👤 Manage profile information

### 🩺 For Doctors
- 🔐 Secure login with profile completion
- 📋 View and manage appointments
- ✅ Mark appointments as completed
- ❌ Cancel appointments
- 💰 Track earnings and patient statistics
- 👤 Update profile (fees, availability, about, address)
- 📊 Dashboard with analytics

### 👨‍💼 For Admins
- 🔐 Secure admin login
- ➕ Add new doctors to the platform
- 👨‍⚕️ Manage doctor profiles (activate/deactivate)
- 🗑️ Delete doctors and users
- 📊 View all appointments
- ❌ Cancel appointments
- 📈 Dashboard with system-wide analytics

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (File-based routing)
- **State Management**: 
  - React Context API (Auth & Config)
  - TanStack Query (Server state)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Notifications**: React Toastify
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Image Storage**: Cloudinary
- **Payment Gateway**: Paystack
- **Email**: Nodemailer (OTP verification)
- **Validation**: Express Validator

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: MongoDB (Dockerized)
- **Environment**: dotenv

## 📁 Project Structure
```
MediConnect/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── api/             # API functions (axios)
│   │   ├── assets/          # Images, icons, assets
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   ├── context/         # React Context providers
│   │   │   ├── AppContext.tsx
│   │   │   ├── AdminContext.tsx
│   │   │   └── DoctorContext.tsx
│   │   ├── hooks/           # TanStack Query hooks
│   │   │   ├── useAdminQueries.ts
│   │   │   ├── useDoctorQueries.ts
│   │   │   └── useUserQueries.ts
│   │   ├── layouts/         # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── Admin/
│   │   │   ├── Doctor/
│   │   │   └── User/
│   │   ├── routes/          # TanStack Router routes
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── cloudinary.ts
│   │   │   └── email.ts
│   │   ├── controllers/     # Route controllers
│   │   │   ├── adminController.ts
│   │   │   ├── doctorController.ts
│   │   │   ├── userController.ts
│   │   │   └── paymentController.ts
│   │   ├── middleware/      # Express middleware
│   │   │   ├── authAdmin.ts
│   │   │   ├── authDoctor.ts
│   │   │   ├── authUser.ts
│   │   │   └── multer.ts
│   │   ├── models/          # Mongoose models
│   │   │   ├── UserModel.ts
│   │   │   ├── DoctorModel.ts
│   │   │   └── AppointmentModel.ts
│   │   ├── routes/          # API routes
│   │   │   ├── adminRoutes.ts
│   │   │   ├── doctorRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   └── paymentRoutes.ts
│   │   └── server.ts        # Entry point
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)
- Cloudinary account
- Paystack account

### Clone the Repository
```bash
git clone https://github.com/delaquash/mediconnect.git
cd mediconnect
```

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

## 🔐 Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Email (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_BACKEND_URL=https://mediconnect-jp6p.onrender.com
VITE_CURRENCY=₦
```

## 🏃 Running the Application

### Option 1: Local Development

**Backend:**
```bash
cd backend
npm run dev
```
Server runs on: https://mediconnect-jp6p.onrender.com

**Frontend:**
```bash
cd frontend
npm run dev
```
App runs on: `http://localhost:5173`

### Option 2: Docker (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `localhost:27017`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a token in the request header:
```
headers: { token: "your_jwt_token" }
headers: { aToken: "admin_token" }    // For admin
headers: { dToken: "doctor_token" }   // For doctor
```

### User Endpoints
```
POST   /user/register              - Register new user
POST   /user/verify-otp            - Verify email OTP
POST   /user/login                 - User login
GET    /user/get-profile           - Get user profile (Auth)
POST   /user/update-profile        - Update profile (Auth)
POST   /user/book-appointment      - Book appointment (Auth)
GET    /user/appointments          - Get user appointments (Auth)
POST   /user/cancel-appointment    - Cancel appointment (Auth)
POST   /user/payment-paystack      - Initialize payment (Auth)
POST   /user/verify-paystack       - Verify payment (Auth)
```

### Doctor Endpoints
```
POST   /doctor/login               - Doctor login
POST   /doctor/verify-otp          - Verify OTP
GET    /doctor/appointments        - Get appointments (Auth)
POST   /doctor/complete-appointment - Mark completed (Auth)
POST   /doctor/cancel-appointment  - Cancel appointment (Auth)
GET    /doctor/dashboard           - Get dashboard data (Auth)
GET    /doctor/profile             - Get profile (Auth)
POST   /doctor/complete-doc-profile - Complete profile (Auth)
PUT    /doctor/update-profile      - Update profile (Auth)
GET    /doctor/list                - Get all doctors (Public)
```

### Admin Endpoints
```
POST   /admin/login                - Admin login
POST   /admin/add-doctor           - Add new doctor (Auth)
GET    /admin/all-doctors          - Get all doctors (Auth)
GET    /admin/all-users            - Get all users (Auth)
DELETE /admin/delete-doctor        - Delete doctor (Auth)
DELETE /admin/delete-user          - Delete user (Auth)
POST   /admin/change-availability  - Toggle availability (Auth)
GET    /admin/appointments         - Get all appointments (Auth)
POST   /admin/cancel-appointment   - Cancel appointment (Auth)
GET    /admin/dashboard            - Get dashboard stats (Auth)
```

### Payment Endpoints
```
POST   /payment/initialize-paystack - Initialize payment (Auth)
POST   /payment/verify-paystack     - Verify payment (Auth)
POST   /payment/paystack-webhook    - Paystack webhook
```

## 👥 User Roles

### 1. Patient (User)
- **Registration**: Email/Password with OTP verification
- **Access**: Browse doctors, book appointments, make payments
- **Dashboard**: View appointment history, manage profile

### 2. Doctor
- **Registration**: Added by admin
- **Access**: Manage appointments, update profile, view earnings
- **Dashboard**: View patient stats, appointment analytics
- **Profile Setup**: Must complete profile before accessing appointments

### 3. Admin
- **Access**: Full system management
- **Capabilities**: 
  - Add/remove doctors
  - View all appointments
  - Manage user accounts
  - System-wide analytics


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Your Name** - [GitHub](https://github.com/@delaquash)

## 🙏 Acknowledgments

- Paystack for payment processing
- Cloudinary for image storage
- TanStack Query for state management
- Tailwind CSS for styling

## 📞 Support

For support, email: support@mediconnect.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Video consultation feature
- [ ] Push notifications
- [ ] Patient medical records
- [ ] Prescription management
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] AI-powered doctor recommendations
- [ ] Insurance integration

---

**Made with ❤️ for better healthcare access**

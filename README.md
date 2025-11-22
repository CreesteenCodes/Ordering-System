# 🍜 Ordering System
A simple web-based ordering system for an authentic Asian dim sum restaurant. Built with **HTML** and **CSS** for the frontend and **JavaScript** for functionality. The system uses **Firebase Realtime Database**, allowing secure, real-time storage and retrieval of orders and user information.

# ✨ Features
- Browse menu items by category (Steamed, Fried & Baked, Noodles, Desserts)
- Add dishes to your cart for easy checkout
- Customer login and registration system
- Admin/Staff dashboard for order management
- Customer reviews and newsletter sign-up
- Contact form for support and inquiries

# 🚀 Getting Started
1. Open `index.html` in your browser.
2. Browse and add items to your cart.
3. Admin/Staff access via `admin_staff.html`.

# 👥 Default Admin and Staff Test Accounts
- Admin: `admin@dimsum.com` / `dimsum.admin`
- Staff: `staff@dimsum.com` / `dimsum.staff`

# 📝 Note
The **Newsletter Subscription** feature is currently **not functional**. To make it work, add the necessary JavaScript function to handle form submissions and configure the email service through **EmailJS** using your Service ID, Template ID, and Public Key.

# 🔧 Configuring Firebase Realtime Database
Before using the system, you need to connect your project to Firebase Realtime Database. Follow the steps below to set up your Firebase configuration.

1. **Create a Firebase Project**
  - Go to `Firebase Console`.
  - Click `Add Project` → enter your project name.
  - Disable Google Analytics (optional) → `Create Project`.  
2. **Add a Web App**
  - Inside your Firebase project, click </> `Web App`.
  - Enter an app nickname (e.g., dimsum-ordering).
  - Click `Register App`.
  - Copy the generated Firebase configuration.
3. **Add Your Firebase Config to the Project**
    
Open your JavaScript file (e.g., firebase.js or app.js) and paste your config:
  ```bash
  const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
  };
  ```
4. **Initialize Firebase in Your Project**
   
Make sure to include Firebase scripts before your custom JS file, or install via npm if using modules.

5. **Test Connection**

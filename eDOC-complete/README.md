# eDOC — TeleHealth Pulse

A complete telehealth web application with patient/doctor portals, live chat, video consultations, and appointment management.

## 📁 Project Structure

```
eDOC/
├── frontend/          ← All HTML pages (open directly in browser)
│   ├── home.html          Landing page
│   ├── login.html         Login (Patient / Doctor)
│   ├── newacc.html        Register new account
│   ├── forgotpass.html    Forgot password
│   ├── resetpass.html     Reset password
│   ├── patientdash.html   Patient dashboard
│   ├── doctordash.html    Doctor dashboard
│   ├── booking.html       Book an appointment
│   ├── doctorapproval.html  Doctor appointment management
│   ├── livechat.html      Patient live chat
│   ├── livechat_doc.html  Doctor live chat
│   └── video.html         WebRTC video consultation
├── backend/
│   ├── server.js          REST API (port 3000)
│   ├── chat_server.js     Socket.IO server (port 5000)
│   ├── db.js              MySQL connection helper
│   └── routes/chat.js
└── database/
    └── edoc.sql           MySQL schema
```

## 🚀 How to Run

### 1. Setup Database
```bash
mysql -u root -p < database/edoc.sql
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Start API Server (port 3000)
```bash
node server.js
```

### 4. Start Chat/Video Server (port 5000)
```bash
node chat_server.js
```

### 5. Open Frontend
Open `frontend/home.html` in your browser — no build step needed!

## ⚙️ Configuration

Edit `backend/server.js` line ~12 to set your MySQL password:
```js
password: "your_mysql_password",
```

## 🔑 Features

- **Patient Portal**: Register, login, book appointments, view status, live chat, video call
- **Doctor Portal**: View/accept/reject appointments, live chat, receive video calls
- **Real-time Chat**: Socket.IO powered live messaging
- **WebRTC Video**: Peer-to-peer encrypted video consultations
- **Password Reset**: Forgot/reset password flow

## 📌 Default Ports

| Service | Port |
|---------|------|
| REST API | 3000 |
| Socket.IO / Video | 5000 |

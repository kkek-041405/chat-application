# Chat Application

A real-time, multi-room chat system built with a Node.js/Express backend (using Socket.io) and client interfaces for Web (React) and Android (React Native/Expo).

## Project Structure

```
├── backend/            # Express, Socket.io server & MongoDB
├── frontend-web/        # React + Vite client with multi-page routing
└── frontend-android/    # Expo / React Native mobile application
```

---

## 1. Backend Server Setup (`/backend`)

The backend connects to MongoDB Atlas 

### Configuration (`backend/.env`)
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

### Run Locally
```bash
cd backend
npm install
npm start
```
The server will run on `http://localhost:5000`.

---

## 2. Web Client Setup (`/frontend-web`)

The web frontend uses React, Vite, and standard Tailwind-free CSS for custom styles. It uses `react-router-dom` to support URL-based page routing.

### Routes
- `/` or `/join`: Input screen to set username and pick a starting chatroom.
- `/chat/:roomId`: Chat window where message history loads and real-time socket events are broadcasted.

### Configuration (`frontend-web/.env.development`)
```env
VITE_BACKEND_URL=http://localhost:5000
```

### Run Locally
```bash
cd frontend-web
npm install
npm run dev
```
Open the browser to `http://localhost:5173` (or the fallback port shown in console).

---

## 3. Mobile App Setup (`/frontend-android`)

The mobile client is built on Expo. It connects to the backend server via HTTP/WebSocket.

### Connection Advice
- **Android Emulator**: Uses `http://10.0.2.2:5000` to access localhost.
- **Physical Device**: Use your computer's local IP address (e.g. `http://192.168.1.15:5000`). Make sure your device is on the same local network.

### Run Locally
```bash
cd frontend-android
npm install
npm start
```
Scan the QR code with the Expo Go app on your phone or launch an emulator.

---

## Design Decisions

- **Multi-page Routing**: We replaced the conditional state-based single-page rendering with `react-router-dom` in the web frontend. Navigating between rooms changes the URL path (`/chat/:roomId`), and direct links or page refreshes are gracefully handled.
- **Data Fallback**: The backend utilizes MongoDB Atlas but handles disconnects gracefully by saving messages to a backup local JSON file. This guarantees that chat functionality works even when external database access is disrupted.
- **Socket and REST Coexistence**: The frontends communicate using Socket.io for immediate delivery. In case of socket disconnection, the code falls back to hitting the standard REST endpoints (`POST /api/messages`) so messages are not lost.
- **Session Persistence**: Nicknames are saved to local storage so users don't have to keep re-entering them on page refresh.

## Assumptions

- Multiple users can share the same nickname (no hard global authentication is required).
- The rooms list is statically defined on the client for user-friendliness (General, Random, Tech Talk, Gaming).
- If the socket drops, the client automatically retries connecting in the background while REST API calls serve as immediate write-fallbacks.

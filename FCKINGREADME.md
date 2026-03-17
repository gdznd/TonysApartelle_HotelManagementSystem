# Tony's Apartel Hotel Management System 🏨

Welcome to the repository for the Tony's Apartel Hotel Management System! 

This project uses a React frontend and a Python (Flask) backend, connected to a live TiDB Cloud serverless database. Because the database is hosted in the cloud, we can all work on this simultaneously without needing a local MySQL server!

## ⚠️ STOP: Before You Begin
For security reasons, the database passwords and certificates are **NOT** uploaded to this repository. Before you start, you must message the team lead to get the following two files:
1. `ca.pem` (The database security certificate)
2. `.env` (Contains the database connection string and password)
3. Get those important files here: https://drive.google.com/drive/folders/1lgtWsq7fTDSFIZjQ9s4gfUVp1BOGWDx1?usp=sharing

Place **both** of these files directly into the root folder of the project (the same folder where `app.py` is located) before running any code.

---

## 🛠️ Step 1: Clone the Repository
Open your terminal or command prompt and run:

git clone https://github.com/gdznd/TonysApartelle_HotelManagementSystem
cd TonysApartelle_HotelManagementSystem


---

## 🐍 Step 2: Start the Backend (Flask)
The backend handles our API and talks to the TiDB database.

1. Open a terminal in the main `SIA_HOTELMANAGEMENTSYSTEM` folder.
2. (Optional but recommended) Create and activate a virtual environment.
3. Install the required Python libraries:

   pip install -r requirements.txt
   
   *(Note: If you don't have a requirements.txt, manually install Flask, flask-cors, mysql-connector-python, and python-dotenv).*
4. Run the server:

   python app.py
   
   You should see it running on `http://127.0.0.1:5000`. Leave this terminal open!

---

## ⚛️ Step 3: Start the Frontend (React)
The frontend is the UI we interact with.

1. Open a **second, separate terminal** and navigate to the frontend folder:
   
   cd hms_frontend
   
2. Install the Node modules (you only need to do this the first time):
   
   npm install
   
3. Start the React development server:
   
   npm start
   
   *(or `npm run dev` depending on your setup).*

Your browser should automatically open to `http://localhost:3000` (or 5173 for Vite), and the app should be fully functional!

---

## 📝 Troubleshooting
* **"Connection Timeout" / Errno 10060:** This usually means your current Wi-Fi network (like school Wi-Fi) is blocking Port 4000. Try connecting your laptop to your phone's mobile hotspot.
* **Missing Data:** Ensure your backend terminal is running and check that you actually placed `ca.pem` and `.env` in the correct folder.

# Criminal Network Analysis System

## 🧩 Problem Statement
An AI-powered platform to help investigators analyze criminal networks — built for Smart India Hackathon (SIH) 2026, under the SIH26189 problem statement.

## 💡 Overview
The system ingests case and entity data, builds an intelligence engine for network analysis, entity resolution, and pattern/anomaly detection, and presents findings to investigators through an interactive platform with graph visualization, map view, timeline, and case management tools.

## ✨ Key Features
- 🕸️ Network graph visualization of criminal connections
- 🔍 Entity resolution across data sources
- 📊 Pattern and anomaly detection
- 🗺️ Map-based and timeline-based case views
- 📁 Case management and role-based access (investigators, supervisors)

## 🛠️ Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Python
- **Database:** MySQL

## 🚀 Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.x (for backend)
- MySQL

### Installation

**Database**
```bash
mysql -u root -p < database/schema.sql
cd backend
pip install -r requirements.txt
python main.py
cd frontend
npm install
npm run dev
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=Criminal_Database
/frontend    → React app (login, dashboard, protected routes)
/backend     → Python backend (main, models, database, graph_data)
/database    → MySQL schema (Users, Police_officers, etc.)
```
## 📸 Screenshots / Demo
Screenshots and demo video will be added once the UI is finalized.

## 👥 Team — [ERROR 007]
Six-member team, SIH 2026:
1. LUCKY KUMAR GUPTA — Team Lead
2. NIDHI SHREE .H
3. MOHAMMED SUFIYAN RAMAJAN APARAJ
4. JEHAR PARMAR
5. SUDESHNA PASUMARTHY
6. SRIKAR REDDY P

## 📄 License
[MIT / your choice, or leave blank]

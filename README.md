# 🌾 AgriMind – AI-Powered Smart Farming Assistant

AgriMind is an intelligent agriculture assistant that helps farmers make data-driven decisions using Machine Learning, Weather Forecasting, and AI Agents.

It combines crop recommendation, 30-day weather forecasting, and irrigation planning into a unified AI-powered system.

Built for hackathons and designed to scale toward real-world AgriTech deployment.

---

## 🚀 Problem Statement

Farmers often struggle with:

- Choosing the right crop for their soil
- Planning irrigation efficiently
- Adapting to changing weather conditions
- Accessing simple, actionable agricultural insights

AgriMind provides AI-driven recommendations to support climate-smart agriculture and improve farm productivity.

---

## 🧠 Key Features

### 🌱 1. Crop Recommendation Engine
- Random Forest model trained on soil and climate dataset
- Inputs:
  - Nitrogen (N)
  - Phosphorus (P)
  - Potassium (K)
  - Temperature
  - Humidity
  - Soil pH
  - Rainfall
- Output:
  - Most suitable crop recommendation

---

### 🌤 2. 30-Day Weather Forecasting
- Fetches real-time weather data
- Uses forecasting model for short-term predictions
- Helps farmers plan crop cycles and irrigation

---

### 💧 3. Smart Irrigation Advisory
- Rule-based irrigation recommendations
- Adjusted using forecasted weather conditions
- Reduces water waste and improves efficiency

---

### 🤖 4. AI Agent (LangChain + Groq)
- Orchestrates tools dynamically
- Selects appropriate tool based on user query
- Generates natural language responses
- Enables conversational agricultural assistance

---

## 🏗 System Architecture

```
Frontend (HTML/CSS/JS)
        ↓
FastAPI Backend (api.py)
        ↓
AI Agent (agent.py)
        ↓
Tools Layer
   ├── crop_tool.py
   ├── weather_tool.py
   └── irrigation_tool.py
        ↓
Machine Learning Models (.pkl files)
```

---

## 📂 Project Structure

```
AgriMind/
├── backend/
│   ├── agent.py
│   ├── tools/
│   │   ├── weather_tool.py
│   │   ├── crop_tool.py
│   │   └── irrigation_tool.py
│   ├── models/
│   │   ├── crop_model.pkl
│   │   └── weather_model.pkl
│   └── api.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── requirements.txt
```

---

## 🛠 Tech Stack

### Backend
- Python
- FastAPI
- Scikit-learn
- Pandas
- NumPy
- LangChain
- Groq LLM

### Frontend
- HTML
- CSS
- JavaScript

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/AgriMind.git
cd AgriMind
```

---

### 2️⃣ Create Virtual Environment

```bash
python -m venv venv
```

Activate environment:

**Windows**
```bash
venv\Scripts\activate
```

**Mac/Linux**
```bash
source venv/bin/activate
```

---

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Set Environment Variables

Create a `.env` file and add your API keys:

```
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_weather_api_key
```

---

### 5️⃣ Run FastAPI Server

```bash
uvicorn backend.api:app --reload
```

Server runs at:

```
http://127.0.0.1:8000
```

---

## 🌍 Future Improvements

- Satellite NDVI integration
- IoT soil sensor connectivity
- Regional soil health database integration
- Mobile application version
- Multilingual farmer support
- Cloud deployment (AWS / GCP / Azure)

---

## 📈 Impact Vision

AgriMind aims to:

- Improve crop yield
- Reduce water waste
- Support small-scale farmers
- Promote sustainable agriculture
- Enable climate-resilient farming decisions

---

## 🧪 Model Information

- Crop Recommendation Model:
  - Algorithm: Random Forest Classifier
  - Multi-class classification
  - Trained on soil and climate features

- Weather Forecasting Model:
  - Predicts short-term weather trends
  - Supports irrigation and crop decisions

---

## 🔐 Security Note

API keys are stored securely using environment variables and are not committed to the repository.

---

## 📜 License

This project is licensed under the MIT License.

---

## 👥 Team

Built with ❤️ for innovation in agriculture and AI.

---

## ⭐ Acknowledgment

AgriMind was developed as a hackathon project to demonstrate how AI agents and machine learning can transform traditional farming practices into intelligent, data-driven systems.

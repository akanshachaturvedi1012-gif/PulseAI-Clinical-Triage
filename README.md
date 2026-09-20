# PulseAI — AI-Assisted Medical Triage & Clinical Report Agent

> An AI-assisted clinical triage workspace that analyzes laboratory reports, identifies potential risk signals, generates structured clinical summaries, and helps prepare referral documentation for clinician review.

## 🚀 Live Demo

**Live Application:**  
https://pulse-ai-clinical-triage--akanshachaturve.replit.app/

**GitHub Repository:**  
https://github.com/akanshachaturvedi1012-gif/PulseAI-Clinical-Triage

---

## 🩺 Overview

PulseAI is a full-stack AI-assisted medical triage and clinical reporting application developed as a hackathon MVP.

It provides a centralized workspace for organizing patient information, analyzing laboratory reports, identifying abnormal biomarkers, generating structured clinical summaries, and preparing referral documentation.

The system is designed as a **clinical decision-support prototype** and not as an autonomous diagnosis or treatment system. All generated medical information is intended for qualified clinician review.

---

## 🎯 Problem

Healthcare information can be distributed across patient records, laboratory reports, clinical notes, and referral documentation.

Reviewing this information manually can take time, particularly when abnormal laboratory values need to be identified and organized quickly.

PulseAI addresses this workflow by bringing patient records, laboratory analysis, risk assessment, and referral generation into one interface.

---

## 💡 Solution

PulseAI follows a simple workflow:

```text
Patient Information
        ↓
Laboratory Report
        ↓
Validation & Parsing
        ↓
Biomarker Analysis
        ↓
Risk Assessment
        ↓
Clinical Summary
        ↓
Patient-Friendly Explanation
        ↓
Referral Documentation
        ↓
Clinician Review
---

## ✨ Key Features

### 🏥 Triage Dashboard

- Centralized clinical workspace
- Triage-oriented patient view
- Search functionality
- Risk information
- Navigation between clinical modules

### 👤 Patient Records

- Patient information
- Age and sex
- Chief complaint
- Case information
- Clinical risk information
- Analysis results

### 🧪 Lab Report Analyzer

- Laboratory report submission
- Input validation
- Laboratory value parsing
- Biomarker anomaly detection
- Structured analysis
- Persistent report storage

### 📊 Risk Assessment

The system generates a structured assessment containing:

- Risk level
- Clinical summary
- Biomarker findings
- SOAP-style clinical note
- Patient-friendly explanation

### 📝 AI Referral Drafter

The application can generate structured referral documentation using available patient and analysis information.

### 💾 Persistent Backend

PulseAI uses SQLite to persist:

- Patients
- Laboratory reports
- Referral records

### 🤖 AI Integration

The backend supports optional Gemini-based analysis.

When an external AI service is not configured or unavailable, a deterministic fallback analysis is available for the demonstration environment.

---

## 🔬 Example Biomarker Analysis

One demonstration case contains:

```text
Patient: John Doe
Age: 45
Sex: Male

Chief Complaint:
Severe weakness and palpitations

Biomarker:
Potassium

Value:
6.2 mEq/L

Reference Range:
3.5–5.0 mEq/L

Status:
High
The system identifies the value as outside the configured reference range and generates a corresponding risk assessment requiring clinician review.

---

## 🧠 Structured Clinical Output

PulseAI produces structured analysis containing:

- Patient Name
- Risk Level
- Clinical Summary
- Biomarker Findings
- SOAP Note
- Patient Explanation

This structured format allows information to be displayed consistently across the application and can support future clinical workflow extensions.

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│       PulseAI Frontend      │
│                             │
│  Dashboard                  │
│  Patient Records            │
│  Lab Analyzer               │
│  Referral Drafter           │
└──────────────┬──────────────┘
               │
               │ API Requests
               ▼
┌─────────────────────────────┐
│       Express Backend       │
│                             │
│ Patient APIs                │
│ Lab Analysis APIs           │
│ Referral APIs               │
│ Validation                  │
│ AI Integration              │
└──────────────┬──────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│    SQLite    │  │ Gemini API   │
│   Database   │  │  (Optional)  │
└──────────────┘  └──────────────┘
---

## 🛠️ Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Responsive web interface

### Backend

- Node.js
- Express
- TypeScript

### Database

- SQLite

### AI

- Gemini API integration
- Deterministic fallback analysis

### Development & Deployment

- Replit
- GitHub

---

## 🔌 API Endpoints

### Patients

```http
POST /api/patients
GET /api/patients
GET /api/patients/:id
GET /api/patients/:id

### Laboratory Reports

POST /api/lab-reports/analyze
GET /api/lab-reports/:id

### Referrals

POST /api/referrals/generate

The backend includes input validation and error handling for invalid requests.

---

## 🗄️ Database

The application uses SQLite for persistence.

The main data areas are:

### Patients

Stores patient information used by the clinical workspace.

### Lab Reports

Stores submitted laboratory reports and generated analysis.

### Referrals

Stores generated referral documentation.

---

## 🧪 Demonstration Patients

The project contains synthetic demonstration data.

### John Doe

- Age: 45
- Sex: Male
- Chief complaint: Severe weakness and palpitations
- Example potassium value: 6.2 mEq/L

### Jane Smith

- Age: 58
- Sex: Female
- Chief complaint: Chest discomfort

### Alex Johnson

- Age: 31
- Sex: Male
- Chief complaint: Routine check

**All demonstration data is synthetic and does not represent real patients.**

---

## 🔐 Security & Privacy

PulseAI is a hackathon prototype and does not use real patient health records.

Important considerations include:

- Synthetic demonstration data
- API credentials are not exposed in frontend code
- AI configuration uses environment variables
- Clinical outputs require professional review
- The application is not designed for autonomous medical decision-making

---

## ⚕️ Clinical Safety

PulseAI is a **clinical decision-support prototype**.

It does not replace doctors, nurses, qualified healthcare professionals, or emergency medical services.

AI-generated or rule-based outputs must be reviewed by an appropriate healthcare professional before being used for real clinical decisions.

This project is intended for demonstration, education, and hackathon evaluation.

---

## ⚙️ Environment Variables

If Gemini integration is enabled, the backend can use:

GEMINI_API_KEY=your_api_key_here

The actual API key should never be committed to GitHub.

An `.env.example` file is included in the project.

---

## 💻 Local Development

Clone the repository:

git clone https://github.com/akanshachaturvedi1012-gif/PulseAI-Clinical-Triage.git

cd PulseAI-Clinical-Triage

Install dependencies:

npm install

Configure the environment variable if Gemini integration is required:

GEMINI_API_KEY=your_api_key_here

Then run the project's configured development workflow.

---

## 🧪 Testing & Validation

The project backend was tested for:

- Patient retrieval
- Patient creation
- Laboratory report upload
- Laboratory report parsing
- Biomarker analysis
- Persisted report retrieval
- Referral generation
- Referral persistence
- Invalid input rejection
- Frontend-to-backend API communication
- Production build validation

The application was also tested through the deployed web interface.

---

## 🚀 Current MVP

The current MVP includes:

- Functional web dashboard
- Patient records
- Triage-oriented interface
- Laboratory report analysis
- Biomarker anomaly identification
- Structured clinical analysis
- Patient-friendly explanations
- Referral generation
- SQLite persistence
- Express backend
- Optional Gemini integration
- Deterministic fallback analysis
- Public deployment
- GitHub repository

---

## 🔮 Future Scope

Future versions could include:

- Voice-based clinical input
- Speech-to-text processing
- More laboratory biomarkers
- Additional clinical scoring systems
- Authentication and role-based access
- Secure patient portals
- EHR integration
- FHIR interoperability
- Audit logging
- Advanced clinical decision-support models
- Multi-language patient explanations
- Human-in-the-loop approval workflows
- Cloud database infrastructure
- Production-grade security and compliance controls

These are future extensions and are not represented as completed features in the current MVP.

---

## 🤖 AI-Assisted Development

PulseAI was developed during the Hack Devengers 2.0 hackathon using AI-assisted development tools for implementation support, debugging, code generation, and workflow development.

The project architecture, feature integration, testing, and deployment were completed as part of the hackathon development process.

---

## 🏆 Hackathon

**Hack Devengers 2.0**

**Project:** PulseAI — AI-Assisted Medical Triage & Clinical Report Agent

**Category:** Open Innovation

**Project Type:** Full-Stack AI-Assisted Healthcare Prototype

---

## 👩‍💻 Author

**Akansha Chaturvedi**

BCA (Honours with Research)

Amity University Kolkata

---

## 🔗 Links

**Live Demo:**  
https://pulse-ai-clinical-triage--akanshachaturve.replit.app/

**GitHub Repository:**  
https://github.com/akanshachaturvedi1012-gif/PulseAI-Clinical-Triage

---

## ⚠️ Disclaimer

PulseAI is a hackathon prototype created for demonstration and educational purposes.

It is not a medical device, does not provide autonomous diagnosis, and should not be used to make medical decisions without appropriate professional review.

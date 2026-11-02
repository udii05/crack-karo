# 04 — User Guide

## What is AI Interview Copilot?

An AI-powered platform that helps you prepare for job interviews. Upload your resume, paste a job description, run realistic mock interviews, get scored feedback, and use the Live Copilot for real-time hints during actual interviews.

---

## Getting Started

### 1. Create an account
- Open the app at **http://localhost:3000**
- Click **Register** and enter your name, email, and password.
- You'll be logged in automatically and land on your **Dashboard**.

### 2. Upload your resume
- Go to **Dashboard → Profile** (or the upload card on the overview).
- Upload a `.txt`, `.pdf`, or `.docx` resume.
- The AI extracts your skills and builds your candidate profile.

### 3. Add a job description (optional but recommended)
- Paste a job description into the **Job Analyzer**.
- The AI maps the requirements to likely interview questions.

---

## Running a Mock Interview

1. From the dashboard, click **New Interview**.
2. Choose a **type** (Behavioral or Technical) and a **difficulty**.
3. Click **Start** — the AI interviewer asks the first question.
4. Press the large microphone button and speak your answer. Your words appear live below the button.
5. Press the microphone button again to stop. The answer is sent for scoring automatically.
6. The AI scores your answer (0–100) and gives feedback.
7. Repeat until the interview completes, then view your **full report**.

### Understanding your score
Each answer is scored on four dimensions:
- **Relevance** (35%) — did you answer the actual question?
- **Structure** (25%) — clear, organized (e.g., STAR method)?
- **Technical accuracy** (25%) — correct and specific?
- **Delivery** (15%) — clarity and confidence.

## Using the Live Copilot

The Copilot gives you real-time talking points during a real interview.

1. Open **Dashboard → Copilot**.
2. Type or paste what the interviewer just asked.
3. Click **Get Hint** — the AI returns suggested talking points and a STAR outline.
4. Use the **discreet overlay** (small, draggable) so it's subtle on camera.

## Dashboard Overview

| Card | What it shows |
|---|---|
| **Readiness Score** | How prepared you are (0–100), updated after each interview |
| **Streak** | Consecutive days of practice |
| **Skill Radar** | Your strengths and gaps |
| **Recent Interviews** | History with scores |
| **Practice** | Browse the question bank |

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't log in | Check email/password; register if you haven't |
| Resume won't parse | Use `.txt`; keep it under 5 MB |
| Microphone button unavailable | Use Chrome or Edge and allow microphone access |
| Backend not reachable | Ensure `python backend/run.py` is running on port 8000 |
| Frontend shows API errors | Ensure backend is up and CORS origin matches |

## Privacy

Your resume and interview data are stored locally in the MVP database. In production, data is encrypted at rest, isolated per user (row-level security), and never shared.
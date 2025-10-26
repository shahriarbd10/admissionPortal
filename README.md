# 🎓 Admission Portal — University Online Exam & Management System  
**Live Site:** [https://admission-portal-self.vercel.app/](https://admission-portal-self.vercel.app/)  

---

## 📘 Overview
The **Admission Portal** is a modern, full-stack web application that digitizes the **university admission examination process**.  
It provides a complete ecosystem for **students, faculties, exam committees, and administrators**, ensuring a secure, automated, and transparent admission workflow.

The system supports:
- **OTP-based student verification**
- **Online departmental exams**
- **Automated question generation**
- **Result calculation & ranking system**

---

## 👥 User Roles & Capabilities

### 🧑‍🎓 Student
- Registers and logs in using **Admission Form ID** and **OTP verification** (sent to registered email/number).  
- Completes the **personal information form** and selects department preferences.  
- Appears for the **department-specific online exam**, which includes:
  - Auto-fetched, department-filtered random questions  
  - Multiple question types: **MCQs**, **True/False**, and **Fill in the blanks**
  - Fixed exam duration with an auto-submit timer  
- Views final admission scores once published.

---

### 🧑‍🏫 Faculty / Exam Committee
- Faculties can securely log in to their portal.  
- Upload **up to 50 questions per subject** across 5 major subjects.  
- Tag each question with:
  - **Department eligibility** (which departments can access it)
  - **Question type** (MCQ / True-False / Fill)
- The system automatically mixes and distributes questions by department, ensuring fairness and variety.

---

### 🧑‍💼 Admin / Department Head
- Full access to system data and control panels.  
- Creates and manages departments, faculties, and student lists.  
- Monitors exams in real time (active sessions, submissions, and timings).  
- Reviews answer sheets and validates evaluation reports.  
- Oversees **marks integration**, where:
  - **SSC = 20 points**  
  - **HSC = 30 points**  
  - **Exam = 50 points**  
  - ➜ **Total Admission Score = 100**

---

## 🧠 Key Features
- 🔐 **Role-based Authentication** (Student, Faculty, Admin)
- ✉️ **OTP Verification** for secure student login  
- 🧾 **Dynamic Question Generation** — Randomized, department-filtered question sets  
- 🧮 **Auto Evaluation System** — Instant grading and result compilation  
- 🕒 **Fixed-Time Exam Sessions** with countdown and auto submission  
- 📊 **Merit Score Calculation** combining previous academic results  
- 📤 **Faculty Upload System** for large question sets  
- 📁 **Admin Panel** for centralized control and reporting  
- 🧠 **Multi-question-type support** (MCQ, True/False, Fill in the blanks)

---

## 🧰 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React.js • Tailwind CSS • Axios |
| **Backend** | Node.js • Express.js |
| **Database** | MongoDB |
| **Authentication** | JWT + OTP Verification (Email / SMS Gateway Integration) |
| **Deployment** | Vercel (Frontend) • Render / AWS EC2 (Backend) |
| **Version Control** | Git & GitHub |

---

## 🧩 System Architecture
```mermaid
graph TD;
A[Student Login via OTP] --> B[Department Allotted]
B --> C[Fetch Randomized Questions]
C --> D[Timed Exam Begins]
D --> E[Auto Submit on Timeout]
E --> F[Result Evaluation & Report Generation]
F --> G[Admin Final Review]
G --> H[Final Merit List Published]

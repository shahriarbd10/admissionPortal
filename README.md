# 🎓 Admission Portal — University Online Exam & Management System  
**Live Site:** [https://admission-portal-self.vercel.app/](https://admission-portal-self.vercel.app/)  

---

## 📘 Overview
The **Admission Portal** is a modern **Next.js-based full-stack web application** built to simplify the **university admission examination process**.  
It provides a complete digital ecosystem for **students, faculties, exam committees, and administrators**, ensuring **secure, scalable, and automated** admission management.  

It features **OTP-based login**, **department-filtered exam generation**, and **automated result compilation**, eliminating manual coordination between students and faculties.

---

## 👥 User Roles & Responsibilities

### 🧑‍🎓 Student
- Registers and logs in with **Admission Form ID** verified through **OTP authentication**.  
- Submits personal and academic details (SSC & HSC scores).  
- Appears in department-based exams scheduled by the committee.  
- Receives randomized question sets filtered by **department and subject eligibility**.  
- Exam auto-submits upon time completion and results are generated automatically.

### 🧑‍🏫 Faculty / Exam Committee
- Secure login portal to **upload and manage question sets**.  
- Each faculty can:
  - Upload **50 questions** across **5 subjects**.  
  - Define **question type** (MCQ, True/False, Fill in the blanks).  
  - Select which **departments** can use their questions.  
- The system automatically mixes and fetches questions for fairness and coverage.

### 🧑‍💼 Admin / Department Head
- Has full system control: users, departments, and exams.  
- Monitors live exam sessions, student submissions, and reports.  
- Reviews results and validates answer sheets.  
- Generates final merit lists combining:
  - **SSC (20 pts)**  
  - **HSC (30 pts)**  
  - **Exam (50 pts)**  
  ➜ **Total Merit Score (100 pts)**

---

## 🧠 Key Features
- 🔐 **Role-Based Authentication** — Students, Faculties, Admin  
- ✉️ **OTP Verification** — Secure student login and registration  
- 🧾 **Automated Question Distribution** — Department-based randomization  
- 🕒 **Timed Exams** — Auto submission after countdown  
- 🧮 **Auto Evaluation** — Real-time marking and result generation  
- 📊 **Merit Score Calculation** (20 + 30 + 50 = 100)  
- 📤 **Faculty Dashboard** — Upload and manage question sets  
- 🧩 **Admin Panel** — Monitor users, sessions, and performance  
- 📚 **Multiple Question Types** — MCQ, True/False, Fill in the blanks  
- 🚀 **Server-Side Rendering (SSR)** for optimized performance  

---

## 🧰 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router) • React • Tailwind CSS |
| **Backend** | Next.js API Routes • Express-style Controllers |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT + OTP (via Email / Phone Gateway) |
| **Deployment** | Vercel (Full-stack) |
| **Version Control** | Git & GitHub |
| **State Management** | React Hooks & Context API |

---

## 🧩 Architecture Flow
```mermaid
graph TD;
A[Student Login via OTP] --> B[Dashboard Access]
B --> C[Fetch Department-Based Questions]
C --> D[Start Timed Exam]
D --> E[Auto Submit on Timeout]
E --> F[Answer Evaluation & Report Generation]
F --> G[Admin Final Review]
G --> H[Merit Score Published]

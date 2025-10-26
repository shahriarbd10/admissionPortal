# 🎓 Admission Portal — University Online Exam & Management System  
**Live Site:** [https://admission-portal-self.vercel.app/](https://admission-portal-self.vercel.app/)

---

## 📘 Overview
The **Admission Portal** is a full-stack **Next.js 14 web application** designed to automate and modernize the **university admission process**.  
It provides a centralized system for **students**, **faculties**, and **administrators** to manage online exams, question sets, and result processing — all in one secure platform.

This platform integrates **OTP-based authentication**, **department-specific exam generation**, and **cloud-hosted data management** using **MongoDB Atlas**, ensuring reliability, scalability, and a smooth user experience.

---

## 👥 User Roles & Responsibilities

### 🧑‍🎓 Students
- Log in securely with **Admission Form ID** verified via **OTP** (email/SMS).  
- Submit personal and academic information (including SSC and HSC scores).  
- Appear for department-wise exams at scheduled times.  
- Receive dynamically fetched random questions relevant to their department.  
- Exam auto-submits once the timer expires, and results are evaluated instantly.

### 🧑‍🏫 Faculty / Exam Committee
- Authorized login to **upload and manage question sets**.  
- Can create up to **50 questions** across **5 subjects**.  
- Each question can be tagged by:
  - **Department eligibility**
  - **Question type** — MCQ, True/False, or Fill in the blanks  
- The system ensures department-wise distribution and fairness through randomization.

### 🧑‍💼 Admin / Department Head
- Has complete visibility and control of the system.  
- Creates departments, manages faculty and student access.  
- Tracks real-time exam activity and verifies result reports.  
- Finalizes student merit lists combining:
  - **SSC (20 pts)**  
  - **HSC (30 pts)**  
  - **Exam (50 pts)**  
  ➜ **Total Merit Score = 100**

---

## 🧠 Key Features
- 🔐 **Role-Based Authentication** — Students, Faculties, and Admins  
- ✉️ **OTP Verification** — Secure student access  
- 🧾 **Dynamic Question Generation** — Department-wise randomization  
- 🕒 **Timed Examinations** — Auto submission after countdown  
- 🧮 **Automatic Evaluation** — Instant marking system  
- 📊 **Merit Score Computation** (20 + 30 + 50)  
- 📤 **Faculty Dashboard** — Upload and manage question sets easily  
- 🧩 **Admin Control Panel** — Real-time monitoring and analytics  
- 🚀 **Deployed on Vercel** with serverless Next.js API routes  

---

## 🧰 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Frontend** | React • Tailwind CSS |
| **Backend** | Next.js API Routes • Node.js Controllers |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **Authentication** | JWT + OTP (Email / SMS Gateway) |
| **Deployment** | Vercel (Full-stack) |
| **Version Control** | Git & GitHub |
| **State Management** | React Hooks & Context API |

---

## 🧩 System Flow
```mermaid
graph TD;
A[Student Login via OTP] --> B[Profile & Department Selection]
B --> C[Department-based Question Fetch]
C --> D[Timed Exam Begins]
D --> E[Auto Submit on Timeout]
E --> F[Answer Evaluation & Score Generation]
F --> G[Admin Review & Merit Calculation]
G --> H[Result Published]

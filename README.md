# 🌐 GFG BVCOE Official Website

🚀 **Official website of GeeksforGeeks BVCOE**, built using modern frontend and backend technologies with a strong focus on **performance, automation, role-based access control, and scalability**.

🔗 **Live Website:** [https://www.gfg-bvcoe.com](https://www.gfg-bvcoe.com)

---

## 👨‍💻 Project Overview

This project was developed as a **large-scale team collaboration**, where I worked as the **Lead Developer**, alongside experienced contributors **Himank** and **Gaurav**.

What started as a frontend-focused website has now evolved into a **full-fledged production system** with:

* Role-based dashboards
* Event automation
* Secure authentication
* Faculty-level administrative controls

This project marks a **major milestone** in my full-stack web development journey.

---

## 🧑‍💻 Development Team

* **Dev Malik** – Lead Developer & System Architect
* **Himank** – Co-Developer
* **Gaurav** – Debugging & Support

### 🎯 Mentorship

* **Toshika** – Chairperson
* **Kartik** – Vice Chairperson & Technical Lead

---

## 🛠️ Tech Stack

### Frontend

* ⚛️ **React.js (Vite)**
* 🎨 **Tailwind CSS**
* 🛤️ **React Router**
* 🎬 **GSAP**
* 🌀 **Lenis (Smooth Scrolling)**

### Backend & Services

* 🟢 **Node.js & Express.js**
* 🍃 **MongoDB Atlas**
* 📧 **Brevo** (Email & OTP Service)
* ☁️ **Cloudinary** (Image Storage & Auto Deletion APIs)
* 🔄 **GitHub Actions** (Keep-Alive Scripts)
* 🚀 **Vercel** (Frontend Deployment)
* 🧩 **Render** (Backend Deployment)

---

## ✨ Major Features

### 🔐 Authentication & Signup System

* Signup is **restricted** to email IDs pre-approved by the **Faculty Incharge**
* OTP-based verification using **Brevo**
* **Auto-Fill OTP Feature**

  * OTP email contains an auto-fill option
  * Backend uses **polling (every second)** to detect OTP confirmation
  * OTP is automatically filled in the open signup tab
* User profile is **auto-generated**

  * MongoDB contains predefined profile mappings
  * Profile photo & details are auto-fetched during signup
* Secure role-based login system

🔗 Signup Link:
[https://www.gfg-bvcoe.com/signup](https://www.gfg-bvcoe.com/signup)

---

## 📅 Event Management Portal (Major Feature Update)

The **Event Management Portal** has been fully developed and integrated into the website.

✅ **Complete responsibility of event handling is now transferred to the Event Management Department**
❌ **No developer dependency required**

---

### 🔑 Access & Permissions

#### Full Event Access Roles

* Event Management Department
* President
* Vice President

These roles can:

* Upload events
* Edit events
* Delete events
* Manage post-event content
* Add FAQs to events

---

### 🗂️ Core Event Features

#### 1️⃣ Event Upload & Management

Authorized users can:

* Upload **upcoming events**
* Upload **post-event details with images**
* Add **FAQs** (shown on both Homepage & Events Page)
* Edit or delete events from a centralized dashboard

---

#### 2️⃣ Public Upload Link (Time-Limited)

* Generate a **public upload link**
* Anyone with the link can submit event details
* Link automatically expires after **12 hours**
* Ideal for volunteers or temporary collaborators

---

#### 3️⃣ Upcoming Event Automation

* Events automatically appear on:

  * Homepage
  * Events Page
* On the **event date**, the event is **auto-removed** from:

  * Homepage
  * Events Page

➡️ Ensures only relevant events are visible

---

### 🛡️ Safe Deletion & Recovery System

To prevent accidental data loss:

* Deleted events:

  * Instantly disappear from UI
  * Remain in database for **10 days**
* Events can be **restored** during this period
* After 10 days → **Permanent deletion**

---

## ⚠️ Force Delete Permissions

**Faculty Incharge, Chairperson, Vice-Chairperson** can:

* Enable / disable **Force Delete** permissions for departments
* Force Delete = **Immediate permanent deletion**
* No 10-day recovery window

✔ Faculty Incharge, Chairperson & Vice-Chairperson **always have Force Delete access**

---

## 🧑‍🏫 Faculty Incharge Dashboard (Exclusive)

Only the **Faculty Incharge** has access to a **dedicated dashboard**, which includes:

### 🔧 Access Control

* Add / remove **allowed email IDs** for signup
* Assign department-wise access

### 👥 Society Management

* “**Manage Society**” dropdown
* View:

  * Complete society member list
  * Department-wise member lists
* Export data as:

  * 📄 PDF
  * 📊 Excel
    (Department-specific or full society)

### 📜 Activity Logs

* View **complete activity logs** of any user
* Tracks:

  * Event uploads
  * Edits
  * Deletions
  * Login actions
  * Permission changes

---

## 👑 Chairperson & Vice-Chairperson Access

They have **all features identical to Faculty Incharge**, **except**:

❌ No access to the **Faculty Dashboard**

✔ Can:

* Manage events
* View society members
* View activity logs
* Use force delete
* Control department permissions

---

## 🧩 Department-Wise Controls

Each department (Technical, EM, etc.) has:

* **My Profile**
* **Manage Your Society**

Permissions depend on role assigned by Faculty Incharge.

---

## 🧹 Automated Media Handling

* All images stored via **Cloudinary**
* On event or user deletion:

  * Images are **automatically removed**
  * No unused media remains

---

## 📚 Learning Outcomes

* Real-world **role-based system design**
* Secure authentication & authorization flows
* Advanced MongoDB schema planning
* Event automation logic
* Production-level dashboards
* Faculty-controlled access systems
* Full deployment lifecycle handling

---

## 🚀 Getting Started (Local Setup)

```bash
# Clone the repository
git clone https://github.com/your-username/gfg-bvcoe-website.git

# Navigate to project directory
cd gfg-bvcoe-website

# Install dependencies
npm install

# Start development server
npm run dev
```


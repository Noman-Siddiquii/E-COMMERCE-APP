<div align="center">
  <br />
    <a href="#" target="_blank">
      <img src="public/readme/hero.webp" alt="Project Banner">
    </a>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6"/>
    <img src="https://img.shields.io/badge/-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <br/>
    <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white">
    <img src="https://img.shields.io/badge/-Better Auth-black?style=for-the-badge&logoColor=white&logo=betterauth&color=black"/>
    <img src="https://img.shields.io/badge/-Drizzle-black?style=for-the-badge&logoColor=C5F74F&logo=drizzle&color=black"/>
  </div>

  <h3 align="center">Nike E-Commerce</h3>

   <div align="center">
     A modern full-stack eCommerce platform inspired by Nike, built with Next.js 15, Drizzle ORM, and Better Auth.
   </div>
</div>

---

##  Table of Contents

1.  [Introduction](#introduction)  
2.  [Tech Stack](#tech-stack)  
3.  [Features](#features)  
4.  [Quick Start](#quick-start)  
5.  [Project Structure](#project-structure)  
6.  [Database Schema](#database-schema)  
7.  [Assets](#assets)  
8.  [More](#more)

---

##  Introduction

This is a **Nike-style eCommerce web application** built to demonstrate modern full-stack development.  
It combines **Next.js 15** with **TypeScript**, **TailwindCSS**, **Drizzle ORM**, **Better Auth**, and **Zustand** for state management.  

The backend is powered by **Neon PostgreSQL** with secure authentication and AI-generated product descriptions.  
The UI is modular, scalable, and optimized for fast deployment.

---

## ⚙️ Tech Stack

- **[Next.js](https://nextjs.org/docs)** – React framework for server-side rendering & full-stack apps.  
- **[TypeScript](https://www.typescriptlang.org/)** – Strongly typed JavaScript for better tooling and scalability.  
- **[TailwindCSS](https://tailwindcss.com/)** – Utility-first CSS for rapid responsive design.  
- **[Better Auth](https://www.better-auth.com/)** – Authentication & authorization library.  
- **[Drizzle ORM](https://orm.drizzle.team/)** – Lightweight, performant TypeScript ORM.  
- **[Neon](https://neon.com/)** – Serverless PostgreSQL with autoscaling & branching.  
- **[Zustand](https://zustand-demo.pmnd.rs/)** – Hook-based state management.

---

##  Features

 **Landing Page** – Modern homepage with animations & branding.  
 **Product Listing** – Filter, sort, and browse all items.  
 **Product Details** – Rich product info with AI-generated descriptions.  
 **Authentication** – Secure login/signup with Better Auth.  
 **Cart & Orders** – Manage shopping cart and checkout flow.  
 **Database Integration** – Products, users, orders fully managed in PostgreSQL.  

---

##  Quick Start

### Prerequisites
- [Git](https://git-scm.com/)  
- [Node.js](https://nodejs.org/en)  
- [npm](https://www.npmjs.com/)  

### Clone & Install
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
Setup Environment Variables
Create .env in project root:

env
Copy code
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Optional OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
Run
bash
Copy code
npm run dev
Visit 👉 http://localhost:3000


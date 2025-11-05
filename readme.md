# 🌐 Portfolio Generator  

![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

> Developed as part of the **Internvita** program under **Coursvita**.  
> A complete **Portfolio and Resume Generator** that empowers users to build, deploy, and customize their digital presence effortlessly.

---

## 🧾 Overview  

**Portfolio Generator** is a web-based platform that enables users to create **personalized portfolio websites** and **ATS-friendly resumes** within minutes.  
It combines automation, AI enhancement, and instant deployment, making it ideal for students, professionals, and job seekers.  

Users can choose from pre-built templates, fill in their details via a guided chatbot or form, preview their portfolio instantly, and deploy it to **Netlify** with one click.  

---

## 🚀 Key Features  

### 🌟 Portfolio Creation  
- Instantly generate professional and responsive portfolio websites.  
- Choose from multiple modern, customizable templates.  
- User-friendly form and chatbot assistance for smooth data entry.  

### 🧠 AI Assistance  
- AI-enhanced content suggestions for descriptions, bios, and summaries.  
- Smart rewriting for professional and engaging language.  

### 📄 Resume Builder  
- Automatically generate **ATS-friendly resumes** using your portfolio data.  
- Export your resume as PDF or download your complete project as a ZIP file.  
- Designed to work seamlessly with HR applicant tracking systems.  

### ⚙️ Developer Tools  
- Download generated portfolio code as a ZIP file for customization.  
- One-click deployment to **Netlify** for live hosting.  

### 🔐 Authentication & Security  
- Secure login using **Google** or **GitHub** accounts.  
- Email and password **signup/login** option.  
- All user data securely stored in **MongoDB**.  

### 💾 Database & Data Management  
- Stores user details, templates, and configurations for easy access.  
- Enables users to revisit, modify, and redeploy portfolios anytime.  

---

## 🧩 Tech Stack  

| Category | Technologies |
|-----------|---------------|
| **Frontend** | React.js, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Authentication** | Firebase / OAuth (Google & GitHub) |
| **AI Integration** | OpenAI API *(optional)* |
| **Deployment** | Netlify (Frontend), Render / Vercel (Backend) |
| **Version Control** | Git & GitHub |

---

## ⚙️ Installation & Setup  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/your-username/portfolio-generator.git
cd portfolio-generator
```

## 🚀 Portfolio Generator Project Setup

### 2️⃣ Install Dependencies

  * **Backend:**
    ```bash
    npm install
    ```
  * **Frontend:**
    ```bash
    cd client
    npm install
    ```

-----

### 3️⃣ Setup Environment Variables

Create a **`.env`** file in the root directory and add the following variables:

```dotenv
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
PORT=5000
```

-----

### 4️⃣ Run the Project

```bash
# Run both client and server
npm run dev
```

> **Note:**
> Frontend runs on **`http://localhost:3000`**
> Backend runs on **`http://localhost:5000`**

-----

### 5️⃣ Deployment

  * **Frontend:** Deploy via **Netlify**
  * **Backend:** Deploy via **Render** or **Vercel**

-----

## 📁 Folder Structure

```
Portfolio-Generator/
│
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.js
│   ├── public/
│   └── package.json
│
├── server/                   # Express backend
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── controllers/          # Business logic
│   ├── config/               # DB connection & env setup
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

-----

## 🧠 Working Flow

1.  User Authentication (**Google / GitHub / Email**)
2.  Input Details through **chatbot or form**
3.  **AI Enhancer** improves text quality
4.  **Preview Portfolio** instantly
5.  **Generate Resume** (ATS-friendly)
6.  Deploy to Netlify or **Download Code as ZIP**

-----

## 🔮 Future Enhancements

  * 🌙 **Dark mode** support
  * 📊 Portfolio **analytics dashboard**
  * 🧩 Additional **template designs**
  * 📧 **Custom domain** integration
  * 🗂️ **Drag-and-drop** section customization
  * 🔔 **Real-time content** editing

-----

## 🧑‍💻 Developer

  * **👨‍💻 Your Name**
  * **🎓 Engineering Student** (Computer Science - 3rd Year)
  * **🏫 Built under Coursvita | Internvita Program**
  * **🔗 LinkedIn | GitHub**

-----

## 📜 License

This project is licensed under the **MIT License** — feel free to use, modify, and share.

-----

## 💡 Acknowledgements

Special thanks to:

  * **Coursvita** for the opportunity and mentorship
  * **Open-source libraries** and contributors that made this project possible

-----

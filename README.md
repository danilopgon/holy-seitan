# 🥦 Holy Seitan

**Holy Seitan** es el recetario vegano en Markdown de [María López Herráiz](https://github.com/mloherr) y [Dani López González](https://github.com/danilopgon).  
Cada receta se escribe en formato `.md`, se guarda en Supabase y se muestra directamente en la web, con un panel de administración y sistema de login.

> A María el Notion free le dijo “hasta aquí”... y en lugar de pagar el plan, hicimos esto. 🤷‍♂️

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1f696553-ae1a-4bfb-aaa3-0725e43a2b8d" />

---

## 🌱 Stack

- **Next.js 15 (App Router)**  
- **Supabase** – Base de datos y autenticación  
- **Drizzle ORM** – Esquema tipado y migraciones  
- **Zustand** – Store global de estado  
- **Shadcn/UI + TailwindCSS** – Interfaz limpia y coherente  

---

🔐 Autenticación

Solo los usuarios registrados (María y Dani) pueden acceder al panel /admin.
El resto de las recetas se pueden ver libremente desde la home.

---

🍳 Funcionalidades

- Listado de recetas con búsqueda

- Renderizado directo de Markdown

- Panel de administración con creación, edición y borrado

- Control de sesión persistente

- API conectada a Supabase

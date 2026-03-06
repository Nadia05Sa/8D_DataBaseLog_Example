# Sistema de Cursos

Sistema de cursos academicos desarrollado con Django REST Framework (Backend) y React + Vite (Frontend).

## Estructura del Proyecto

```
8D_DataBaseLog/
├── Cliente_Curso/              # Frontend React + Vite
│   ├── src/
│   │   ├── CursoApp.jsx        # Componente principal
│   │   └── service/
│   │       └── api.js          # Servicios de conexion API
│   ├── package.json            # Dependencias del frontend
│   └── vite.config.js
│
├── Servidor_Curso/             # Backend Django
│   ├── curso/                  # App principal
│   │   ├── models.py           # Modelo Curso
│   │   ├── views.py            # ViewSets de la API
│   │   ├── serializers.py      # Serializadores
│   │   ├── urls.py             # Rutas de la API
│   │   └── apps.py             # Configuracion de la app
│   ├── Servidor_Curso/
│   │   └── settings.py         # Configuracion Django
│   ├── requirements.txt        # Dependencias del backend
│   └── manage.py
│
└── README.md                   # Este archivo
```

## Instalacion de Dependencias

### Backend (Django)

```bash
cd Servidor_Curso

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver
```

### Frontend (React)

```bash
cd Cliente_Curso

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Endpoints de la API

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/cursos/ | Listar todos los cursos |
| POST | /api/cursos/ | Crear un nuevo curso |
| GET | /api/cursos/{id}/ | Obtener un curso especifico |
| PUT | /api/cursos/{id}/ | Actualizar un curso |
| DELETE | /api/cursos/{id}/ | Eliminar un curso |

## Tecnologias Utilizadas

### Backend
- Python 3.x
- Django 4.2
- Django REST Framework 3.16.1
- django-cors-headers 4.9.0
- MySQL (mysqlclient 2.2.8)

### Frontend
- React 19
- Vite 5
- Bootstrap 5
- Axios
- react-hot-toast

---
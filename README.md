# Sistema de Cursos con Auditoria

Sistema de cursos academicos con registro de auditoria completo, desarrollado con **Django REST Framework** (Backend) y **React + Vite** (Frontend).

---

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
│   │   ├── models.py           # Modelos (Curso, Bitacora)
│   │   ├── views.py            # ViewSets de la API
│   │   ├── serializers.py      # Serializadores
│   │   ├── signals.py          # Senales para bitacora
│   │   ├── middleware.py       # Middleware para capturar request
│   │   ├── urls.py             # Rutas de la API
│   │   └── apps.py             # Configuracion de la app
│   ├── Servidor_Curso/
│   │   └── settings.py         # Configuracion Django
│   ├── requirements.txt        # Dependencias del backend
│   └── manage.py
│
└── README.md                   # Este archivo
```

---

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

# Crear superusuario (opcional)
python manage.py createsuperuser

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

---

## Parte 1: Creacion del Proyecto Django (Backend)

### 1.1 Crear el proyecto y la aplicacion

```bash
# Crear el proyecto Django
   py -m django startproject Servidor_Curso

# Entrar al directorio del proyecto
cd Servidor_Curso

# Crear la aplicacion 'curso'
   py manage.py startapp curso
```

### 1.2 Instalar dependencias

```bash
pip install djangorestframework
pip install django-cors-headers
pip install django-auditlog
pip install mysqlclient
```

### 1.3 Configurar settings.py

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Librerias de terceros
    'auditlog',           # Sistema de auditoria automatica
    'corsheaders',        # Permite peticiones desde React
    'rest_framework',     # Framework para APIs REST
    
    # Aplicaciones del proyecto
    'curso',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS - debe ir arriba
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'auditlog.middleware.AuditlogMiddleware',  # Captura el usuario actual
    'curso.middleware.RequestMiddleware',       # Captura IP y User-Agent
]

# Configurar CORS para permitir peticiones desde el frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Configurar base de datos MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'curso',
        'USER': 'user_curso',
        'PASSWORD': 'contrasena123',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

### 1.4 Crear el modelo Curso (models.py)

```python
from django.db import models
from auditlog.registry import auditlog
from django.contrib.auth.models import User

class Curso(models.Model):
    nombre = models.CharField(max_length=50)
    codigo = models.CharField(max_length=20, unique=True)
    creditos = models.IntegerField()
    profesor = models.CharField(max_length=100)
    cupo_maximo = models.IntegerField()
    estado = models.CharField(
        max_length=10,
        choices=[('ABIERTO', 'Abierto'), ('CERRADO', 'Cerrado')],
        default='ABIERTO',
    )

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

# Registrar el modelo para auditoria automatica con django-auditlog
auditlog.register(Curso)


class Bitacora(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    objeto_id = models.IntegerField()
    objeto_repr = models.CharField(max_length=150, blank=True, default='')
    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Campos tecnicos adicionales
    cambios_json = models.JSONField(blank=True, null=True, default=dict)
    ip_usuario = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, default='')
    content_type = models.CharField(max_length=100, blank=True, default='')
    datos_antes = models.JSONField(blank=True, null=True, default=dict)
    datos_despues = models.JSONField(blank=True, null=True, default=dict)

    class Meta:
        ordering = ['-fecha']
```

### 1.5 Aplicar migraciones

```bash
py manage.py makemigrations
py manage.py migrate
```

---

## Parte 2: Creacion del Proyecto React (Frontend)

### 2.1 Crear el proyecto con Vite

```bash
# Crear proyecto React con Vite
npm create vite@latest Cliente_Curso -- --template react

# Entrar al directorio
cd Cliente_Curso

# Instalar dependencias
npm install
```

### 2.2 Instalar dependencias adicionales

```bash
npm install axios           # Cliente HTTP para consumir la API
npm install bootstrap       # Framework CSS
npm install react-hot-toast # Notificaciones toast
```

### 2.3 Crear el servicio API (src/service/api.js)

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/';

// LISTAR cursos
export const read = () => {
    return axios.get(`${BASE_URL}cursos/`);
};

// CREAR curso
export const create = (data) => {
    return axios.post(`${BASE_URL}cursos/`, data);
};

// ACTUALIZAR curso
export const update = (id, data) => {
    return axios.put(`${BASE_URL}cursos/${id}/`, data);
};

// ELIMINAR curso
export const deleteM = (id) => {
    return axios.delete(`${BASE_URL}cursos/${id}/`);
};

// OBTENER registros de auditoria (bitacora)
export const readBitacora = () => {
    return axios.get(`${BASE_URL}bitacora/`);
};
```

---

## Parte 3: Implementacion de django-auditlog

**django-auditlog** es una libreria que registra automaticamente todos los cambios (CREATE, UPDATE, DELETE) en los modelos de Django.

### 3.1 Instalacion

```bash
pip install django-auditlog
```

### 3.2 Configuracion en settings.py

```python
INSTALLED_APPS = [
    # ... otras apps
    'auditlog',
]

MIDDLEWARE = [
    # ... otros middlewares
    'auditlog.middleware.AuditlogMiddleware',  # IMPORTANTE: despues de AuthenticationMiddleware
]
```

### 3.3 Registrar modelos para auditoria (models.py)

```python
from auditlog.registry import auditlog

class Curso(models.Model):
    # ... campos del modelo

# Registrar el modelo - esto habilita la auditoria automatica
auditlog.register(Curso)
```

### 3.4 Aplicar migraciones de auditlog

```bash
py manage.py migrate
```

### 3.5 Que registra auditlog?

- **Tabla automatica**: `auditlog_logentry`
- **Campos registrados**:
  - `action`: Tipo de accion (0=CREATE, 1=UPDATE, 2=DELETE)
  - `changes`: JSON con los cambios realizados
  - `actor`: Usuario que realizo la accion
  - `timestamp`: Fecha y hora
  - `object_repr`: Representacion del objeto
  - `content_type`: Tipo de modelo

### 3.6 Ver logs en Django Admin

Los logs se pueden ver automaticamente en `/admin/auditlog/logentry/`

---

## Parte 4: Implementacion de Bitacora Personalizada

Ademas de django-auditlog, se implemento una **bitacora personalizada** que se expone a traves de la API REST para mostrar en el frontend con datos tecnicos detallados.

### 4.1 Modelo Bitacora (models.py)

El modelo incluye campos tecnicos adicionales:

| Campo         | Tipo                  | Descripcion                          |
|---------------|-----------------------|--------------------------------------|
| usuario       | ForeignKey            | Usuario que realizo la accion        |
| accion        | CharField             | CREADO, ACTUALIZADO, ELIMINADO       |
| modelo        | CharField             | Nombre del modelo afectado           |
| objeto_id     | IntegerField          | ID del objeto afectado               |
| objeto_repr   | CharField             | Nombre del curso (codigo)            |
| descripcion   | TextField             | Descripcion del cambio               |
| fecha         | DateTimeField         | Fecha y hora del evento              |
| cambios_json  | JSONField             | Cambios en formato JSON              |
| ip_usuario    | GenericIPAddressField | IP del usuario                       |
| user_agent    | TextField             | Navegador/cliente del usuario        |
| content_type  | CharField             | Tipo de contenido tecnico            |
| datos_antes   | JSONField             | Estado del objeto ANTES del cambio   |
| datos_despues | JSONField             | Estado del objeto DESPUES del cambio |

### 4.2 Crear signals para registrar automaticamente (signals.py)

```python
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import Curso, Bitacora
import threading

# Variable local para almacenar datos del request
_request_local = threading.local()

def get_current_request():
    return getattr(_request_local, 'request', None)

def set_current_request(request):
    _request_local.request = request

def get_client_ip(request):
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')

def serializar_modelo(instance):
    try:
        data = model_to_dict(instance)
        for key, value in data.items():
            if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                data[key] = str(value)
        return data
    except Exception:
        return {}

@receiver(pre_save, sender=Curso)
def guardar_datos_antes(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._datos_antes = serializar_modelo(Curso.objects.get(pk=instance.pk))
        except Curso.DoesNotExist:
            instance._datos_antes = {}
    else:
        instance._datos_antes = {}

@receiver(post_save, sender=Curso)
def registrar_guardado(sender, instance, created, **kwargs):
    accion = "CREADO" if created else "ACTUALIZADO"
    request = get_current_request()
    
    datos_antes = getattr(instance, '_datos_antes', {})
    datos_despues = serializar_modelo(instance)
    
    cambios = {}
    if not created and datos_antes:
        for key in datos_despues:
            if key in datos_antes and datos_antes[key] != datos_despues[key]:
                cambios[key] = {
                    'antes': datos_antes[key],
                    'despues': datos_despues[key]
                }

    Bitacora.objects.create(
        usuario=getattr(instance, '_usuario_actual', None),
        accion=accion,
        modelo="Curso",
        objeto_id=instance.id,
        objeto_repr=f"{instance.nombre} ({instance.codigo})",
        descripcion=f"Se {accion.lower()} el curso {instance.nombre}",
        cambios_json=cambios if cambios else datos_despues,
        ip_usuario=get_client_ip(request),
        user_agent=get_user_agent(request),
        content_type="curso.Curso",
        datos_antes=datos_antes if not created else {},
        datos_despues=datos_despues
    )

@receiver(post_delete, sender=Curso)
def registrar_eliminado(sender, instance, **kwargs):
    request = get_current_request()
    datos_antes = serializar_modelo(instance)
    
    Bitacora.objects.create(
        usuario=getattr(instance, '_usuario_actual', None),
        accion="ELIMINADO",
        modelo="Curso",
        objeto_id=instance.id,
        objeto_repr=f"{instance.nombre} ({instance.codigo})",
        descripcion=f"Se elimino el curso {instance.nombre}",
        cambios_json={},
        ip_usuario=get_client_ip(request),
        user_agent=get_user_agent(request),
        content_type="curso.Curso",
        datos_antes=datos_antes,
        datos_despues={}
    )
```

### 4.3 Crear Middleware para capturar request (middleware.py)

```python
from .signals import set_current_request

class RequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_current_request(request)
        response = self.get_response(request)
        set_current_request(None)
        return response
```

### 4.4 Conectar signals en apps.py

```python
from django.apps import AppConfig

class CursoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'curso'

    def ready(self):
        import curso.signals
```

### 4.5 Crear el Serializer (serializers.py)

```python
from rest_framework import serializers
from .models import Bitacora

class BitacoraSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()
    timestamp = serializers.DateTimeField(source='fecha', read_only=True)
    accion_texto = serializers.SerializerMethodField()
    object_repr = serializers.SerializerMethodField()
    actor_nombre = serializers.SerializerMethodField()
    cambios_formateados = serializers.CharField(source='descripcion', read_only=True)
    
    # Campos tecnicos adicionales
    cambios_json = serializers.JSONField(read_only=True)
    ip_usuario = serializers.CharField(read_only=True)
    user_agent = serializers.CharField(read_only=True)
    content_type = serializers.CharField(read_only=True)
    datos_antes = serializers.JSONField(read_only=True)
    datos_despues = serializers.JSONField(read_only=True)

    class Meta:
        model = Bitacora
        fields = [
            'id', 'usuario', 'accion', 'modelo', 'objeto_id', 'descripcion', 'fecha',
            'timestamp', 'accion_texto', 'object_repr', 'actor_nombre', 'cambios_formateados',
            'cambios_json', 'ip_usuario', 'user_agent', 'content_type', 
            'datos_antes', 'datos_despues'
        ]

    def get_actor_nombre(self, obj):
        return str(obj.usuario) if obj.usuario else 'Sistema'

    def get_accion_texto(self, obj):
        mapeo = {'CREADO': 'CREAR', 'ACTUALIZADO': 'ACTUALIZAR', 'ELIMINADO': 'ELIMINAR'}
        return mapeo.get(obj.accion, obj.accion)

    def get_object_repr(self, obj):
        return obj.objeto_repr if obj.objeto_repr else obj.descripcion
```

### 4.6 Crear el ViewSet (views.py)

```python
from rest_framework.viewsets import ReadOnlyModelViewSet
from .models import Bitacora
from .serializers import BitacoraSerializer

class BitacoraViewSet(ReadOnlyModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer
```

### 4.7 Configurar URLs (urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CursoViewSet, BitacoraViewSet

router = DefaultRouter()
router.register(r'cursos', CursoViewSet)
router.register(r'bitacora', BitacoraViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
```

---

## Parte 5: Comparacion auditlog vs Bitacora Personalizada

| Caracteristica      | django-auditlog            | Bitacora Personalizada |
|---------------------|----------------------------|------------------------|
| Instalacion         | Libreria externa           | Codigo propio          |
| Configuracion       | Minima (register)          | Manual (signals)       |
| Campos              | Automaticos (JSON changes) | Personalizables        |
| Acceso              | Django Admin               | API REST / Frontend    |
| IP/User-Agent       | No incluido                | Incluido               |
| Datos antes/despues | JSON compacto              | JSON completo          |
| Flexibilidad        | Limitada                   | Total                  |
| Uso ideal           | Auditoria interna          | Mostrar al usuario     |

### Por que usar ambos?

- **auditlog**: Registro tecnico detallado para administradores
- **Bitacora**: Registro amigable para mostrar en el frontend con datos tecnicos

---

## Parte 6: Ejecucion del Proyecto

### Backend (Django)

```bash
cd Servidor_Curso
py manage.py runserver
```
El servidor estara disponible en: `http://localhost:8000`

### Frontend (React)

```bash
cd Cliente_Curso
npm run dev
```
La aplicacion estara disponible en: `http://localhost:5173`

---

## Endpoints de la API

| Metodo | Endpoint            | Descripcion                   |
|--------|---------------------|-------------------------------|
| GET    | `/api/cursos/`      | Listar todos los cursos       |
| POST   | `/api/cursos/`      | Crear un nuevo curso          |
| GET    | `/api/cursos/{id}/` | Obtener un curso especifico   |
| PUT    | `/api/cursos/{id}/` | Actualizar un curso           |
| DELETE | `/api/cursos/{id}/` | Eliminar un curso             |
| GET    | `/api/bitacora/`    | Listar registros de auditoria |

---

## Tecnologias Utilizadas

### Backend
- Python 3.13
- Django 4.2
- Django REST Framework 3.16.1
- django-auditlog 3.4.1
- django-cors-headers 4.9.0
- MySQL (mysqlclient 2.2.8)

### Frontend
- React 19
- Vite 5
- Bootstrap 5
- Axios
- react-hot-toast

## Datos Tecnicos en el Modal de Auditoria

El modal de detalle de auditoria muestra:

### Columna Izquierda
- ID interno del registro
- Objeto afectado (nombre, object_pk, content_type)
- Usuario responsable
- IP del usuario
- User Agent (navegador)
- Fecha y hora completa

### Columna Derecha
- Cambios en JSON (formato codigo)
- Datos ANTES del cambio (fondo rojo)
- Datos DESPUES del cambio (fondo verde)
- Descripcion del cambio

---

## Notas Importantes

1. **AuditlogMiddleware** debe ir DESPUES de `AuthenticationMiddleware` para capturar el usuario
2. **RequestMiddleware** captura la IP y User-Agent de cada peticion
3. Los **signals** deben importarse en `apps.py` dentro del metodo `ready()`
4. El campo `objeto_repr` almacena "NombreCurso (CODIGO)" para referencia historica
5. Los registros de bitacora son de **solo lectura** (ReadOnlyModelViewSet)
6. Los datos antes/despues se almacenan como JSON completo para comparacion

---

## Archivos de Dependencias

### Backend (requirements.txt)
```
Django==4.2
djangorestframework==3.16.1
django-auditlog==3.4.1
django-cors-headers==4.9.0
mysqlclient==2.2.8
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "axios": "^1.13.6",
    "bootstrap": "^5.3.8",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hot-toast": "^2.6.0"
  }
}
```

---

Desarrollado para la materia de Base de Datos - 2026

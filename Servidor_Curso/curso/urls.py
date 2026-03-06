from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CursoViewSet # <--- Importamos el ViewSet de nuestro curso

# Creamos el router y registramos nuestro ViewSet
router = DefaultRouter()
router.register(r'cursos', CursoViewSet)



urlpatterns = [
    # Incluimos todas las rutas generadas por el router bajo el prefijo 'api/'
    path('api/', include(router.urls)), 
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BitacoraViewSet, CursoViewSet

# Creamos el router y registramos nuestro ViewSet
router = DefaultRouter()
router.register(r'cursos', CursoViewSet)
router.register(r'bitacora', BitacoraViewSet) # <-- Registramos el ViewSet de la bitácora



urlpatterns = [
    # Incluimos todas las rutas generadas por el router bajo el prefijo 'api/'
    path('api/', include(router.urls)), 
]

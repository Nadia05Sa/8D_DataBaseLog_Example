from django.apps import AppConfig

class CursoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'curso'

    def ready(self):
        # Importar el módulo de señales para registrar las señales de auditlog
        import curso.signals
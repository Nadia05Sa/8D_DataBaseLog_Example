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
        choices=[
            ('ABIERTO', 'Abierto'), 
            ('CERRADO', 'Cerrado')
        ],
        default='ABIERTO',
    )

    def abrir(self):
        """Cambia el estado del curso a ABIERTO y guarda el cambio."""
        self.estado = 'ABIERTO'
        self.save()  

    def cerrar(self):
        """Cambia el estado del curso a CERRADO y guarda el cambio."""
        self.estado = 'CERRADO'
        self.save()  

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


auditlog.register(Curso)


class Bitacora(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(max_length=50)
    modelo = models.CharField(max_length=100)
    objeto_id = models.IntegerField()
    objeto_repr = models.CharField(max_length=150, blank=True, default='')
    descripcion = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Campos técnicos adicionales
    cambios_json = models.JSONField(blank=True, null=True, default=dict)
    ip_usuario = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, default='')
    content_type = models.CharField(max_length=100, blank=True, default='')
    datos_antes = models.JSONField(blank=True, null=True, default=dict)
    datos_despues = models.JSONField(blank=True, null=True, default=dict)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Registro de Bitácora'
        verbose_name_plural = 'Registros de Bitácora'

    def __str__(self):
        return f"{self.usuario} - {self.accion} - {self.modelo}"
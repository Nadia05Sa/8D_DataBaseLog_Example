from django.db import models

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



from rest_framework import serializers
from .models import Curso # <--- Aquí va el o los modelos a serializar

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__' 


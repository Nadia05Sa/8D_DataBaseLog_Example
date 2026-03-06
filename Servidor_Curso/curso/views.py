from django.shortcuts import render
from rest_framework import viewsets
from .models import  Curso  # <--- El modelo 
from .serializers import CursoSerializer # <-- El serializador del modelo


class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

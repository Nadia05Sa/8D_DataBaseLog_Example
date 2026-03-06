from django.shortcuts import render
from rest_framework import viewsets
from .models import Bitacora, Curso  # <--- El modelo 
from .serializers import CursoSerializer # <-- El serializador del modelo
from .serializers import BitacoraSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet

class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer


class BitacoraViewSet(ReadOnlyModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer


def perform_create(self, serializer):
    instance = serializer.save()
    instance._usuario_actual = self.request.user

def perform_update(self, serializer):
    instance = serializer.save()
    instance._usuario_actual = self.request.user

def perform_destroy(self, instance):
    instance._usuario_actual = self.request.user
    instance.delete()
from rest_framework import serializers
from .models import Curso # <--- Aquí va el o los modelos a serializar
from .models import Bitacora

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__' 

class BitacoraSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField()
    # Campos mapeados para el frontend
    timestamp = serializers.DateTimeField(source='fecha', read_only=True)
    accion_texto = serializers.SerializerMethodField()
    object_repr = serializers.SerializerMethodField()
    actor_nombre = serializers.SerializerMethodField()
    cambios_formateados = serializers.CharField(source='descripcion', read_only=True)
    
    # Campos técnicos adicionales
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
            # Campos técnicos
            'cambios_json', 'ip_usuario', 'user_agent', 'content_type', 
            'datos_antes', 'datos_despues'
        ]

    def get_actor_nombre(self, obj):
        return str(obj.usuario) if obj.usuario else 'Sistema'

    def get_accion_texto(self, obj):
        # Mapea los nombres de acción de los signals al formato esperado por el frontend
        mapeo_acciones = {
            'CREADO': 'CREAR',
            'ACTUALIZADO': 'ACTUALIZAR',
            'ELIMINADO': 'ELIMINAR'
        }
        return mapeo_acciones.get(obj.accion, obj.accion)

    def get_object_repr(self, obj):
        # Si objeto_repr tiene valor, usarlo; si no, extraer info de la descripción
        if obj.objeto_repr:
            return obj.objeto_repr
        # Fallback para registros antiguos: usar descripción
        return obj.descripcion
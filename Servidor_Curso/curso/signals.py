from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.forms.models import model_to_dict
from .models import Curso, Bitacora
import threading

# Signals para registro de bitácora

# Variable local para almacenar datos del request
_request_local = threading.local()

def get_current_request():
    """Obtiene el request actual del thread local"""
    return getattr(_request_local, 'request', None)

def set_current_request(request):
    """Establece el request actual en el thread local"""
    _request_local.request = request

def get_client_ip(request):
    """Obtiene la IP del cliente"""
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    """Obtiene el user agent del cliente"""
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')

def serializar_modelo(instance):
    """Convierte una instancia del modelo a diccionario"""
    try:
        data = model_to_dict(instance)
        # Convertir valores no serializables a string
        for key, value in data.items():
            if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                data[key] = str(value)
        return data
    except Exception:
        return {}

# Almacenar datos antes del guardado
@receiver(pre_save, sender=Curso)
def guardar_datos_antes(sender, instance, **kwargs):
    """Guarda los datos anteriores antes de actualizar"""
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
    
    # Calcular cambios
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
        descripcion=f"Se eliminó el curso {instance.nombre}",
        cambios_json={},
        ip_usuario=get_client_ip(request),
        user_agent=get_user_agent(request),
        content_type="curso.Curso",
        datos_antes=datos_antes,
        datos_despues={}
    )
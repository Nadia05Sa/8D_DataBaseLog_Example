from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import Curso, Bitacora
import threading

# Variable local para almacenar datos del request
_request_local = threading.local()


def get_current_request():
    return getattr(_request_local, 'request', None)


def set_current_request(request):
    _request_local.request = request


def get_client_ip(request):
    if request is None:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    if request is None:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')


def serializar_modelo(instance):
    try:
        data = model_to_dict(instance)
        for key, value in data.items():
            if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                data[key] = str(value)
        return data
    except Exception:
        return {}


@receiver(pre_save, sender=Curso)
def guardar_datos_antes(sender, instance, **kwargs):
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
        descripcion=f"Se elimino el curso {instance.nombre}",
        cambios_json={},
        ip_usuario=get_client_ip(request),
        user_agent=get_user_agent(request),
        content_type="curso.Curso",
        datos_antes=datos_antes,
        datos_despues={}
    )

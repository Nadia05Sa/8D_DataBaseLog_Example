from .signals import set_current_request


class RequestMiddleware:
    """
    Middleware para capturar el request actual y hacerlo disponible
    en los signals para registrar IP y user_agent en la bitácora.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Almacenar el request en el thread local antes de procesar
        set_current_request(request)
        
        response = self.get_response(request)
        
        # Limpiar el request después de procesar
        set_current_request(None)
        
        return response


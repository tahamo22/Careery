# core/apps.py
from django.apps import AppConfig
import os
import sys
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # ✅ تشغيل signals
        import core.signals  # noqa


# myapp/apps.py


class MyAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp' # Replace with your actual app name

    def ready(self):
        # We check if we are running a server (runserver) or production (uwsgi/gunicorn)
        # and avoid loading models during simple commands like 'migrate' or 'makemigrations'
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv:
            
            # To prevent double loading in auto-reload mode:
            if os.environ.get('RUN_MAIN') == 'true':
                from .ml_models import load_models
                load_models()
            
            # Note: If you run with --noreload, you might need to remove the RUN_MAIN check
            # or just call load_models() directly if double loading isn't an issue for you yet.
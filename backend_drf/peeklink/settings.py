
import os, pathlib
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent

import dotenv
dotenv.load_dotenv()
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
DEBUG = os.environ.get("DEBUG","1") == "1"
ALLOWED_HOSTS = ["*"]
SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "http://127.0.0.1:8000")

INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "rest_framework","corsheaders","app","rest_framework_simplejwt",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "peeklink.urls"
TEMPLATES = [{
    "BACKEND":"django.template.backends.django.DjangoTemplates",
    "DIRS":[BASE_DIR / "templates"],
    "APP_DIRS":True,
    "OPTIONS":{"context_processors":[
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "peeklink.wsgi.application"

# DATABASES = {
#   "default": {
#     "ENGINE":"django.db.backends.postgresql",
#     "NAME": os.environ.get("POSTGRES_DB","peeklink"),
#     "USER": os.environ.get("POSTGRES_USER","peeklink"),
#     "PASSWORD": os.environ.get("POSTGRES_PASSWORD","peeklink"),
#     "HOST": os.environ.get("POSTGRES_HOST","db"),
#     "PORT": int(os.environ.get("POSTGRES_PORT","5432")),
#   }
# }
USE_SQLITE = os.environ.get("DJANGO_USE_SQLITE", "1") == "1"

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "peeklink"),
            "USER": os.environ.get("POSTGRES_USER", "peeklink"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "peeklink"),
            "HOST": os.environ.get("POSTGRES_HOST", "db"),
            "PORT": int(os.environ.get("POSTGRES_PORT", "5432")),
        }
    }

AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"

CORS_ALLOW_ALL_ORIGINS = True
REST_FRAMEWORK = { "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",  
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",  
    ],}
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1") == "1"
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "0") == "1"

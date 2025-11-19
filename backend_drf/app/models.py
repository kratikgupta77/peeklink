from django.conf import settings
from django.db import models
import secrets
from django.utils import timezone


class Link(models.Model):
    id = models.CharField(primary_key=True, max_length=16, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="links",
        null=True,
        blank=True,
    )
    target = models.URLField()
    password_hash = models.CharField(max_length=128, null=True, blank=True)
    require_password = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    analytics_opt_in = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = secrets.token_urlsafe(8)[:12]
        return super().save(*args, **kwargs)


class ClickEvent(models.Model):
    EVENT_CHOICES = (("preview", "preview"), ("redirect", "redirect"))
    link = models.ForeignKey(Link, on_delete=models.CASCADE, related_name="events")
    ts = models.DateTimeField(default=timezone.now, db_index=True)
    event = models.CharField(max_length=16, choices=EVENT_CHOICES)
    verdict_label = models.CharField(max_length=12, default="safe")
    verdict_score = models.FloatField(default=0.0)
    referrer = models.CharField(max_length=256, blank=True, default="")
    ua_hash = models.CharField(max_length=64, blank=True, default="")
    country = models.CharField(max_length=2, blank=True, default="")
    success = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["link", "ts"]),
            models.Index(fields=["verdict_label"]),
        ]


class EmailOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["user", "code"]),
            models.Index(fields=["expires_at"]),
        ]

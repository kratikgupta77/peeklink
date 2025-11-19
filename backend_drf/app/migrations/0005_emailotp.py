from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("app", "0004_link_owner"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailOTP",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=6)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("verified", models.BooleanField(default=False)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="otps", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(
            model_name="emailotp",
            index=models.Index(fields=["user", "code"], name="app_emailo_user_id_e4dca0_idx"),
        ),
        migrations.AddIndex(
            model_name="emailotp",
            index=models.Index(fields=["expires_at"], name="app_emailo_expires_b4237c_idx"),
        ),
    ]


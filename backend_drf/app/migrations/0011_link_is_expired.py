from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0009_link_max_clicks"),
    ]

    operations = [
        migrations.AddField(
            model_name="link",
            name="is_expired",
            field=models.BooleanField(
                default=False, help_text="Flag indicating if link has expired"
            ),
        ),
    ]


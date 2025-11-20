from django.db import migrations


def ensure_max_clicks_column(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(app_link)")
        columns = {row[1] for row in cursor.fetchall()}
        if "max_clicks" not in columns:
            cursor.execute("ALTER TABLE app_link ADD COLUMN max_clicks INTEGER NULL")


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0011_link_is_expired"),
    ]

    operations = [
        migrations.RunPython(
            ensure_max_clicks_column,
            reverse_code=migrations.RunPython.noop,
        )
    ]


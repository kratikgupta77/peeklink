# Generated manually
from django.db import migrations, models


def add_max_clicks_if_not_exists(apps, schema_editor):
    """Add max_clicks column only if it doesn't exist"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("PRAGMA table_info(app_link)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'max_clicks' not in columns:
            # Add the column
            cursor.execute("ALTER TABLE app_link ADD COLUMN max_clicks INTEGER NULL")
        # If column exists, do nothing (no error)


def remove_max_clicks_if_exists(apps, schema_editor):
    """Remove max_clicks column if it exists (reverse migration)"""
    # SQLite doesn't support DROP COLUMN easily, so we'll just leave it
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_rename_app_emailo_user_id_e4dca0_idx_app_emailot_user_id_454128_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(
            add_max_clicks_if_not_exists,
            reverse_code=remove_max_clicks_if_exists,
        ),
    ]


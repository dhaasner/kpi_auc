# Generated by Django 4.2.11 on 2024-03-12 18:29

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('audit_log', '0005_do_nothing'),
    ]

    operations = [
        migrations.RenameIndex(
            model_name='auditlog',
            new_name='audit_log_a_app_lab_2076fe_idx',
            old_fields=('app_label', 'model_name'),
        ),
        migrations.RenameIndex(
            model_name='auditlog',
            new_name='audit_log_a_app_lab_330cca_idx',
            old_fields=('app_label', 'model_name', 'action'),
        ),
    ]

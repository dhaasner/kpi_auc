# Generated by Django 3.2.15 on 2023-04-03 21:46

from django.db import migrations, models

from kpi.constants import ASSET_TYPE_SURVEY
from kpi.models.asset import AssetDeploymentStatus


def populate_deployment_status(apps, schema_editor):
    Asset = apps.get_model('kpi', 'Asset')  # noqa
    batch_size = 2000
    Asset.objects.only('_deployment_status').filter(
        _deployment_data={}, asset_type=ASSET_TYPE_SURVEY
    ).update(_deployment_status=AssetDeploymentStatus.DRAFT)
    qs = Asset.objects.only('_deployment_status', '_deployment_data').exclude(
        _deployment_data={}
    )
    batch = []
    for asset in qs.iterator(chunk_size=batch_size):
        asset._deployment_status = (
            AssetDeploymentStatus.DEPLOYED
            if asset._deployment_data.get('active')  # noqa
            else AssetDeploymentStatus.ARCHIVED
        )
        batch.append(asset)
        if len(batch) >= batch_size:
            Asset.objects.bulk_update(batch, ['_deployment_status'])
            batch = []
    if batch:
        Asset.objects.bulk_update(batch, ['_deployment_status'])


def noop(*args, **kwargs):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('kpi', '0049_add_pending_delete_to_asset'),
    ]

    operations = [
        migrations.AddField(
            model_name='asset',
            name='_deployment_status',
            field=models.CharField(blank=True, choices=[('archived', 'Archived'), ('deployed', 'Deployed'), ('draft', 'Draft')], db_index=True, null=True, max_length=8),
        ),
        migrations.RunPython(populate_deployment_status, noop)
    ]

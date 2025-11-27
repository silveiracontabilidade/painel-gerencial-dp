from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_servicosolicitado_ultimo_fup'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicosolicitado',
            name='removido_em',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='servicosolicitado',
            name='removido_por',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
    ]

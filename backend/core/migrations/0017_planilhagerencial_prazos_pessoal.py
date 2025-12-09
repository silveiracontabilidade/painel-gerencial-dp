from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_feriado'),
    ]

    operations = [
        migrations.AddField(
            model_name='planilhagerencial',
            name='prazo_admissao',
            field=models.CharField(blank=True, db_column='PRAZO_ADMISSAO', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='planilhagerencial',
            name='prazo_ferias',
            field=models.CharField(blank=True, db_column='PRAZO_FERIAS', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='planilhagerencial',
            name='prazo_rescisao',
            field=models.CharField(blank=True, db_column='PRAZO_RESCISAO', max_length=50, null=True),
        ),
    ]

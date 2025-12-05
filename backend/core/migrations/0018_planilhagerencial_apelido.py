from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_planilhagerencial_prazos_pessoal'),
    ]

    operations = [
        migrations.AddField(
            model_name='planilhagerencial',
            name='apelido',
            field=models.CharField(blank=True, db_column='Apelido', max_length=255, null=True),
        ),
    ]

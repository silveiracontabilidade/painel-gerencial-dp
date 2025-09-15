from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Responsavel

class Command(BaseCommand):
    help = "Garante que cada Responsavel tenha um User no auth_user. Cria se não existir, vincula se já existir."

    def handle(self, *args, **options):
        count_new, count_existing = 0, 0
        for r in Responsavel.objects.all():
            username = r.email or r.nome.replace(" ", "").lower()

            # já existe um User com esse username?
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": r.email,
                    "password": "Mudar123"  # vai ser sobrescrito logo abaixo
                }
            )

            if created:
                # define senha padrão
                user.set_password("Mudar123")
                user.save()
                count_new += 1
                self.stdout.write(self.style.SUCCESS(f"✅ User CRIADO: {username}"))
            else:
                count_existing += 1
                self.stdout.write(f"ℹ️ User já existia: {username}")

            # vincula no Responsavel (salva o username no campo CharField)
            if r.usuario != user.username:
                r.usuario = user.username
                r.save(update_fields=["usuario"])

        self.stdout.write(self.style.SUCCESS(
            f"Processo finalizado. Novos: {count_new}, Já existiam: {count_existing}"
        ))

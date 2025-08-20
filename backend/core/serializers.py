from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado,
    AgendaBase
)

# ---------------------- USUÁRIO DJANGO ----------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


# ---------------------- GRUPO GERENCIAL ----------------------
class GrupoGerencialSerializer(serializers.ModelSerializer):
    coordenadora_nome = serializers.StringRelatedField(source='coordenadora', read_only=True)

    class Meta:
        model = GrupoGerencial
        fields = ['id', 'nome', 'coordenadora', 'coordenadora_nome']


# ---------------------- RESPONSÁVEL ----------------------
class ResponsavelSerializer(serializers.ModelSerializer):
    usuario = serializers.CharField() 
    grupo_nome = serializers.StringRelatedField(source='grupo', read_only=True)

    class Meta:
        model = Responsavel
        fields = ['id', 'usuario', 'nome', 'email', 'voip', 'ramal', 'grupo', 'grupo_nome', 'perfil']


# ---------------------- EMPRESA / PLANILHA ----------------------
class PlanilhaGerencialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanilhaGerencial
        fields = '__all__'  # ou liste os campos manualmente


# ---------------------- SERVIÇO ----------------------
class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'prazo_dias', 'tempo_execucao']


# # ---------------------- SERVIÇO SOLICITADO ----------------------
from rest_framework import serializers
from .models import ServicoSolicitado, PlanilhaGerencial

# class ServicoSolicitadoSerializer(serializers.ModelSerializer):
#     empresa_razao_social = serializers.SerializerMethodField()
#     servico_nome = serializers.StringRelatedField(source='servico', read_only=True)

#     class Meta:
#         model = ServicoSolicitado
#         fields = [
#             'id', 'data_solicitacao', 'empresa_id', 'empresa_razao_social',
#             'servico', 'servico_nome', 'competencia', 'identificacao',
#             'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao'
#         ]

#     def get_empresa_razao_social(self, obj):
#         try:
#             empresa = PlanilhaGerencial.objects.get(pk=obj.empresa_id)
#             return empresa.razao_social
#         except PlanilhaGerencial.DoesNotExist:
#             return None
class ServicoSolicitadoSerializer(serializers.ModelSerializer):
    empresa_razao_social = serializers.SerializerMethodField()
    servico_nome = serializers.StringRelatedField(source='servico', read_only=True)

    class Meta:
        model = ServicoSolicitado
        fields = [
            'id', 'data_solicitacao', 'empresa', 'empresa_razao_social',
            'servico', 'servico_nome', 'competencia', 'identificacao',
            'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao'
        ]

    def get_empresa_razao_social(self, obj):
        try:
            from .models import PlanilhaGerencial
            empresa = PlanilhaGerencial.objects.get(cod_folha=obj.empresa)
            return empresa.razao_social
        except PlanilhaGerencial.DoesNotExist:
            return None


# # ---------------------- AGENDA BASE ----------------------
class AgendaBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaBase
        fields = '__all__'

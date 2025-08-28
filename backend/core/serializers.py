from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado,AgendaBase,Sistema, PeriodoEntrega
)
import math
from decimal import Decimal
from rest_framework.fields import CharField



# --------- Saneamento: NaN/"nan" -> "" na saída | "" -> None na entrada ----------
def _sanitize_out(value):
    if isinstance(value, float) and math.isnan(value):
        return ""
    if isinstance(value, Decimal):
        try:
            if math.isnan(float(value)):
                return ""
        except Exception:
            pass
    if isinstance(value, str) and value.strip().lower() == "nan":
        return ""
    return value

def _walk_out(data):
    if isinstance(data, dict):
        return {k: _walk_out(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_walk_out(v) for v in data]
    return _sanitize_out(data)

class BaseSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return _walk_out(rep)

    def to_internal_value(self, data):
        data = dict(data)
        for k, v in list(data.items()):
            if isinstance(v, str) and v.strip() == "":
                field = self.fields.get(k)
                if field:
                    if isinstance(field, CharField) and getattr(field, "allow_blank", False):
                        data[k] = ""
                    else:
                        data[k] = None
        return super().to_internal_value(data)

# ---------------------- Usuário Django ----------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# ---------------------- Grupo Gerencial ----------------------
class GrupoGerencialSerializer(BaseSerializer):
    coordenadora_nome = serializers.StringRelatedField(source='coordenadora', read_only=True)

    class Meta:
        model = GrupoGerencial
        fields = ['id', 'nome', 'coordenadora', 'coordenadora_nome']

# ---------------------- Responsável ----------------------
class ResponsavelSerializer(serializers.ModelSerializer):
    grupo_nome = serializers.StringRelatedField(source='grupo', read_only=True)

    class Meta:
        model = Responsavel
        fields = [
            'id',
            'usuario',     # agora é string
            'nome',
            'email',
            'voip',
            'ramal',
            'grupo',
            'grupo_nome',
            'perfil',
        ]


# ---------------------- Empresa / Planilha ----------------------      
class PlanilhaGerencialSerializer(serializers.ModelSerializer):
    cnpj_formatado = serializers.SerializerMethodField()

    class Meta:
        model = PlanilhaGerencial
        fields = '__all__'  # mantém os originais
        # ou lista manualmente, incluindo 'cnpj_formatado'

    def get_cnpj_formatado(self, obj):
        if not obj.cnpj:
            return None
        cnpj = ''.join(filter(str.isdigit, obj.cnpj))
        if len(cnpj) == 14:
            return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}" 
        elif len(cnpj) == 11:
            return f"{cnpj[:3]}.{cnpj[3:6]}.{cnpj[6:9]}-{cnpj[9:]}"
        return obj.cnpj  # fallback se não tiver 14 dígitos


# ---------------------- Serviço ----------------------
class ServicoSerializer(BaseSerializer):
    class Meta:
        model = Servico
        fields = ['id', 'nome', 'prazo_dias']

# ---------------------- Serviço Solicitado ----------------------
class ServicoSolicitadoSerializer(BaseSerializer):
    empresa_razao_social = serializers.SerializerMethodField(read_only=True)
    servico_nome = serializers.StringRelatedField(source='servico', read_only=True)

    class Meta:
        model = ServicoSolicitado
        fields = [
            'id', 'data_solicitacao', 'empresa', 'empresa_razao_social',
            'servico', 'servico_nome', 'competencia', 'identificacao',
            'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao'
        ]

    def get_empresa_razao_social(self, obj):
        return getattr(obj.empresa, 'razao_social', None)
    

# # # ---------------------- AGENDA BASE ----------------------
class AgendaBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaBase
        fields = '__all__'


# # # ---------------------- SISTEMAS ----------------------
class SistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sistema
        fields = ['id', 'nome']


# # # ---------------------- PERIODOS ----------------------
class PeriodoEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoEntrega
        fields = ['id', 'dia', 'tipo', 'descricao']
        read_only_fields = ['descricao']   # <- não vai ser exigido no POST

    def create(self, validated_data):
        dia = validated_data['dia']
        tipo = validated_data['tipo']
        if tipo == 'DIA_UTIL':
            descricao = f"{dia}º Dia Útil"
        else:
            descricao = f"Dia {dia}"
        validated_data['descricao'] = descricao
        return super().create(validated_data)

    def update(self, instance, validated_data):
        dia = validated_data.get('dia', instance.dia)
        tipo = validated_data.get('tipo', instance.tipo)
        if tipo == 'DIA_UTIL':
            descricao = f"{dia}º Dia Útil"
        else:
            descricao = f"Dia {dia}"
        validated_data['descricao'] = descricao
        return super().update(instance, validated_data)


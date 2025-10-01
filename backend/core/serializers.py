from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado,AgendaBase,Sistema, PeriodoEntrega, CCT, PG_PLR,
    Responsavel,
    MotivoRescisao
    )
import math
from decimal import Decimal
from rest_framework.fields import CharField
from datetime import timedelta
from django.contrib.auth.password_validation import validate_password


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
from django.contrib.auth.models import User

class ResponsavelSerializer(serializers.ModelSerializer):
    grupo_nome = serializers.StringRelatedField(source='grupo', read_only=True)

    class Meta:
        model = Responsavel
        fields = [
            'id',
            'usuario',
            'nome',
            'email',
            'voip',
            'ramal',
            'grupo',
            'grupo_nome',
            'perfil',
            'status',   # 👈 faltava aqui
        ]
        extra_kwargs = {
            'usuario': {'read_only': True},
        }


    def create(self, validated_data):
        # cria User com senha padrão
        user = User.objects.create_user(
            username=validated_data['email'],  # usa o email como login
            email=validated_data['email'],
            password="Mudar123"
        )

        # cria Responsavel vinculado
        responsavel = Responsavel.objects.create(usuario=user, **validated_data)
        return responsavel


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
class ServicoSerializer(serializers.ModelSerializer):
    tempo_execucao = serializers.CharField()  # força string no payload

    # novos campos de anexos
    checklist = serializers.FileField(required=False, allow_null=True)
    instrucao_trabalho = serializers.FileField(required=False, allow_null=True)
    video_explicativo = serializers.FileField(required=False, allow_null=True)
    topico_rapido = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Servico
        fields = "__all__"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.tempo_execucao:
            total_seconds = int(instance.tempo_execucao.total_seconds())
            horas, resto = divmod(total_seconds, 3600)
            minutos, _ = divmod(resto, 60)
            rep["tempo_execucao"] = f"{horas:02d}:{minutos:02d}"
        else:
            rep["tempo_execucao"] = "00:00"
        return rep

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        tempo_str = data.get("tempo_execucao")
        if tempo_str:
            try:
                h, m = map(int, tempo_str.split(":"))
                ret["tempo_execucao"] = timedelta(hours=h, minutes=m)
            except Exception:
                raise serializers.ValidationError({"tempo_execucao": "Formato inválido. Use HH:MM"})
        return ret


# ---------------------- Serviço Solicitado ----------------------

from .models import ServicoSolicitado, PlanilhaGerencial  # garante import de PlanilhaGerencial

class ServicoSolicitadoSerializer(BaseSerializer):
    empresa_razao_social = serializers.SerializerMethodField(read_only=True)
    servico_nome = serializers.StringRelatedField(source='servico', read_only=True)

    class Meta:
        model = ServicoSolicitado
        fields = [
            'id', 'data_solicitacao', 'empresa', 'empresa_razao_social',
            'servico', 'servico_nome', 'competencia', 'identificacao',
            'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao',

            # FÉRIAS
            'ferias_abono', 'ferias_data_ini', 'ferias_tipo',
            'ferias_qtd_dias', 'ferias_qtd_dias_abono',
            'ferias_data_ini_abono', 'ferias_adiantamento',

            # RESCISÃO
            'rescisao_tipo_aviso', 'rescisao_dias_aviso',
            'rescisao_data_ini', 'rescisao_tipo',

            # ADMISSÃO
            'admissao_tipo', 'admissao_data_ini',
            'admissao_deslig_programado', 'admissao_preliminar',

            # AFASTAMENTO
            'afast_tipo', 'afast_dias', 'afast_ini', 'afast_pericia',

            # AVULSO
            'avulso_valor', 'avulso_os',

            # MULTA
            'multa_valor', 'multa_rnc',

            # OUTROS
            'id_acessorias',

            # STATUS
            'status',
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



# # # ---------------------- CCTs ----------------------
class CCTSerializer(serializers.ModelSerializer):
    empresa_nome = serializers.SerializerMethodField()
    # aceita vazio e múltiplos formatos de data
    data_envio = serializers.DateField(
        required=False,
        allow_null=True,
        input_formats=['%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d']
    )

    class Meta:
        model = CCT
        fields = [
            'id',
            'cod_folha',
            'codigo_sindicato',
            'data_envio',
            'ano_base',
            'empresa_nome',
            'cct_link',
            'cct_login',
            'cct_senha',
        ]
        # 👇 Permite string vazia ('') e não obriga envio
        extra_kwargs = {
            'cct_link':  {'required': False, 'allow_blank': True},
            'cct_login': {'required': False, 'allow_blank': True},
            'cct_senha': {'required': False, 'allow_blank': True},
            # se quiser também aceitar null (None), só ative se o model tiver null=True:
            # 'cct_link':  {'required': False, 'allow_blank': True, 'allow_null': True},
            # 'cct_login': {'required': False, 'allow_blank': True, 'allow_null': True},
            # 'cct_senha': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def get_empresa_nome(self, obj):
        try:
            # ajuste se a relação correta for com cod_folha (em vez de cod_folha_520)
            return PlanilhaGerencial.objects.get(cod_folha_520=obj.cod_folha).razao_social
        except PlanilhaGerencial.DoesNotExist:
            return None


# # # ---------------------- PLR ----------------------
class PGPLRSerializer(serializers.ModelSerializer):
    data_entrega = serializers.DateField(required=False, allow_null=True,
                                         input_formats=['%Y-%m-%d','%d-%m-%Y','%Y/%m/%d'])
    class Meta:
        model = PG_PLR
        fields = ['id','cod_folha','numero_sindicato','parcela','valor','mes_pagamento','data_entrega']
        extra_kwargs = {
            'cod_folha':        {'required': False, 'allow_blank': True},
            'numero_sindicato': {'required': False, 'allow_blank': True},
            'parcela':          {'required': False, 'allow_blank': True},
            'mes_pagamento':    {'required': False, 'allow_blank': True},
        }

# usuario e responsável
class UsuarioResponsavelSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    nome = serializers.CharField()
    grupo = serializers.IntegerField()   # id do GrupoGerencial
    perfil = serializers.CharField()
    status = serializers.CharField()

    def create(self, validated_data):
        # cria User
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        # cria Responsavel vinculado
        responsavel = Responsavel.objects.create(
            usuario=validated_data['username'],   # 👈 grava como string
            nome=validated_data['nome'],
            email=validated_data['email'],
            grupo_id=validated_data['grupo'],
            perfil=validated_data['perfil'],
            status=validated_data['status'].upper()  # 👈 garante "SIM"/"NÃO"
        )
        return responsavel
        

class MotivoRescisaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivoRescisao
        fields = ['id', 'descricao', 'mensagem']
        
        
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "As senhas não coincidem."})
        return attrs
        
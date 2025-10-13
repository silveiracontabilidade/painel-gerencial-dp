from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado, AgendaBase, AgendaRegra, Sistema, PeriodoEntrega, CCT, PG_PLR,
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
            'status',
        ]
        extra_kwargs = {
            'usuario': {'required': True, 'allow_blank': False},
        }

    def create(self, validated_data):
        email = validated_data.get('email')
        username = validated_data.get('usuario') or email

        user = User.objects.create_user(
            username=username,
            email=email,
            password="Mudar123"
        )

        dados_responsavel = {**validated_data, 'usuario': username}
        responsavel = Responsavel.objects.create(**dados_responsavel)
        return responsavel

    def update(self, instance, validated_data):
        novo_usuario = validated_data.get('usuario', instance.usuario)
        novo_email = validated_data.get('email', instance.email)

        # 🔥 atualiza também no auth_user
        try:
            user = User.objects.get(username=instance.usuario)
            user.username = novo_usuario
            user.email = novo_email
            user.save()
        except User.DoesNotExist:
            # se não existir, cria
            User.objects.create_user(
                username=novo_usuario,
                email=novo_email,
                password="Mudar123"
            )

        # 🔥 atualiza o Responsavel
        instance.usuario = novo_usuario
        instance.nome = validated_data.get('nome', instance.nome)
        instance.email = novo_email
        instance.voip = validated_data.get('voip', instance.voip)
        instance.ramal = validated_data.get('ramal', instance.ramal)
        instance.grupo = validated_data.get('grupo', instance.grupo)
        instance.perfil = validated_data.get('perfil', instance.perfil)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        return instance




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
    responsavel_nome = serializers.StringRelatedField(source='responsavel', read_only=True)

    class Meta:
        model = ServicoSolicitado
        fields = [
            'id', 'data_solicitacao', 'empresa', 'empresa_razao_social',
            'responsavel', 'responsavel_nome',
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



# # # ---------------------- AGENDA REGRAS ----------------------
class AgendaRegraSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgendaRegra
        fields = ['id', 'campo', 'operador', 'valor', 'conector', 'ordem']


# # # ---------------------- AGENDA BASE ----------------------
class AgendaBaseSerializer(serializers.ModelSerializer):
    servico_nome = serializers.CharField(source='servico.nome', read_only=True)
    regras = AgendaRegraSerializer(many=True, required=False)

    class Meta:
        model = AgendaBase
        fields = '__all__'

    def create(self, validated_data):
        regras_data = validated_data.pop('regras', [])
        agenda = super().create(validated_data)
        self._atualizar_regras(agenda, regras_data)
        return agenda

    def update(self, instance, validated_data):
        regras_data = validated_data.pop('regras', None)
        agenda = super().update(instance, validated_data)
        if regras_data is not None:
            agenda.regras.all().delete()
            self._atualizar_regras(agenda, regras_data)
        return agenda

    def _atualizar_regras(self, agenda, regras_data):
        regras_criadas = []
        for ordem, regra in enumerate(regras_data, start=1):
            regras_criadas.append(
                AgendaRegra(
                    agenda=agenda,
                    campo=regra.get('campo', '').upper(),
                    operador=regra.get('operador', 'IGUAL'),
                    valor=regra.get('valor', ''),
                    conector=regra.get('conector', 'AND'),
                    ordem=regra.get('ordem', ordem),
                )
            )
        if regras_criadas:
            AgendaRegra.objects.bulk_create(regras_criadas)


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
        elif tipo == 'DIAS_ANTES':
            descricao = f"{dia} dias antes"
        else:
            descricao = f"Dia {dia}"
        validated_data['descricao'] = descricao
        return super().create(validated_data)

    def update(self, instance, validated_data):
        dia = validated_data.get('dia', instance.dia)
        tipo = validated_data.get('tipo', instance.tipo)
        if tipo == 'DIA_UTIL':
            descricao = f"{dia}º Dia Útil"
        elif tipo == 'DIAS_ANTES':
            descricao = f"{dia} dias antes"
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
        

from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ReadOnlyModelViewSet
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFilter
from rest_framework import viewsets, filters, pagination
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics, permissions
from rest_framework import status
from rest_framework.decorators import action
from datetime import date, timedelta
from decimal import Decimal
import calendar
import unicodedata
import json
import re
from collections import defaultdict
from django.db.models import Q, Count, Value, Sum
from django.db.models.functions import Coalesce, Upper, Trim
from django.utils.dateparse import parse_date

from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado, 
    AgendaBase, Sistema, PeriodoEntrega, 
    CCT,
    PG_PLR,
    Responsavel,
    Permissao,
    MotivoRescisao,
    TipoAdmissao
)
from .serializers import (
    UserSerializer,
    GrupoGerencialSerializer,
    ResponsavelSerializer,
    PlanilhaGerencialSerializer,
    ServicoSerializer,
    ServicoSolicitadoSerializer, 
    AgendaBaseSerializer, 
    SistemaSerializer, 
    PeriodoEntregaSerializer,
    CCTSerializer,
    PGPLRSerializer,
    UsuarioResponsavelSerializer,
    MotivoRescisaoSerializer,
    TipoAdmissaoSerializer,
    ChangePasswordSerializer
)

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer


class GrupoGerencialViewSet(viewsets.ModelViewSet):
    queryset = GrupoGerencial.objects.all()
    serializer_class = GrupoGerencialSerializer


   
class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.select_related('grupo').order_by('nome')
    serializer_class = ResponsavelSerializer


class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer
    parser_classes = [MultiPartParser, FormParser]



class ServicoSolicitadoViewSet(viewsets.ModelViewSet):
    class ServicoSolicitadoPagination(PageNumberPagination):
        page_size = 100
        page_size_query_param = 'page_size'
        max_page_size = 5_000_000

    queryset = (
        ServicoSolicitado.objects
        .select_related('servico', 'responsavel', 'processo_realizado_por')
        .order_by('-data_solicitacao', '-id')
    )
    serializer_class = ServicoSolicitadoSerializer
    pagination_class = ServicoSolicitadoPagination


class EmpresaPagination(PageNumberPagination):
    # page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 5_000_000

class PlanilhaGerencialFilter(FilterSet):
    cod_folha = CharFilter(lookup_expr='icontains')
    razao_social = CharFilter(lookup_expr='icontains')
    grupo_economico = CharFilter(lookup_expr='icontains')
    cnpj = CharFilter(lookup_expr='icontains')
    status_do_cliente = CharFilter(lookup_expr='exact')
    inicio_contrato_inicio = DateFilter(field_name='inicio_contrato', lookup_expr='gte')
    inicio_contrato_fim = DateFilter(field_name='inicio_contrato', lookup_expr='lte')
    termino_contrato_inicio = DateFilter(field_name='termino_contrato', lookup_expr='gte')
    termino_contrato_fim = DateFilter(field_name='termino_contrato', lookup_expr='lte')
    tributacao = CharFilter(lookup_expr='exact')
    sistema = CharFilter(lookup_expr='exact')
    grupo = CharFilter(lookup_expr='exact')
    resp_dp = CharFilter(lookup_expr='exact')
    ramal = CharFilter(lookup_expr='icontains')
    data_pagto_salario_inicio = DateFilter(field_name='data_pagto_salario', lookup_expr='gte')
    data_pagto_salario_fim = DateFilter(field_name='data_pagto_salario', lookup_expr='lte')
    classificacao = CharFilter(lookup_expr='exact')
    matriz = CharFilter(lookup_expr='exact')
    enviadctf = CharFilter(lookup_expr='exact')
    
    #FILTROS AVANÇADOS
    sci_report = CharFilter(lookup_expr='icontains')
    visitacao = CharFilter(lookup_expr='icontains')
    tempo_demandado = CharFilter(lookup_expr='icontains')
    

    serv_prest = CharFilter(lookup_expr='exact')
    serv_tom = CharFilter(lookup_expr='exact')
    deson = CharFilter(lookup_expr='icontains')
    secconci = CharFilter(lookup_expr='icontains')
    planilha_folha = CharFilter(lookup_expr='exact')
    planilha_convenio = CharFilter(lookup_expr='exact')
    sst = CharFilter(lookup_expr='icontains')
    apura_vt = CharFilter(lookup_expr='exact')
    opc_rec_patronal = CharFilter(lookup_expr='icontains')

    plr = CharFilter(lookup_expr='exact')
    plr_dt_entrega_inicio = DateFilter(field_name='plr_dt_entrega', lookup_expr='gte')
    plr_dt_entrega_fim = DateFilter(field_name='plr_dt_entrega', lookup_expr='lte')
    plr_dt_pagto_inicio = DateFilter(field_name='plr_dt_pagto', lookup_expr='gte')
    plr_dt_pagto_fim = DateFilter(field_name='plr_dt_pagto', lookup_expr='lte')

    adiantamento = CharFilter(lookup_expr='exact')
    perc_adiantamento_min = CharFilter(field_name='perc_adiantamento', lookup_expr='gte')
    perc_adiantamento_max = CharFilter(field_name='perc_adiantamento', lookup_expr='lte')
    dt_adiantamento_entrega_inicio = DateFilter(field_name='dt_adiantamento_entrega', lookup_expr='gte')
    dt_adiantamento_entrega_fim = DateFilter(field_name='dt_adiantamento_entrega', lookup_expr='lte')
    dt_adiantamento_pagamento_inicio = DateFilter(field_name='dt_adiantamento_pagamento', lookup_expr='gte')
    dt_adiantamento_pagamento_fim = DateFilter(field_name='dt_adiantamento_pagamento', lookup_expr='lte')

    periodo_ponto = CharFilter(lookup_expr='icontains')
    tipo_ponto = CharFilter(lookup_expr='icontains')
    ponto_entrega = CharFilter(lookup_expr='icontains')
    ponto_ini = CharFilter(lookup_expr='icontains')
    ponto_fim = CharFilter(lookup_expr='icontains')
    fecha_ponto = CharFilter(lookup_expr='icontains')
    envia_ponto = CharFilter(lookup_expr='exact')
    honorarios_min = CharFilter(field_name='honorarios', lookup_expr='gte')
    honorarios_max = CharFilter(field_name='honorarios', lookup_expr='lte')

    dt_13_entrega_inicio = DateFilter(field_name='dt_13_entrega', lookup_expr='gte')
    dt_13_entrega_fim = DateFilter(field_name='dt_13_entrega', lookup_expr='lte')
    dt_13_adiantamento_entrega_inicio = DateFilter(field_name='dt_13_adiantamento_entrega', lookup_expr='gte')
    dt_13_adiantamento_entrega_fim = DateFilter(field_name='dt_13_adiantamento_entrega', lookup_expr='lte')

    venc_procuracao_inicio = DateFilter(field_name='venc_procuracao', lookup_expr='gte')
    venc_procuracao_fim = DateFilter(field_name='venc_procuracao', lookup_expr='lte')
    venc_fgts_digital_inicio = DateFilter(field_name='venc_fgts_digital', lookup_expr='gte')
    venc_fgts_digital_fim = DateFilter(field_name='venc_fgts_digital', lookup_expr='lte')
    

    class Meta:
        model = PlanilhaGerencial
        fields = '__all__'

# class PlanilhaGerencialViewSet(ReadOnlyModelViewSet):
class PlanilhaGerencialViewSet(viewsets.ModelViewSet):
    """
    ViewSet apenas leitura para a tabela geral_planilha_gerencial (managed=False).
    Suporta paginação, filtros parciais (icontains) e filtros por intervalo de datas.
    """
    queryset = PlanilhaGerencial.objects.all()
    serializer_class = PlanilhaGerencialSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PlanilhaGerencialFilter
    search_fields = ['razao_social', 'cnpj']
    ordering_fields = '__all__'

    pagination_class = EmpresaPagination
    
    lookup_field = 'cod_folha'


class AgendaBaseViewSet(viewsets.ModelViewSet):
    queryset = AgendaBase.objects.select_related('servico').prefetch_related('regras').all()
    serializer_class = AgendaBaseSerializer

    def _usuario_pode_editar(self, request):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            responsavel = Responsavel.objects.get(usuario=request.user.username)
        except Responsavel.DoesNotExist:
            return False
        return (responsavel.perfil or '').lower() in ('admin', 'coordenador')

    def create(self, request, *args, **kwargs):
        if not self._usuario_pode_editar(request):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self._usuario_pode_editar(request):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not self._usuario_pode_editar(request):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self._usuario_pode_editar(request):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='gerar-servicos')
    def gerar_servicos(self, request):
        if not self._usuario_pode_editar(request):
            return Response({'detail': 'Permissão negada.'}, status=status.HTTP_403_FORBIDDEN)
        mes = request.data.get('mes')
        ano = request.data.get('ano')

        try:
            mes = int(mes)
            ano = int(ano)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Informe mês e ano válidos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if mes < 1 or mes > 12 or ano < 2000:
            return Response(
                {'detail': 'Mês deve estar entre 1 e 12 e o ano deve ser maior que 1999.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        competencia = f"{mes:02d}{ano}"
        CAMPO_MAP = {
            'CLASSIFICACAO2': 'classificacao2',
            'SECCONCI': 'secconci',
            'APURA_VT': 'apura_vt',
            'SERV_PREST': 'serv_prest',
            'PLANILHA_CONVENIO': 'planilha_convenio',
            'PLANILHA_FOLHA': 'planilha_folha',
            'DESON': 'deson',
            'ADIANTAMENTO': 'adiantamento',
            'PLR': 'plr',
            'DATA_ENTREGA_FOLHA': 'data_entrega_folha',
            'DT_13_ADIANTAMENTO_ENTREGA': 'dt_13_adiantamento_entrega',
            'DT_13_ENTREGA': 'dt_13_entrega',
            'ENVIA_PONTO': 'envia_ponto',
            'TEM_PAT': 'tem_pat',
        }

        CAMPOS_BOOLEANOS = {
            'SECCONCI',
            'APURA_VT',
            'SERV_PREST',
            'PLANILHA_CONVENIO',
            'PLANILHA_FOLHA',
            'DESON',
            'ADIANTAMENTO',
            'PLR',
            'ENVIA_PONTO',
            'TEM_PAT',
        }

        CAMPOS_PREENCHIMENTO = {'DT_13_ADIANTAMENTO_ENTREGA', 'DT_13_ENTREGA'}

        CAMPOS_PERIODO_EMPRESA = {
            'dt_adiantamento_entrega': 'Entrega do adiantamento',
            'plr_dt_entrega': 'Entrega do PLR',
            'dt_13_adiantamento_entrega': '13º adiantamento',
            'dt_13_entrega': '13º pagamento',
            'ponto_entrega': 'Entrega do ponto',
        }

        def clamp_day(year, month, day):
            ultimo_dia = calendar.monthrange(year, month)[1]
            return min(day, ultimo_dia)

        def deve_rodar(item):
            if not item.usa_data_agenda:
                return True
            periodo = (item.periodo or '').lower()
            alvo_mes = item.mes

            if periodo == 'mensal':
                return True

            if periodo == 'semestral':
                if not alvo_mes:
                    return False
                meses_validos = {alvo_mes, ((alvo_mes + 5) % 12) + 1}
                return mes in meses_validos

            if periodo == 'anual':
                if not alvo_mes:
                    return False
                return mes == alvo_mes

            return False

        def normalizar_texto(valor):
            if valor is None:
                return ''
            texto = unicodedata.normalize('NFKD', str(valor)).encode('ascii', 'ignore').decode('ascii')
            return texto.strip().lower()

        def interpretar_booleano(valor):
            if isinstance(valor, bool):
                return valor
            if isinstance(valor, (int, float)):
                return valor != 0
            if isinstance(valor, str):
                return valor.strip().lower() in {'1', 'true', 't', 'sim', 's', 'yes'}
            return False

        def construir_q(regras):
            if not regras:
                return None

            regras_ordenadas = sorted(regras, key=lambda r: (r.ordem, r.id))
            combinado = None

            for regra in regras_ordenadas:
                campo_upper = (regra.campo or '').upper()
                campo_model = CAMPO_MAP.get(campo_upper)
                if not campo_model:
                    continue

                conector = (regra.conector or 'AND').upper()

                if campo_upper in CAMPOS_BOOLEANOS:
                    valor_normalizado = normalizar_texto(regra.valor or '')
                    if not valor_normalizado or valor_normalizado in {'sim', 's', '1', 'true'}:
                        q = (
                            Q(**{f"{campo_model}__iregex": r'^(\\s)*(sim|s|1|true)(\\s)*$'})
                            | Q(**{f"{campo_model}__iexact": 'Sim'})
                            | Q(**{f"{campo_model}__iexact": 'SIM'})
                        )
                    elif valor_normalizado in {'nao', 'não', 'n', '0', 'false'}:
                        q = (
                            Q(**{f"{campo_model}__iregex": r'^(\\s)*(nao|não|n|0|false)(\\s)*$'})
                            | Q(**{f"{campo_model}__iexact": 'Não'})
                            | Q(**{f"{campo_model}__iexact": 'NAO'})
                        )
                    else:
                        q = Q(**{f"{campo_model}__iexact": (regra.valor or '').strip()})
                elif campo_upper in CAMPOS_PREENCHIMENTO:
                    valor_normalizado = (regra.valor or '').strip().lower()
                    if valor_normalizado in {'nao', 'não', 'vazio', 'nao preenchido', 'não preenchido'}:
                        q = Q(**{f"{campo_model}__isnull": True}) | Q(**{f"{campo_model}__exact": ''})
                    else:
                        q = Q(**{f"{campo_model}__isnull": False}) & ~Q(**{f"{campo_model}__exact": ''})
                else:
                    valor = (regra.valor or '').strip()
                    operador = (regra.operador or 'IGUAL').upper()

                    if operador == 'IGUAL':
                        q = Q(**{f"{campo_model}__iexact": valor})
                    elif operador == 'DIFERENTE':
                        q = ~Q(**{f"{campo_model}__iexact": valor})
                    elif operador == 'CONTEM':
                        q = Q(**{f"{campo_model}__icontains": valor})
                    elif operador == 'NAO_CONTEM':
                        q = ~Q(**{f"{campo_model}__icontains": valor})
                    else:
                        continue

                if combinado is None:
                    combinado = q
                else:
                    if conector == 'OR':
                        combinado = combinado | q
                    else:
                        combinado = combinado & q

            return combinado

        def calcular_nesimo_dia_util(ano, mes, n):
            if n <= 0:
                return date(ano, mes, 1)
            contador = 0
            dia_atual = date(ano, mes, 1)
            ultimo_dia_mes = calendar.monthrange(ano, mes)[1]
            while dia_atual.month == mes:
                if dia_atual.weekday() < 5:
                    contador += 1
                    if contador == n:
                        return dia_atual
                dia_atual += timedelta(days=1)
            # se n maior que quantidade de dias úteis, devolve último útil
            dia_atual = date(ano, mes, ultimo_dia_mes)
            while dia_atual.weekday() >= 5:
                dia_atual -= timedelta(days=1)
            return dia_atual

        def calcular_data_por_periodo(periodo_obj, ano, mes):
            if periodo_obj.tipo == 'DIA':
                return date(ano, mes, clamp_day(ano, mes, periodo_obj.dia))
            if periodo_obj.tipo == 'DIA_UTIL':
                return calcular_nesimo_dia_util(ano, mes, periodo_obj.dia)
            if periodo_obj.tipo == 'DIAS_ANTES':
                ultimo = date(ano, mes, calendar.monthrange(ano, mes)[1])
                return ultimo - timedelta(days=periodo_obj.dia)
            return date(ano, mes, clamp_day(ano, mes, periodo_obj.dia))

        def calcular_datas_item(item, empresa, periodo_por_descricao):
            dia_base = item.dia or 1
            if item.usa_data_agenda or not item.campo_periodo_empresa:
                vencimento = date(ano, mes, clamp_day(ano, mes, dia_base))
                return vencimento, 'agenda'

            campo = item.campo_periodo_empresa
            valor_periodo = getattr(empresa, campo, None)
            if valor_periodo is None or str(valor_periodo).strip() == '':
                return None, 'empresa'

            chave = normalizar_texto(valor_periodo)
            if not chave or chave == 'agenda':
                vencimento = date(ano, mes, clamp_day(ano, mes, dia_base))
                return vencimento, 'agenda'

            periodo = periodo_por_descricao.get(chave)
            if not periodo:
                return None, 'empresa'

            return calcular_data_por_periodo(periodo, ano, mes), 'empresa'

        hoje = date.today()
        queryset_base = self.get_queryset()
        ids_solicitados = None
        itens_nao_encontrados = []
        somente_selecionados = interpretar_booleano(request.data.get('somente_selecionados'))
        total_itens_solicitados = request.data.get('total_itens_solicitados', None)
        if total_itens_solicitados is not None:
            try:
                total_itens_solicitados = int(str(total_itens_solicitados).strip())
            except (TypeError, ValueError):
                total_itens_solicitados = None

        selecionados_bruto = request.data.get('agenda_ids', None)
        if selecionados_bruto is not None:
            if isinstance(selecionados_bruto, str):
                texto = selecionados_bruto.strip()
                if not texto:
                    valores_base = []
                else:
                    try:
                        possivel_json = json.loads(texto)
                    except ValueError:
                        valores_base = [parte.strip() for parte in texto.split(',') if parte.strip()]
                    else:
                        if isinstance(possivel_json, (list, tuple, set)):
                            valores_base = list(possivel_json)
                        else:
                            valores_base = [possivel_json]
            elif isinstance(selecionados_bruto, (list, tuple, set)):
                valores_base = list(selecionados_bruto)
            else:
                valores_base = [selecionados_bruto]

            ids_temp = []
            vistos = set()
            for valor in valores_base:
                try:
                    ident = int(str(valor).strip())
                except (TypeError, ValueError):
                    return Response(
                        {'detail': 'Parâmetro agenda_ids contém valores inválidos.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if ident <= 0 or ident in vistos:
                    continue
                vistos.add(ident)
                ids_temp.append(ident)

            if not ids_temp:
                return Response(
                    {'detail': 'Nenhum item da agenda foi selecionado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            ids_solicitados = ids_temp

        if ids_solicitados is not None and total_itens_solicitados is not None:
            if total_itens_solicitados != len(ids_solicitados):
                return Response(
                    {'detail': 'Quantidade de itens selecionados divergente do informado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if ids_solicitados is not None:
            queryset_selecionada = queryset_base.filter(id__in=ids_solicitados)
            agenda_itens = list(queryset_selecionada)
            ids_encontrados = {item.id for item in agenda_itens}
            itens_nao_encontrados = [ident for ident in ids_solicitados if ident not in ids_encontrados]
            ordem_ids = {ident: idx for idx, ident in enumerate(ids_solicitados)}
            agenda_itens.sort(key=lambda item: ordem_ids.get(item.id, len(ordem_ids)))
        else:
            if somente_selecionados:
                return Response(
                    {'detail': 'Nenhum item da agenda foi selecionado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            agenda_itens = list(queryset_base)

        if not agenda_itens:
            mensagem = 'Nenhum item da agenda encontrado para processamento.'
            if ids_solicitados is not None:
                mensagem = 'Nenhum item da agenda encontrado para os IDs selecionados.'
            return Response({'detail': mensagem}, status=status.HTTP_400_BAD_REQUEST)

        agenda_itens_inativos = [
            item for item in agenda_itens
            if getattr(item, 'ativo', True) is False
        ]
        agenda_itens = [
            item for item in agenda_itens
            if getattr(item, 'ativo', True) is not False
        ]

        if not agenda_itens:
            mensagem = 'Nenhum item da agenda ativo encontrado para processamento.'
            resposta = {'detail': mensagem}
            if agenda_itens_inativos:
                resposta['itens_inativos'] = [item.id for item in agenda_itens_inativos]
            return Response(resposta, status=status.HTTP_400_BAD_REQUEST)

        agenda_ids_processados = [item.id for item in agenda_itens]
        servicos_sem_relacionamento = []
        itens_sem_destino = []
        itens_fora_periodo = []
        itens_sem_empresas = []
        itens_sem_data = []
        campos_regra_invalidos = defaultdict(list)
        total_criados = 0
        total_duplicados = 0
        detalhes = []

        if agenda_itens_inativos:
            for item in agenda_itens_inativos:
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': False,
                    'status': 'ignorado',
                    'motivo': 'Atividade marcada como inativa.',
                    'criadas': 0,
                    'duplicadas': 0,
                })

        periodos_lista = list(PeriodoEntrega.objects.all())
        periodo_por_descricao = {}
        for p in periodos_lista:
            periodo_por_descricao[normalizar_texto(p.descricao)] = p
            periodo_por_descricao[str(p.id)] = p

        empresas_base_qs = PlanilhaGerencial.objects.filter(
            status_do_cliente__iregex=r'(ativo|ativa)'
        ).exclude(
            status_do_cliente__iregex=r'inativ'
        )

        responsaveis_todos = Responsavel.objects.select_related('grupo').all()
        responsaveis_ativos = []
        for resp in responsaveis_todos:
            status_bruto = (resp.status or '').strip()
            status_ascii = unicodedata.normalize('NFKD', status_bruto).encode('ascii', 'ignore').decode('ascii').lower()

            if status_ascii in ('nao', 'inativo', 'false', '0'):
                continue

            responsaveis_ativos.append(resp)

        responsaveis_por_nome = {
            normalizar_texto(resp.nome): resp
            for resp in responsaveis_ativos
        }
        coordenadores_por_grupo = defaultdict(list)
        for resp in responsaveis_ativos:
            if resp.perfil == 'coordenador' and resp.grupo:
                grupo_nome = normalizar_texto(resp.grupo.nome)
                coordenadores_por_grupo[grupo_nome].append(resp)

        detalhes.append({
            'resumo_destinos': {
                'analistas_ativos': len(responsaveis_por_nome),
                'coordenadores_ativos': sum(len(v) for v in coordenadores_por_grupo.values()),
            }
        })
        if ids_solicitados is not None:
            detalhes.append({
                'ids_solicitados': ids_solicitados,
                'ids_processados': agenda_ids_processados,
                'ids_nao_encontrados': itens_nao_encontrados,
            })

        chaves_criadas = set()
        objetos_para_criar = []

        for item in agenda_itens:
            ativo_item = getattr(item, 'ativo', True)
            if not item.servico:
                servicos_sem_relacionamento.append(item.id)
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': ativo_item,
                    'status': 'ignorado',
                    'motivo': 'Item sem serviço associado.',
                    'criadas': 0,
                    'duplicadas': 0,
                })
                continue

            if not deve_rodar(item):
                itens_fora_periodo.append(item.id)
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': ativo_item,
                    'status': 'ignorado',
                    'motivo': 'Itens do período não correspondem ao mês informado.',
                    'criadas': 0,
                    'duplicadas': 0,
                })
                continue

            regras = list(item.regras.all())
            filtro_empresas = construir_q(regras)

            empresas_qs = empresas_base_qs
            if filtro_empresas is not None:
                empresas_qs = empresas_qs.filter(filtro_empresas)

            empresas_selecionadas = list(empresas_qs)

            if (
                item.campo_periodo_empresa
                and item.campo_periodo_empresa not in CAMPOS_PERIODO_EMPRESA
            ):
                itens_sem_data.append(item.id)
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': ativo_item,
                    'status': 'ignorado',
                    'motivo': f"Campo de período '{item.campo_periodo_empresa}' não é suportado.",
                    'criadas': 0,
                    'duplicadas': 0,
                })
                continue

            if not empresas_selecionadas:
                itens_sem_empresas.append(item.id)
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': ativo_item,
                    'status': 'ignorado',
                    'motivo': 'Nenhuma empresa atende às regras configuradas.',
                    'criadas': 0,
                    'duplicadas': 0,
                })
                # registra campos inválidos, se houver
                for regra in regras:
                    if (regra.campo or '').upper() not in CAMPO_MAP:
                        campos_regra_invalidos[item.id].append(regra.campo)
                continue

            tipo = (item.tipo_distribuicao or '').strip().lower()
            if tipo not in ('empresa', 'analista', 'coordenador', 'analista e coordenador'):
                itens_sem_destino.append(item.id)
                detalhes.append({
                    'agenda_id': item.id,
                    'nome': item.nome,
                    'tipo_distribuicao': item.tipo_distribuicao,
                    'periodo': item.periodo,
                    'dia': item.dia,
                    'mes': item.mes,
                    'usa_data_agenda': item.usa_data_agenda,
                    'campo_periodo_empresa': item.campo_periodo_empresa,
                    'ativo': ativo_item,
                    'status': 'ignorado',
                    'motivo': 'Tipo de distribuição não reconhecido.',
                    'criadas': 0,
                    'duplicadas': 0,
                })
                continue

            detalhe_comum = {
                'agenda_id': item.id,
                'nome': item.nome,
                'tipo_distribuicao': item.tipo_distribuicao,
                'periodo': 'mensal' if not item.usa_data_agenda else item.periodo,
                'dia': item.dia,
                'mes': item.mes,
                'usa_data_agenda': item.usa_data_agenda,
                'campo_periodo_empresa': item.campo_periodo_empresa,
                'ativo': ativo_item,
                'fonte_data': 'empresa' if not item.usa_data_agenda else 'agenda',
            }

            criados_item = 0
            duplicados_item = 0
            empresas_processadas = 0
            analistas_nao_encontrados = set()
            coordenadores_nao_encontrados = set()
            agregados_por_responsavel = {}
            responsaveis_gerados = []

            for empresa in empresas_selecionadas:
                codigo_empresa = getattr(empresa, 'cod_folha', None)
                try:
                    codigo_int = int(str(codigo_empresa).strip())
                except (TypeError, ValueError):
                    continue

                vencimento, _ = calcular_datas_item(item, empresa, periodo_por_descricao)
                if not vencimento:
                    itens_sem_data.append(item.id)
                    detalhes.append({
                        **detalhe_comum,
                        'status': 'ignorado',
                        'motivo': f'Empresa {codigo_empresa}: não foi possível determinar a data de entrega.',
                        'criadas': 0,
                        'duplicadas': 0,
                    })
                    continue

                if tipo == 'analista':
                    nome_resp = normalizar_texto(getattr(empresa, 'resp_dp', ''))
                    resp_obj = responsaveis_por_nome.get(nome_resp)
                    if not resp_obj:
                        if nome_resp:
                            analistas_nao_encontrados.add(nome_resp)
                        if item.id not in itens_sem_destino:
                            itens_sem_destino.append(item.id)
                        detalhes.append({
                            **detalhe_comum,
                            'status': 'ignorado',
                            'motivo': f'Empresa {codigo_empresa}: nenhum responsável encontrado para distribuição por analista.',
                            'criadas': 0,
                            'duplicadas': 0,
                        })
                        continue

                    info = agregados_por_responsavel.setdefault(
                        resp_obj.id,
                        {
                            'responsavel': resp_obj,
                            'vencimento': vencimento,
                            'empresas': [],
                            'grupos': set(),
                        }
                    )
                    if vencimento and (info['vencimento'] is None or vencimento < info['vencimento']):
                        info['vencimento'] = vencimento
                    info['empresas'].append(codigo_int)
                    grupo_original = (getattr(empresa, 'grupo', '') or '').strip()
                    if grupo_original:
                        info['grupos'].add(grupo_original)
                    empresas_processadas += 1
                    continue

                if tipo == 'coordenador':
                    grupo_emp = normalizar_texto(getattr(empresa, 'grupo', ''))
                    if not grupo_emp:
                        if item.id not in itens_sem_destino:
                            itens_sem_destino.append(item.id)
                        detalhes.append({
                            **detalhe_comum,
                            'status': 'ignorado',
                            'motivo': f'Empresa {codigo_empresa}: grupo não informado para distribuição por coordenador.',
                            'criadas': 0,
                            'duplicadas': 0,
                        })
                        continue

                    coordenadores_destino = coordenadores_por_grupo.get(grupo_emp)
                    if not coordenadores_destino:
                        grupo_original = (getattr(empresa, 'grupo', '') or '').strip()
                        coordenadores_nao_encontrados.add(grupo_original or grupo_emp)
                        if item.id not in itens_sem_destino:
                            itens_sem_destino.append(item.id)
                        detalhes.append({
                            **detalhe_comum,
                            'status': 'ignorado',
                            'motivo': f'Empresa {codigo_empresa}: nenhum coordenador encontrado para o grupo {grupo_original or grupo_emp}.',
                            'criadas': 0,
                            'duplicadas': 0,
                        })
                        continue

                    grupo_original = (getattr(empresa, 'grupo', '') or '').strip()

                    for coord in coordenadores_destino:
                        info = agregados_por_responsavel.setdefault(
                            coord.id,
                            {
                                'responsavel': coord,
                                'vencimento': vencimento,
                                'empresas': [],
                                'grupos': set(),
                            }
                        )
                        if vencimento and (info['vencimento'] is None or vencimento < info['vencimento']):
                            info['vencimento'] = vencimento
                        info['empresas'].append(codigo_int)
                        if grupo_original:
                            info['grupos'].add(grupo_original)

                    empresas_processadas += 1
                    continue

                responsaveis_destino = []
                if tipo == 'analista e coordenador':
                    nome_resp = normalizar_texto(getattr(empresa, 'resp_dp', ''))
                    resp_obj = responsaveis_por_nome.get(nome_resp)
                    if resp_obj:
                        responsaveis_destino.append(resp_obj)
                    elif nome_resp:
                        analistas_nao_encontrados.add(nome_resp)
                elif tipo != 'analista':
                    nome_resp = normalizar_texto(getattr(empresa, 'resp_dp', ''))
                    resp_obj = responsaveis_por_nome.get(nome_resp)
                    if resp_obj:
                        responsaveis_destino.append(resp_obj)
                    elif nome_resp:
                        analistas_nao_encontrados.add(nome_resp)

                if tipo in ('coordenador', 'analista e coordenador'):
                    grupo_emp_raw = getattr(empresa, 'grupo', '')
                    grupo_emp = normalizar_texto(grupo_emp_raw)
                    if grupo_emp and coordenadores_por_grupo.get(grupo_emp):
                        responsaveis_destino.extend(coordenadores_por_grupo[grupo_emp])
                    else:
                        grupo_original = (grupo_emp_raw or '').strip()
                        if grupo_emp:
                            coordenadores_nao_encontrados.add(grupo_original or grupo_emp)

                if tipo == 'empresa':
                    destinos_empresa = [None]
                elif tipo == 'coordenador':
                    destinos_empresa = responsaveis_destino
                elif tipo == 'analista e coordenador':
                    destinos_empresa = []
                    vistos_resp = set()
                    for resp in responsaveis_destino:
                        if resp.id not in vistos_resp:
                            destinos_empresa.append(resp)
                            vistos_resp.add(resp.id)
                else:  # analista já retornou continue antes
                    destinos_empresa = responsaveis_destino

                if not destinos_empresa:
                    itens_sem_destino.append(item.id)
                    detalhes.append({
                        **detalhe_comum,
                        'status': 'ignorado',
                        'motivo': f'Empresa {codigo_empresa}: nenhum responsável encontrado para o tipo "{tipo}".',
                        'criadas': 0,
                        'duplicadas': 0,
                    })
                    continue

                empresas_processadas += 1

                for responsavel_destino in destinos_empresa:
                    filtros = {
                        'servico': item.servico,
                        'competencia': competencia,
                    }

                    if responsavel_destino is None:
                        filtros['responsavel__isnull'] = True
                    else:
                        filtros['responsavel'] = responsavel_destino

                    filtros['empresa'] = codigo_int
                    filtros['id_agenda'] = str(item.id)

                    chave_dup = (codigo_int, responsavel_destino.id if responsavel_destino else None, item.servico_id, competencia, item.id)
                    if chave_dup in chaves_criadas:
                        duplicados_item += 1
                        continue

                    if ServicoSolicitado.objects.filter(**filtros).exists():
                        duplicados_item += 1
                        continue

                    chaves_criadas.add(chave_dup)
                    objetos_para_criar.append(
                        ServicoSolicitado(
                            data_solicitacao=hoje,
                            empresa=codigo_int,
                            responsavel=responsavel_destino,
                            servico=item.servico,
                            competencia=competencia,
                            identificacao=item.nome,
                            descricao_servico=item.descricao,
                            data_vencimento=vencimento,
                            data_para_resposta=vencimento,
                            avulso_valor=Decimal('0'),
                            multa_valor=Decimal('0'),
                            status='PENDENTE',
                            id_agenda=str(item.id),
                        )
                    )
                    criados_item += 1

            if tipo in ('analista', 'coordenador'):
                if not agregados_por_responsavel:
                    detalhes.append({
                        **detalhe_comum,
                        'status': 'ignorado',
                        'motivo': 'Nenhum responsável elegível encontrado nas empresas do filtro.' if tipo == 'analista' else 'Nenhum coordenador elegível encontrado nas empresas do filtro.',
                        'criadas': 0,
                        'duplicadas': 0,
                    })
                else:
                    for info in agregados_por_responsavel.values():
                        resp_destino = info['responsavel']
                        filtros = {
                            'servico': item.servico,
                            'competencia': competencia,
                            'responsavel': resp_destino,
                            'empresa__isnull': True,
                            'id_agenda': str(item.id),
                        }

                        chave_dup = (None, resp_destino.id, item.servico_id, competencia, item.id)
                        if chave_dup in chaves_criadas:
                            duplicados_item += 1
                            continue

                        if ServicoSolicitado.objects.filter(**filtros).exists():
                            duplicados_item += 1
                            continue

                        chaves_criadas.add(chave_dup)
                        objetos_para_criar.append(
                            ServicoSolicitado(
                                data_solicitacao=hoje,
                                empresa=None,
                                responsavel=resp_destino,
                                servico=item.servico,
                                competencia=competencia,
                                identificacao=item.nome,
                                descricao_servico=item.descricao,
                                data_vencimento=info['vencimento'],
                                data_para_resposta=info['vencimento'],
                                avulso_valor=Decimal('0'),
                                multa_valor=Decimal('0'),
                                status='PENDENTE',
                                id_agenda=str(item.id),
                            )
                        )
                        criados_item += 1
                        responsaveis_gerados.append({
                            'id': resp_destino.id,
                            'nome': resp_destino.nome,
                            'empresas': sorted(set(info['empresas'])),
                            'grupos': sorted({g for g in info.get('grupos', set()) if g}),
                        })


            total_criados += criados_item
            total_duplicados += duplicados_item

            detalhe_item = {
                **detalhe_comum,
                'status': 'processado' if criados_item or duplicados_item else 'ignorado',
                'criadas': criados_item,
                'duplicadas': duplicados_item,
                'empresas_processadas': empresas_processadas,
                'analistas_nao_encontrados': sorted(analistas_nao_encontrados),
                'coordenadores_nao_encontrados': sorted(coordenadores_nao_encontrados),
            }
            if tipo in ('analista', 'coordenador'):
                detalhe_item['responsaveis_gerados'] = responsaveis_gerados

            detalhes.append(detalhe_item)

        if objetos_para_criar:
            ServicoSolicitado.objects.bulk_create(objetos_para_criar)

        resposta = {
            'competencia': competencia,
            'mes': mes,
            'ano': ano,
            'total_criados': total_criados,
            'total_duplicados': total_duplicados,
            'itens_processados': len(agenda_itens),
            'itens_sem_servico': servicos_sem_relacionamento,
            'itens_sem_destino': itens_sem_destino,
            'itens_fora_periodo': itens_fora_periodo,
            'itens_sem_empresas': itens_sem_empresas,
            'itens_sem_data': itens_sem_data,
            'campos_regra_invalidos': {k: v for k, v in campos_regra_invalidos.items()},
            'detalhes': detalhes,
            'somente_selecionados': ids_solicitados is not None,
            'total_itens_solicitados': len(ids_solicitados) if ids_solicitados is not None else len(agenda_itens),
            'resumo_destinos': {
                'analistas_ativos': len(responsaveis_por_nome),
                'coordenadores_ativos': sum(len(v) for v in coordenadores_por_grupo.values()),
            },
        }

        if agenda_itens_inativos:
            resposta['itens_inativos'] = [item.id for item in agenda_itens_inativos]

        if ids_solicitados is not None:
            resposta['itens_solicitados'] = ids_solicitados
            resposta['itens_processados_ids'] = agenda_ids_processados
            resposta['itens_nao_encontrados'] = itens_nao_encontrados

        return Response(resposta, status=status.HTTP_200_OK)


class SistemaViewSet(viewsets.ModelViewSet):
    queryset = Sistema.objects.all()
    serializer_class = SistemaSerializer


class PeriodoEntregaViewSet(viewsets.ModelViewSet):
    queryset = PeriodoEntrega.objects.all()
    serializer_class = PeriodoEntregaSerializer
    
    
class CCTViewSet(viewsets.ModelViewSet):
    serializer_class = CCTSerializer
    queryset = CCT.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        empresa = self.request.query_params.get('empresa')
        if empresa:
            # Se o campo na tabela CCT for 'cod_folha', mantenha assim:
            qs = qs.filter(cod_folha=empresa)

            # Se na sua base a ligação for por 'cod_folha_520', troque para:
            # qs = qs.filter(cod_folha_520=empresa)
        return qs

class PGPLRViewSet(viewsets.ModelViewSet):
    serializer_class = PGPLRSerializer
    queryset = PG_PLR.objects.all().order_by('id')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_sindicato','parcela','mes_pagamento']
    ordering_fields = ['id','numero_sindicato','parcela','mes_pagamento','data_entrega','valor']
    ordering = ['id']

    def get_queryset(self):
        qs = super().get_queryset()
        empresa = self.request.query_params.get('empresa')  # ex.: ?empresa=1234
        if empresa:
            qs = qs.filter(cod_folha=empresa)
        return qs


class UsuarioResponsavelViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioResponsavelSerializer
    queryset = Responsavel.objects.all()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    try:
        responsavel = Responsavel.objects.get(usuario=user.username)
        return Response({
            "id": responsavel.id,
            "nome": responsavel.nome,
            "email": responsavel.email,
            "perfil": responsavel.perfil,
            "grupo": responsavel.grupo_id
        })
    except Responsavel.DoesNotExist:
        return Response({"error": "Responsável não encontrado"}, status=404)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def minhas_permissoes(request):
    try:
        responsavel = Responsavel.objects.get(usuario=request.user.username)
        perfil = responsavel.perfil
    except Responsavel.DoesNotExist:
        return Response({"error": "Responsável não encontrado"}, status=404)

    permissoes = Permissao.objects.filter(perfil=perfil).values("tela", "aba", "campo", "pode_editar")
    return Response(list(permissoes))


class MotivoRescisaoViewSet(viewsets.ModelViewSet):
    queryset = MotivoRescisao.objects.all()
    serializer_class = MotivoRescisaoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descricao', 'mensagem']
    ordering_fields = ['id', 'descricao']
    ordering = ['descricao']


class TipoAdmissaoViewSet(viewsets.ModelViewSet):
    queryset = TipoAdmissao.objects.all()
    serializer_class = TipoAdmissaoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descricao', 'mensagem']
    ordering_fields = ['id', 'descricao']
    ordering = ['descricao']


def _parse_periodo(request):
    inicio = request.query_params.get('start_date')
    fim = request.query_params.get('end_date')
    data_inicio = parse_date(inicio) if inicio else None
    data_fim = parse_date(fim) if fim else None

    if data_inicio and data_fim and data_inicio > data_fim:
        data_inicio, data_fim = data_fim, data_inicio

    return data_inicio, data_fim


def _aplica_periodo_existencia(qs, data_inicio, data_fim):
    if data_fim:
        qs = qs.filter(Q(inicio_contrato__isnull=True) | Q(inicio_contrato__lte=data_fim))
    if data_inicio:
        qs = qs.filter(Q(termino_contrato__isnull=True) | Q(termino_contrato__gte=data_inicio))
    return qs


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_empresas(request):
    data_inicio, data_fim = _parse_periodo(request)

    qs_base = PlanilhaGerencial.objects.all()
    qs_periodo = _aplica_periodo_existencia(qs_base, data_inicio, data_fim)

    ativos_qs = qs_periodo.filter(status_do_cliente__iexact='ATIVO')
    ativos = ativos_qs.count()
    inativos = qs_periodo.filter(status_do_cliente__iexact='INATIVO').count()
    total = qs_periodo.count()

    novas_qs = qs_base.exclude(inicio_contrato__isnull=True)
    if data_inicio:
        novas_qs = novas_qs.filter(inicio_contrato__gte=data_inicio)
    if data_fim:
        novas_qs = novas_qs.filter(inicio_contrato__lte=data_fim)
    novas = novas_qs.count()

    saidas_qs = qs_base.exclude(termino_contrato__isnull=True)
    if data_inicio:
        saidas_qs = saidas_qs.filter(termino_contrato__gte=data_inicio)
    if data_fim:
        saidas_qs = saidas_qs.filter(termino_contrato__lte=data_fim)
    saidas = saidas_qs.count()

    categorias_alvo = ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE']
    categoria_chaves = [cat.lower() for cat in categorias_alvo] + ['nao_classificadas']

    def mapear_classificacao(valor):
        if not valor:
            return 'nao_classificadas'
        normalizado = valor.strip().upper()
        if normalizado in categorias_alvo:
            return normalizado.lower()
        return 'nao_classificadas'

    classificacao_por_grupo_qs = (
        ativos_qs
        .annotate(grupo_label=Trim(Coalesce('grupo', Value('Sem Grupo'))))
        .annotate(grupo_chave=Upper('grupo_label'))
        .annotate(classificacao_valor=Trim(Coalesce('classificacao', Value(''))))
        .annotate(classificacao_upper=Upper('classificacao_valor'))
        .values('grupo_label', 'grupo_chave', 'classificacao_upper')
        .annotate(
            total=Count('cod_folha'),
            honorarios_total=Coalesce(Sum('honorarios'), Value(Decimal('0')))
        )
    )

    responsaveis_por_grupo = defaultdict(set)
    for item in ativos_qs.values('grupo', 'resp_dp'):
        grupo_nome = (item.get('grupo') or 'Sem Grupo').strip() or 'Sem Grupo'
        resp_nome = (item.get('resp_dp') or '').strip()
        if not resp_nome:
            continue
        chave_grupo = grupo_nome.upper()
        responsaveis_por_grupo[chave_grupo].add(resp_nome.upper())

    zero_decimal = Decimal('0')

    def novo_registro_grupo(label):
        registro = {'grupo': label, 'colab': 0}
        for chave in categoria_chaves:
            registro[chave] = {'qtd': 0, 'honorarios': zero_decimal}
        registro['total'] = {'qtd': 0, 'honorarios': zero_decimal}
        return registro

    classificacao_por_grupo_map = {}
    totais_classificacao = {
        chave: {'qtd': 0, 'honorarios': zero_decimal}
        for chave in categoria_chaves
    }
    totais_classificacao['total'] = {'qtd': 0, 'honorarios': zero_decimal}

    for item in classificacao_por_grupo_qs:
        grupo_label = item.get('grupo_label') or 'Sem Grupo'
        grupo_chave = (item.get('grupo_chave') or grupo_label).upper()
        chave_classificacao = mapear_classificacao(item.get('classificacao_upper') or '')
        quantidade = int(item.get('total') or 0)
        honorarios = item.get('honorarios_total') or zero_decimal

        grupo_dados = classificacao_por_grupo_map.get(grupo_chave)
        if grupo_dados is None:
            grupo_dados = novo_registro_grupo(grupo_label)
            classificacao_por_grupo_map[grupo_chave] = grupo_dados
        elif (
            grupo_label
            and grupo_dados['grupo']
            and grupo_dados['grupo'].upper() == grupo_dados['grupo']
        ):
            grupo_dados['grupo'] = grupo_label

        grupo_dados[chave_classificacao]['qtd'] += quantidade
        grupo_dados[chave_classificacao]['honorarios'] += honorarios
        grupo_dados['total']['qtd'] += quantidade
        grupo_dados['total']['honorarios'] += honorarios

        totais_classificacao[chave_classificacao]['qtd'] += quantidade
        totais_classificacao[chave_classificacao]['honorarios'] += honorarios
        totais_classificacao['total']['qtd'] += quantidade
        totais_classificacao['total']['honorarios'] += honorarios

    classificacao_responsaveis_map = defaultdict(
        lambda: defaultdict(
            lambda: {
                'label': '',
                'dados': {
                    chave: {'qtd': 0, 'honorarios': zero_decimal}
                    for chave in categoria_chaves
                },
                'total': {'qtd': 0, 'honorarios': zero_decimal},
            }
        )
    )

    for empresa in ativos_qs.values('grupo', 'resp_dp', 'classificacao', 'honorarios'):
        grupo_label = (empresa.get('grupo') or 'Sem Grupo').strip() or 'Sem Grupo'
        responsavel_label = (empresa.get('resp_dp') or 'Sem Responsável').strip() or 'Sem Responsável'
        grupo_chave = grupo_label.upper()
        responsavel_chave = responsavel_label.upper()
        classificacao_chave = mapear_classificacao((empresa.get('classificacao') or '').strip())
        honorarios_empresa = empresa.get('honorarios') or zero_decimal
        info_resp = classificacao_responsaveis_map[grupo_chave][responsavel_chave]
        if not info_resp['label']:
            info_resp['label'] = responsavel_label
        dados_classe = info_resp['dados'][classificacao_chave]
        dados_classe['qtd'] += 1
        dados_classe['honorarios'] += honorarios_empresa
        info_resp['total']['qtd'] += 1
        info_resp['total']['honorarios'] += honorarios_empresa

    def decimal_para_float(valor):
        if valor is None:
            return 0.0
        if not isinstance(valor, Decimal):
            valor = Decimal(valor)
        return float(valor.quantize(Decimal('0.01')))

    classificacao_por_grupo = []
    total_colaboradores = 0
    for _, dados in sorted(
        classificacao_por_grupo_map.items(),
        key=lambda par: (par[1].get('grupo') or par[0]).upper()
    ):
        linha = {'grupo': dados.get('grupo') or 'Sem Grupo'}
        grupo_chave = (linha['grupo'] or 'Sem Grupo').strip().upper()
        colab = len(responsaveis_por_grupo.get(grupo_chave, set()))
        linha['colab'] = colab
        total_colaboradores += colab
        for chave in categoria_chaves:
            info = dados[chave]
            linha[chave] = {
                'qtd': info['qtd'],
                'honorarios': decimal_para_float(info['honorarios']),
            }
        total_info = dados['total']
        linha['total'] = {
            'qtd': total_info['qtd'],
            'honorarios': decimal_para_float(total_info['honorarios']),
        }
        responsaveis_raw = classificacao_responsaveis_map.get(grupo_chave, {})
        responsaveis_linha = []
        for resp_chave, resp_info in sorted(responsaveis_raw.items(), key=lambda par: par[0]):
            registro_resp = {'responsavel': resp_info['label'] or resp_chave}
            colunas_resp = {}
            for chave in categoria_chaves:
                dados_col = resp_info['dados'][chave]
                valor_formatado = {
                    'qtd': dados_col['qtd'],
                    'honorarios': decimal_para_float(dados_col['honorarios']),
                }
                registro_resp[chave] = valor_formatado
                colunas_resp[chave] = valor_formatado
            total_resp = resp_info['total']
            registro_resp['total'] = {
                'qtd': total_resp['qtd'],
                'honorarios': decimal_para_float(total_resp['honorarios']),
            }
            registro_resp['colunas'] = colunas_resp
            responsaveis_linha.append(registro_resp)
        linha['responsaveis'] = responsaveis_linha
        classificacao_por_grupo.append(linha)

    classificacao_totais = {}
    for chave in categoria_chaves:
        info = totais_classificacao[chave]
        classificacao_totais[chave] = {
            'qtd': info['qtd'],
            'honorarios': decimal_para_float(info['honorarios']),
        }
    info_total = totais_classificacao['total']
    classificacao_totais['total'] = {
        'qtd': info_total['qtd'],
        'honorarios': decimal_para_float(info_total['honorarios']),
    }

    classificacao_resposta = {
        'bronze': classificacao_totais['bronze']['qtd'],
        'prata': classificacao_totais['prata']['qtd'],
        'ouro': classificacao_totais['ouro']['qtd'],
        'diamante': classificacao_totais['diamante']['qtd'],
        'nao_classificadas': classificacao_totais['nao_classificadas']['qtd'],
        'total': classificacao_totais['total']['qtd'],
    }

    total_colaboradores = sum(linha.get('colab', 0) for linha in classificacao_por_grupo)

    movimento_por_resp = {}
    totais_movimento = {
        'entrada': {'qtd': 0, 'honorarios': zero_decimal},
        'saida': {'qtd': 0, 'honorarios': zero_decimal},
    }

    def registrar_movimento(tipo, grupo_nome, resp_nome, qtd, honorarios):
        grupo_label = (grupo_nome or 'Sem Grupo').strip() or 'Sem Grupo'
        resp_label = (resp_nome or 'Sem Responsável').strip() or 'Sem Responsável'
        chave = (grupo_label.upper(), resp_label.upper())
        linha = movimento_por_resp.get(chave)
        if linha is None:
            linha = {
                'grupo': grupo_label,
                'responsavel': resp_label,
                'entrada': {'qtd': 0, 'honorarios': zero_decimal},
                'saida': {'qtd': 0, 'honorarios': zero_decimal},
            }
            movimento_por_resp[chave] = linha
        bloco = linha[tipo]
        bloco['qtd'] += int(qtd or 0)
        bloco['honorarios'] += honorarios or zero_decimal
        total_tipo = totais_movimento[tipo]
        total_tipo['qtd'] += int(qtd or 0)
        total_tipo['honorarios'] += honorarios or zero_decimal

    entradas_por_resp = (
        novas_qs
        .annotate(grupo_label=Trim(Coalesce('grupo', Value('Sem Grupo'))))
        .annotate(resp_label=Trim(Coalesce('resp_dp', Value('Sem Responsável'))))
        .values('grupo_label', 'resp_label')
        .annotate(
            total=Count('cod_folha'),
            honorarios_total=Coalesce(Sum('honorarios'), Value(Decimal('0')))
        )
    )

    for item in entradas_por_resp:
        registrar_movimento(
            'entrada',
            item.get('grupo_label'),
            item.get('resp_label'),
            item.get('total'),
            item.get('honorarios_total'),
        )

    saidas_por_resp = (
        saidas_qs
        .annotate(grupo_label=Trim(Coalesce('grupo', Value('Sem Grupo'))))
        .annotate(resp_label=Trim(Coalesce('resp_dp', Value('Sem Responsável'))))
        .values('grupo_label', 'resp_label')
        .annotate(
            total=Count('cod_folha'),
            honorarios_total=Coalesce(Sum('honorarios'), Value(Decimal('0')))
        )
    )

    for item in saidas_por_resp:
        registrar_movimento(
            'saida',
            item.get('grupo_label'),
            item.get('resp_label'),
            item.get('total'),
            item.get('honorarios_total'),
        )

    movimento_detalhado_linhas = []
    for _, linha in sorted(
        movimento_por_resp.items(),
        key=lambda par: (par[1]['grupo'].upper(), par[1]['responsavel'].upper())
    ):
        movimento_detalhado_linhas.append({
            'grupo': linha['grupo'],
            'responsavel': linha['responsavel'],
            'entrada': {
                'qtd': linha['entrada']['qtd'],
                'honorarios': decimal_para_float(linha['entrada']['honorarios']),
            },
            'saida': {
                'qtd': linha['saida']['qtd'],
                'honorarios': decimal_para_float(linha['saida']['honorarios']),
            },
        })

    movimento_detalhado_totais = {
        tipo: {
            'qtd': valores['qtd'],
            'honorarios': decimal_para_float(valores['honorarios']),
        }
        for tipo, valores in totais_movimento.items()
    }

    def parse_duracao(valor):
        if valor is None:
            return 0
        if isinstance(valor, timedelta):
            return max(0, int(round(valor.total_seconds() / 60)))
        if isinstance(valor, Decimal):
            try:
                numero = float(valor)
                return max(0, int(round(numero)))
            except Exception:
                pass
        if isinstance(valor, (int, float)):
            return max(0, int(round(valor)))
        texto = str(valor).strip()
        if not texto:
            return 0
        texto = texto.replace(' ', '').replace(',', ':').replace('h', ':').replace('H', ':')
        if ':' in texto:
            partes = texto.split(':')
            try:
                horas = int(partes[0] or '0')
            except ValueError:
                horas = 0
            try:
                minutos = int(partes[1] or '0')
            except ValueError:
                minutos = 0
            minutos = max(0, min(minutos, 59))
            return max(0, horas) * 60 + minutos
        if texto.isdigit():
            if len(texto) <= 2:
                return int(texto)
            horas = int(texto[:-2])
            minutos = int(texto[-2:])
            minutos = max(0, min(minutos, 59))
            return max(0, horas) * 60 + minutos
        match = re.match(r'^\D*(\d+)\D+(\d{1,2})\D*$', texto)
        if match:
            horas = int(match.group(1) or 0)
            minutos = int(match.group(2) or 0)
            minutos = max(0, min(minutos, 59))
            return max(0, horas) * 60 + minutos
        return 0

    def formatar_minutos(total_minutos):
        if total_minutos is None:
            total_minutos = 0
        minutos = int(total_minutos)
        if minutos < 0:
            minutos = 0
        horas, resto = divmod(minutos, 60)
        return f"{horas:02d}:{resto:02d}"

    empresas_info = []
    empresas_lookup = {}
    codigos_int_ativos = set()

    for empresa in ativos_qs.values(
        'cod_folha',
        'grupo',
        'resp_dp',
        'tempo_demandado',
        'demanda_folha',
        'demanda_13',
        'demanda_ad_13',
    ):
        cod_bruto = str(empresa.get('cod_folha') or '').strip()
        if not cod_bruto:
            continue
        cod_str = cod_bruto
        try:
            cod_int = str(int(cod_bruto))
        except (TypeError, ValueError):
            cod_int = None

        grupo_label = (empresa.get('grupo') or 'Sem Grupo').strip() or 'Sem Grupo'
        responsavel_label = (empresa.get('resp_dp') or 'Sem Responsável').strip() or 'Sem Responsável'

        tempo_estimado_min = parse_duracao(empresa.get('tempo_demandado'))
        demandas = {
            'demanda_folha': parse_duracao(empresa.get('demanda_folha')),
            'demanda_13': parse_duracao(empresa.get('demanda_13')),
            'demanda_ad_13': parse_duracao(empresa.get('demanda_ad_13')),
        }

        info = {
            'cod_principal': cod_str,
            'codigos': {cod_str},
            'grupo': grupo_label.upper(),
            'responsavel': responsavel_label.upper(),
            'tempo_estimado_min': tempo_estimado_min,
            'demandas': demandas,
        }
        if cod_int:
            info['codigos'].add(cod_int)
            codigos_int_ativos.add(int(cod_int))
        else:
            try:
                codigos_int_ativos.add(int(cod_str))
            except ValueError:
                pass

        empresas_info.append(info)
        for codigo in info['codigos']:
            empresas_lookup[codigo] = info
            empresas_lookup[str(codigo)] = info

    grupos_map = {}
    total_estimado_min = 0
    total_efetivo_min = 0

    for info in empresas_info:
        grupo_key = info['grupo']
        responsavel_key = info['responsavel']
        tempo_est = info['tempo_estimado_min']
        grupo_dados = grupos_map.setdefault(
            grupo_key,
            {
                'grupo': grupo_key,
                'tempo_estimado': 0,
                'tempo_efetivo': 0,
                'responsaveis': {},
            }
        )
        grupo_dados['tempo_estimado'] += tempo_est
        responsavel_dados = grupo_dados['responsaveis'].setdefault(
            responsavel_key,
            {
                'responsavel': responsavel_key,
                'tempo_estimado': 0,
                'tempo_efetivo': 0,
            }
        )
        responsavel_dados['tempo_estimado'] += tempo_est
        total_estimado_min += tempo_est

    servicos_qs = (
        ServicoSolicitado.objects
        .select_related('servico', 'responsavel__grupo')
        .filter(data_conclusao__isnull=False)
    )
    if codigos_int_ativos:
        servicos_qs = servicos_qs.filter(empresa__in=list(codigos_int_ativos))
    if data_inicio:
        servicos_qs = servicos_qs.filter(data_conclusao__gte=data_inicio)
    if data_fim:
        servicos_qs = servicos_qs.filter(data_conclusao__lte=data_fim)

    for solicitacao in servicos_qs:
        tempo_execucao = solicitacao.servico.tempo_execucao if solicitacao.servico else None
        minutos = parse_duracao(tempo_execucao)
        if minutos <= 0:
            continue

        grupo_nome = 'SEM GRUPO'
        responsavel_nome = 'SEM RESPONSÁVEL'

        if solicitacao.responsavel:
            responsavel_nome = (solicitacao.responsavel.nome or 'Sem Responsável').strip().upper() or 'SEM RESPONSÁVEL'
            if solicitacao.responsavel.grupo:
                grupo_nome = (solicitacao.responsavel.grupo.nome or 'Sem Grupo').strip().upper() or 'SEM GRUPO'
        elif solicitacao.empresa is not None:
            info = empresas_lookup.get(solicitacao.empresa) or empresas_lookup.get(str(solicitacao.empresa))
            if info:
                grupo_nome = info['grupo']
                responsavel_nome = info['responsavel']

        grupo_dados = grupos_map.setdefault(
            grupo_nome,
            {
                'grupo': grupo_nome,
                'tempo_estimado': 0,
                'tempo_efetivo': 0,
                'responsaveis': {},
            }
        )
        grupo_dados['tempo_efetivo'] += minutos

        responsavel_dados = grupo_dados['responsaveis'].setdefault(
            responsavel_nome,
            {
                'responsavel': responsavel_nome,
                'tempo_estimado': 0,
                'tempo_efetivo': 0,
            }
        )
        responsavel_dados['tempo_efetivo'] += minutos
        total_efetivo_min += minutos

    tempos_por_grupo = []
    for grupo_nome in sorted(grupos_map.keys()):
        dados = grupos_map[grupo_nome]
        responsaveis_lista = []
        for responsavel_nome in sorted(dados['responsaveis'].keys()):
            resp_dados = dados['responsaveis'][responsavel_nome]
            responsaveis_lista.append({
                'responsavel': responsavel_nome,
                'tempo_estimado': formatar_minutos(resp_dados['tempo_estimado']),
                'tempo_efetivo': formatar_minutos(resp_dados['tempo_efetivo']),
            })
        tempos_por_grupo.append({
            'grupo': grupo_nome,
            'tempo_estimado': formatar_minutos(dados['tempo_estimado']),
            'tempo_efetivo': formatar_minutos(dados['tempo_efetivo']),
            'responsaveis': responsaveis_lista,
        })

    tempos_totais = {
        'tempo_estimado': formatar_minutos(total_estimado_min),
        'tempo_efetivo': formatar_minutos(total_efetivo_min),
    }

    motivos_saida = [
        {
            'motivo': entrada['motivo_normalizado'],
            'quantidade': entrada['total']
        }
        for entrada in (
            saidas_qs
            .annotate(motivo_normalizado=Coalesce(Upper('motivo_termino'), Value('NÃO INFORMADO')))
            .values('motivo_normalizado')
            .annotate(total=Count('cod_folha'))
            .order_by('-total', 'motivo_normalizado')
        )
    ]

    return Response({
        'periodo': {
            'inicio': data_inicio.isoformat() if data_inicio else None,
            'fim': data_fim.isoformat() if data_fim else None,
        },
        'empresas_geral': {
            'ativas': ativos,
            'inativas': inativos,
            'total': total,
        },
        'movimentacao': {
            'novas': novas,
            'saidas': saidas,
        },
        'classificacao_ativas': classificacao_resposta,
        'classificacao_por_grupo': classificacao_por_grupo,
        'classificacao_totais': classificacao_totais,
        'classificacao_colunas': categoria_chaves,
        'colaboradores_total': total_colaboradores,
        'movimentacao_detalhada': {
            'linhas': movimento_detalhado_linhas,
            'totais': movimento_detalhado_totais,
        },
        'motivos_saida': motivos_saida,
        'tempos_por_grupo': {
            'linhas': tempos_por_grupo,
            'totais': tempos_totais,
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_servicos(request):
    data_inicio, data_fim = _parse_periodo(request)
    hoje = date.today()

    empresas_map = {}
    ativos_codigos = set()
    responsavel_map = {
        resp.id: (resp.nome or 'Sem Responsável').strip().upper() or 'SEM RESPONSÁVEL'
        for resp in Responsavel.objects.all()
    }

    for item in PlanilhaGerencial.objects.values(
        'cod_folha',
        'razao_social',
        'grupo',
        'resp_dp',
        'status_do_cliente'
    ):
        cod = str(item.get('cod_folha') or '').strip()
        if not cod:
            continue
        grupo = (item.get('grupo') or 'Sem Grupo').strip() or 'Sem Grupo'
        responsavel = (item.get('resp_dp') or 'Sem Responsável').strip() or 'Sem Responsável'
        ativo = str(item.get('status_do_cliente') or '').strip().upper() == 'ATIVO'
        info = {
            'codigo': cod,
            'razao_social': (item.get('razao_social') or '').strip() or cod,
            'grupo': grupo.upper(),
            'responsavel': responsavel.upper(),
            'ativo': ativo,
        }
        empresas_map[cod] = info
        if cod.isdigit():
            empresas_map[str(int(cod))] = info
            if ativo:
                ativos_codigos.add(int(cod))
        else:
            try:
                cod_int = int(cod)
                empresas_map[str(cod_int)] = info
                if ativo:
                    ativos_codigos.add(cod_int)
            except ValueError:
                pass

    STATUS_ABERTOS = ('PENDENTE', 'PAUSADO')

    base_qs = ServicoSolicitado.objects.select_related('servico', 'responsavel')

    atrasados = []
    atrasados_qs = base_qs.filter(
        status__in=STATUS_ABERTOS,
        data_para_resposta__lt=hoje,
        data_para_resposta__isnull=False,
    ).order_by('data_para_resposta')

    for item in atrasados_qs:
        empresa_info = empresas_map.get(str(item.empresa))
        if not empresa_info or not empresa_info['ativo']:
            continue
        data_resposta = item.data_para_resposta
        dias_atraso = (hoje - data_resposta).days if data_resposta else 0
        if dias_atraso < 0:
            dias_atraso = 0
        responsavel_label = item.responsavel.nome.upper() if item.responsavel else empresa_info['responsavel']
        servico_nome = item.servico.nome if item.servico else ''
        detalhe = (item.identificacao or '').strip() or (item.descricao_servico or '').strip()
        atrasados.append({
            'id': item.id,
            'responsavel': responsavel_label or 'SEM RESPONSÁVEL',
            'empresa': empresa_info['razao_social'],
            'servico': servico_nome,
            'detalhe': detalhe,
            'data_resposta': data_resposta.isoformat() if data_resposta else None,
            'dias_em_atraso': dias_atraso,
        })

    vencem_hoje = []
    vencem_hoje_qs = base_qs.filter(
        status__in=STATUS_ABERTOS,
        data_para_resposta=hoje,
    )

    for item in vencem_hoje_qs:
        empresa_info = empresas_map.get(str(item.empresa))
        if not empresa_info or not empresa_info['ativo']:
            continue
        responsavel_label = item.responsavel.nome.upper() if item.responsavel else empresa_info['responsavel']
        servico_nome = item.servico.nome if item.servico else ''
        detalhe = (item.identificacao or '').strip() or (item.descricao_servico or '').strip()
        vencem_hoje.append({
            'id': item.id,
            'responsavel': responsavel_label or 'SEM RESPONSÁVEL',
            'empresa': empresa_info['razao_social'],
            'servico': servico_nome,
            'detalhe': detalhe,
            'data_resposta': hoje.isoformat(),
            'dias_em_atraso': 0,
        })

    resumo_por_grupo = {}
    totais_resumo = {
        'fechados_periodo': 0,
        'vencer_7': 0,
        'vencer_15': 0,
        'vencer_30': 0,
    }

    def registrar_resumo(info_empresa, responsavel_label, chave):
        grupo_chave = (info_empresa['grupo'] or 'SEM GRUPO').upper()
        resp_chave = (responsavel_label or info_empresa['responsavel'] or 'SEM RESPONSÁVEL').upper()

        grupo_dados = resumo_por_grupo.setdefault(
            grupo_chave,
            {
                'grupo': grupo_chave,
                'fechados_periodo': 0,
                'vencer_7': 0,
                'vencer_15': 0,
                'vencer_30': 0,
                'responsaveis': {},
            }
        )
        grupo_dados[chave] += 1

        responsavel_dados = grupo_dados['responsaveis'].setdefault(
            resp_chave,
            {
                'responsavel': resp_chave,
                'fechados_periodo': 0,
                'vencer_7': 0,
                'vencer_15': 0,
                'vencer_30': 0,
            }
        )
        responsavel_dados[chave] += 1
        totais_resumo[chave] += 1

    fechados_qs = base_qs.filter(
        status='CONCLUIDO',
        data_conclusao__isnull=False,
    )
    if data_inicio:
        fechados_qs = fechados_qs.filter(data_conclusao__gte=data_inicio)
    if data_fim:
        fechados_qs = fechados_qs.filter(data_conclusao__lte=data_fim)

    for item in fechados_qs:
        empresa_info = empresas_map.get(str(item.empresa))
        if not empresa_info or not empresa_info['ativo']:
            continue
        responsavel_label = item.responsavel.nome.upper() if item.responsavel else empresa_info['responsavel']
        registrar_resumo(empresa_info, responsavel_label, 'fechados_periodo')

    if ativos_codigos:
        abertos_qs = base_qs.filter(
            status__in=STATUS_ABERTOS,
            empresa__in=list(ativos_codigos),
            data_para_resposta__isnull=False,
        )

        for item in abertos_qs.values('empresa', 'data_para_resposta', 'responsavel_id'):
            empresa_codigo = item.get('empresa')
            info_empresa = empresas_map.get(str(empresa_codigo))
            if not info_empresa or not info_empresa['ativo']:
                continue

            data_resposta = item.get('data_para_resposta')
            if not data_resposta:
                continue

            if data_resposta < hoje:
                continue

            dias = (data_resposta - hoje).days
            if dias <= 7:
                chave = 'vencer_7'
            elif dias <= 15:
                chave = 'vencer_15'
            elif dias <= 30:
                chave = 'vencer_30'
            else:
                continue

            responsavel_label = responsavel_map.get(item.get('responsavel_id')) if item.get('responsavel_id') else None
            if not responsavel_label:
                responsavel_label = info_empresa['responsavel']
            registrar_resumo(info_empresa, responsavel_label, chave)

    linhas_resumo = []
    for grupo_nome in sorted(resumo_por_grupo.keys()):
        dados = resumo_por_grupo[grupo_nome]
        responsaveis_list = []
        for resp_nome in sorted(dados['responsaveis'].keys()):
            resp_dados = dados['responsaveis'][resp_nome]
            responsaveis_list.append({
                'responsavel': resp_dados['responsavel'],
                'fechados_periodo': resp_dados['fechados_periodo'],
                'vencer_7': resp_dados['vencer_7'],
                'vencer_15': resp_dados['vencer_15'],
                'vencer_30': resp_dados['vencer_30'],
            })
        linhas_resumo.append({
            'grupo': dados['grupo'],
            'fechados_periodo': dados['fechados_periodo'],
            'vencer_7': dados['vencer_7'],
            'vencer_15': dados['vencer_15'],
            'vencer_30': dados['vencer_30'],
            'responsaveis': responsaveis_list,
        })

    resumo_totais = {
        'fechados_periodo': totais_resumo['fechados_periodo'],
        'vencer_7': totais_resumo['vencer_7'],
        'vencer_15': totais_resumo['vencer_15'],
        'vencer_30': totais_resumo['vencer_30'],
    }

    return Response({
        'periodo': {
            'inicio': data_inicio.isoformat() if data_inicio else None,
            'fim': data_fim.isoformat() if data_fim else None,
        },
        'atrasados': atrasados,
        'vencem_hoje': vencem_hoje,
        'resumo_grupo': {
            'linhas': linhas_resumo,
            'totais': resumo_totais,
        },
    })


#--------- ALTERAÇÃO DE SENHA ------------
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": "Senha atual incorreta."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"status": "Senha alterada com sucesso."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ------------- RESET DE SENHA PELO ADMIN -------------

# class UserViewSet(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer

#     @action(detail=True, methods=['post'], url_path='reset-password')
#     def reset_password(self, request, pk=None):
#         user = self.get_object()
#         user.set_password("Mudar123")
#         user.save()
#         return Response({"status": "Senha redefinida para Mudar123"}, status=status.HTTP_200_OK)
    

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'  # 👈 força lookup pelo username
    lookup_value_regex = '[^/]+'

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, username=None):
        user = self.get_object()
        user.set_password("Mudar123")
        user.save()
        return Response({"status": "Senha redefinida para Mudar123"}, status=status.HTTP_200_OK)


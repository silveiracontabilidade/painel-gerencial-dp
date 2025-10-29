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
from collections import defaultdict
from django.db.models import Q

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
        max_page_size = 5000

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
    max_page_size = 2000

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
            if item.usa_data_agenda or not item.campo_periodo_empresa:
                vencimento = date(ano, mes, clamp_day(ano, mes, item.dia))
                return vencimento

            campo = item.campo_periodo_empresa
            valor_periodo = getattr(empresa, campo, None)
            if not valor_periodo:
                return None

            chave = normalizar_texto(valor_periodo)
            periodo = periodo_por_descricao.get(chave)
            if not periodo:
                return None

            return calcular_data_por_periodo(periodo, ano, mes)

        hoje = date.today()
        agenda_itens = list(self.get_queryset())
        servicos_sem_relacionamento = []
        itens_sem_destino = []
        itens_fora_periodo = []
        itens_sem_empresas = []
        itens_sem_data = []
        campos_regra_invalidos = defaultdict(list)
        total_criados = 0
        total_duplicados = 0
        detalhes = []

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

        chaves_criadas = set()
        objetos_para_criar = []

        for item in agenda_itens:
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
                'periodo': item.periodo,
                'dia': item.dia,
                'mes': item.mes,
                'usa_data_agenda': item.usa_data_agenda,
                'campo_periodo_empresa': item.campo_periodo_empresa,
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

                vencimento = calcular_datas_item(item, empresa, periodo_por_descricao)
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
                        }
                    )
                    if vencimento and (info['vencimento'] is None or vencimento < info['vencimento']):
                        info['vencimento'] = vencimento
                    info['empresas'].append(codigo_int)
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
                    grupo_emp = normalizar_texto(getattr(empresa, 'grupo', ''))
                    if grupo_emp and coordenadores_por_grupo.get(grupo_emp):
                        responsaveis_destino.extend(coordenadores_por_grupo[grupo_emp])
                    else:
                        if grupo_emp:
                            coordenadores_nao_encontrados.add(grupo_emp)

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

                    chave_dup = (codigo_int, responsavel_destino.id if responsavel_destino else None, item.servico_id, competencia)
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
                        )
                    )
                    criados_item += 1

            if tipo == 'analista':
                if not agregados_por_responsavel:
                    detalhes.append({
                        **detalhe_comum,
                        'status': 'ignorado',
                        'motivo': 'Nenhum responsável elegível encontrado nas empresas do filtro.',
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
                        }

                        chave_dup = (None, resp_destino.id, item.servico_id, competencia)
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
                            )
                        )
                        criados_item += 1
                        responsaveis_gerados.append({
                            'id': resp_destino.id,
                            'nome': resp_destino.nome,
                            'empresas': sorted(set(info['empresas'])),
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
            if tipo == 'analista':
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
            'resumo_destinos': {
                'analistas_ativos': len(responsaveis_por_nome),
                'coordenadores_ativos': sum(len(v) for v in coordenadores_por_grupo.values()),
            },
        }

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


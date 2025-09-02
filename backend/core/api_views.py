from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ReadOnlyModelViewSet
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFilter
from rest_framework import viewsets, filters, pagination
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado, 
    AgendaBase, Sistema, PeriodoEntrega, 
    CCT,
    PG_PLR
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
    PGPLRSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class GrupoGerencialViewSet(viewsets.ModelViewSet):
    queryset = GrupoGerencial.objects.all()
    serializer_class = GrupoGerencialSerializer


   
class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.select_related('grupo').order_by('nome')
    serializer_class = ResponsavelSerializer


class ServicoViewSet(viewsets.ModelViewSet):
    queryset = Servico.objects.all()
    serializer_class = ServicoSerializer


class ServicoSolicitadoViewSet(viewsets.ModelViewSet):
    queryset = ServicoSolicitado.objects.select_related('servico').all()
    serializer_class = ServicoSolicitadoSerializer


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
    queryset = AgendaBase.objects.all()
    serializer_class = AgendaBaseSerializer


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


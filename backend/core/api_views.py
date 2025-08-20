from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework import filters  # para OrderingFilter e SearchFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateFilter
from rest_framework import viewsets, filters, pagination
from django.contrib.auth.models import User
from .models import (
    GrupoGerencial,
    Responsavel,
    PlanilhaGerencial,
    Servico,
    ServicoSolicitado, 
    AgendaBase
)
from .serializers import (
    UserSerializer,
    GrupoGerencialSerializer,
    ResponsavelSerializer,
    PlanilhaGerencialSerializer,
    ServicoSerializer,
    ServicoSolicitadoSerializer, 
    AgendaBaseSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class GrupoGerencialViewSet(viewsets.ModelViewSet):
    queryset = GrupoGerencial.objects.all()
    serializer_class = GrupoGerencialSerializer


class ResponsavelViewSet(viewsets.ModelViewSet):
    queryset = Responsavel.objects.select_related('grupo').all()
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

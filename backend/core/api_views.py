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
    MotivoRescisao
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


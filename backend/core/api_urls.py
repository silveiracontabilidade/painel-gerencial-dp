from rest_framework.routers import DefaultRouter
from .api_views import (
    UserViewSet,
    GrupoGerencialViewSet,
    ResponsavelViewSet,
    PlanilhaGerencialViewSet,
    ServicoViewSet,
    ServicoSolicitadoViewSet, 
    AgendaBaseViewSet, 
    SistemaViewSet,
    PeriodoEntregaViewSet,
    CCTViewSet,
    PGPLRViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'grupos', GrupoGerencialViewSet)
router.register(r'responsaveis', ResponsavelViewSet)
router.register(r'empresas', PlanilhaGerencialViewSet)
router.register(r'servicos', ServicoViewSet)
router.register(r'solicitacoes', ServicoSolicitadoViewSet)
router.register(r'agenda-base', AgendaBaseViewSet)
router.register(r'sistemas', SistemaViewSet)
router.register(r'periodos-entrega', PeriodoEntregaViewSet)
router.register(r'ccts', CCTViewSet)   # <-- registra aqui
router.register(r'pg-plr', PGPLRViewSet, basename='pg-plr')


urlpatterns = router.urls

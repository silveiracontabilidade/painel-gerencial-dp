from rest_framework.routers import DefaultRouter
from .api_views import (
    UserViewSet,
    GrupoGerencialViewSet,
    ResponsavelViewSet,
    PlanilhaGerencialViewSet,
    ServicoViewSet,
    ServicoSolicitadoViewSet, 
    AgendaBaseViewSet
)

router = DefaultRouter()
router.register(r'usuarios', UserViewSet)
router.register(r'grupos', GrupoGerencialViewSet)
router.register(r'responsaveis', ResponsavelViewSet)
router.register(r'empresas', PlanilhaGerencialViewSet)
router.register(r'servicos', ServicoViewSet)
router.register(r'solicitacoes', ServicoSolicitadoViewSet)
router.register(r'agenda-base', AgendaBaseViewSet)

urlpatterns = router.urls

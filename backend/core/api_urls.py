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
    PGPLRViewSet,
    UsuarioResponsavelViewSet,
    me,
    minhas_permissoes
)
from django.urls import path, include
from django.conf import settings

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
router.register(r'ccts', CCTViewSet)   
router.register(r'pg-plr', PGPLRViewSet, basename='pg-plr')
router.register(r'usuarios-responsaveis', UsuarioResponsavelViewSet, basename='usuarios-responsaveis')


urlpatterns = router.urls + [
    path("me/", me, name="me"),
    path("permissoes/mine/", minhas_permissoes),
    ]



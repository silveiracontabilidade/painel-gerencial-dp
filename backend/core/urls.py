from django.urls import path, include
from .views import (
    login_view, logout_view, teste_api, pagina_restrita,

    GrupoListView, GrupoCreateView, GrupoUpdateView, GrupoDeleteView,
    ResponsavelListView, ResponsavelCreateView, ResponsavelUpdateView, ResponsavelDeleteView,
    ServicoListView, ServicoCreateView, ServicoUpdateView, ServicoDeleteView,
    ServicoSolicitadoListView, ServicoSolicitadoCreateView, ServicoSolicitadoUpdateView, ServicoSolicitadoDeleteView,
    AgendaBaseListView, AgendaBaseCreateView, AgendaBaseUpdateView, AgendaBaseDeleteView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('api/teste/', teste_api, name='api_teste'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('restrito/', pagina_restrita, name='restrito'),
    
    # APIs REST
    path('api/', include('core.api_urls')),

    # Grupos Gerenciais
    path('grupos/', GrupoListView.as_view(), name='grupo_listar'),
    path('grupos/novo/', GrupoCreateView.as_view(), name='grupo_criar'),
    path('grupos/<int:pk>/editar/', GrupoUpdateView.as_view(), name='grupo_editar'),
    path('grupos/<int:pk>/excluir/', GrupoDeleteView.as_view(), name='grupo_excluir'),

    # Responsáveis
    path('responsaveis/', ResponsavelListView.as_view(), name='responsavel_listar'),
    path('responsaveis/novo/', ResponsavelCreateView.as_view(), name='responsavel_criar'),
    path('responsaveis/<int:pk>/editar/', ResponsavelUpdateView.as_view(), name='responsavel_editar'),
    path('responsaveis/<int:pk>/excluir/', ResponsavelDeleteView.as_view(), name='responsavel_excluir'),

    # Serviços
    path('servicos/', ServicoListView.as_view(), name='servico_listar'),
    path('servicos/novo/', ServicoCreateView.as_view(), name='servico_criar'),
    path('servicos/<int:pk>/editar/', ServicoUpdateView.as_view(), name='servico_editar'),
    path('servicos/<int:pk>/excluir/', ServicoDeleteView.as_view(), name='servico_excluir'),

    # Serviços Solicitados
    path('solicitacoes/', ServicoSolicitadoListView.as_view(), name='servico_solicitado_listar'),
    path('solicitacoes/novo/', ServicoSolicitadoCreateView.as_view(), name='servico_solicitado_criar'),
    path('solicitacoes/<int:pk>/editar/', ServicoSolicitadoUpdateView.as_view(), name='servico_solicitado_editar'),
    path('solicitacoes/<int:pk>/excluir/', ServicoSolicitadoDeleteView.as_view(), name='servico_solicitado_excluir'),
    
    # Agenda Base
    path('agenda-base/', AgendaBaseListView.as_view(), name='agenda_base_listar'),
    path('agenda-base/novo/', AgendaBaseCreateView.as_view(), name='agenda_base_criar'),
    path('agenda-base/<int:pk>/editar/', AgendaBaseUpdateView.as_view(), name='agenda_base_editar'),
    path('agenda-base/<int:pk>/excluir/', AgendaBaseDeleteView.as_view(), name='agenda_base_excluir'),
    
    # Login
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),         # login
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),        # refresh

]

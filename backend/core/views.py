from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy

from .models import (
    GrupoGerencial,
    Responsavel,
    Servico,
    ServicoSolicitado, 
    AgendaBase
)


# ------------------------ AUTENTICAÇÃO ------------------------

def teste_api(request):
    return JsonResponse({'msg': 'API Django respondendo com sucesso!'})


def login_view(request):
    if request.method == 'POST':
        usuario = request.POST.get('username')
        senha = request.POST.get('password')
        user = authenticate(request, username=usuario, password=senha)
        if user is not None:
            login(request, user)
            return redirect('/')  # ou outra URL protegida
        else:
            return render(request, 'login.html', {'erro': 'Usuário ou senha inválidos'})
    return render(request, 'login.html')


def logout_view(request):
    logout(request)
    return redirect('/login/')


@login_required
def pagina_restrita(request):
    return render(request, 'restrito.html')


# ------------------------ DECORADOR PADRÃO ------------------------

decoradores = [login_required]


# ------------------------ GRUPO GERENCIAL ------------------------

@method_decorator(decoradores, name='dispatch')
class GrupoListView(ListView):
    model = GrupoGerencial
    template_name = 'grupo/listar.html'
    context_object_name = 'grupos'

@method_decorator(decoradores, name='dispatch')
class GrupoCreateView(CreateView):
    model = GrupoGerencial
    fields = ['nome', 'coordenadora']
    template_name = 'grupo/form.html'
    success_url = reverse_lazy('grupo_listar')

@method_decorator(decoradores, name='dispatch')
class GrupoUpdateView(UpdateView):
    model = GrupoGerencial
    fields = ['nome', 'coordenadora']
    template_name = 'grupo/form.html'
    success_url = reverse_lazy('grupo_listar')

@method_decorator(decoradores, name='dispatch')
class GrupoDeleteView(DeleteView):
    model = GrupoGerencial
    template_name = 'grupo/confirmar_exclusao.html'
    success_url = reverse_lazy('grupo_listar')


# ------------------------ RESPONSÁVEL ------------------------

@method_decorator(decoradores, name='dispatch')
class ResponsavelListView(ListView):
    model = Responsavel
    template_name = 'responsavel/listar.html'
    context_object_name = 'responsaveis'

@method_decorator(decoradores, name='dispatch')
class ResponsavelCreateView(CreateView):
    model = Responsavel
    fields = ['usuario', 'nome', 'email', 'voip', 'ramal', 'grupo', 'perfil']
    template_name = 'responsavel/form.html'
    success_url = reverse_lazy('responsavel_listar')

@method_decorator(decoradores, name='dispatch')
class ResponsavelUpdateView(UpdateView):
    model = Responsavel
    fields = ['usuario', 'nome', 'email', 'voip', 'ramal', 'grupo', 'perfil']
    template_name = 'responsavel/form.html'
    success_url = reverse_lazy('responsavel_listar')

@method_decorator(decoradores, name='dispatch')
class ResponsavelDeleteView(DeleteView):
    model = Responsavel
    template_name = 'responsavel/confirmar_exclusao.html'
    success_url = reverse_lazy('responsavel_listar')


# ------------------------ SERVIÇO ------------------------

@method_decorator(decoradores, name='dispatch')
class ServicoListView(ListView):
    model = Servico
    template_name = 'servico/listar.html'
    context_object_name = 'servicos'

@method_decorator(decoradores, name='dispatch')
class ServicoCreateView(CreateView):
    model = Servico
    # fields = ['nome', 'prazo_dias']
    fields = ['nome', 'prazo_dias', 'tempo_execucao']
    template_name = 'servico/form.html'
    success_url = reverse_lazy('servico_listar')

@method_decorator(decoradores, name='dispatch')
class ServicoUpdateView(UpdateView):
    model = Servico
    # fields = ['nome', 'prazo_dias']
    fields = ['nome', 'prazo_dias', 'tempo_execucao']
    template_name = 'servico/form.html'
    success_url = reverse_lazy('servico_listar')

@method_decorator(decoradores, name='dispatch')
class ServicoDeleteView(DeleteView):
    model = Servico
    template_name = 'servico/confirmar_exclusao.html'
    success_url = reverse_lazy('servico_listar')


# ------------------------ SERVIÇOS SOLICITADOS ------------------------

@method_decorator(decoradores, name='dispatch')
class ServicoSolicitadoListView(ListView):
    model = ServicoSolicitado
    template_name = 'servico_solicitado/listar.html'
    context_object_name = 'solicitacoes'

@method_decorator(decoradores, name='dispatch')
class ServicoSolicitadoCreateView(CreateView):
    model = ServicoSolicitado
    fields = ['data_solicitacao', 'empresa', 'servico', 'competencia', 'identificacao', 'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao']
    template_name = 'servico_solicitado/form.html'
    success_url = reverse_lazy('servico_solicitado_listar')

@method_decorator(decoradores, name='dispatch')
class ServicoSolicitadoUpdateView(UpdateView):
    model = ServicoSolicitado
    fields = ['data_solicitacao', 'empresa', 'servico', 'competencia', 'identificacao', 'descricao_servico', 'data_vencimento', 'data_para_resposta', 'data_conclusao']
    template_name = 'servico_solicitado/form.html'
    success_url = reverse_lazy('servico_solicitado_listar')

@method_decorator(decoradores, name='dispatch')
class ServicoSolicitadoDeleteView(DeleteView):
    model = ServicoSolicitado
    template_name = 'servico_solicitado/confirmar_exclusao.html'
    success_url = reverse_lazy('servico_solicitado_listar')


# ------------------------ SERVIÇOS SOLICITADOS ------------------------

@method_decorator(decoradores, name='dispatch')
class AgendaBaseListView(ListView):
    model = AgendaBase
    template_name = 'agenda_base/listar.html'
    context_object_name = 'agenda'

@method_decorator(decoradores, name='dispatch')
class AgendaBaseCreateView(CreateView):
    model = AgendaBase
    fields = ['periodo', 'dia', 'mes', 'nome', 'descricao', 'responsabilidade', 'observacao']
    template_name = 'agenda_base/form.html'
    success_url = reverse_lazy('agenda_base_listar')

@method_decorator(decoradores, name='dispatch')
class AgendaBaseUpdateView(UpdateView):
    model = AgendaBase
    fields = ['periodo', 'dia', 'mes', 'nome', 'descricao', 'responsabilidade', 'observacao']
    template_name = 'agenda_base/form.html'
    success_url = reverse_lazy('agenda_base_listar')

@method_decorator(decoradores, name='dispatch')
class AgendaBaseDeleteView(DeleteView):
    model = AgendaBase
    template_name = 'agenda_base/confirmar_exclusao.html'
    success_url = reverse_lazy('agenda_base_listar')

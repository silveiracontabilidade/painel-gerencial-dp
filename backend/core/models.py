from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta

#GRUPOS SILVEIRA
class GrupoGerencial(models.Model):
    nome = models.CharField(max_length=100)
    coordenadora = models.ForeignKey('Responsavel', on_delete=models.SET_NULL, null=True, blank=True, related_name='grupos_que_coordena')

    class Meta:
        db_table = 'pg_grupos_gerenciais'

    def __str__(self):
        return self.nome


#USUÁRIOS RESPONSÁVEIS
class Responsavel(models.Model):
    PERFIL_CHOICES = [
        ('admin', 'Administrador'),
        ('operador', 'Operador'),
    ]

    usuario = models.CharField(max_length=100, unique=True)
    nome = models.CharField(max_length=100)
    email = models.EmailField()
    voip = models.CharField(max_length=20, null=True, blank=True)
    ramal = models.CharField(max_length=20, null=True, blank=True)
    grupo = models.ForeignKey('GrupoGerencial', on_delete=models.SET_NULL, null=True, blank=True, related_name='membros')
    perfil = models.CharField(max_length=10, choices=PERFIL_CHOICES)

    class Meta:
        db_table = 'pg_responsaveis'

    def __str__(self):
        return self.nome

#EMPRESAS - PLANILHA GERENCIAL
class PlanilhaGerencial(models.Model):
    cod_folha = models.CharField(max_length=10, db_column='Cod_folha', primary_key=True)
    cod_geral = models.CharField(max_length=10, db_column='Cod_Geral', null=True, blank=True)
    razao_social = models.CharField(max_length=255, db_column='Razao_Social', null=True, blank=True)
    grupo_economico = models.CharField(max_length=255, db_column='Grupo_Economico', null=True, blank=True)
    cnpj = models.CharField(max_length=50, db_column='CNPJ', null=True, blank=True)
    cnpj_original = models.CharField(max_length=50, db_column='CNPJ_Original', null=True, blank=True)
    status_do_cliente = models.CharField(max_length=100, db_column='Status_do_Cliente', null=True, blank=True)
    inicio_contrato = models.DateField(db_column='Inicio_Contrato', null=True, blank=True)
    termino_contrato = models.DateField(db_column='Termino_Contrato', null=True, blank=True)
    motivo_termino = models.CharField(max_length=255, db_column='Motivo_Termino', null=True, blank=True)
    tributacao = models.CharField(max_length=100, db_column='Tributacao', null=True, blank=True)
    sistema = models.CharField(max_length=100, db_column='Sistema', null=True, blank=True)
    resp_dp = models.CharField(max_length=100, db_column='Resp_DP', null=True, blank=True)
    ramal = models.CharField(max_length=50, db_column='Ramal', null=True, blank=True)
    voip = models.CharField(max_length=50, db_column='Voip', null=True, blank=True)
    grupo = models.CharField(max_length=100, db_column='Grupo', null=True, blank=True)
    data_pagto_salario = models.CharField(max_length=20, db_column='Data_Pagto_Salario', null=True, blank=True)
    classificacao = models.CharField(max_length=100, db_column='Classificacao', null=True, blank=True)
    sci_report = models.CharField(max_length=255, db_column='SCI_Report', null=True, blank=True)
    visitacao = models.CharField(max_length=100, db_column='Visitacao', null=True, blank=True)
    matriz = models.CharField(max_length=100, db_column='Matriz', null=True, blank=True)
    tempo_demandado = models.CharField(max_length=100, db_column='Tempo_Demandado', null=True, blank=True)
    enviadctf = models.CharField(max_length=100, db_column='EnviaDCTF', null=True, blank=True)
    classificacao2 = models.CharField(max_length=100, db_column='Classificacao2', null=True, blank=True)
    cod_folha_520 = models.CharField(max_length=100, db_column='cod_folha_520', null=True, blank=True)

    # --- campos de folha --- #
    serv_prest = models.CharField(max_length=255, db_column='SERV_PREST', null=True, blank=True)
    deson = models.CharField(max_length=50, db_column='DESON', null=True, blank=True)
    secconci = models.CharField(max_length=50, db_column='SECCONCI', null=True, blank=True)
    planilha_folha = models.CharField(max_length=50, db_column='PLANILHA_FOLHA', null=True, blank=True)
    planilha_convenio = models.CharField(max_length=50, db_column='PLANILHA_CONVENIO', null=True, blank=True)
    fecha_ponto = models.CharField(max_length=50, db_column='FECHA_PONTO', null=True, blank=True)
    obs_folha = models.TextField(db_column='OBS_FOLHA', null=True, blank=True)
    sst = models.CharField(max_length=50, db_column='SST', null=True, blank=True)
    dt_adiantamento = models.DateField(db_column='DT_ADIANTAMENTO', null=True, blank=True)
    perc_adiantamento = models.CharField(max_length=20, db_column='PERC_ADIANTAMENTO', null=True, blank=True)
    periodo_ponto = models.CharField(max_length=50, db_column='PERIODO_PONTO', null=True, blank=True)
    tipo_ponto = models.CharField(max_length=50, db_column='TIPO_PONTO', null=True, blank=True)
    info_ferias = models.TextField(db_column='INFO_FERIAS', null=True, blank=True)
    obs_rescisao = models.TextField(db_column='OBS_RESCISAO', null=True, blank=True)
    login_out_sist = models.CharField(max_length=100, db_column='LOGIN_OUT_SIST', null=True, blank=True)
    sen_out_sist = models.CharField(max_length=100, db_column='SEN_OUT_SIST', null=True, blank=True)
    cad_pat = models.CharField(max_length=50, db_column='CAD_PAT', null=True, blank=True)
    usu_pat = models.CharField(max_length=100, db_column='USU_PAT', null=True, blank=True)
    sen_pat = models.CharField(max_length=100, db_column='SEN_PAT', null=True, blank=True)
    dt_envio_cct = models.DateField(db_column='DT_ENVIO_CCT', null=True, blank=True)
    opc_rec_patronal = models.CharField(max_length=50, db_column='OPC_REC_PATRONAL', null=True, blank=True)
    dt_venc_conec_social = models.DateField(db_column='DT_VENC_CONEC_SOCIAL', null=True, blank=True)
    sd_login = models.CharField(max_length=100, db_column='SD_LOGIN', null=True, blank=True)
    sd_senha = models.CharField(max_length=100, db_column='SD_SENHA', null=True, blank=True)
    sd_email = models.EmailField(db_column='SD_EMAIL', null=True, blank=True)
    fgts_digital = models.CharField(max_length=50, db_column='FGTS_DIGITAL', null=True, blank=True)
    
    class Meta:
        managed = True
        db_table = 'geral_planilha_gerencial'

#SERVIÇOS SOLICITADOS X EMPRESA 
class ServicoSolicitado(models.Model):
    data_solicitacao = models.DateField()
    empresa = models.IntegerField()
    servico = models.ForeignKey('Servico', on_delete=models.CASCADE)  # FK nova
    competencia = models.CharField(max_length=6)
    identificacao = models.CharField(max_length=100, null=True, blank=True)
    descricao_servico = models.TextField(null=True, blank=True)
    data_vencimento = models.DateField(null=True, blank=True)
    data_para_resposta = models.DateField(null=True, blank=True)
    data_conclusao = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'pg_servicos_solicitados'

    def __str__(self):
        return f"{self.empresa.razao_social} - {self.servico.nome} ({self.competencia})"
    
#CADASTRO DE SERVIÇOS
class Servico(models.Model):
    nome = models.CharField(max_length=255)
    prazo_dias = models.DecimalField(max_digits=5, decimal_places=2) 
    tempo_execucao = models.DurationField(default=timedelta)

    class Meta:
        db_table = 'pg_servicos'

    def __str__(self):
        return self.nome
    

#CADASTRO BASE DE AGENDA DE ATIVIDADES
class AgendaBase(models.Model):
    PERIODO_CHOICES = [
        ('mensal', 'Mensal'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual'),
    ]

    periodo = models.CharField(max_length=10, choices=PERIODO_CHOICES, null=True, blank=True)
    dia = models.PositiveSmallIntegerField()
    mes = models.PositiveSmallIntegerField(null=True, blank=True)
    nome = models.CharField(max_length=255)
    descricao = models.TextField(null=True, blank=True)
    responsabilidade = models.CharField(max_length=255, null=True, blank=True)
    observacao = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'pg_agenda_base'

    def __str__(self):
        return self.nome

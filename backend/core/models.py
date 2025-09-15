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
        ('especialista', 'Especialista'),
        ('especialista_senior', 'Especialista Senior'),
        ('coordenador', 'Coordenador'),
    ]

    usuario = models.CharField(max_length=100, unique=True)
    nome = models.CharField(max_length=100)
    email = models.EmailField()
    voip = models.CharField(max_length=20, null=True, blank=True)
    ramal = models.CharField(max_length=20, null=True, blank=True)
    grupo = models.ForeignKey('GrupoGerencial', on_delete=models.SET_NULL, null=True, blank=True, related_name='membros')
    perfil = models.CharField(max_length=100, choices=PERFIL_CHOICES)

    class Meta:
        db_table = 'pg_responsaveis'
        managed = False

    def __str__(self):
        return self.nome

# EMPRESAS - PLANILHA GERENCIAL
class PlanilhaGerencial(models.Model):
    cod_folha = models.CharField(max_length=10, db_column='Cod_folha', primary_key=True)
    cod_geral = models.CharField(max_length=10, db_column='Cod_Geral', null=True, blank=True)
    cod_acessorias = models.CharField(max_length=10, db_column='COD_ACESSORIAS', null=True, blank=True)
    razao_social = models.CharField(max_length=255, db_column='Razao_Social', null=True, blank=True)
    forma_comunica = models.CharField(max_length=100, db_column='FORMA_COMUNICA', null=True, blank=True)
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

    # --- campos folha e operacionais ---
    serv_prest = models.CharField(max_length=10, db_column='SERV_PREST', null=True, blank=True)
    serv_tom = models.CharField(max_length=10, db_column='SERV_TOM', null=True, blank=True)
    deson = models.CharField(max_length=50, db_column='DESON', null=True, blank=True)
    secconci = models.CharField(max_length=50, db_column='SECCONCI', null=True, blank=True)
    planilha_folha = models.CharField(max_length=50, db_column='PLANILHA_FOLHA', null=True, blank=True)
    planilha_convenio = models.CharField(max_length=50, db_column='PLANILHA_CONVENIO', null=True, blank=True)
    obs_folha = models.TextField(db_column='OBS_FOLHA', null=True, blank=True)
    sst = models.CharField(max_length=50, db_column='SST', null=True, blank=True)
    data_entrega_folha = models.CharField(max_length=100, db_column='DATA_ENTREGA_FOLHA', null=True, blank=True)

    # Adiantamento / 13º / PLR
    adiantamento = models.CharField(max_length=10, db_column='ADIANTAMENTO', null=True, blank=True)
    dt_adiantamento_entrega = models.CharField(max_length=50, db_column='DT_ADIANTAMENTO_ENTREGA', null=True, blank=True)
    dt_adiantamento_pagamento = models.CharField(max_length=100, db_column='DT_ADIANTAMENTO_PAGAMENTO', null=True, blank=True)
    perc_adiantamento = models.CharField(max_length=20, db_column='PERC_ADIANTAMENTO', null=True, blank=True)
    dt_13_entrega = models.CharField(max_length=50, db_column='DT_13_ENTREGA', null=True, blank=True)
    dt_13_adiantamento_entrega = models.CharField(max_length=50, db_column='DT_13_ADIANTAMENTO_ENTREGA', null=True, blank=True)
    obs_13 = models.TextField(db_column='OBS_13', null=True, blank=True)
    obs_13_adiantamento = models.TextField(db_column='OBS_13_ADIANTAMENTO', null=True, blank=True)
    plr = models.CharField(max_length=10, db_column='PLR', null=True, blank=True)
    plr_dt_entrega = models.CharField(max_length=10, db_column='PLR_DT_ENTREGA', null=True, blank=True)
    plr_dt_pagto = models.CharField(max_length=10, db_column='PLR_DT_PAGTO', null=True, blank=True)
    obs_plr = models.TextField(db_column='OBS_PLR', null=True, blank=True)

    # Observações
    obs_admissao = models.TextField(db_column='OBS_ADMISSAO', null=True, blank=True)
    obs_ferias = models.TextField(db_column='OBS_FERIAS', null=True, blank=True)
    obs_rescisao = models.TextField(db_column='OBS_RESCISAO', null=True, blank=True)
    obs_gerencial = models.TextField(db_column='OBS_GERENCIAL', null=True, blank=True)

    # Ponto
    periodo_ponto = models.CharField(max_length=50, db_column='PERIODO_PONTO', null=True, blank=True)
    tipo_ponto = models.CharField(max_length=50, db_column='TIPO_PONTO', null=True, blank=True)
    ponto_ini = models.CharField(max_length=10, db_column='PONTO_INI', null=True, blank=True)
    ponto_fim = models.CharField(max_length=10, db_column='PONTO_FIM', null=True, blank=True)
    obs_ponto = models.TextField(db_column='OBS_PONTO', null=True, blank=True)
    fecha_ponto = models.CharField(max_length=50, db_column='FECHA_PONTO', null=True, blank=True)
    envia_ponto = models.CharField(max_length=50, db_column='ENVIA_PONTO', null=True, blank=True)

    # Honorários
    honorarios = models.DecimalField(max_digits=10, decimal_places=2, db_column='Honorarios', null=True, blank=True)

    # Acessos e sistemas
    login_out_sist = models.CharField(max_length=100, db_column='LOGIN_OUT_SIST', null=True, blank=True)
    sen_out_sist = models.CharField(max_length=100, db_column='SEN_OUT_SIST', null=True, blank=True)
    cad_pat = models.CharField(max_length=50, db_column='CAD_PAT', null=True, blank=True)
    usu_pat = models.CharField(max_length=100, db_column='USU_PAT', null=True, blank=True)
    sen_pat = models.CharField(max_length=100, db_column='SEN_PAT', null=True, blank=True)
    tem_pat = models.CharField(max_length=10, db_column='TEM_PAT', null=True, blank=True)

    sd_login = models.CharField(max_length=100, db_column='SD_LOGIN', null=True, blank=True)
    sd_senha = models.CharField(max_length=100, db_column='SD_SENHA', null=True, blank=True)
    sd_email = models.EmailField(db_column='SD_EMAIL', null=True, blank=True)

    # Datas e vencimentos
    dt_envio_cct = models.DateField(db_column='DT_ENVIO_CCT', null=True, blank=True)
    opc_rec_patronal = models.CharField(max_length=50, db_column='OPC_REC_PATRONAL', null=True, blank=True)
    dt_venc_conec_social = models.DateField(db_column='DT_VENC_CONEC_SOCIAL', null=True, blank=True)
    venc_procuracao = models.DateField(db_column='VENC_PROCURACAO', null=True, blank=True)
    venc_fgts_digital = models.DateField(db_column='VENC_FGTS_DIGITAL', null=True, blank=True)

    # Outras flags
    fgts_digital = models.CharField(max_length=50, db_column='FGTS_DIGITAL', null=True, blank=True)
    tem_det = models.CharField(max_length=10, db_column='TEM_DET', null=True, blank=True)
    tem_fap = models.CharField(max_length=10, db_column='TEM_FAP', null=True, blank=True)
    apura_vt = models.CharField(max_length=10, db_column='APURA_VT', null=True, blank=True)

    # Serviços
    aprendizes = models.TextField(db_column='APRENDIZES', null=True, blank=True)
    med_ocupa = models.TextField(db_column='MED_OCUPA', null=True, blank=True)
    med_ocupa_proc_venc = models.DateField(db_column='MED_OCUPA_PROC_VENC', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'geral_planilha_gerencial'



# PERÍODOS DE ENTREGA
class PeriodoEntrega(models.Model):
    DIA_TIPO_CHOICES = [
        ('DIA', 'Dia Corrido'),
        ('DIA_UTIL', 'Dia Útil'),
    ]

    dia = models.PositiveSmallIntegerField()  # Ex: 5, 10, 20
    tipo = models.CharField(max_length=10, choices=DIA_TIPO_CHOICES)
    descricao = models.CharField(max_length=50, editable=False)

    class Meta:
        managed = False
        db_table = 'pg_periodos_entrega'
        unique_together = ('dia', 'tipo')
        ordering = ['tipo', 'dia']

    def save(self, *args, **kwargs):
        # Gera descrição automaticamente
        if self.tipo == 'DIA_UTIL':
            self.descricao = f"{self.dia}º Dia Útil"
        else:
            self.descricao = f"Dia {self.dia}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.descricao


# SISTEMAS
class Sistema(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    class Meta:
        managed = False
        db_table = 'pg_sistemas'
        ordering = ['nome']

    def __str__(self):
        return self.nome



#SERVIÇOS SOLICITADOS X EMPRESA 
# class ServicoSolicitado(models.Model):
#     data_solicitacao = models.DateField()
#     empresa = models.IntegerField()  # cod_folha da empresa
#     servico = models.ForeignKey('Servico', on_delete=models.CASCADE)  # FK para Servico
#     competencia = models.CharField(max_length=6)
#     identificacao = models.CharField(max_length=100, null=True, blank=True)
#     descricao_servico = models.TextField(null=True, blank=True)
#     data_vencimento = models.DateField(null=True, blank=True)
#     data_para_resposta = models.DateField(null=True, blank=True)
#     data_conclusao = models.DateField(null=True, blank=True)

#     STATUS_CHOICES = [
#         ("PENDENTE", "Pendente"),
#         ("PAUSADO", "Pendente"),
#         ("CONCLUIDO", "Concluído"),
#     ]
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDENTE")

#     class Meta:
#         db_table = 'pg_servicos_solicitados'

#     def __str__(self):
#         return f"Empresa {self.empresa} - {self.servico.nome} ({self.competencia})"
    
    
class ServicoSolicitado(models.Model):
    data_solicitacao = models.DateField()
    empresa = models.IntegerField()
    servico = models.ForeignKey('Servico', on_delete=models.CASCADE)
    competencia = models.CharField(max_length=6)
    identificacao = models.CharField(max_length=100, null=True, blank=True)
    descricao_servico = models.TextField(null=True, blank=True)
    data_vencimento = models.DateField(null=True, blank=True)
    data_para_resposta = models.DateField(null=True, blank=True)
    data_conclusao = models.DateField(null=True, blank=True)

    # FERIAS
    ferias_abono = models.CharField(max_length=100, null=True, blank=True)
    ferias_data_ini = models.CharField(max_length=100, null=True, blank=True)

    # RESCISÃO
    rescisao_tipo_aviso = models.CharField(max_length=100, null=True, blank=True)
    rescisao_dias_aviso = models.CharField(max_length=100, null=True, blank=True)
    rescisao_data_ini = models.CharField(max_length=100, null=True, blank=True)
    rescisao_tipo = models.CharField(max_length=100, null=True, blank=True)

    # ADMISSÃO
    admissao_tipo = models.CharField(max_length=100, null=True, blank=True)
    admissao_data_ini = models.CharField(max_length=100, null=True, blank=True)
    admissao_deslig_programado = models.CharField(max_length=100, null=True, blank=True)

    # AFASTAMENTO
    afast_tipo = models.CharField(max_length=100, null=True, blank=True)
    afast_dias = models.CharField(max_length=100, null=True, blank=True)
    afast_ini = models.CharField(max_length=100, null=True, blank=True)
    afast_pericia = models.CharField(max_length=100, null=True, blank=True)


    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("PAUSADO", "Pendente"),
        ("CONCLUIDO", "Concluído"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDENTE")

    class Meta:
        db_table = 'pg_servicos_solicitados'

    def __str__(self):
        return f"Empresa {self.empresa} - {self.servico.nome} ({self.competencia})"
    
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
    id = models.BigAutoField(primary_key=True) 
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
        managed = False 

    def __str__(self):
        return self.nome


class CCT(models.Model):
    id = models.AutoField(primary_key=True)
    cod_folha = models.CharField(max_length=10, db_column='cod_folha')
    codigo_sindicato = models.CharField(max_length=50)
    data_envio = models.DateField()
    ano_base = models.IntegerField()
    cct_link = models.CharField(max_length=60)
    cct_login = models.CharField(max_length=20)
    cct_senha = models.CharField(max_length=20)

    class Meta:
        db_table = 'pg_ccts'

    def __str__(self):
        return f"{self.cod_folha} - {self.codigo_sindicato} ({self.ano_base})"
    
    
class PG_PLR(models.Model):
    id = models.AutoField(primary_key=True)
    cod_folha = models.CharField("Cód. Folha", max_length=20, blank=True, null=True)  # <— novo
    numero_sindicato = models.CharField("Nº Sindicato", max_length=50, blank=True, null=True)
    parcela = models.CharField("Parcela", max_length=20, blank=True, null=True)
    valor = models.DecimalField("Valor", max_digits=12, decimal_places=2, blank=True, null=True)
    mes_pagamento = models.CharField("Mês de Pagamento", max_length=20, blank=True, null=True)
    data_entrega = models.DateField("Data da Entrega", blank=True, null=True)

    class Meta:
        db_table = 'pg_plr'
        verbose_name = "Pagamento de PLR"
        verbose_name_plural = "Pagamentos de PLR"
        managed = False

    def __str__(self):
        return f"{self.cod_folha or ''} - {self.numero_sindicato or ''} - {self.parcela or ''}"


#tabela de permissões
class Permissao(models.Model):
    PERFIL_CHOICES = [
        ('admin', 'Administrador'),
        ('coordenador', 'Coordenador'),
        ('analista_senior', 'Analista Sênior'),
        ('analista', 'Analista'),
    ]

    id = models.AutoField(primary_key=True)
    perfil = models.CharField(max_length=50, choices=PERFIL_CHOICES)
    tela = models.CharField(max_length=50)       # Ex.: 'empresa', 'responsaveis', 'sistemas'
    aba = models.CharField(max_length=50, blank=True, null=True)  # só se a tela tiver abas
    campo = models.CharField(max_length=100)     # Ex.: 'grupo', 'resp_dp', 'tributacao'
    pode_editar = models.BooleanField(default=False)

    class Meta:
        db_table = "pg_permissoes"
        managed = False
        unique_together = ("perfil", "tela", "aba", "campo")

    def __str__(self):
        return f"{self.perfil} - {self.tela} - {self.aba or '-'} - {self.campo}"

import React, { useState, useEffect } from 'react';
import './EmpresaFormModal.css';
import api from '../../api/axios';
import { paraISO, paraBR } from '../../utils/datas';

export default function EmpresaFormModal({ visivel, aoFechar, aoSalvar, dados }) {
  const [empresa, setEmpresa] = useState({});
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [sistemas, setSistemas] = useState([]);
  const [ccts, setCcts] = useState([]);
  const [plrs, setPlrs] = useState([]);
  const [aba, setAba] = useState('GERENCIAL'); // 'GERENCIAL' | 'FOLHA'
  const [permissoes, setPermissoes] = useState([]);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  
  
    //Permissoes do usuário
  useEffect(() => {
    async function fetchPermissoes() {
      try {
        const { data } = await api.get("/api/permissoes/mine/");
        setPermissoes(data);
      } catch (err) {
        console.error("Erro ao buscar permissões:", err);
      }
    }
    fetchPermissoes();
  }, []);

    //Perfil do usuario
  useEffect(() => {
    async function fetchPerfil() {
      try {
        const { data } = await api.get("/api/me");
        setPerfilUsuario(data.perfil); // admin, coordenador, especialista, especialista_senior
      } catch (err) {
        console.error("Erro ao buscar perfil do usuário:", err);
      }
    }
    fetchPerfil();
  }, []);

  // dados da empresa
  useEffect(() => {
    if (dados?.cod_folha) {
      api.get(`/api/ccts/?empresa=${dados.cod_folha}`)
        .then(res => {
          const lista = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          setCcts(lista);
        })
        .catch(() => setCcts([]));
    } else {
      setCcts([]);
    }
  }, [dados]);


  //dados da CCT
  useEffect(() => {
    const normalizada = {};
    for (const campo in dados) {
      let valor = dados[campo];

      if (valor && ['inicio_contrato','termino_contrato','dt_envio_cct','dt_venc_conec_social','venc_procuracao'].includes(campo)) {
        // Se vier no formato ISO (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
          const [ano, mes, dia] = valor.split('-');
          valor = `${dia}-${mes}-${ano}`; // DD-MM-YYYY
        }
        // Se vier no formato YYYY/MM/DD
        else if (/^\d{4}\/\d{2}\/\d{2}$/.test(valor)) {
          const [ano, mes, dia] = valor.split('/');
          valor = `${dia}-${mes}-${ano}`; // DD-MM-YYYY
        }
      }
      normalizada[campo] = typeof valor === 'string' ? valor.toUpperCase() : valor;
    }
    setEmpresa(normalizada);
  }, [dados]);


  // dados do PLR
  useEffect(() => {
    const cod = dados?.cod_folha ? String(dados.cod_folha) : null;
    if (!cod) { setPlrs([]); return; }

    // limpa para não “sangrar” dados de outra empresa
    setPlrs([]);

    // ✅ use o mesmo padrão da CCT: params, não string concat
    api.get('/api/pg-plr/', { params: { empresa: cod } })
      .then((res) => {
        const crua = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        // ✅ garantir no cliente também (cinturão + suspensório)
        const somenteDestaEmpresa = crua.filter(x => String(x.cod_folha) === cod);
        setPlrs(somenteDestaEmpresa);
      })
      .catch(() => setPlrs([]));
  }, [dados?.cod_folha]);

  //carregar todos os dados de tabelas auxiliares
  useEffect(() => {
    async function carregarDados() {
      const [res1, res2, res3, res4] = await Promise.all([
        api.get('/api/responsaveis/'),
        api.get('/api/grupos/'),
        api.get('/api/periodos-entrega/'),
        api.get('/api/sistemas/')  
      ]);

      setResponsaveis(res1.data.results || res1.data);
      setGrupos(res2.data.results || res2.data);
      setPeriodos(res3.data.results || res3.data);
      setSistemas(res4.data.results || res4.data);
    }
    carregarDados();
  }, []);


  const handleChange = (campo) => (e) => {
    let valor = (e.target.value ?? '').toUpperCase();
    setEmpresa((prev) => {
      const atualizado = { ...prev, [campo]: valor };
      if (campo === 'cod_folha') atualizado['cod_folha_520'] = valor;
      if (campo === 'cnpj_original') atualizado['cnpj'] = valor.replace(/[^0-9]/g, '');
      return atualizado;
    });
  };

  
  if (!visivel) return null;

  const opcoes = {
    status_do_cliente: ['ATIVO', 'INATIVO'],
    tributacao: ['LP', 'SN', 'LR', 'MEI', 'IMUNES', 'ISENTAS', 'DOM', 'CARNÊ LEÃO', 'RURAL PF', 'RURAL PJ', 'CAEPF', '1406', 'EXTERIOR', 'BPO FIN', 'BPO RH'],
    classificacao: ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'],
    sci_report: ['SIM', 'NÃO'],
    visitacao: ['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'N/A'],
    matriz: ['SIM', 'NÃO'],
    enviadctf: ['SIM', 'NÃO'],
    classificacao2: ['BPO FIN', 'BPO RH', 'CARNÊ LEÃO', 'CONSULTORIA', 'DOM S/ MOV', 'DOMÉSTICA', 'FACULTATIVO', 'FATOR R', 'FATOR R + FUNCS', 'FOLHA COM DADOS', 'FOLHA SEM DADOS', 'PRÓ LABORE', 'TIME OUT', 'SEM MOVIMENTO'],
    sim_nao:['SIM', 'NÃO'],
    tipo_ponto:['CARTOGRÁFICO', 'FOLHA'],
    motivo_termino:[
        'ADESÃO AO REGIME MEI', 
        'CANCELOU ENTRADA', 
        'CLIENTE DESAPARECEU', 
        'CONFLITO DE INTERESSES',
        'DECIDIU PELA MOVIMENTAÇÃO DE LIVRO CAIXA',
        'DESACORDO COMERCIAL',
        'DESLIGAMENTO DE COLABORADOR',
        'EM ENCERRAMENTO',
        'ENCERROU',
        'EXTINTA',
        'FALECIMENTO EMPREGADOR',
        'INADIMPLENTE',
        'INCORPORAÇÃO',
        'INSATISFAÇÃO COM ATENDIMENTO',
        'INSOLVÊNCIA',
        'INTERNALIZAÇÃO CONTÁBIL',
        'PARCERIA COM OUTRO CONTADOR',
        'REDUÇÃO DE CUSTOS',
        'VENDA',
      ]
  };

  const camposRestritos = [
      "cod_folha",
      "cod_geral",
      "cod_acessorias",
      "status_do_cliente",
      "sci_report",
      "opc_rec_patronal",
      "classificacao",
      "cnpj_original",
      "razao_social",
      "forma_comunica"
    ];

  const abasDisponiveis = [
      { id: 'GERENCIAL', label: 'Gerencial' },
      { id: 'FOLHA', label: 'Folha' }, 
      { id: 'ADIANTAMENTO', label: 'Adiantamento' },
      { id: 'PLR', label: 'PLR' }, 
      { id: 'DECIMOTERC', label: 'Décimo terceiro' }, 
      { id: 'SERVICOS', label: 'Serviços' }, 
      { id: 'PONTO', label: 'Ponto' }, 
      { id: 'PROCURACOES', label: 'Procurações e Acessos' }, 
      { id: 'CCT', label: 'CCT' }, 
      { id: 'ACORDOS', label: 'Acordos' }, 
  ];

  // dd-mm-yyyy
  const mascararData = (valor) => {
    const d = valor.replace(/[^\d]/g, "").slice(0, 8); // só dígitos, até 8 chars (ddmmyyyy)
    if (!d) return "";

    if (d.length <= 2) return d;                       // "1", "12"
    if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;     // "12-3", "12-12"
    return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;       // "12-12-2", "12-12-2025"
  };

  const normalizarData = (valor) => {
    const d = valor.replace(/[^\d]/g, "");
    if (d.length < 8) return valor; // deixa como está se incompleto

    let dia = parseInt(d.slice(0, 2), 10);
    let mes = parseInt(d.slice(2, 4), 10);
    let ano = parseInt(d.slice(4, 8), 10);

    if (dia < 1) dia = 1;
    if (dia > 31) dia = 31;
    if (mes < 1) mes = 1;
    if (mes > 12) mes = 12;
    if (ano < 1900) ano = 1900; // mínimo razoável

    const DD = String(dia).padStart(2, "0");
    const MM = String(mes).padStart(2, "0");
    const YYYY = String(ano).padStart(4, "0");

    return `${DD}-${MM}-${YYYY}`;
  };


  // --- HORA (máscara leve para digitar) ---
  const mascararHora = (valor) => {
    const d = valor.replace(/[^\d]/g, "").slice(0, 4); // HHMM (0-4)
    if (!d) return "";
    if (d.length <= 2) return d;                        // "1", "12"
    return `${d.slice(0, 2)}:${d.slice(2)}`;           // "12:3" ou "12:34"
  };

  // --- HORA (normalização ao sair do campo) ---
  const normalizarHora = (valor) => {
    const d = valor.replace(/[^\d]/g, "");
    if (!d) return "";

    let h = parseInt(d.slice(0, 2) || "0", 10);
    let m = parseInt(d.slice(2, 4) || "0", 10);

    if (h > 23) h = 23;
    if (m > 59) m = 59;

    const HH = String(h).padStart(2, "0");
    const MM = String(m).padStart(2, "0");
    return `${HH}:${MM}`;
  };


  // Valida/mascara hora no formato HH:MM (00–23 : 00–59)
  const validarHora = (valor) => {
    // mantém só dígitos
    const digits = valor.replace(/[^\d]/g, "").slice(0, 4); // HHMM (no máx 4)

    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);

    if (digits.length <= 2) return hh;           // "0", "09", "23"
    let h = parseInt(hh || "0", 10);
    let m = parseInt(mm || "0", 10);

    // limita faixas
    if (h > 23) h = 23;
    if (m > 59) m = 59;

    const HH = String(h).padStart(2, "0");
    const MM = String(m).padStart(2, "0");

    return `${HH}:${MM}`.slice(0, 5);            // garante "HH:MM"
  };

  // --- DURAÇÃO EM HORAS (pode ser > 24h) ---
  const mascararDuracao = (valor) => {
    valor = valor.replace(/\D/g, ""); // mantém só números
    if (valor.length <= 2) return valor; // só horas
    return valor.slice(0, -2) + ":" + valor.slice(-2); // insere ":" antes dos 2 últimos dígitos
  };

  const normalizarDuracao = (valor) => {
    if (!valor) return "";
    const [h, m] = valor.split(":");
    let horas = parseInt(h || "0", 10);
    let minutos = parseInt(m || "0", 10);

    if (isNaN(horas)) horas = 0;
    if (isNaN(minutos)) minutos = 0;

    if (minutos > 59) minutos = 59; // só trava minutos

    return `${horas}:${String(minutos).padStart(2, "0")}`;
  };


  // Valida apenas números
  const validarNumero = (valor) => {
    return valor.replace(/[^0-9]/g, ""); // remove tudo que não for número
  };

  // Valida formato dd-mm-yyyy
  const validarData = (valor) => {
    const regex = /^(\d{0,2})(-?)(\d{0,2})(-?)(\d{0,4})$/;
    let match = valor.match(regex);
    if (!match) return valor.replace(/[^0-9-]/g, ""); 

    let dia = match[1];
    let mes = match[3];
    let ano = match[5];

    // Reconstrói mantendo os "-"
    let resultado = "";
    if (dia) resultado += dia;
    if (mes) resultado += "-" + mes;
    if (ano) resultado += "-" + ano;

    return resultado;
  };

  //helper para verificar se pode editar
  const podeEditar = (aba, campo) => {
    // 🔒 Se for especialista, nunca pode editar os campos restritos
    if (
      ["especialista", "especialista_senior"].includes(perfilUsuario) &&
      camposRestritos.includes(campo)
    ) {
      return false;
    }

    const regra = permissoes.find(
      (p) =>
        p.tela === "empresa" &&
        p.aba === aba &&
        (p.campo === campo || p.campo === "*")
    );
    return regra ? regra.pode_editar : false;
  };



  const renderFlag = (campo, label, valorAtual) => {
    const normalizado = (valorAtual || '').toUpperCase();
    const pode = podeEditar(aba, campo);

    return (
      <div className="campo campo-micro-flag" key={campo}>
        <label className="flag-label">{label}</label>
        <input
          type="checkbox"
          className="flag-checkbox"
          checked={normalizado === 'SIM'}
          disabled={!pode}
          onChange={
            pode
              ? (e) =>
                  setEmpresa({
                    ...empresa,
                    [campo]: e.target.checked ? 'SIM' : 'NÃO',
                  })
              : undefined
          }
        />
      </div>
    );
  };


  const renderSelect = (campo, label, options, classe = 'campo-curto', valorAtual) => {
    const normalizado = (valorAtual || '').toUpperCase();
    const lista =
      normalizado && !options.includes(normalizado)
        ? [normalizado, ...options]
        : options;

    const pode = podeEditar(aba, campo);

    return (
      <div className={`campo ${classe}`} key={campo}>
        <label>{label}</label>
        <select
          value={empresa[campo] || ''}
          onChange={pode ? handleChange(campo) : undefined}
          disabled={!pode}
        >
          <option value="">--</option>
          {lista.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  };


  const renderText = (
  campo,
  label,
  classe = 'campo-medio',
  tipo = 'text',
  valorCustom = null,
  validation = null
    ) => {
    const value = valorCustom !== null ? valorCustom : (empresa[campo] || '');
    const maxLength =
      validation === 'date' ? 10 :
      validation === 'time' ? 5  :
      validation === 'duration' ? 999 : // não limita, pode ser muitas horas
      undefined;

    const inputMode =
      validation === 'numeric' ? 'numeric' :
      validation === 'date' || validation === 'time' || validation === 'duration' ? 'numeric' :
      undefined;

    const placeholder =
      validation === 'date' ? 'dd-mm-aaaa' :
      validation === 'time' ? 'hh:mm' :
      validation === 'duration' ? 'hh:mm' :
      undefined;

    return (
      <div className={`campo ${classe}`} key={campo}>
        <label>{label}</label>
        <input
            type={tipo}
            value={value}
            maxLength={maxLength}
            inputMode={inputMode}
            placeholder={placeholder}
            autoComplete="off"
            readOnly={!podeEditar(aba, campo)}
            disabled={!podeEditar(aba, campo)}
            onChange={(e) => {
              if (!podeEditar(aba, campo)) return;

              let valor = e.target.value;

              if (validation === "numeric") valor = validarNumero(valor);
              if (validation === "date") valor = mascararData(valor);
              if (validation === "time") valor = mascararHora(valor);
              if (validation === "duration") valor = mascararDuracao(valor);

              handleChange(campo)({ target: { value: valor } });
            }}
            onBlur={(e) => {
              if (!podeEditar(aba, campo)) return;

              if (validation === "time") {
                const valor = normalizarHora(e.target.value);
                handleChange(campo)({ target: { value: valor } });
              }
              if (validation === "date") {
                const valor = normalizarData(e.target.value);
                handleChange(campo)({ target: { value: valor } });
              }
              if (validation === "duration") {
                const valor = normalizarDuracao(e.target.value);
                handleChange(campo)({ target: { value: valor } });
              }
            }}
          />

      </div>
    );
  };


  const renderTextarea = (campo, label, classe = 'campo-longo', classearea) => {
    return (
      <div className={`campo ${classe}`} key={campo}>
        <label>{label}</label>
        <textarea
          value={empresa[campo] || ''}
          className={classearea}
          rows={3}
          readOnly={!podeEditar(aba, campo)}
          disabled={!podeEditar(aba, campo)}
          onChange={(e) => {
            if (!podeEditar(aba, campo)) return;
            handleChange(campo)(e);
          }}
        />
      </div>
    );
  };

  // CRUD DO CCT //
  const adicionarCCT = () => {
    setCcts([...ccts, { id: Date.now(), codigo_sindicato: '', data_envio: '', ano_base: '', cct_link: '', cct_login: '', cct_senha:'' }]);
  };

  const atualizarCCT = (id, campo, valor) => {
    setCcts(ccts.map(cct => cct.id === id ? { ...cct, [campo]: valor } : cct));
  };

  const removerCCT = (id) => {
    setCcts(ccts.filter(cct => cct.id !== id));
  };
  //========================

  // CRUD DO PLR //
  const adicionarPLR = () => {
    setPlrs(prev => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,          // id temporário para distinguir de registros do backend
        cod_folha: empresa.cod_folha || '', 
        numero_sindicato: '',
        parcela: '',
        valor: '',
        mes_pagamento: '',
        data_entrega: ''
      }
    ]);
  };

  const atualizarPLR = (id, campo, valor) => {
    setPlrs(prev => prev.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  };

  const removerPLR = (id) => {
    setPlrs(prev => prev.filter(item => item.id !== id));
  };
  //========================

  const podeEditarCamposTopo = ["admin", "coordenador"].includes(perfilUsuario);

  return (
  <div className="modal-overlay">
    <div className="modal">
      <h3>{empresa?.cod_folha ? 'EDITAR EMPRESA' : 'NOVA EMPRESA'}</h3>

      {/* Abas */}
      <div className="abas">
        {abasDisponiveis.map(abaCfg => (
          <button
            key={abaCfg.id}
            className={aba === abaCfg.id ? 'aba ativa' : 'aba'}
            onClick={() => setAba(abaCfg.id)}
          >
            {abaCfg.label}
          </button>
        ))}
      </div>

      <div className="modal-form">
        {/* Topo comum nas abas */}
        <div className="bloco-header">
          <div className="linha topo-comum">
            {renderText('cod_folha', 'CÓD. FOLHA', 'campo-micro-micro','text',null,'numeric')}
            {renderText('cod_geral', 'CÓD. GERAL', 'campo-micro-micro','text',null,'numeric')}
            {renderText('cod_acessorias', 'ACESSÓRIAS', 'campo-micro-micro','text',null,'numeric')}
            {renderSelect('status_do_cliente', 'STATUS DO CLIENTE', opcoes.status_do_cliente, "campo-micro", empresa.status_do_cliente)}
            {renderFlag('sci_report', 'SCI REPORT', empresa.sci_report)}
            {renderFlag('opc_rec_patronal', 'PATRONAL', empresa.opc_rec_patronal)}
            {renderSelect(
                  'classificacao',
                  <span className={(!empresa.classificacao || empresa.classificacao.trim() === '') ? 'label-erro' : ''}>
                    CATEGORIA
                  </span>,
                  opcoes.classificacao,
                  'campo-curto',
                  empresa.classificacao
                )}
            {renderText(
              'cnpj_original',
              'CNPJ',
              'campo-curto',
              'text',
              empresa.cnpj_formatado || empresa.cnpj_original || ''
            )}
          </div>
          <div className='linha'>
            {renderText('razao_social', 'RAZÃO SOCIAL', 'campo-medio')}
            {renderText('forma_comunica', 'FORMA DE COMUNICAÇÃO', 'campo-curto')}
          </div>
        </div> 

        {aba === 'GERENCIAL' && (
          <>
            {/* DADOS DO CLIENTE */}
            <div className="bloco">
              <h4>DADOS DO CLIENTE</h4>
              <div className="linha">
                {renderText('grupo_economico', 'GRUPO ECONÔMICO', 'campo-medio')}
                {renderSelect('tributacao', 'TRIBUTAÇÃO', opcoes.tributacao, 'campo-curto', empresa.tributacao)}
                {renderSelect('sistema', 'SISTEMA', sistemas.map(s => s.nome.toUpperCase()), 'campo-curto', empresa.sistema)}
                {renderFlag('matriz', 'MATRIZ', empresa.matriz)}
                {renderFlag('enviadctf', 'ENVIA DCTF', empresa.enviadctf)}
                {renderSelect('visitacao', 'VISITAÇÃO', opcoes.visitacao, empresa.visitacao)}
                {renderText('tempo_demandado', 'TEMPO DEMANDADO', 'campo-curto', 'text', null, "duration")}
                {renderText('honorarios', 'HONORÁRIO', 'campo-curto')}
                
              </div>
            </div>

            {/* DADOS DO ANALISTA */}
            <div className="bloco">
              <h4>DADOS DO ANALISTA</h4>
              <div className="linha">
                {renderSelect('grupo', 'GRUPO', grupos.map(g => g.nome.toUpperCase()),'campo-curto', empresa.grupo)}
                {renderSelect('resp_dp', 'RESPONSÁVEL DP', responsaveis.map(r => r.nome.toUpperCase()), 'campo-curto', empresa.resp_dp)}
                {renderText('ramal', 'RAMAL', 'campo-curto','text',null, 'numeric')}
              </div>
            </div>

            {/* DADOS CONTRATUAIS */}
            <div className="bloco">
              <h4>DADOS CONTRATUAIS</h4>
              <div className="linha">
                {renderText('inicio_contrato', 'INÍCIO CONTRATO', 'campo-curto', 'text',null, 'date')}
                {renderText('termino_contrato', 'TÉRMINO CONTRATO', 'campo-curto', 'text',null, 'date')}
                {renderSelect('motivo_termino', 'MOTIVO TÉRMINO', opcoes.motivo_termino,'campo-medio', empresa.motivo_termino)}
              </div>
            </div>
          </>
        )}

        {aba === 'FOLHA' && (
          <>
            {/* ABA FOLHA */}
            <div className="bloco">
              <h4>GERAL</h4>
              <div className="linha">
                {renderSelect('data_entrega_folha', 'ENTREGA AO CLIENTE', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.data_entrega_folha)}
                {renderSelect('data_pagto_salario', 'DATA PGTO SALÁRIO', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.data_pagto_salario)}
                {renderSelect('classificacao2', 'TIPO', opcoes.classificacao2,  'campo-micro', empresa.classificacao2)}
                {renderFlag('serv_prest', 'SERV. PRESTADOS',  empresa.serv_prest)}
                {renderFlag('serv_TOM', 'SERV. TOMADOS',  empresa.serv_tom)}
                {renderFlag('deson', 'DESONERAÇÃO', empresa.deson)}
                {renderFlag('secconci', 'SECONCI',  empresa.secconci)}
                {renderFlag('planilha_folha', 'PLAN. FOLHA',  empresa.planilha_folha)}
                {renderFlag('planilha_convenio', 'PLAN. CONVÊNIO',  empresa.planilha_convenio)}
                {renderFlag('apura_vt', 'APURA VT', empresa.apura_vt)}
                {renderFlag('fecha_ponto', 'FECHA PONTO', empresa.fecha_ponto)}
                {renderTextarea('obs_folha', 'OBS. FOLHA', 'campo-longo','textarea-grande')}
              </div>
            </div>
          </>
        )}

        {aba === 'ADIANTAMENTO' && (
          <>
            <div className='bloco'>
              <h4>ADIANTAMENTO</h4>
              <div className="linha">
                {renderFlag('adiantamento', 'ADIANTAMENTO', empresa.adiantamento)}
                {renderSelect('dt_adiantamento_entrega', 'ENTREGA AO CLIENTE', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.dt_adiantamento_entrega)}
                {renderSelect('dt_adiantamento_pagamento', 'DT PAGTO', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.dt_adiantamento_pagamento)}
                {renderText('perc_adiantamento', 'PERCENTUAL', 'campo-curto','text',null,'numeric')}
              </div>
              <div className='linha'>
                {renderTextarea('obs_folha', 'OBS.')}
              </div>
            </div>
          </>
        )}

        {aba === 'PLR' && (
          <div className='bloco'>
            <h4>PLR</h4>

            <div className="linha">
              {renderFlag('plr', 'Tem PLR?', empresa.plr)}
              {renderTextarea('obs_plr', 'OBS.', 'campo-curto')}
            </div>

            <h4 style={{marginTop: '12px'}}>LANÇAMENTOS DE PLR</h4>
            <button type="button" onClick={adicionarPLR}>+ Adicionar PLR</button>

            <table className="tabela-cct">
              <thead>
                <tr>
                  <th>Nº SINDICATO</th>
                  <th>PARCELA</th>
                  <th>VALOR</th>
                  <th>MÊS PAGAMENTO</th>
                  <th>DATA ENTREGA</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {plrs.map(item => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={item.numero_sindicato || ''}
                        onChange={e => atualizarPLR(item.id, 'numero_sindicato', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.parcela || ''}
                        onChange={e => atualizarPLR(item.id, 'parcela', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.valor ?? ''}
                        onChange={e => atualizarPLR(item.id, 'valor', e.target.value)}
                        placeholder="ex.: 1234,56"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.mes_pagamento || ''}
                        onChange={e => atualizarPLR(item.id, 'mes_pagamento', e.target.value)}
                        placeholder="ex.: JANEIRO"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.data_entrega || ''}
                        onChange={e => atualizarPLR(item.id, 'data_entrega', e.target.value)}
                        placeholder="dd-mm-aaaa"
                      />
                    </td>
                    <td>
                      <button onClick={() => removerPLR(item.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {aba === 'DECIMOTERC' && (
          <>
            <div className='bloco'>
              <h4>DÉCIMO TERCEIRO</h4>
              <div className="linha">
                {renderSelect('dt_13_adiantamento_entrega', 'DATA ADTO 13º', periodos.map(p => p.descricao.toUpperCase()), 'campo-micro', empresa.dt_13_adiantamento_entrega)}
                {renderTextarea('obs_13_adiantamento', 'OBS.','campo-curto')}
              </div>
              <br></br>
              <div className="linha">
                {renderSelect('dt_13_entrega', 'DATA 13º.', periodos.map(p => p.descricao.toUpperCase()), 'campo-micro', empresa.dt_13_entrega)}
                {renderTextarea('obs_13', 'OBS.','campo-curto')}
              </div>
            </div>
          </>
        )}

        {aba === 'SERVICOS' && (
          <>
            <div className='bloco'>
              <h4>SERVIÇOS</h4>
              <div className="linha">
                {renderText('aprendizes', 'APRENDIZES', 'campo-curto')}
              {/* </div>
              <br></br>
              <div className="linha"> */}
                {renderText('med_ocupa', 'MEDICINA OCUPACIONAL', 'campo-curto')}
                {renderText('med_ocupa_proc_venc', 'VENC. PROC. MEDICINA', 'campo-micro', 'text',null, 'date')}
              </div>
              <br></br>
              <div className="linha">
                {renderTextarea('obs_admissao', 'OBSERVAÇÕES ADMISSÃO','campo-longo','textarea-medio')}
                {renderTextarea('obs_ferias', 'OBSERVAÇÕES FÉRIAS')}
                {renderTextarea('obs_rescisao', 'OBSERVAÇÕES RESCISÃO','campo-longo','textarea-medio')}
              </div>
            </div>
          </>
        )}

        {aba === 'PONTO' && (
          <>
            <div className='bloco'>
              <h4>PONTO</h4>
              <div className="linha">
                {renderFlag('envia_ponto', 'ENVIA', empresa.envia_ponto)}
                {renderSelect('tipo_ponto', 'TIPO', opcoes.tipo_ponto,'campo-curto', empresa.tipo_ponto)}
                {renderSelect('ponto_ini', 'PERÍODO INICIO', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.ponto_ini)}
                {renderSelect('ponto_fim', 'PERÍODO FIM', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.ponto_fim)}
                {renderTextarea('obs_ponto',"OBSERVAÇÃO")}
                
              </div>
            </div>
          </>
        )}

        {aba === 'PROCURACOES' && (
          <>
            <div className='bloco'>
              <h4>SISTEMA</h4>
              <div className="linha">
                {renderText('login_out_sist', 'LOGIN OUTRO SISTEMA', 'campo-micro')}
                {renderText('sen_out_sist', 'SENHA OUTRO SISTEMA', 'campo-micro')}
              </div>
            </div>

            <div className='bloco'>
              <h4>GOVERNO</h4>
              <div className="linha">
                {renderFlag('tem_det', 'DET ?', empresa.tem_det)}
                {renderFlag('tem_fap', 'FAP ?', empresa.tem_fap)}
                {renderFlag('tem_pat', 'PAT ?', empresa.tem_pat)}
                {renderText('usu_pat', 'USUÁRIO PAT + CPF', 'campo-micro')}
                {renderText('sen_pat', 'SENHA DO PAT', 'campo-micro')}
                {renderText('sd_login', 'SD: LOGIN', 'campo-micro')}
                {renderText('sd_senha', 'SD: SENHA', 'campo-micro')}
                {renderText('sd_email', 'SD: EMAIL', 'campo-curto')}
              </div>
              <br></br>
              <div className="linha">
                {renderText('fgts_digital', 'VENCIMENTO FGTS DIGITAL', 'campo-curto', 'text',null,'date')}              
                {renderText('dt_venc_conec_social', 'VENCIMENTO CONECTIVIDADE SOCIAL', 'campo-curto', 'text',null,'date')}
                {renderText('venc_procuracao', 'VENCIMENTO PROCURAÇÃO E-CAC', 'campo-curto', 'text',null,'date')}
              </div>
            </div>
          </>
        )}

        {aba === 'CCT' && (
          <div className="bloco">
            <h4>CONVENÇÕES COLETIVAS</h4>
            <button type="button" onClick={adicionarCCT}>+ Adicionar CCT</button>
            <table className="tabela-cct">
              <thead>
                <tr>
                  <th>CÓDIGO DO SINDICATO</th>
                  <th>DATA ENVIO CCT</th>
                  <th>ANO BASE</th>
                  <th>LINK DA CONTRIBUIÇÃO</th>
                  <th>LOGIN</th>
                  <th>SENHA</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {ccts.map(cct => (
                  <tr key={cct.id}>
                    <td>
                      <input
                        type="text"
                        value={cct.codigo_sindicato}
                        onChange={(e) => atualizarCCT(cct.id, 'codigo_sindicato', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={cct.data_envio}
                        onChange={(e) => atualizarCCT(cct.id, 'data_envio', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={cct.ano_base}
                        onChange={(e) => atualizarCCT(cct.id, 'ano_base', e.target.value)}
                      />
                    </td>
                     <td>
                      <input
                        type="text"
                        value={cct.cct_link}
                        onChange={(e) => atualizarCCT(cct.id, 'cct_link', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={cct.cct_login}
                        onChange={(e) => atualizarCCT(cct.id, 'cct_login', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={cct.cct_senha}
                        onChange={(e) => atualizarCCT(cct.id, 'cct_senha', e.target.value)}
                      />
                    </td>
                    <td>
                      <button onClick={() => removerCCT(cct.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
       
        {aba === 'ACORDOS' && (
          <>
            <div className='bloco'>
              <h4>ACORDOS</h4>
              <div className="linha">
                {renderTextarea('obs_gerencial', 'OBSERVAÇÕES/ACORDOS COM O CLIENTE  ', 'campo-longo','textarea-gigante')}
              </div>
            </div>
          </>
        )}

      <div className="botoes">
        <button onClick={() => aoSalvar({ ...empresa, ccts, plrs })}>SALVAR</button>
        <button className="cancelar" onClick={aoFechar}>CANCELAR</button>
      </div>
      </div>
    </div>
  </div>
);

}

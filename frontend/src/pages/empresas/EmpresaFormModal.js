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
  const [aba, setAba] = useState('GERENCIAL'); // 'GERENCIAL' | 'FOLHA'

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
    classificacao2: ['BPO FIN', 'BPO RH', 'CARNÊ LEÃO', 'CONSULTORIA', 'DOM S/ MOV', 'DOMÉSTICA', 'FACULTATIVO', 'FATOR R', 'FATOR R + FUNCS', 'OUTROS', 'PRÓ LABORE', 'TIME OUT', 'SEM MOVIMENTO', 'NÃO PREENCHIDO'],
    sim_nao:['SIM', 'NÃO'],
    tipo_ponto:['CARTOGRÁFICO', 'FOLHA']
  };

  const abasDisponiveis = [
      { id: 'GERENCIAL', label: 'Gerencial' },
      { id: 'FOLHA', label: 'Folha' }, 
      { id: 'ADIANTAMENTO', label: 'Adiantamento' },
      { id: 'PLR', label: 'PLR' }, 
      { id: 'DECIMOTERC', label: 'Décimo terceiro' }, 
      { id: 'SERVICOS', label: 'Serviços' }, 
      { id: 'PONTO', label: 'Ponto' }, 
      { id: 'PROCURACOES', label: 'Procurações e Acessos' }, 
  ];

  const renderFlag = (campo, label, valorAtual) => {
    const normalizado = (valorAtual || '').toUpperCase();

    return (
      <div className="campo campo-micro-flag" key={campo}>
        <label className="flag-label">{label}</label>
        <input
          type="checkbox"
          className="flag-checkbox"
          checked={normalizado === 'SIM'}
          onChange={(e) =>
            setEmpresa({
              ...empresa,
              [campo]: e.target.checked ? 'SIM' : 'NÃO',
            })
          }
        />
      </div>
    );
  };



  const renderSelect = (campo, label, options,  classe = 'campo-curto', valorAtual) => {
    const normalizado = (valorAtual || '').toUpperCase();
    const lista = normalizado && !options.includes(normalizado) ? [normalizado, ...options] : options;
    return (
      <div className={`campo ${classe}`}  key={campo}>
        <label>{label}</label>
        <select value={empresa[campo] || ''} onChange={handleChange(campo)}>
          <option value="">--</option>
          {lista.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderText = (campo, label, classe = 'campo-medio', tipo = 'text', valorCustom = null) => (
    <div className={`campo ${classe}`} key={campo}>
      <label>{label}</label>
      <input
        type={tipo}
        value={valorCustom !== null ? valorCustom : (empresa[campo] || '')}
        onChange={handleChange(campo)}
      />
    </div>
  );

  const renderTextarea = (campo, label, classe = 'campo-longo') => (
    <div className={`campo ${classe}`} key={campo}>
      <label>{label}</label>
      <textarea value={empresa[campo] || ''} onChange={handleChange(campo)} rows={3} />
    </div>
  );

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
        {/* Topo comum nas duas abas */}
        <div className="bloco-header">
          <div className="linha topo-comum">
            {renderText('cod_folha', 'CÓD. FOLHA', 'campo-micro-micro')}
            {renderText('cod_geral', 'CÓD. GERAL', 'campo-micro-micro')}
            {renderText('cod_acessorias', 'ACESSÓRIAS', 'campo-micro-micro')}
            {renderSelect('status_do_cliente', 'STATUS DO CLIENTE', opcoes.status_do_cliente, "campo-micro", empresa.status_do_cliente)}
            {renderFlag('sci_report', 'SCI REPORT', empresa.sci_report)}
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
            {renderText('razao_social', 'RAZÃO SOCIAL', 'campo-longo')}
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
                {renderText('tempo_demandado', 'TEMPO DEMANDADO', 'campo-curto')}
                {renderText('honorarios', 'HONORÁRIO', 'campo-curto')}
              </div>
            </div>

            {/* DADOS DO ANALISTA */}
            <div className="bloco">
              <h4>DADOS DO ANALISTA</h4>
              <div className="linha">
                {renderSelect('grupo', 'GRUPO', grupos.map(g => g.nome.toUpperCase()),'campo-curto', empresa.grupo)}
                {renderSelect('resp_dp', 'RESPONSÁVEL DP', responsaveis.map(r => r.nome.toUpperCase()), 'campo-curto', empresa.resp_dp)}
                {renderText('ramal', 'RAMAL', 'campo-curto')}
              </div>
            </div>

            {/* DADOS CONTRATUAIS */}
            <div className="bloco">
              <h4>DADOS CONTRATUAIS</h4>
              <div className="linha">
                {renderText('inicio_contrato', 'INÍCIO CONTRATO', 'campo-curto', 'text')}
                {renderText('termino_contrato', 'TÉRMINO CONTRATO', 'campo-curto', 'text')}
                {renderText('motivo_termino', 'MOTIVO TÉRMINO', 'campo-medio')}
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
                {renderSelect('data_entrega_folha', 'ENTREGA', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.data_entrega_folha)}
                {renderSelect('data_pagto_salario', 'DATA PGTO SALÁRIO', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.data_pagto_salario)}
                {renderSelect('classificacao2', 'TIPO', opcoes.classificacao2,  'campo-micro', empresa.classificacao2)}
                {renderFlag('serv_prest', 'SERVIÇOS PRESTADOS',  empresa.serv_prest)}
                {renderFlag('serv_TOM', 'SERVIÇOS TOMADOS',  empresa.serv_tom)}
                {renderFlag('deson', 'DESONERAÇÃO', empresa.deson)}
                {renderFlag('secconci', 'SECONCI',  empresa.secconci)}
                {renderFlag('planilha_folha', 'PLANILHA FOLHA',  empresa.planilha_folha)}
                {renderFlag('planilha_convenio', 'PLANILHA CONVÊNIO',  empresa.planilha_convenio)}
                {renderTextarea('obs_folha', 'OBSERVAÇÕES FOLHA')}
              </div>
            </div>
            <div className='bloco'>
              <h4>CCT</h4>
              <div className="linha">
                {renderText('dt_envio_cct', 'DATA DE ENVIO CCT', 'campo-micro', 'text')}
                {renderText('opc_rec_patronal', 'OPÇÃO REC. PATRONAL (ANO ATUAL)', 'campo-micro')}
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
                {renderSelect('dt_adiantamento_entrega', 'ENTREGA', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.dt_adiantamento_entrega)}
                {renderSelect('dt_adiantamento_pagamento', 'DT PAGTO', periodos.map(p => p.descricao.toUpperCase()), 'campo-curto', empresa.dt_adiantamento_pagamento)}
                {renderText('perc_adiantamento', 'PERCENTUAL', 'campo-curto')}
              </div>
              <div className='linha'>
                {renderTextarea('obs_folha', 'OBS.')}
              </div>
            </div>
          </>
        )}

        {aba === 'PLR' && (
          <>
            <div className='bloco'>
              <h4>PLR</h4>
              <div className="linha">
                {renderFlag('plr', 'Tem PLR?', empresa.plr)}
                {renderSelect('plr_dt_entrega', 'ENTREGA', periodos.map(p => p.descricao.toUpperCase()), 'campo-micro', empresa.plr_dt_entrega)}
                {renderSelect('plr_dt_pagto', 'DT PAGTO', periodos.map(p => p.descricao.toUpperCase()), 'campo-micro', empresa.plr_dt_pagto)}
                {renderTextarea('obs_plr', 'OBS.')}
              </div>
            </div>
          </>
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
                {renderTextarea('obs_admissao', 'OBSERVAÇÕES ADMISSÃO')}
                {renderText('aprendizes', 'APRENDIZES', 'campo-longo')}
                {renderText('med_ocupa', 'MED. OCUPACIONAL', 'campo-longo')}
                {renderTextarea('obs_ferias', 'OBSERVAÇÕES FÉRIAS')}
                {renderTextarea('obs_rescisao', 'OBSERVAÇÕES RESCISÃO')}
              </div>
            </div>
          </>
        )}

        {aba === 'PONTO' && (
          <>
            <div className='bloco'>
              <h4>PONTO</h4>
              <div className="linha">
                {renderFlag('envia_ponto', 'ENVIA ?', empresa.envia_ponto)}
                {renderFlag('fecha_ponto', 'FECHA ?', empresa.fecha_ponto)}
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
              {/* </div>
              <br></br>
              <div className="linha"> */}
                {renderText('sd_login', 'SD: LOGIN', 'campo-micro')}
                {renderText('sd_senha', 'SD: SENHA', 'campo-micro')}
                {renderText('sd_email', 'SD: EMAIL', 'campo-curto')}
              </div>
              <br></br>
              <div className="linha">
                {renderText('fgts_digital', 'VENCIMENTO FGTS DIGITAL', 'campo-curto', 'text')}              
                {renderText('dt_venc_conec_social', 'VENCIMENTO CONECTIVIDADE SOCIAL', 'campo-curto', 'text')}
                {renderText('venc_procuracao', 'VENCIMENTO PROCURAÇÃO E-CAC', 'campo-curto', 'text')}
              </div>
            </div>
          </>
        )}

        <div className="botoes">
          <button onClick={() => aoSalvar(empresa)}>SALVAR</button>
          <button className="cancelar" onClick={aoFechar}>CANCELAR</button>
        </div>
      </div>
    </div>
  </div>
);

}


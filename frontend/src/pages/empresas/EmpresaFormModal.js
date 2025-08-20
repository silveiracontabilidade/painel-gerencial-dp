import React, { useState, useEffect } from 'react';
import './EmpresaFormModal.css';
import api from '../../api/axios';

export default function EmpresaFormModal({ visivel, aoFechar, aoSalvar, dados }) {
  const [empresa, setEmpresa] = useState({});
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [aba, setAba] = useState('GERENCIAL'); // 'GERENCIAL' | 'FOLHA'

  useEffect(() => {
    const normalizada = {};
    for (const campo in dados) {
      const valor = dados[campo];
      normalizada[campo] = typeof valor === 'string' ? valor.toUpperCase() : valor;
    }
    setEmpresa(normalizada);
  }, [dados]);

  useEffect(() => {
    async function carregarDados() {
      const [res1, res2] = await Promise.all([
        api.get('/api/responsaveis/'),
        api.get('/api/grupos/')
      ]);
      setResponsaveis(res1.data.results || res1.data);
      setGrupos(res2.data.results || res2.data);
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
    sistema: ['ADP', 'DEBCRED', 'DOMÍNIO', 'INTERNO', 'PROTHEUS', 'RM', 'TI9', 'TOTVS', 'ÚNICO', 'VM'],
    classificacao: ['BRONZE', 'PRATA', 'OURO', 'DIAMANTE'],
    sci_report: ['SIM', 'NÃO'],
    visitacao: ['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'N/A'],
    matriz: ['SIM', 'NÃO'],
    enviadctf: ['SIM', 'NÃO'],
    classificacao2: ['BPO FIN', 'BPO RH', 'CARNÊ LEÃO', 'CONSULTORIA', 'DOM S/ MOV', 'DOMÉSTICA', 'FACULTATIVO', 'FATOR R', 'FATOR R + FUNCS', 'OUTROS', 'PRÓ LABORE', 'TIME OUT', 'SEM MOVIMENTO', 'NÃO PREENCHIDO'],
    sim_nao:['SIM', 'NÃO']
  };

  const renderSelect = (campo, label, options, valorAtual) => {
    const normalizado = (valorAtual || '').toUpperCase();
    const lista = normalizado && !options.includes(normalizado) ? [normalizado, ...options] : options;
    return (
      <div className="campo campo-medio" key={campo}>
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

  const renderText = (campo, label, classe = 'campo-medio', tipo = 'text') => (
    <div className={`campo ${classe}`} key={campo}>
      <label>{label}</label>
      <input type={tipo} value={empresa[campo] || ''} onChange={handleChange(campo)} />
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
          <button className={aba === 'GERENCIAL' ? 'aba ativa' : 'aba'} onClick={() => setAba('GERENCIAL')}>Gerencial</button>
          <button className={aba === 'FOLHA' ? 'aba ativa' : 'aba'} onClick={() => setAba('FOLHA')}>Folha</button>
        </div>

        <div className="modal-form">
          {/* Topo comum nas duas abas */}
          <div className="linha topo-comum">
            {renderText('cod_folha', 'CÓDIGO FOLHA', 'campo-micro')}
            {renderText('cod_geral', 'CÓDIGO GERAL', 'campo-micro')}
            {renderText('razao_social', 'RAZÃO SOCIAL', 'campo-curto')}
          </div>

          {aba === 'GERENCIAL' ? (
            <>
              <div className="linha">
                {renderText('grupo_economico', 'GRUPO ECONÔMICO', 'campo-medio')}
                {renderText('cnpj_original', 'CNPJ ORIGINAL', 'campo-medio')}
              </div>
              <div className="linha">
                {renderSelect('status_do_cliente', 'STATUS DO CLIENTE', opcoes.status_do_cliente, empresa.status_do_cliente)}
                {renderText('inicio_contrato', 'INÍCIO CONTRATO', 'campo-curto', 'date')}
                {renderText('termino_contrato', 'TÉRMINO CONTRATO', 'campo-curto', 'date')}
                {renderText('motivo_termino', 'MOTIVO TÉRMINO', 'campo-longo')}
              </div>
              <div className="linha">
                {renderSelect('tributacao', 'TRIBUTAÇÃO', opcoes.tributacao, empresa.tributacao)}
                {renderSelect('sistema', 'SISTEMA', opcoes.sistema, empresa.sistema)}
                {renderSelect('resp_dp', 'RESPONSÁVEL DP', responsaveis.map(r => r.nome.toUpperCase()), empresa.resp_dp)}
                {renderText('ramal', 'RAMAL', 'campo-curto')}
                {renderText('voip', 'VOIP', 'campo-curto')}
              </div>
              <div className="linha">
                {renderSelect('grupo', 'GRUPO', grupos.map(g => g.nome.toUpperCase()), empresa.grupo)}
                {renderText('data_pagto_salario', 'DATA PGTO SALÁRIO', 'campo-curto')}
                {renderSelect('classificacao', 'CLASSIFICAÇÃO', opcoes.classificacao, empresa.classificacao)}
                {renderSelect('sci_report', 'SCI REPORT', opcoes.sci_report, empresa.sci_report)}
              </div>
              <div className="linha">
                {renderSelect('visitacao', 'VISITAÇÃO', opcoes.visitacao, empresa.visitacao)}
                {renderSelect('matriz', 'MATRIZ', opcoes.matriz, empresa.matriz)}
                {renderText('tempo_demandado', 'TEMPO DEMANDADO')}
                {renderSelect('enviadctf', 'ENVIA DCTF', opcoes.enviadctf, empresa.enviadctf)}
                {renderSelect('classificacao2', 'CLASSIFICAÇÃO 2', opcoes.classificacao2, empresa.classificacao2)}
              </div>
            </>
          ) : (
            <>
              {/* ABA FOLHA */}
              <div className="linha">
                {renderSelect('SERV_PREST', 'SERVIÇOS PRESTADOS', opcoes.sim_nao, empresa.serv_prest)}
                {renderSelect('DESON', 'DESONERAÇÃO', opcoes.sim_nao, empresa.deson)}
                {renderSelect('SECCONCI', 'SECONCI', opcoes.sim_nao, empresa.secconci)}
                {renderSelect('PLANILHA_FOLHA', 'PLANILHA FOLHA', opcoes.sim_nao, empresa.planilha_folha)}
                {renderSelect('PLANILHA_CONVENIO', 'PLANILHA CONVÊNIO', opcoes.sim_nao, empresa.planilha_convenio)}
              </div>
              <div className="linha">
                {renderText('DT_ADIANTAMENTO', 'DT PAGTO ADIANTAMENTO', 'campo-curto', 'date')}
                {renderText('PERC_ADIANTAMENTO', '% DO ADIANTAMENTO', 'campo-curto')}
                {renderText('DT_ENVIO_CCT', 'DATA DE ENVIO CCT', 'campo-curto', 'date')}
                {renderText('OPC_REC_PATRONAL', 'OPÇÃO REC. PATRONAL (ANO ATUAL)', 'campo-medio')}
              </div>
              <div className="linha">
                {renderSelect('FECHA_PONTO', 'FECHAMOS PONTO?', opcoes.sim_nao, empresa.fecha_ponto)}
                {renderText('PERIODO_PONTO', 'PERÍODO DO PONTO', 'campo-curto')}
                {renderText('TIPO_PONTO', 'TIPO DO PONTO', 'campo-curto')}
                {renderText('SST', 'SST', 'campo-curto')}
              </div>
              <div className="linha">
                {renderTextarea('OBS_FOLHA', 'OBSERVAÇÕES FOLHA')}
              </div>
              <div className="linha">
                {renderTextarea('INFO_FERIAS', 'INFORMAÇÕES FÉRIAS')}
                {renderTextarea('OBS_RESCISAO', 'OBSERVAÇÕES RESCISÃO')}
              </div>
              <div className="linha">
                {renderText('LOGIN_OUT_SIST', 'LOGIN OUTRO SISTEMA', 'campo-curto')}
                {renderText('SEN_OUT_SIST', 'SENHA OUTRO SISTEMA', 'campo-curto')}
                {renderText('USU_PAT', 'USUÁRIO PAT + CPF', 'campo-curto')}
                {renderText('SEN_PAT', 'SENHA DO PAT', 'campo-curto')}
              </div>
              <div className="linha">
                {renderText('SD_LOGIN', 'SD: LOGIN', 'campo-curto')}
                {renderText('SD_SENHA', 'SD: SENHA', 'campo-curto')}
                {renderText('SD_EMAIL', 'SD: EMAIL', 'campo-curto')}
                {renderText('FGTS_DIGITAL', 'FGTS DIGITAL', 'campo-curto')}
                {renderText('DT_VENC_CONEC_SOCIAL', 'VCTO CONECTIVIDADE SOCIAL', 'campo-curto', 'date')}
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


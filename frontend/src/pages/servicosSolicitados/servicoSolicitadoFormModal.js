// ServicoSolicitadoFormModal.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './servicos-solicitados.css';
import Select from 'react-select';

export default function ServicoSolicitadoFormModal({ dados, fechar }) {
  const [form, setForm] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    const init = async () => {
      await carregarDadosAuxiliares();
      if (dados) {
        const limpa = { ...dados };
        delete limpa.empresa_id;
        setForm(limpa);
      } else {
        setForm(f => ({ ...f, data_solicitacao: new Date().toISOString().split('T')[0] }));
      }
    };
    init();
  }, [dados]);

  const carregarDadosAuxiliares = async () => {
    const [resEmp, resServ] = await Promise.all([
      api.get('/api/empresas/?limit=9999'),
      api.get('/api/servicos/')
    ]);
    setEmpresas(resEmp.data.results || resEmp.data);
    setServicos(resServ.data.results || resServ.data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleServicoChange = (e) => {
    const { value } = e.target;
    const servico = servicos.find(s => String(s.id) === value);
    const dataSolicitacao = form.data_solicitacao || new Date().toISOString().split('T')[0];
    const prazoDias = servico?.prazo_dias || 0;
    const venc = new Date(dataSolicitacao);
    venc.setDate(venc.getDate() + Number(prazoDias));
    const vencStr = venc.toISOString().split('T')[0];
    setForm(prev => ({ ...prev, servico: value, data_vencimento: vencStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { empresa_id, ...payload } = form;
    if (dados?.id) await api.put(`/api/solicitacoes/${dados.id}/`, payload);
    else await api.post('/api/solicitacoes/', payload);
    fechar();
  };

  const renderInput = (name, label, tipo = 'text', classe = 'campo-medio', disabled = false) => (
    <div className={`campo ${classe}`} key={name}>
      <label>{label}</label>
      <input
        type={tipo}
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );

  const renderSelect = (name, label, opcoes, classe = 'campo-medio') => (
    <div className={`campo ${classe}`} key={name}>
      <label>{label}</label>
      <select name={name} value={form[name] || ''} onChange={handleChange}>
        <option value="">--</option>
        {opcoes.map(opt => (
          <option key={opt.id || opt} value={opt.id || opt}>
            {opt.razao_social || opt.nome || opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{dados ? 'EDITAR SERVIÇO SOLICITADO' : 'NOVO SERVIÇO SOLICITADO'}</h3>
        <form onSubmit={handleSubmit} className="modal-form">

          <div className="linha">
            <div className="campo campo-longo">
              <label>EMPRESA</label>
              <Select
                options={empresas.map(emp => ({
                  value: emp.cod_folha,
                  label: `${emp.cod_folha} - ${emp.razao_social}`
                }))}
                value={empresas
                  .map(emp => ({
                    value: emp.cod_folha,
                    label: `${emp.cod_folha} - ${emp.razao_social}`
                  }))
                  .find(opt => String(opt.value) === String(form.empresa))}
                onChange={opt => {
                  const novo = { ...form };
                  delete novo.empresa_id;
                  novo.empresa = opt?.value || '';
                  setForm(novo);
                }}
                placeholder="Digite para buscar..."
                isClearable
              />
            </div>
          </div>

          <div className="linha">
            <div className="campo campo-medio">
              <label>SERVIÇO</label>
              <select name="servico" value={form.servico || ''} onChange={handleServicoChange}>
                <option value="">--</option>
                {servicos.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            {renderInput('competencia', 'COMPETÊNCIA', 'text', 'campo-curto')}
            {renderInput('identificacao', 'IDENTIFICAÇÃO', 'text', 'campo-longo')}
          </div>

          <div className="linha">
            {renderInput('data_solicitacao', 'SOLICITAÇÃO', 'date', 'campo-curto')}
            {renderInput('data_vencimento', 'VENCIMENTO', 'date', 'campo-curto', true)}
            {renderInput('data_para_resposta', 'DATA PARA RESPOSTA', 'date', 'campo-curto')}
            {renderInput('data_conclusao', 'CONCLUSÃO', 'date', 'campo-curto')}
          </div>

          <div className="linha">
            <div className="campo campo-longo">
              <label>DESCRIÇÃO DO SERVIÇO</label>
              <textarea name="descricao_servico" value={form.descricao_servico || ''} onChange={handleChange}></textarea>
            </div>
          </div>

          <div className="botoes">
            <button type="submit">SALVAR</button>
            <button type="button" className="cancelar" onClick={fechar}>CANCELAR</button>
          </div>
        </form>
      </div>
    </div>
  );
}

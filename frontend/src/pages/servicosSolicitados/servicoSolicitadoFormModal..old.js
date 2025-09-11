// ServicoSolicitadoFormModal.js
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './servicos-solicitados.css';
import Select from 'react-select';
import { paraISO, paraBR } from '../../utils/datas';

// Helpers de datas (UI dd-mm-aaaa)
const toBRHifen = (iso) => (iso ? paraBR(iso).replace(/\//g, '-') : '');
const toISO = (brOuBrHifen) => {
  if (!brOuBrHifen) return null;
  return paraISO(brOuBrHifen.replace(/\//g, '-'));
};

// Máscara/normalização de data (opcional usar depois nos inputs)
const mascararData = (valor) => {
  const d = String(valor || '').replace(/[^\d]/g, '').slice(0, 8);
  if (!d) return '';
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
};
const normalizarData = (valor) => {
  const d = String(valor || '').replace(/[^\d]/g, '');
  if (d.length < 8) return valor;
  let dia = Math.min(Math.max(parseInt(d.slice(0, 2) || '1', 10), 1), 31);
  let mes = Math.min(Math.max(parseInt(d.slice(2, 4) || '1', 10), 1), 12);
  let ano = Math.max(parseInt(d.slice(4, 8) || '1900', 10), 1900);
  const DD = String(dia).padStart(2, '0');
  const MM = String(mes).padStart(2, '0');
  const YYYY = String(ano).padStart(4, '0');
  return `${DD}-${MM}-${YYYY}`;
};

export default function ServicoSolicitadoFormModal({ dados, fechar }) {
  const [form, setForm] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [errors, setErrors] = useState({}); // <- erros de validação/front ou API

  const CAMPOS_DATA = ['data_solicitacao', 'data_vencimento', 'data_para_resposta', 'data_conclusao'];

  useEffect(() => {
    const init = async () => {
      await carregarDadosAuxiliares();

      if (dados) {
        const f = { ...dados };
        delete f.empresa_id;

        // Normaliza datas recebidas (podem vir ISO)
        CAMPOS_DATA.forEach((c) => {
          f[c] = f[c] ? toBRHifen(f[c]) : '';
        });

        setForm(f);
      } else {
        const hojeISO = new Date().toISOString().split('T')[0];
        setForm((prev) => ({ ...prev, data_solicitacao: toBRHifen(hojeISO) }));
      }
    };
    init();
  }, [dados]);

  const carregarDadosAuxiliares = async () => {
    const [resEmp, resServ] = await Promise.all([
      api.get('/api/empresas/', { params: { page: 1, page_size: 2000 } }),
      api.get('/api/servicos/'),
    ]);
    setEmpresas(resEmp.data.results || resEmp.data);
    setServicos(resServ.data.results || resServ.data);
  };

  // ===== Handlers =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: String(value ?? '').toUpperCase() }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleChangeDataMask = (e) => {
    const { name, value } = e.target;
    const val = mascararData(value);
    setForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlurDataNormalize = (e) => {
    const { name, value } = e.target;
    const val = normalizarData(value);
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleServicoChange = (e) => {
    const value = e?.target ? e.target.value : e; // compatível se vier de um select custom
    // Se limpar o serviço, zera também o vencimento calculado
    if (!value) {
      setForm((prev) => ({ ...prev, servico: '', data_vencimento: '' }));
      if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
      return;
    }

    const servico = servicos.find((s) => String(s.id) === String(value));
    const dataSolicBR = form.data_solicitacao || toBRHifen(new Date().toISOString().split('T')[0]);
    const baseISO = toISO(dataSolicBR) || new Date().toISOString().split('T')[0];

    const venc = new Date(`${baseISO}T00:00:00`);
    const prazoDias = Number(servico?.prazo_dias || 0);
    venc.setDate(venc.getDate() + prazoDias);

    const vencISO = venc.toISOString().split('T')[0];
    const vencBR = toBRHifen(vencISO);

    setForm((prev) => ({ ...prev, servico: String(value), data_vencimento: vencBR }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
  };

  // ===== Validação leve (front) =====
  const validar = () => {
    const e = {};
    if (!form.empresa) e.empresa = 'Selecione a empresa.';
    if (!form.servico) e.servico = 'Selecione o serviço.';
    // data_solicitacao pode ser opcional, mas se vier, precisa estar plausível
    if (form.data_solicitacao) {
      const iso = toISO(form.data_solicitacao);
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        e.data_solicitacao = 'Data inválida. Use dd-mm-aaaa.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Sanitização ('' -> null, id numérico, datas ISO)
  const montarPayload = () => {
    const toNull = (v) => (v === '' || v === undefined ? null : v);
    const payload = { ...form };

    payload.empresa = toNull(payload.empresa); // é o cod_folha (string). Se back exigir, será validado no DRF.
    payload.servico = payload.servico ? Number(payload.servico) : null;

    CAMPOS_DATA.forEach((c) => {
      payload[c] = payload[c] ? toISO(String(payload[c])) : null; // dd-mm-aaaa -> YYYY-MM-DD
    });

    delete payload.empresa_id;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = montarPayload();

    try {
      if (dados?.id) {
        await api.put(`/api/solicitacoes/${dados.id}/`, payload);
      } else {
        await api.post('/api/solicitacoes/', payload);
      }
      fechar();
    } catch (err) {
      // Trata erros da API (400, 422, etc.)
      const apiData = err.response?.data;
      if (apiData && typeof apiData === 'object') {
        // pinta os campos com erro, se nome bater
        const novosErros = { ...errors };
        Object.entries(apiData).forEach(([campo, msgs]) => {
          novosErros[campo] = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        });
        setErrors(novosErros);

        // monta um alerta consolidado
        const msg = Object.entries(apiData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
        alert(`Erro ao salvar:\n${msg}`);
      } else {
        alert('Erro ao salvar o registro. Tente novamente.');
      }
      console.error('Falha ao salvar solicitação:', err);
    }
  };

  // Render helpers
  const renderInput = (name, label, tipo = 'text', classe = 'campo-medio', disabled = false) => (
    <div className={`campo ${classe}`} key={name}>
      <label>
        {label}{' '}
        {errors[name] && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors[name]})</span>}
      </label>
      <input
        type={tipo}
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        disabled={disabled}
        style={errors[name] ? { borderColor: 'red' } : undefined}
      />
    </div>
  );

  const renderInputData = (name, label, classe = 'campo-medio', disabled = false) => (
    <div className={`campo ${classe}`} key={name}>
      <label>
        {label}{' '}
        {errors[name] && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors[name]})</span>}
      </label>
      <input
        type="text"
        name={name}
        value={form[name] || ''}
        onChange={handleChangeDataMask}
        onBlur={handleBlurDataNormalize}
        placeholder="dd-mm-aaaa"
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        style={errors[name] ? { borderColor: 'red' } : undefined}
      />
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{dados ? 'EDITAR SERVIÇO SOLICITADO' : 'NOVO SERVIÇO SOLICITADO'}</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="linha">
            <div className="campo campo-longo">
              <label>
                EMPRESA{' '}
                {errors.empresa && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors.empresa})</span>}
              </label>
              <Select
                options={empresas.map((emp) => ({
                  value: emp.cod_folha,
                  label: `${emp.cod_folha} - ${emp.razao_social}`,
                }))}
                value={empresas
                  .map((emp) => ({
                    value: emp.cod_folha,
                    label: `${emp.cod_folha} - ${emp.razao_social}`,
                  }))
                  .find((opt) => String(opt.value) === String(form.empresa))}
                onChange={(opt) => {
                  setForm((prev) => ({ ...prev, empresa: opt?.value || '' }));
                  if (errors.empresa) setErrors((prev) => ({ ...prev, empresa: undefined }));
                }}
                placeholder="Digite para buscar..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: errors.empresa ? 'red' : base.borderColor,
                    minHeight: 30,
                  }),
                  indicatorsContainer: (base) => ({ ...base, height: 30 }),
                }}
              />
            </div>
          </div>

          <div className="linha">
            <div className="campo campo-medio">
              <label>
                SERVIÇO{' '}
                {errors.servico && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors.servico})</span>}
              </label>
              <select
                name="servico"
                value={form.servico || ''}
                onChange={handleServicoChange}
                style={errors.servico ? { borderColor: 'red' } : undefined}
              >
                <option value="">--</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            {renderInput('competencia', 'COMPETÊNCIA', 'text', 'campo-curto')}
            
            <div className="campo campo-medio">
              <label>STATUS</label>
              <select
                name="status"
                value={form.status || 'PENDENTE'}
                onChange={handleChange}
              >
                <option value="PENDENTE">Pendente</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="ATRASADO">Atrasado</option>
              </select>   
            </div> 

            {renderInput('identificacao', 'IDENTIFICAÇÃO', 'text', 'campo-longo')}
            <div className="campo campo-longo">
              <label>DESCRIÇÃO DO SERVIÇO</label>
              <textarea
                name="descricao_servico"
                value={form.descricao_servico || ''}
                onChange={handleChange}
                placeholder="Detalhes da demanda..."
              />
            </div>
          </div>

          <div className="linha">
            {renderInputData('data_solicitacao', 'SOLICITAÇÃO', 'campo-curto')}
            {renderInputData('data_vencimento', 'VENCIMENTO', 'campo-curto', true)}
            {renderInputData('data_para_resposta', 'DATA PARA RESPOSTA', 'campo-curto')}
            {renderInputData('data_conclusao', 'CONCLUSÃO', 'campo-curto')}
          </div>

          <div className="botoes">
            <button type="submit">SALVAR</button>
            <button type="button" className="cancelar" onClick={fechar}>
              CANCELAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

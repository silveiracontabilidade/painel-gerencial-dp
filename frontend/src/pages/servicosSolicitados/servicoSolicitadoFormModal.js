// ServicoSolicitadoFormModal.js
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './servicos-solicitados.css';
import Select from 'react-select';
import { paraISO, paraBR } from '../../utils/datas';

// ===== Helpers =====
const toBRHifen = (iso) => (iso ? paraBR(iso).replace(/\//g, '-') : '');
const toISO = (brOuBrHifen) => {
  if (!brOuBrHifen) return null;
  return paraISO(brOuBrHifen.replace(/\//g, '-'));
};
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
const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const getTipoServico = (nome) => {
  const n = normalize(nome);
  if (n.includes('ADMIS')) return 'ADMISSAO';
  if (n.includes('FERI')) return 'FERIAS';
  if (n.includes('RESCIS')) return 'RESCISAO';
  if (n.includes('AFAST')) return 'AFASTAMENTO';
  return null;
};

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
const formatISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


// ===== Mapeamento 1:1 para o Model informado =====
const FIELD_MAP = {
  // status geral
  status: 'status',

  // FÉRIAS
  ferias: {
    abono: 'ferias_abono',
    data_ini: 'ferias_data_ini', // CharField (guardamos dd-mm-aaaa)
  },

  // RESCISÃO
  rescisao: {
    tipo_aviso: 'rescisao_tipo_aviso',
    dias_aviso: 'rescisao_dias_aviso',
    data_ini: 'rescisao_data_ini', // CharField (dd-mm-aaaa)
    tipo: 'rescisao_tipo',
  },

  // ADMISSÃO
  admissao: {
    tipo: 'admissao_tipo',
    data_ini: 'admissao_data_ini', // CharField (dd-mm-aaaa)
    deslig_programado: 'admissao_deslig_programado',
  },

  // AFASTAMENTO
  afast: {
    tipo: 'afast_tipo',
    dias: 'afast_dias',
    ini: 'afast_ini', // CharField (dd-mm-aaaa)
    pericia: 'afast_pericia',
  },
};

export default function ServicoSolicitadoFormModal({ dados, fechar }) {
  const [form, setForm] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [errors, setErrors] = useState({});

  // estados blocos dinâmicos (mantidos como strings; datas específicas ficam em dd-mm-aaaa)
  const [ferias, setFerias] = useState({});
  const [rescisao, setRescisao] = useState({});
  const [admissao, setAdmissao] = useState({});
  const [afast, setAfast] = useState({});

  const CAMPOS_DATA_CORE = ['data_solicitacao', 'data_vencimento', 'data_para_resposta', 'data_conclusao'];

  useEffect(() => {
    const init = async () => {
      await carregarDadosAuxiliares();

      if (dados) {
        const f = { ...dados };
        delete f.empresa_id;

        // Normaliza datas core para dd-mm-aaaa (inputs)
        CAMPOS_DATA_CORE.forEach((c) => {
          f[c] = f[c] ? toBRHifen(f[c]) : '';
        });

        // Pré-preenche blocos dinâmicos a partir do back (1:1)
        setFerias({
          [FIELD_MAP.ferias.abono]: dados[FIELD_MAP.ferias.abono] || '',
          [FIELD_MAP.ferias.data_ini]: dados[FIELD_MAP.ferias.data_ini] || '',
        });
        setRescisao({
          [FIELD_MAP.rescisao.tipo_aviso]: dados[FIELD_MAP.rescisao.tipo_aviso] || '',
          [FIELD_MAP.rescisao.dias_aviso]: dados[FIELD_MAP.rescisao.dias_aviso] || '',
          [FIELD_MAP.rescisao.data_ini]: dados[FIELD_MAP.rescisao.data_ini] || '',
          [FIELD_MAP.rescisao.tipo]: dados[FIELD_MAP.rescisao.tipo] || '',
        });
        setAdmissao({
          [FIELD_MAP.admissao.tipo]: dados[FIELD_MAP.admissao.tipo] || '',
          [FIELD_MAP.admissao.data_ini]: dados[FIELD_MAP.admissao.data_ini] || '',
          [FIELD_MAP.admissao.deslig_programado]: dados[FIELD_MAP.admissao.deslig_programado] || '',
        });
        setAfast({
          [FIELD_MAP.afast.tipo]: dados[FIELD_MAP.afast.tipo] || '',
          [FIELD_MAP.afast.dias]: dados[FIELD_MAP.afast.dias] || '',
          [FIELD_MAP.afast.ini]: dados[FIELD_MAP.afast.ini] || '',
          [FIELD_MAP.afast.pericia]: dados[FIELD_MAP.afast.pericia] || '',
        });

        setForm(f);
      } else {
        const hojeISO = new Date().toISOString().split('T')[0];
        setForm((prev) => ({ ...prev, data_solicitacao: toBRHifen(hojeISO), status: 'PENDENTE' }));
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  const carregarDadosAuxiliares = async () => {
    const [resEmp, resServ] = await Promise.all([
      api.get('/api/empresas/', { params: { page: 1, page_size: 2000 } }),
      api.get('/api/servicos/'),
    ]);
    setEmpresas(resEmp.data.results || resEmp.data);
    setServicos(resServ.data.results || resServ.data);
  };

  const servicoSelecionado = useMemo(
    () => servicos.find((s) => String(s.id) === String(form.servico)),
    [servicos, form.servico]
  );
  const tipoServico = getTipoServico(servicoSelecionado?.nome);

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
  // const handleServicoChange = (e) => {
  //   const value = e?.target ? e.target.value : e;
  //   if (!value) {
  //     setForm((prev) => ({ ...prev, servico: '', data_vencimento: '' }));
  //     if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
  //     return;
  //   }

  //   const servico = servicos.find((s) => String(s.id) === String(value));
  //   const dataSolicBR = form.data_solicitacao || toBRHifen(new Date().toISOString().split('T')[0]);
  //   const baseISO = toISO(dataSolicBR) || new Date().toISOString().split('T')[0];

  //   const venc = new Date(`${baseISO}T00:00:00`);
  //   const prazoDias = Number(servico?.prazo_dias || 0);
  //   venc.setDate(venc.getDate() + prazoDias);

  //   const vencISO = venc.toISOString().split('T')[0];
  //   const vencBR = toBRHifen(vencISO);

  //   setForm((prev) => ({ ...prev, servico: String(value), data_vencimento: vencBR }));
  //   if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
  // };

  const handleServicoChange = (e) => {
  const value = e?.target ? e.target.value : e;
  if (!value) {
    setForm((prev) => ({ ...prev, servico: '', data_vencimento: '' }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
    return;
  }

  const servico = servicos.find((s) => String(s.id) === String(value));

  // Base para a data: tentar usar a data_solicitacao do form; se for inválida, cair pra hoje
  const dataSolicBR = form.data_solicitacao || toBRHifen(new Date().toISOString().split('T')[0]);
  const baseISO = toISO(dataSolicBR) || new Date().toISOString().split('T')[0];

  // Construção robusta da data base
  let base = new Date(`${baseISO}T00:00:00`);
  if (!isValidDate(base)) {
    base = new Date(); // fallback
    // zera horário pra não variar por timezone
    base.setHours(0, 0, 0, 0);
  }

  // Soma do prazo (sempre número)
  const prazoDias = Number(servico?.prazo_dias ?? 0);
    if (!Number.isFinite(prazoDias)) {
      // se por algum motivo vier algo não numérico, zera
      base = new Date(base.getTime());
    } else {
      base = new Date(base.getTime());
      base.setDate(base.getDate() + prazoDias);
    }

    // Formata YYYY-MM-DD sem depender de toISOString (evita "Invalid time value")
    const vencISO = isValidDate(base) ? formatISO(base) : new Date().toISOString().split('T')[0];
    const vencBR = toBRHifen(vencISO);

    setForm((prev) => ({ ...prev, servico: String(value), data_vencimento: vencBR }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
  };

  // binds para blocos
  const bind = (setter) => (campo) => (e) => {
    const v = e?.target?.value ?? e;
    setter((prev) => ({ ...prev, [campo]: String(v ?? '') }));
  };
  const bindMaskDate = (setter) => (campo) => (e) => {
    const v = mascararData(e.target.value);
    setter((prev) => ({ ...prev, [campo]: v }));
  };
  const bindBlurNormDate = (setter) => (campo) => (e) => {
    const v = normalizarData(e.target.value);
    setter((prev) => ({ ...prev, [campo]: v }));
  };

  // ===== Validação (leve) =====
  const validar = () => {
    const e = {};
    if (!form.empresa) e.empresa = 'Selecione a empresa.';
    if (!form.servico) e.servico = 'Selecione o serviço.';
    if (form.data_solicitacao) {
      const iso = toISO(form.data_solicitacao);
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) e.data_solicitacao = 'Data inválida. Use dd-mm-aaaa.';
    }

    // mínimos por tipo (exemplos)
    if (tipoServico === 'FERIAS') {
      // se vier preenchida, garantir formato válido
      const campo = FIELD_MAP.ferias.data_ini;
      if (ferias[campo] && !/^\d{2}-\d{2}-\d{4}$/.test(ferias[campo])) e[campo] = 'Data inválida.';
    }
    if (tipoServico === 'RESCISAO') {
      const campo = FIELD_MAP.rescisao.data_ini;
      if (rescisao[campo] && !/^\d{2}-\d{2}-\d{4}$/.test(rescisao[campo])) e[campo] = 'Data inválida.';
    }
    if (tipoServico === 'ADMISSAO') {
      const campo = FIELD_MAP.admissao.data_ini;
      if (admissao[campo] && !/^\d{2}-\d{2}-\d{4}$/.test(admissao[campo])) e[campo] = 'Data inválida.';
    }
    if (tipoServico === 'AFASTAMENTO') {
      const inif = FIELD_MAP.afast.ini;
      if (afast[inif] && !/^\d{2}-\d{2}-\d{4}$/.test(afast[inif])) e[inif] = 'Data inválida.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ===== Montagem do payload =====
  const montarPayload = () => {
    const toNull = (v) => (v === '' || v === undefined ? null : v);
    const payload = { ...form };

    // campos base
    payload.empresa = toNull(payload.empresa);
    payload.servico = payload.servico ? Number(payload.servico) : null;

    // datas core -> ISO
    CAMPOS_DATA_CORE.forEach((c) => {
      payload[c] = payload[c] ? toISO(String(payload[c])) : null;
    });

    // status
    if (FIELD_MAP.status) payload[FIELD_MAP.status] = payload.status || 'PENDENTE';

    // === FÉRIAS (CharField -> mantemos dd-mm-aaaa) ===
    Object.entries(ferias).forEach(([k, v]) => (payload[k] = toNull(v)));

    // === RESCISÃO (CharField) ===
    Object.entries(rescisao).forEach(([k, v]) => (payload[k] = toNull(v)));

    // === ADMISSÃO (CharField) ===
    Object.entries(admissao).forEach(([k, v]) => (payload[k] = toNull(v)));

    // === AFASTAMENTO (CharField) ===
    Object.entries(afast).forEach(([k, v]) => (payload[k] = toNull(v)));

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
      const apiData = err.response?.data;
      if (apiData && typeof apiData === 'object') {
        const novosErros = { ...errors };
        Object.entries(apiData).forEach(([campo, msgs]) => {
          novosErros[campo] = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        });
        setErrors(novosErros);
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

  // ===== Render helpers =====
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
  const renderMaskedDate = (state, setter, field, label, classe = 'campo-curto') => (
    <div className={`campo ${classe}`} key={field}>
      <label>
        {label}{' '}
        {errors[field] && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors[field]})</span>}
      </label>
      <input
        type="text"
        value={state[field] || ''}
        onChange={bindMaskDate(setter)(field)}
        onBlur={bindBlurNormDate(setter)(field)}
        placeholder="dd-mm-aaaa"
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        style={errors[field] ? { borderColor: 'red' } : undefined}
      />
    </div>
  );

  // ===== Blocos Dinâmicos =====
  const BlocoFerias = () => (
    <div className="bloco">
      <h4>Férias</h4>
      <div className="linha">
        <div className="campo campo-curto">
          <label>Abono</label>
          <select
            value={ferias[FIELD_MAP.ferias.abono] || ''}
            onChange={bind(setFerias)(FIELD_MAP.ferias.abono)}
          >
            <option value="">--</option>
            <option value="SIM">SIM</option>
            <option value="NAO">NÃO</option>
          </select>
        </div>
        {renderMaskedDate(ferias, setFerias, FIELD_MAP.ferias.data_ini, 'Início (dd-mm-aaaa)')}
      </div>
    </div>
  );

  const BlocoRescisao = () => (
    <div className="bloco">
      <h4>Rescisão</h4>
      <div className="linha">
        <div className="campo campo-curto">
          <label>Tipo Aviso</label>
          <input
            value={rescisao[FIELD_MAP.rescisao.tipo_aviso] || ''}
            onChange={bind(setRescisao)(FIELD_MAP.rescisao.tipo_aviso)}
          />
        </div>
        <div className="campo campo-curto">
          <label>Dias Aviso</label>
          <input
            value={rescisao[FIELD_MAP.rescisao.dias_aviso] || ''}
            onChange={bind(setRescisao)(FIELD_MAP.rescisao.dias_aviso)}
          />
        </div>
        {renderMaskedDate(rescisao, setRescisao, FIELD_MAP.rescisao.data_ini, 'Data Início (dd-mm-aaaa)')}
        <div className="campo campo-medio">
          <label>Tipo</label>
          <input
            value={rescisao[FIELD_MAP.rescisao.tipo] || ''}
            onChange={bind(setRescisao)(FIELD_MAP.rescisao.tipo)}
          />
        </div>
      </div>
    </div>
  );

  const BlocoAdmissao = () => (
    <div className="bloco">
      <h4>Admissão</h4>
      <div className="linha">
        <div className="campo campo-medio">
          <label>Tipo</label>
          <input
            value={admissao[FIELD_MAP.admissao.tipo] || ''}
            onChange={bind(setAdmissao)(FIELD_MAP.admissao.tipo)}
          />
        </div>
        {renderMaskedDate(admissao, setAdmissao, FIELD_MAP.admissao.data_ini, 'Data Início (dd-mm-aaaa)')}
        <div className="campo campo-medio">
          <label>Deslig. Programado</label>
          <input
            value={admissao[FIELD_MAP.admissao.deslig_programado] || ''}
            onChange={bind(setAdmissao)(FIELD_MAP.admissao.deslig_programado)}
          />
        </div>
      </div>
    </div>
  );

  const BlocoAfastamento = () => (
    <div className="bloco">
      <h4>Afastamento</h4>
      <div className="linha">
        <div className="campo campo-medio">
          <label>Tipo</label>
          <input
            value={afast[FIELD_MAP.afast.tipo] || ''}
            onChange={bind(setAfast)(FIELD_MAP.afast.tipo)}
          />
        </div>
        <div className="campo campo-curto">
          <label>Dias</label>
          <input
            value={afast[FIELD_MAP.afast.dias] || ''}
            onChange={bind(setAfast)(FIELD_MAP.afast.dias)}
          />
        </div>
        {renderMaskedDate(afast, setAfast, FIELD_MAP.afast.ini, 'Início (dd-mm-aaaa)')}
        <div className="campo campo-curto">
          <label>Perícia</label>
          <input
            value={afast[FIELD_MAP.afast.pericia] || ''}
            onChange={bind(setAfast)(FIELD_MAP.afast.pericia)}
          />
        </div>
      </div>
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

            <div className="campo campo-curto">
              <label>STATUS</label>
              <select name="status" value={form.status || 'PENDENTE'} onChange={handleChange}>
                <option value="PENDENTE">Pendente</option>
                <option value="PAUSADO">Pausado</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>

            {renderInput('competencia', 'COMPETÊNCIA', 'text', 'campo-curto')}
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

          {/* Dinâmico por tipo */}
          {tipoServico === 'FERIAS' && <BlocoFerias />}
          {tipoServico === 'RESCISAO' && <BlocoRescisao />}
          {tipoServico === 'ADMISSAO' && <BlocoAdmissao />}
          {tipoServico === 'AFASTAMENTO' && <BlocoAfastamento />}

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

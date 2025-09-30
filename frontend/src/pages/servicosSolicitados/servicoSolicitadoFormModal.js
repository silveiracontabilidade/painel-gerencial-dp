// ServicoSolicitadoFormModal.js
import React, { useEffect, useState, useMemo, useCallback  } from 'react';
import {FileText} from 'lucide-react'
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

// Normaliza numéricos: se vazio → 0
const toNumberOrZero = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  return Number(v);
};

const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const toBRSafe = (valor) => {
  if (!valor) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    // ISO YYYY-MM-DD
    const [y, m, d] = valor.split('-');
    return `${d}-${m}-${y}`;
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(valor)) {
    // ISO YYYY/MM/DD
    const [y, m, d] = valor.split('/');
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(valor)) {
    // já está em BR
    return valor;
  }
  return valor; // fallback
};


const getTipoServico = (nome) => {
  const n = normalize(nome);
  if (n.includes('ADMIS')) return 'ADMISSAO';
  if (n.includes('FERI')) return 'FERIAS';
  if (n.includes('RESCIS')) return 'RESCISAO';
  if (n.includes('AFAST')) return 'AFASTAMENTO';
  if (n.includes('AVULSO')) return 'AVULSO';
  if (n.includes('MULTA')) return 'MULTA';
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
    data_ini: 'ferias_data_ini',
    tipo: 'ferias_tipo',
    qtd_dias: 'ferias_qtd_dias',
    qtd_dias_abono: 'ferias_qtd_dias_abono',
  },

  // RESCISÃO
  rescisao: {
    tipo_aviso: 'rescisao_tipo_aviso',
    dias_aviso: 'rescisao_dias_aviso',
    data_ini: 'rescisao_data_ini',
    tipo: 'rescisao_tipo',
  },

  // ADMISSÃO
  admissao: {
    tipo: 'admissao_tipo',
    data_ini: 'admissao_data_ini',
    deslig_programado: 'admissao_deslig_programado',
    preliminar: 'admissao_preliminar',
  },

  // AFASTAMENTO
  afast: {
    tipo: 'afast_tipo',
    dias: 'afast_dias',
    ini: 'afast_ini',
    pericia: 'afast_pericia',
  },

    // AVULSO
  avulso: {
    valor: 'avulso_valor',
    os: 'avulso_os',
  },

  // MULTA
  multa: {
    valor: 'multa_valor',
    rnc: 'multa_rnc',
  },

};


export default function ServicoSolicitadoFormModal({ dados, fechar }) {
  const [form, setForm] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [errors, setErrors] = useState({});
  // Estado do Tipo de Aviso Prévio
  const [motivosRescisao, setMotivosRescisao] = useState([]);


  // estados blocos dinâmicos (mantidos como strings; datas específicas ficam em dd-mm-aaaa)
  const [ferias, setFerias] = useState({
    [FIELD_MAP.ferias.abono]: '',
    [FIELD_MAP.ferias.data_ini]: '',
    [FIELD_MAP.ferias.tipo]: '',
    [FIELD_MAP.ferias.qtd_dias]: '',
    [FIELD_MAP.ferias.qtd_dias_abono]: '',
  });

  const [rescisao, setRescisao] = useState({
    [FIELD_MAP.rescisao.tipo_aviso]: '',
    [FIELD_MAP.rescisao.dias_aviso]: '',
    [FIELD_MAP.rescisao.data_ini]: '',
    [FIELD_MAP.rescisao.tipo]: '',
  });

  const [admissao, setAdmissao] = useState({
    [FIELD_MAP.admissao.tipo]: '',
    [FIELD_MAP.admissao.data_ini]: '',
    [FIELD_MAP.admissao.deslig_programado]: '',
    [FIELD_MAP.admissao.preliminar]: '',
  });

  const [afast, setAfast] = useState({
    [FIELD_MAP.afast.tipo]: '',
    [FIELD_MAP.afast.dias]: '',
    [FIELD_MAP.afast.ini]: '',
    [FIELD_MAP.afast.pericia]: '',
  });

  const [avulso, setAvulso] = useState({
    [FIELD_MAP.avulso.valor]: '',
    [FIELD_MAP.avulso.os]: '',
  });

  const [multa, setMulta] = useState({
    [FIELD_MAP.multa.valor]: '',
    [FIELD_MAP.multa.rnc]: '',
  });


  const CAMPOS_DATA_CORE = ['data_solicitacao', 'data_vencimento', 'data_para_resposta', 'data_conclusao'];

  useEffect(() => {
    const init = async () => {
      await carregarDadosAuxiliares();

      if (dados) {
        const f = { ...dados };
        delete f.empresa_id;

        CAMPOS_DATA_CORE.forEach((c) => {
          f[c] = f[c] ? toBRSafe(f[c]) : '';
        });

        // Pré-preenche blocos dinâmicos a partir do back (1:1)
       setFerias({
        [FIELD_MAP.ferias.abono]: dados[FIELD_MAP.ferias.abono] || '',
        [FIELD_MAP.ferias.data_ini]: dados[FIELD_MAP.ferias.data_ini] ? toBRSafe(dados[FIELD_MAP.ferias.data_ini]) : '',
        [FIELD_MAP.ferias.tipo]: dados[FIELD_MAP.ferias.tipo] || '',
        [FIELD_MAP.ferias.qtd_dias]: dados[FIELD_MAP.ferias.qtd_dias] || '',
        [FIELD_MAP.ferias.qtd_dias_abono]: dados[FIELD_MAP.ferias.qtd_dias_abono] || '',
      });
      setRescisao({
        [FIELD_MAP.rescisao.tipo_aviso]: dados[FIELD_MAP.rescisao.tipo_aviso] || '',
        [FIELD_MAP.rescisao.dias_aviso]: dados[FIELD_MAP.rescisao.dias_aviso] || '',
        [FIELD_MAP.rescisao.data_ini]: dados[FIELD_MAP.rescisao.data_ini] ? toBRSafe(dados[FIELD_MAP.rescisao.data_ini]) : '',
        [FIELD_MAP.rescisao.tipo]: dados[FIELD_MAP.rescisao.tipo] || '',
      });
      setAdmissao({
        [FIELD_MAP.admissao.tipo]: dados[FIELD_MAP.admissao.tipo] || '',
        [FIELD_MAP.admissao.data_ini]: dados[FIELD_MAP.admissao.data_ini] ? toBRSafe(dados[FIELD_MAP.admissao.data_ini]) : '',
        [FIELD_MAP.admissao.deslig_programado]: dados[FIELD_MAP.admissao.deslig_programado] || '',
        [FIELD_MAP.admissao.preliminar]: dados[FIELD_MAP.admissao.preliminar] || '',
      });
      setAfast({
        [FIELD_MAP.afast.tipo]: dados[FIELD_MAP.afast.tipo] || '',
        [FIELD_MAP.afast.dias]: dados[FIELD_MAP.afast.dias] || '',
        [FIELD_MAP.afast.ini]: dados[FIELD_MAP.afast.ini] ? toBRSafe(dados[FIELD_MAP.afast.ini]) : '',
        [FIELD_MAP.afast.pericia]: dados[FIELD_MAP.afast.pericia] || '',
      });
      setAvulso({
        [FIELD_MAP.avulso.valor]: dados[FIELD_MAP.avulso.valor] || '',
        [FIELD_MAP.avulso.os]: dados[FIELD_MAP.avulso.os] || '',
      });
      setMulta({
        [FIELD_MAP.multa.valor]: dados[FIELD_MAP.multa.valor] || '',
        [FIELD_MAP.multa.rnc]: dados[FIELD_MAP.multa.rnc] || '',
      });

      setForm(f);
      } else {
        const hojeISO = new Date().toISOString().split('T')[0];
        setForm((prev) => ({ ...prev, data_solicitacao: toBRSafe(hojeISO), status: 'PENDENTE' }));
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  const carregarDadosAuxiliares = async () => {
    const [resEmp, resServ, resMotivos] = await Promise.all([
      api.get('/api/empresas/', { params: { page: 1, page_size: 2000 } }),
      api.get('/api/servicos/'),
      api.get('/api/motivos-rescisao/'),
    ]);
    setEmpresas(resEmp.data.results || resEmp.data);
    setServicos(resServ.data.results || resServ.data);
    setMotivosRescisao(resMotivos.data.results || resMotivos.data);
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


  // ===== Handlers estáveis para blocos dinâmicos =====
  // FÉRIAS
  const handleFeriasChange = useCallback((e) => {
    const { name, value } = e.target;
    setFerias((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFeriasDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setFerias((prev) => ({ ...prev, [name]: value.replace(/[^\d-]/g, '') }));
  }, []);

  const handleFeriasDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setFerias((prev) => ({ ...prev, [name]: normalizarData(value) }));
  }, []);

  // RESCISÃO
  const handleRescisaoChange = useCallback((e) => {
    const { name, value } = e.target;
    setRescisao((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRescisaoDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setRescisao((prev) => ({ ...prev, [name]: value.replace(/[^\d-]/g, '') }));
  }, []);

  const handleRescisaoDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setRescisao((prev) => ({ ...prev, [name]: normalizarData(value) }));
  }, []);

  // ADMISSÃO
  const handleAdmissaoChange = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAdmissaoDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: value.replace(/[^\d-]/g, '') }));
  }, []);

  const handleAdmissaoDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: normalizarData(value) }));
  }, []);

  // AFASTAMENTO
  const handleAfastChange = useCallback((e) => {
    const { name, value } = e.target;
    setAfast((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAfastDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setAfast((prev) => ({ ...prev, [name]: value.replace(/[^\d-]/g, '') }));
  }, []);

  const handleAfastDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setAfast((prev) => ({ ...prev, [name]: normalizarData(value) }));
  }, []);

  //AVULSO 
  const handleAvulsoChange = useCallback((e) => {
    const { name, value } = e.target;
    setAvulso((prev) => ({ ...prev, [name]: value }));
  }, []);


  //MULTA
  const handleMultaChange = useCallback((e) => {
    const { name, value } = e.target;
    setMulta((prev) => ({ ...prev, [name]: value }));
  }, []);



  const handleServicoChange = (e) => {
  const value = e?.target ? e.target.value : e;
  if (!value) {
    setForm((prev) => ({ ...prev, servico: '', data_vencimento: '' }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
    return;
  }

  const servico = servicos.find((s) => String(s.id) === String(value));

  // Base para a data: tentar usar a data_solicitacao do form; se for inválida, cair pra hoje
  const dataSolicBR = form.data_solicitacao || toBRSafe(new Date().toISOString().split('T')[0]);
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
    const vencBR = toBRSafe(vencISO);

    setForm((prev) => ({ ...prev, servico: String(value), data_vencimento: vencBR }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
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
    Object.entries(ferias).forEach(([k, v]) => {
        if (['ferias_qtd_dias', 'ferias_qtd_dias_abono'].includes(k)) {
          payload[k] = toNumberOrZero(v);
        } else {
          payload[k] = toNull(v);
        }
      });

    // === RESCISÃO ===
    Object.entries(rescisao).forEach(([k, v]) => {
      if (['rescisao_dias_aviso'].includes(k)) {
        payload[k] = toNumberOrZero(v);
      } else {
        payload[k] = toNull(v);
      }
    });

    // === ADMISSÃO (CharField) ===
    Object.entries(admissao).forEach(([k, v]) => (payload[k] = toNull(v)));

    // === AFASTAMENTO (CharField) ===
    Object.entries(afast).forEach(([k, v]) => (payload[k] = toNull(v)));

    // === AVULSO ===
    Object.entries(avulso).forEach(([k, v]) => {
      if (['avulso_valor'].includes(k)) {
        payload[k] = toNumberOrZero(v);
      } else {
        payload[k] = toNull(v);
      }
    });

    // === MULTA ===
    Object.entries(multa).forEach(([k, v]) => {
      if (['multa_valor'].includes(k)) {
        payload[k] = toNumberOrZero(v);
      } else {
        payload[k] = toNull(v);
      }
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
  
  // ===== Blocos Dinâmicos =====
  // === FÉRIAS ===
const renderBlocoFerias = () => (
  <div className="bloco">
    <h4>Férias</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Tipo</label>
        <select
          name={FIELD_MAP.ferias.tipo}
          value={ferias[FIELD_MAP.ferias.tipo] || ''}
          onChange={handleFeriasChange}
        >
          <option value="">--</option>
          <option value="COLETIVA">COLETIVA</option>
          <option value="INDIVIDUAL">INDIVIDUAL</option>
        </select>
      </div>
      <div className="campo campo-curto">
        <label>Qtd Dias</label>
        <input
          type="number"
          name={FIELD_MAP.ferias.qtd_dias}
          value={ferias[FIELD_MAP.ferias.qtd_dias] || ''}
          onChange={handleFeriasChange}
        />
      </div>
      <div className="campo campo-curto">
        <label> Data Início </label>
        <input
          type="text"
          name={FIELD_MAP.ferias.data_ini}
          value={ferias[FIELD_MAP.ferias.data_ini] || ''}
          onChange={handleFeriasDateChange}
          onBlur={handleFeriasDateBlur}
          placeholder="dd-mm-aaaa"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
 
      <div className="campo campo-curto">
        <label>Abono</label>
        <select
          name={FIELD_MAP.ferias.abono}
          value={ferias[FIELD_MAP.ferias.abono] || ''}
          onChange={handleFeriasChange}
        >
          <option value="">--</option>
          <option value="SIM, antes do inicio">SIM, antes do inicio</option>
          <option value="SIM, após férias">SIM, após férias</option>
          <option value="NÃO">NÃO</option>
        </select>
      </div>
      <div className="campo campo-curto">
        <label>Qtd Dias Abono</label>
        <input
          type="number"
          name={FIELD_MAP.ferias.qtd_dias_abono}
          value={ferias[FIELD_MAP.ferias.qtd_dias_abono] || ''}
          onChange={handleFeriasChange}
        />
      </div>
    </div>
  </div>
);

// === RESCISÃO ===
  const renderBlocoRescisao = () => (
  <div className="bloco">
    <h4>Rescisão</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Tipo Aviso</label>
        <select
          name={FIELD_MAP.rescisao.tipo_aviso}
          value={rescisao[FIELD_MAP.rescisao.tipo_aviso] || ''}
          onChange={handleRescisaoChange}
        >
          <option value="">--</option>
          {motivosRescisao.map((m) => (
            <option key={m.id} value={m.descricao}>
              {m.descricao}
            </option>
          ))}
        </select>
      </div>

      <div className="campo campo-curto">
        <label>Dias Aviso</label>
        <input
          type="text"
          name={FIELD_MAP.rescisao.dias_aviso}
          value={rescisao[FIELD_MAP.rescisao.dias_aviso] || ''}
          onChange={handleRescisaoChange}
        />
      </div>

      <div className="campo campo-curto">
        <label>Data Início (dd-mm-aaaa)</label>
        <input
          type="text"
          name={FIELD_MAP.rescisao.data_ini}
          value={rescisao[FIELD_MAP.rescisao.data_ini] || ''}
          onChange={handleRescisaoDateChange}
          onBlur={handleRescisaoDateBlur}
          placeholder="dd-mm-aaaa"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <div className="campo campo-medio">
        <label>Aviso Descontado</label>
        <select
          name={FIELD_MAP.rescisao.tipo}
          value={rescisao[FIELD_MAP.rescisao.tipo] || ''}
          onChange={handleRescisaoChange}
        >
          <option value="">--</option>
          <option value="SIM">SIM</option>
          <option value="NÃO">NÃO</option>
          <option value="DISPENSADO">DISPENSADO</option>
        </select>
      </div>
    </div>
  </div>
);



// === ADMISSÃO ===
const renderBlocoAdmissao = () => (
  <div className="bloco">
    <h4>Admissão</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Tipo</label>
        <input
          type="text"
          name={FIELD_MAP.admissao.tipo}
          value={admissao[FIELD_MAP.admissao.tipo] || ''}
          onChange={handleAdmissaoChange}
        />
      </div>

      <div className="campo campo-curto">
        <label>Data Início (dd-mm-aaaa)</label>
        <input
          type="text"
          name={FIELD_MAP.admissao.data_ini}
          value={admissao[FIELD_MAP.admissao.data_ini] || ''}
          onChange={handleAdmissaoDateChange}
          onBlur={handleAdmissaoDateBlur}
          placeholder="dd-mm-aaaa"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <div className="campo campo-medio">
        <label>Deslig. Programado</label>
        <input
          type="text"
          name={FIELD_MAP.admissao.deslig_programado}
          value={admissao[FIELD_MAP.admissao.deslig_programado] || ''}
          onChange={handleAdmissaoChange}
        />
      </div>

      <div className="campo campo-curto">
        <label>Preliminar</label>
        <select
          name={FIELD_MAP.admissao.preliminar}
          value={admissao[FIELD_MAP.admissao.preliminar] || ''}
          onChange={handleAdmissaoChange}
        >
          <option value="">--</option>
          <option value="SIM">SIM</option>
          <option value="NÃO">NÃO</option>
        </select>
      </div>
    </div>
  </div>
);

// === AFASTAMENTO ===
const renderBlocoAfastamento = () => (
  <div className="bloco">
    <h4>Afastamento</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Tipo</label>
        <input
          type="text"
          name={FIELD_MAP.afast.tipo}
          value={afast[FIELD_MAP.afast.tipo] || ''}
          onChange={handleAfastChange}
        />
      </div>

      <div className="campo campo-curto">
        <label>Dias</label>
        <input
          type="text"
          name={FIELD_MAP.afast.dias}
          value={afast[FIELD_MAP.afast.dias] || ''}
          onChange={handleAfastChange}
        />
      </div>

      <div className="campo campo-curto">
        <label>Início (dd-mm-aaaa)</label>
        <input
          type="text"
          name={FIELD_MAP.afast.ini}
          value={afast[FIELD_MAP.afast.ini] || ''}
          onChange={handleAfastDateChange}
          onBlur={handleAfastDateBlur}
          placeholder="dd-mm-aaaa"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <div className="campo campo-curto">
        <label>Perícia</label>
        <input
          type="text"
          name={FIELD_MAP.afast.pericia}
          value={afast[FIELD_MAP.afast.pericia] || ''}
          onChange={handleAfastChange}
        />
      </div>
    </div>
  </div>
);

// === AVULSO ===
const renderBlocoAvulso = () => (
  <div className="bloco">
    <h4>Avulso</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Valor</label>
        <input
          type="number"
          step="0.01"
          name={FIELD_MAP.avulso.valor}
          value={avulso[FIELD_MAP.avulso.valor] || ''}
          onChange={handleAvulsoChange}
        />
      </div>
      <div className="campo campo-medio">
        <label>OS</label>
        <input
          type="text"
          name={FIELD_MAP.avulso.os}
          value={avulso[FIELD_MAP.avulso.os] || ''}
          onChange={handleAvulsoChange}
        />
      </div>
    </div>
  </div>
);

// === MULTA ===
const renderBlocoMulta = () => (
  <div className="bloco">
    <h4>Multa</h4>
    <div className="linha">
      <div className="campo campo-medio">
        <label>Valor</label>
        <input
          type="number"
          step="0.01"
          name={FIELD_MAP.multa.valor}
          value={multa[FIELD_MAP.multa.valor] || ''}
          onChange={handleMultaChange}
        />
      </div>
      <div className="campo campo-medio">
        <label>RNC</label>
        <input
          type="text"
          name={FIELD_MAP.multa.rnc}
          value={multa[FIELD_MAP.multa.rnc] || ''}
          onChange={handleMultaChange}
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
        
        {/* Empresa */}
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

        {/* Serviço + ID + Competência + Arquivos */}
        <div className="linha linha-servico">
          <div className="campo campo-medio">
            <label>SERVIÇO</label>
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

          {renderInput('id_acessorias', 'ID ACESSÓRIAS', 'text', 'campo-curto')}  
          {renderInput('competencia', 'COMPETÊNCIA', 'text', 'campo-curto')}

          {/* Arquivos */}
          {/* <div className="campo campo-arquivos"> */}
            <div className="arquivo-item">
              <label>CHECKLIST</label>
              {servicoSelecionado?.checklist ? (
                <a href={servicoSelecionado.checklist} target="_blank" rel="noopener noreferrer">
                  <FileText size={18} />
                </a>
              ) : <span>-</span>}
            </div>
            <div className="arquivo-item">
              <label>INSTRUÇÃO</label>
              {servicoSelecionado?.instrucao_trabalho ? (
                <a href={servicoSelecionado.instrucao_trabalho} target="_blank" rel="noopener noreferrer">
                  <FileText size={18} />
                </a>
              ) : <span>-</span>}
            </div>
            <div className="arquivo-item">
              <label>VÍDEO</label>
              {servicoSelecionado?.video_explicativo ? (
                <a href={servicoSelecionado.video_explicativo} target="_blank" rel="noopener noreferrer">
                  <FileText size={18} />
                </a>
              ) : <span>-</span>}
            </div>
            <div className="arquivo-item">
              <label>TÓPICO</label>
              {servicoSelecionado?.topico_rapido ? (
                <a href={servicoSelecionado.topico_rapido} target="_blank" rel="noopener noreferrer">
                  <FileText size={18} />
                </a>
              ) : <span>-</span>}
            {/* </div> */}
          </div>
        </div>

        {/* Descrição */}
        <div className="linha">
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

        {/* Blocos dinâmicos */}
        {tipoServico === 'FERIAS' && renderBlocoFerias()}
        {tipoServico === 'RESCISAO' && renderBlocoRescisao()}
        {tipoServico === 'ADMISSAO' && renderBlocoAdmissao()}
        {tipoServico === 'AFASTAMENTO' && renderBlocoAfastamento()}
        {tipoServico === 'AVULSO' && renderBlocoAvulso()}
        {tipoServico === 'MULTA' && renderBlocoMulta()}

        {/* Datas principais */}
        <div className="linha">
          {renderInputData('data_solicitacao', 'SOLICITAÇÃO', 'campo-curto')}
          {renderInputData('data_vencimento', 'VENCIMENTO', 'campo-curto', true)}
          {renderInputData('data_para_resposta', 'DATA PARA RESPOSTA', 'campo-curto')}
          {renderInputData('data_conclusao', 'CONCLUSÃO', 'campo-curto')}
        </div>

        {/* Botões */}
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

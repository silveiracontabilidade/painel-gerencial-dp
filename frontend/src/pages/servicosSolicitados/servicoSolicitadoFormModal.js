// ServicoSolicitadoFormModal.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {FileText} from 'lucide-react'
import api from '../../api/axios';
import './servicos-solicitados.css';
import Select from 'react-select';
import { paraISO, paraBR } from '../../utils/datas';

// ===== Helpers =====
// Mascara COMPETÊNCIA (MMAAAA)
const mascararCompetencia = (valor) => {
  const digits = String(valor || '').replace(/\D/g, '').slice(0, 6); // só números, máx 6
  return digits;
};

const normalizarCompetencia = (valor) => {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '');
  if (digits.length !== 6) return valor; // só aceita completo
  let mes = parseInt(digits.slice(0, 2), 10);
  let ano = parseInt(digits.slice(2, 6), 10);

  if (mes < 1) mes = 1;
  if (mes > 12) mes = 12;
  if (ano < 1900) ano = 1900;

  const MM = String(mes).padStart(2, '0');
  const YYYY = String(ano).padStart(4, '0');
  return `${MM}${YYYY}`;
};

const competenciaParaNumero = (valor) => {
  if (!valor) return null;
  const digits = String(valor).replace(/\D/g, '');
  if (digits.length !== 6) return null;
  const mes = parseInt(digits.slice(0, 2), 10);
  const ano = parseInt(digits.slice(2, 6), 10);
  if (!Number.isFinite(mes) || !Number.isFinite(ano) || mes < 1 || mes > 12 || ano < 1900) {
    return null;
  }
  return ano * 100 + mes;
};

const obterCompetenciaAtualNumero = () => {
  const hoje = new Date();
  return hoje.getFullYear() * 100 + (hoje.getMonth() + 1);
};

const toBRHifen = (iso) => (iso ? paraBR(iso).replace(/\//g, '-') : '');
const toISO = (brOuBrHifen) => {
  if (!brOuBrHifen) return null;
  return paraISO(brOuBrHifen.replace(/\//g, '-'));
};

const dataEhValida = (valor) => Boolean(toISO(valor));

const calcularDataRespostaPorPrazo = (dataVencimentoBR, prazoDias) => {
  if (!dataVencimentoBR) return null;
  const dias = Number(prazoDias ?? 0);
  if (!Number.isFinite(dias)) return null;

  const partes = dataVencimentoBR.split('-');
  if (partes.length !== 3) return null;
  const [dd, mm, yyyy] = partes.map((p) => parseInt(p, 10));
  if (Number.isNaN(dd) || Number.isNaN(mm) || Number.isNaN(yyyy)) return null;

  const data = new Date(yyyy, mm - 1, dd);
  if (!isValidDate(data)) return null;

  const diasInteiros = Math.max(0, Math.floor(dias));
  data.setDate(data.getDate() - diasInteiros);

  while (data.getDay() === 0 || data.getDay() === 6) {
    data.setDate(data.getDate() - 1);
  }

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = String(data.getFullYear());
  return `${dia}-${mes}-${ano}`;
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

const SERVICOS_AFASTAMENTO_COM_FUP = new Set(
  [
    'Afastamento CAT',
    'Afastamento Doença',
    'Afastamento Invalidez',
    'Afastamento Maternidade',
    'Afastamento Militar',
    'Afastamento Militiar',
  ].map((nome) => normalize(nome))
);

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


const getTipoServico = (nome, categoria) => {
  const n = normalize(nome);
  const c = normalize(categoria);
  const texto = `${n} ${c}`.trim();
  if (texto.includes('ADMIS')) return 'ADMISSAO';
  if (texto.includes('FERI')) return 'FERIAS';
  if (texto.includes('RESCIS')) return 'RESCISAO';
  if (texto.includes('AFAST')) return 'AFASTAMENTO';
  if (n.includes('MULTA')) return 'MULTA';
  if (n.includes('AVULSO')) return 'AVULSO';
  if (texto.includes('MULTA')) return 'MULTA';
  if (texto.includes('AVULSO')) return 'AVULSO';
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
    observacao: 'admissao_observacao',
  },

  // AFASTAMENTO
  afast: {
    dias: 'afast_dias',
    ini: 'afast_ini',
    pericia: 'afast_pericia',
    retorno: 'afast_retorno'
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

const TIPOS_ADMISSAO_OBRIGAM_DESLIGAMENTO = new Set(['ESTAGIARIO', 'PRAZO DETERMINADO']);

export default function ServicoSolicitadoFormModal({ dados, fechar }) {
  const [form, setForm] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [errors, setErrors] = useState({});
  // Estado do Tipo de Aviso Prévio
  const [motivosRescisao, setMotivosRescisao] = useState([]);
  const [tiposAdmissao, setTiposAdmissao] = useState([]);
  const [empresaDetalhe, setEmpresaDetalhe] = useState(null);
  const isEdicao = Boolean(dados?.id);

  const clearFieldError = useCallback((campo) => {
    setErrors((prev) => {
      if (!prev?.[campo]) return prev;
      const atualizado = { ...prev };
      delete atualizado[campo];
      return atualizado;
    });
  }, []);


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
    [FIELD_MAP.admissao.observacao]: '',
  });

  const [afast, setAfast] = useState({
    [FIELD_MAP.afast.dias]: '',
    [FIELD_MAP.afast.ini]: '',
    [FIELD_MAP.afast.pericia]: '',
    [FIELD_MAP.afast.retorno]: '',
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

  //PARA COMPETÊNCIA
  const renderInputCompetencia = (name = 'competencia', label = 'COMPETÊNCIA', classe = 'campo-curto', disabled = false) => (
    <div className={`campo ${classe}`} key={name}>
      <label>
        {label}{' '}
        {errors[name] && <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>({errors[name]})</span>}
      </label>
      <input
        type="text"
        name={name}
        value={form[name] || ''}
        onChange={(e) => {
          const val = mascararCompetencia(e.target.value);
          setForm((prev) => ({ ...prev, [name]: val }));
          if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
        }}
        onBlur={(e) => {
          const val = normalizarCompetencia(e.target.value);
          setForm((prev) => ({ ...prev, [name]: val }));
        }}
        placeholder="MMAAAA"
        maxLength={6}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        style={errors[name] ? { borderColor: 'red' } : undefined}
      />
    </div>
  );

  useEffect(() => {
    const init = async () => {
      await carregarDadosAuxiliares(!isEdicao);

      if (dados) {
        const f = { ...dados };
        delete f.empresa_id;

        CAMPOS_DATA_CORE.forEach((c) => {
          f[c] = f[c] ? toBRSafe(f[c]) : '';
        });

        f.ultimo_fup = dados.ultimo_fup ? normalizarCompetencia(dados.ultimo_fup) : '';

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
        [FIELD_MAP.admissao.deslig_programado]: dados[FIELD_MAP.admissao.deslig_programado]
          ? toBRSafe(dados[FIELD_MAP.admissao.deslig_programado])
          : '',
        [FIELD_MAP.admissao.preliminar]: dados[FIELD_MAP.admissao.preliminar] || '',
        [FIELD_MAP.admissao.observacao]: dados[FIELD_MAP.admissao.observacao] || '',
      });
      setAfast({
        [FIELD_MAP.afast.dias]: dados[FIELD_MAP.afast.dias] || '',
        [FIELD_MAP.afast.ini]: dados[FIELD_MAP.afast.ini] ? toBRSafe(dados[FIELD_MAP.afast.ini]) : '',
        [FIELD_MAP.afast.pericia]: dados[FIELD_MAP.afast.pericia]
          ? toBRSafe(dados[FIELD_MAP.afast.pericia])
          : '',
        [FIELD_MAP.afast.retorno]: dados[FIELD_MAP.afast.retorno]
          ? toBRSafe(dados[FIELD_MAP.afast.retorno])
          : '',
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
        setForm((prev) => ({
          ...prev,
          data_solicitacao: toBRSafe(hojeISO),
          status: 'PENDENTE',
          ultimo_fup: '',
        }));
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, isEdicao]);

  const carregarDadosAuxiliares = async (incluirEmpresas = true) => {
    const [resServ, resMotivos, resTipos] = await Promise.all([
      api.get('/api/servicos/'),
      api.get('/api/motivos-rescisao/'),
      api.get('/api/tipos-admissao/'),
    ]);
    setServicos(resServ.data.results || resServ.data);
    setMotivosRescisao(resMotivos.data.results || resMotivos.data);
    setTiposAdmissao(resTipos.data.results || resTipos.data);
    // carrega responsáveis para o select de processo
    try {
      const resResp = await api.get('/api/responsaveis/');
      setResponsaveis(resResp.data.results || resResp.data);
    } catch (e) {
      setResponsaveis([]);
    }
    if (incluirEmpresas) {
      const resEmp = await api.get('/api/empresas/', { params: { page: 1, page_size: 5_000_000 } });
      setEmpresas(resEmp.data.results || resEmp.data);
      setEmpresaDetalhe(null);
    } else {
      setEmpresas([]);
      const empresaChave = dados?.empresa ?? dados?.cod_folha;
      if (empresaChave) {
        try {
          const { data } = await api.get(`/api/empresas/${empresaChave}/`);
          setEmpresaDetalhe(data);
        } catch (err) {
          setEmpresaDetalhe(null);
        }
      } else {
        setEmpresaDetalhe(null);
      }
    }
  };



  const servicoSelecionado = useMemo(
    () => servicos.find((s) => String(s.id) === String(form.servico)),
    [servicos, form.servico]
  );
  const tipoServico = getTipoServico(servicoSelecionado?.nome, servicoSelecionado?.categoria);
  const podeExibirUltimoFup = useMemo(() => {
    if (tipoServico !== 'AFASTAMENTO') {
      return false;
    }
    const nomeNormalizado = normalize(servicoSelecionado?.nome);
    return SERVICOS_AFASTAMENTO_COM_FUP.has(nomeNormalizado);
  }, [tipoServico, servicoSelecionado]);
  const tipoAdmissaoSelecionado = useMemo(
    () => tiposAdmissao.find(
      (t) => normalize(t.descricao) === normalize(admissao[FIELD_MAP.admissao.tipo])
    ),
    [tiposAdmissao, admissao]
  );
  const exigeDesligamentoProgramado = useMemo(() => {
    const descricaoNormalizada = normalize(admissao[FIELD_MAP.admissao.tipo]);
    return TIPOS_ADMISSAO_OBRIGAM_DESLIGAMENTO.has(descricaoNormalizada);
  }, [admissao]);
  const empresaLabel = useMemo(() => {
    const empresaChave = dados?.empresa ?? dados?.cod_folha ?? '';
    const codigo = empresaDetalhe?.cod_folha ?? empresaChave;
    const razao = empresaDetalhe?.razao_social;
    if (!codigo) return '';
    return razao ? `${codigo} - ${razao}` : String(codigo);
  }, [empresaDetalhe, dados]);

  useEffect(() => {
    if (!podeExibirUltimoFup && form.ultimo_fup) {
      setForm((prev) => {
        if (!prev.ultimo_fup) return prev;
        return { ...prev, ultimo_fup: '' };
      });
    }
    if (!podeExibirUltimoFup && errors.ultimo_fup) {
      setErrors((prev) => ({ ...prev, ultimo_fup: undefined }));
    }
  }, [podeExibirUltimoFup, form.ultimo_fup, errors.ultimo_fup]);

  const responsavelById = useMemo(() => {
    const mapa = new Map();
    (responsaveis || []).forEach((resp) => mapa.set(String(resp.id), resp));
    return mapa;
  }, [responsaveis]);

  const responsavelByNomeUpper = useMemo(() => {
    const mapa = new Map();
    (responsaveis || []).forEach((resp) => {
      mapa.set(String(resp.nome || '').toUpperCase(), resp);
    });
    return mapa;
  }, [responsaveis]);

  const executorSelecionadoInfo = useMemo(() => {
    const idSelecionado = form.processo_realizado_por;
    if (idSelecionado) {
      const existente = responsavelById.get(String(idSelecionado));
      if (existente) {
        return existente;
      }
    }

    const nomeFallback = form.processo_realizado_por_nome || '';

    if (nomeFallback) {
      return responsavelByNomeUpper.get(String(nomeFallback).toUpperCase()) || null;
    }

    return null;
  }, [
    form.processo_realizado_por,
    form.processo_realizado_por_nome,
    responsavelById,
    responsavelByNomeUpper,
  ]);

  const grupoExecutorSelecionado = executorSelecionadoInfo?.grupo_nome
    ? String(executorSelecionadoInfo.grupo_nome).toUpperCase()
    : '';

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
    setForm((prev) => {
      return { ...prev, [name]: val };
    });
  };


  // ===== Handlers estáveis para blocos dinâmicos =====
  // FÉRIAS
  const handleFeriasChange = useCallback((e) => {
    const { name, value } = e.target;
    setFerias((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFeriasDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setFerias((prev) => ({ ...prev, [name]: mascararData(value) }));
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
    setRescisao((prev) => ({ ...prev, [name]: mascararData(value) }));
  }, []);

  const handleRescisaoDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setRescisao((prev) => ({ ...prev, [name]: normalizarData(value) }));
  }, []);

  // ADMISSÃO
  const handleAdmissaoChange = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    if (name === FIELD_MAP.admissao.tipo) {
      clearFieldError(FIELD_MAP.admissao.deslig_programado);
    }
  }, [clearFieldError]);

  const handleAdmissaoDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: mascararData(value) }));
    clearFieldError(name);
  }, [clearFieldError]);

  const handleAdmissaoDateBlur = useCallback((e) => {
    const { name, value } = e.target;
    setAdmissao((prev) => ({ ...prev, [name]: normalizarData(value) }));
    clearFieldError(name);
  }, [clearFieldError]);

  // AFASTAMENTO
  const handleAfastChange = useCallback((e) => {
    const { name, value } = e.target;
    setAfast((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAfastDateChange = useCallback((e) => {
    const { name, value } = e.target;
    setAfast((prev) => ({ ...prev, [name]: mascararData(value) }));
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
      setForm((prev) => ({ ...prev, servico: '', data_para_resposta: '' }));
      if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      servico: String(value),
    }));
    if (errors.servico) setErrors((prev) => ({ ...prev, servico: undefined }));
  };

  // ===== Validação (leve) =====
  const validar = () => {
    const e = {};
    const empresaObrigatoria = !form.responsavel;
    if (empresaObrigatoria && !form.empresa) e.empresa = 'Selecione a empresa.';
    if (!form.servico) e.servico = 'Selecione o serviço.';
    if (form.data_solicitacao && !dataEhValida(form.data_solicitacao)) {
      e.data_solicitacao = 'Data inválida. Verifique o dia, mês e ano.';
    }
    if (form.data_vencimento && !dataEhValida(form.data_vencimento)) {
      e.data_vencimento = 'Data inválida. Verifique o dia, mês e ano.';
    }
    if (form.data_para_resposta && !dataEhValida(form.data_para_resposta)) {
      e.data_para_resposta = 'Data inválida. Verifique o dia, mês e ano.';
    }
    if (form.data_conclusao && !dataEhValida(form.data_conclusao)) {
      e.data_conclusao = 'Data inválida. Verifique o dia, mês e ano.';
    }

    // ✅ Validação COMPETÊNCIA MMAAAA
    if (form.competencia) {
      const digits = form.competencia.replace(/\D/g, '');
      if (digits.length !== 6) {
        e.competencia = 'Formato inválido. Use MMAAAA.';
      } else {
        const mes = parseInt(digits.slice(0, 2), 10);
        const ano = parseInt(digits.slice(2, 6), 10);
        if (mes < 1 || mes > 12) {
          e.competencia = 'Mês inválido (01 a 12).';
        } else if (ano < 1900) {
          e.competencia = 'Ano inválido (mínimo 1900).';
        }
      }
    }

    if (form.ultimo_fup) {
      const numeroCompetencia = competenciaParaNumero(form.ultimo_fup);
      if (numeroCompetencia === null) {
        e.ultimo_fup = 'Formato inválido. Use MMAAAA.';
      } else if (numeroCompetencia > obterCompetenciaAtualNumero()) {
        e.ultimo_fup = 'Competência futura não permitida.';
      }
    }

    // mínimos por tipo (exemplos)
    if (tipoServico === 'FERIAS') {
      const campo = FIELD_MAP.ferias.data_ini;
      if (ferias[campo] && !dataEhValida(ferias[campo])) e[campo] = 'Data inválida.';
    }
    if (tipoServico === 'RESCISAO') {
      const campo = FIELD_MAP.rescisao.data_ini;
      if (rescisao[campo] && !dataEhValida(rescisao[campo])) e[campo] = 'Data inválida.';
    }
    if (tipoServico === 'ADMISSAO') {
      const campoDataIni = FIELD_MAP.admissao.data_ini;
      if (admissao[campoDataIni] && !dataEhValida(admissao[campoDataIni])) {
        e[campoDataIni] = 'Data inválida.';
      }

      const campoDeslig = FIELD_MAP.admissao.deslig_programado;
      const valorDeslig = admissao[campoDeslig];
      if (exigeDesligamentoProgramado) {
        if (!valorDeslig) {
          e[campoDeslig] = 'Informe a data do desligamento programado.';
        } else if (!dataEhValida(valorDeslig)) {
          e[campoDeslig] = 'Data inválida.';
        }
      } else if (valorDeslig && !dataEhValida(valorDeslig)) {
        e[campoDeslig] = 'Data inválida.';
      }
    }
    if (tipoServico === 'AFASTAMENTO') {
      const inif = FIELD_MAP.afast.ini;
      if (afast[inif] && !dataEhValida(afast[inif])) e[inif] = 'Data inválida.';
      const pericia = FIELD_MAP.afast.pericia;
      if (afast[pericia] && !dataEhValida(afast[pericia])) e[pericia] = 'Data inválida.';
      const retorno = FIELD_MAP.afast.retorno;
      if (afast[retorno] && !dataEhValida(afast[retorno])) e[retorno] = 'Data inválida.';
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

    if (payload.data_vencimento) {
      const respostaCalculada = servicoSelecionado
        ? calcularDataRespostaPorPrazo(payload.data_vencimento, servicoSelecionado.prazo_dias)
        : null;
      payload.data_para_resposta = respostaCalculada || null;
    } else {
      payload.data_para_resposta = null;
    }

    // datas core -> ISO
    CAMPOS_DATA_CORE.forEach((c) => {
      payload[c] = payload[c] ? toISO(String(payload[c])) : null;
    });

    // status
    if (FIELD_MAP.status) payload[FIELD_MAP.status] = payload.status || 'PENDENTE';

    payload.ultimo_fup = payload.ultimo_fup ? normalizarCompetencia(payload.ultimo_fup) : null;

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

    // Processo Realizado Por (FK -> id de responsável)
    if (form.processo_realizado_por) {
      payload.processo_realizado_por = Number(form.processo_realizado_por);
    } else {
      payload.processo_realizado_por = null;
    }

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
        delete payload.processo_realizado_por_nome;
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

  const handleExcluir = async () => {
    if (!dados?.id) return;
    if (!window.confirm('Confirma a exclusão deste serviço solicitado?')) return;
    try {
      await api.delete(`/api/solicitacoes/${dados.id}/`);
      fechar();
    } catch (err) {
      console.error('Erro ao excluir solicitação:', err.response?.data || err);
      alert('Erro ao excluir o serviço solicitado. Tente novamente.');
    }
  };

  const handleRecuperar = async () => {
    if (!dados?.id) return;
    try {
      await api.patch(`/api/solicitacoes/${dados.id}/`, { status: 'PENDENTE' });
      fechar();
    } catch (err) {
      console.error('Erro ao recuperar solicitação:', err.response?.data || err);
      alert('Erro ao recuperar o serviço solicitado. Tente novamente.');
    }
  };

  const formatarDataHora = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString('pt-BR');
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
        <label>
          Tipo{' '}
          {errors[FIELD_MAP.admissao.tipo] && (
            <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>
              ({errors[FIELD_MAP.admissao.tipo]})
            </span>
          )}
        </label>
        <select
          name={FIELD_MAP.admissao.tipo}
          value={admissao[FIELD_MAP.admissao.tipo] || ''}
          onChange={handleAdmissaoChange}
        >
          <option value="">--</option>
          {admissao[FIELD_MAP.admissao.tipo] &&
            !tiposAdmissao.some(
              (tipo) => normalize(tipo.descricao) === normalize(admissao[FIELD_MAP.admissao.tipo])
            ) && (
              <option value={admissao[FIELD_MAP.admissao.tipo]}>
                {admissao[FIELD_MAP.admissao.tipo]}
              </option>
            )}
          {tiposAdmissao.map((tipo) => (
            <option key={tipo.id} value={tipo.descricao}>
              {tipo.descricao}
            </option>
          ))}
        </select>
        {(tipoAdmissaoSelecionado?.mensagem || exigeDesligamentoProgramado) && (
          <small className="campo-hint">
            {tipoAdmissaoSelecionado?.mensagem ||
              'Informe a data de desligamento programado para este tipo.'}
          </small>
        )}
      </div>

      <div className="campo campo-curto">
        <label>
          Data Início (dd-mm-aaaa){' '}
          {errors[FIELD_MAP.admissao.data_ini] && (
            <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>
              ({errors[FIELD_MAP.admissao.data_ini]})
            </span>
          )}
        </label>
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

      <div className="campo campo-curto">
        <label>
          Data Deslig. Programado{' '}
          {errors[FIELD_MAP.admissao.deslig_programado] && (
            <span style={{ color: 'red', fontWeight: 600, fontSize: 11 }}>
              ({errors[FIELD_MAP.admissao.deslig_programado]})
            </span>
          )}
        </label>
        <input
          type="text"
          name={FIELD_MAP.admissao.deslig_programado}
          value={admissao[FIELD_MAP.admissao.deslig_programado] || ''}
          onChange={handleAdmissaoDateChange}
          onBlur={handleAdmissaoDateBlur}
          placeholder="dd-mm-aaaa"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
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

      <div className="campo campo-longo">
        <label>Observação</label>
        <input
          type="text"
          name={FIELD_MAP.admissao.observacao}
          value={admissao[FIELD_MAP.admissao.observacao] || ''}
          onChange={handleAdmissaoChange}
        />
      </div>
    </div>
  </div>
);

// === AFASTAMENTO ===
const renderBlocoAfastamento = () => {
  return (
    <div className="bloco bloco-afastamento">
      <h4>Afastamento</h4>
      <div className="linha linha-afastamento">
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
          <label>Início</label>
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
            onChange={handleAfastDateChange}
            onBlur={handleAfastDateBlur}
            placeholder="dd-mm-aaaa"
            maxLength={10}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="campo campo-curto">
          <label>Retorno</label>
          <input
            type="text"
            name={FIELD_MAP.afast.retorno}
            value={afast[FIELD_MAP.afast.retorno] || ''}
            onChange={handleAfastDateChange}
            onBlur={handleAfastDateBlur}
            placeholder="dd-mm-aaaa"
            maxLength={10}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        {podeExibirUltimoFup &&
          renderInputCompetencia('ultimo_fup', 'ÚLTIMO FUP', 'campo-curto campo-ultimo-fup')}
      </div>
    </div>
  );
};

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
            {!isEdicao ? (
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
            ) : (
              <input
                type="text"
                value={empresaLabel}
                readOnly
                disabled
              />
            )}
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
          {renderInputCompetencia('competencia', 'COMPETÊNCIA', 'campo-curto')}

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
          {renderInputData('data_vencimento', 'VENCIMENTO', 'campo-curto')}
          {renderInputData('data_para_resposta', 'DATA PARA RESPOSTA', 'campo-curto', true)}
          {renderInputData('data_conclusao', 'CONCLUSÃO', 'campo-curto')}
        </div>

        {/* Processo Realizado Por */}
        <div className="linha">
          <div className="campo campo-medio">
            <label>GRUPO DO EXECUTOR</label>
            <input
              type="text"
              value={grupoExecutorSelecionado || '—'}
              readOnly
              disabled
            />
          </div>
          <div className="campo campo-medio">
            <label>PROCESSO REALIZADO POR</label>
            <select
              name="processo_realizado_por"
              value={form.processo_realizado_por || ''}
              onChange={(e) => {
                const valor = e.target.value;
                const info = responsavelById.get(String(valor)) || null;
                setForm((prev) => ({
                  ...prev,
                  processo_realizado_por: valor,
                  processo_realizado_por_nome: info?.nome || '',
                }));
              }}
            >
              <option value="">--</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {servicoSelecionado?.mensagem && (
          <div className="mensagem-informativa">
            <strong>MENSAGEM:</strong> {servicoSelecionado.mensagem}
          </div>
        )}        

        {dados?.status === 'REMOVIDO' && (
          <div className="mensagem-informativa" style={{ background: '#fff4e5', color: '#8a4b1d' }}>
            <strong>Serviço removido</strong>
            <div>Por: {dados.removido_por || '—'}</div>
            <div>Em: {formatarDataHora(dados.removido_em) || '—'}</div>
          </div>
        )}

        {/* Botões */}
        <div className="botoes">
          {dados?.id && dados?.status !== 'REMOVIDO' && (
            <button type="button" className="excluir" onClick={handleExcluir}>
              EXCLUIR
            </button>
          )}
          {dados?.id && dados?.status === 'REMOVIDO' && (
            <button type="button" className="recuperar" onClick={handleRecuperar}>
              RECUPERAR
            </button>
          )}
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

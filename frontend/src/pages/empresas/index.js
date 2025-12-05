import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UserCog, Plus, Pencil, Filter, Loader2 } from 'lucide-react';
import EmpresaFormModal from './EmpresaFormModal'; // ajuste o path
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../api/axios';
import './Empresas.css';
import { paraISO, paraBR } from '../../utils/datas';
import FiltrosAvancadosModal from './FiltrosAvancadosModal';
// util simples para exportar CSV (abre no Excel)
function exportToCsv(filename, rows, headers) {
  const sep = ';';
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    const needs = /[";\n]/.test(s);
    const cleaned = s.replace(/"/g, '""');
    return needs ? `"${cleaned}"` : cleaned;
  };
  const headerLine = headers.map(h => esc(h.label)).join(sep);
  const lines = rows.map(r => headers.map(h => esc(r[h.key])).join(sep));
  const csv = [headerLine, ...lines].join('\n');
  // Prepend BOM para Excel reconhecer UTF-8 e acentos corretamente
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  if (!normalized) return <span className="status-badge status-badge--empty">&nbsp;</span>;

  let color = '#999';
  if (normalized === 'ATIVO') color = '#2ecc71';
  else if (normalized === 'INATIVO') color = '#e74c3c';
  else color = '#f39c12';

  return <span className="status-badge" style={{ backgroundColor: color }} title={normalized} />;
};

const BooleanIcon = ({ value }) => {
  const normalized = (value || '').toUpperCase();
  if (normalized === 'SIM') return <span className="boolean-icon boolean-icon--yes" title="SIM">✔</span>;
  if (normalized === 'NÃO' || normalized === 'NAO') return <span className="boolean-icon boolean-icon--no" title="NÃO">✘</span>;
  return <span className="boolean-icon boolean-icon--empty">—</span>;
};

export default function Empresas() {

const [empresas, setEmpresas] = useState([]);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);
const pageSize = 5_000_000; // ou outro valor conforme necessário 
const [modalDelegarAberto, setModalDelegarAberto] = useState(false);
const [novoResponsavel, setNovoResponsavel] = useState('');
const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
const [responsaveis, setResponsaveis] = useState([]);
const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);
const [perfilUsuario, setPerfilUsuario] = useState(null);
const [periodosEntrega, setPeriodosEntrega] = useState([]);

const responsaveisPorNome = useMemo(() => {
  const mapa = new Map();
  responsaveis.forEach((resp) => {
    const chave = (resp.nome || '').toUpperCase();
    if (chave) mapa.set(chave, resp);
  });
  return mapa;
}, [responsaveis]);

const grupoDerivado = useCallback(
  (empresa) => {
    if (!empresa) return '';
    const respNome = (empresa.resp_dp || '').toUpperCase();
    if (!respNome) {
      return empresa.grupo ? String(empresa.grupo).toUpperCase() : '';
    }
    const responsavel = responsaveisPorNome.get(respNome);
    const grupo = responsavel?.grupo_nome;
    return grupo ? String(grupo).toUpperCase() : '';
  },
  [responsaveisPorNome]
);

const ramalDerivado = useCallback(
  (empresa) => {
    if (!empresa) return '';
    const respNome = (empresa.resp_dp || '').toUpperCase();
    const responsavel = respNome ? responsaveisPorNome.get(respNome) : null;
    const ramalFonte = responsavel?.ramal ?? empresa.ramal;
    return ramalFonte ? String(ramalFonte).toUpperCase() : '';
  },
  [responsaveisPorNome]
);

const compararTexto = (a, b) =>
  a.localeCompare(b, 'pt', { sensitivity: 'base', ignorePunctuation: true });

// lista de campos considerados "avançados"
const camposAvancados = [
  "sci_report","visitacao","tempo_demandado","serv_prest","serv_tom","deson",
  "secconci","planilha_folha","planilha_convenio","sst","apura_vt","opc_rec_patronal",
  "plr","plr_dt_entrega_inicio","plr_dt_entrega_fim","plr_dt_pagto_inicio","plr_dt_pagto_fim",
  "adiantamento","perc_adiantamento_min","perc_adiantamento_max","dt_adiantamento_entrega_inicio",
  "dt_adiantamento_entrega_fim","dt_adiantamento_pagamento_inicio","dt_adiantamento_pagamento_fim",
  "periodo_ponto","tipo_ponto","ponto_ini","ponto_fim","fecha_ponto","envia_ponto",
  "honorarios_min","honorarios_max","dt_13_entrega_inicio","dt_13_entrega_fim",
  "dt_13_adiantamento_entrega_inicio","dt_13_adiantamento_entrega_fim",
  "venc_procuracao_inicio","venc_procuracao_fim","venc_fgts_digital_inicio","venc_fgts_digital_fim", "ponto_entrega"
];

useEffect(() => {
  async function fetchResponsaveis() {
    try {
      const { data } = await api.get("/api/responsaveis/");
      setResponsaveis(data); // já vem ordenado
    } catch (err) {
      console.error("Erro ao buscar responsáveis:", err);
    }
  }
  fetchResponsaveis();
}, []);

useEffect(() => {
  async function fetchPerfil() {
    try {
      const { data } = await api.get("/api/me/");
      setPerfilUsuario(data.perfil);
    } catch (err) {
      console.error("Erro ao buscar perfil do usuário:", err);
    }
  }
  fetchPerfil();
}, []);

useEffect(() => {
  async function fetchPeriodosEntrega() {
    try {
      const { data } = await api.get('/api/periodos-entrega/');
      setPeriodosEntrega(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar períodos de entrega:', err);
    }
  }
  fetchPeriodosEntrega();
}, []);

const [filters, setFilters] = useState({
    cod_folha: '',
    razao_social: '',
    grupo_economico: '',
    cnpj: '',
    status_do_cliente: '',
    inicio_contrato_inicio: '',
    inicio_contrato_fim: '',
    inicio_contrato_vazio: false,
    termino_contrato_inicio: '',
    termino_contrato_fim: '',
    termino_contrato_vazio: false,
    tributacao: '',
    sistema: '',
    grupo: '',
    resp_dp: '',
    ramal: '',
    data_pagto_salario_inicio: '',
    data_pagto_salario_fim: '',
    categoria: '',
    classificacao2: '',
    matriz: '',
    enviadctf: '',
    sci_report: '',
    visitacao: '',
    tempo_demandado: '',
    serv_prest: '',
    serv_tom: '',
    deson: '',
    secconci: '',
    planilha_folha: '',
    planilha_convenio: '',
    sst: '',
    apura_vt: '',
    opc_rec_patronal: '',
    plr: '',
    plr_dt_entrega_inicio: '',
    plr_dt_entrega_fim: '',
    plr_dt_pagto_inicio: '',
    plr_dt_pagto_fim: '',
    adiantamento: '',
    perc_adiantamento_min: '',
    perc_adiantamento_max: '',
    dt_adiantamento_entrega_inicio: '',
    dt_adiantamento_entrega_fim: '',
    dt_adiantamento_pagamento_inicio: '',
    dt_adiantamento_pagamento_fim: '',
    periodo_ponto: '',
    tipo_ponto: '',
    ponto_ini: '',
    ponto_fim: '',
    fecha_ponto: '',
    envia_ponto: '',
    honorarios_min: '',
    honorarios_max: '',
    dt_13_entrega_inicio: '',
    dt_13_entrega_fim: '',
    dt_13_adiantamento_entrega_inicio: '',
    dt_13_adiantamento_entrega_fim: '',
    venc_procuracao_inicio: '',
    venc_procuracao_fim: '',
    venc_fgts_digital_inicio: '',
    venc_fgts_digital_fim: '',
    ponto_entrega: ''
  });

  // verifica se há filtros avançados preenchidos
  const filtrosAvancadosAtivos = camposAvancados.filter(
    (campo) => filters[campo] && filters[campo] !== ""
  );
  const temFiltrosAvancados = filtrosAvancadosAtivos.length > 0;
  const qtdFiltrosAvancados = filtrosAvancadosAtivos.length;
  const handleOrdenar = campo => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  //FILTROS DE EMPRESAS - TESTANDO O BACKEND
  const empresasFiltradas = useMemo(() => {
    const normalize = val => {
      return (val || '')
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    };

    const filtradas = empresas.filter(emp =>
      (!filters.cod_folha || normalize(emp.cod_folha).includes(normalize(filters.cod_folha))) &&
      (!filters.razao_social || normalize(emp.razao_social).includes(normalize(filters.razao_social))) &&
      (!filters.grupo_economico || normalize(emp.grupo_economico).includes(normalize(filters.grupo_economico))) &&
      (!filters.cnpj || normalize(emp.cnpj).includes(normalize(filters.cnpj))) &&
      (!filters.status_do_cliente || normalize(emp.status_do_cliente) === normalize(filters.status_do_cliente)) &&
      (!filters.tributacao || normalize(emp.tributacao).includes(normalize(filters.tributacao))) &&
      (!filters.sistema || normalize(emp.sistema) === normalize(filters.sistema)) &&
      (!filters.grupo || normalize(grupoDerivado(emp)) === normalize(filters.grupo)) &&
      (!filters.resp_dp || normalize(emp.resp_dp) === normalize(filters.resp_dp)) &&
      (!filters.ramal || normalize(ramalDerivado(emp)).includes(normalize(filters.ramal))) &&
      (!filters.categoria || normalize(emp.classificacao) === normalize(filters.categoria)) &&
      (!filters.classificacao2 || normalize(emp.classificacao2) === normalize(filters.classificacao2)) &&
      (!filters.matriz || normalize(emp.matriz).includes(normalize(filters.matriz))) &&
      (!filters.enviadctf || normalize(emp.enviadctf).includes(normalize(filters.enviadctf))) &&
      (!filters.data_pagto_salario_inicio || normalize(emp.data_pagto_salario) === normalize(filters.data_pagto_salario_inicio)) &&
      (
        (!filters.inicio_contrato_vazio &&
          (!filters.inicio_contrato_inicio || new Date(emp.inicio_contrato) >= new Date(filters.inicio_contrato_inicio)) &&
          (!filters.inicio_contrato_fim || new Date(emp.inicio_contrato) <= new Date(filters.inicio_contrato_fim))
        )
        ||
        (filters.inicio_contrato_vazio && (!emp.inicio_contrato || emp.inicio_contrato === ''))
      ) &&
      (
        (!filters.termino_contrato_vazio &&
          (!filters.termino_contrato_inicio || new Date(emp.termino_contrato) >= new Date(filters.termino_contrato_inicio)) &&
          (!filters.termino_contrato_fim || new Date(emp.termino_contrato) <= new Date(filters.termino_contrato_fim))
        )
        ||
        (filters.termino_contrato_vazio && (!emp.termino_contrato || emp.termino_contrato === ''))
      )
    );

    // Aplica ordenação, se houver campo definido
    if (ordenacao.campo) {
      filtradas.sort((a, b) => {
        if (ordenacao.campo === 'cod_folha') {
          const numA = parseInt(a.cod_folha, 10) || 0;
          const numB = parseInt(b.cod_folha, 10) || 0;
          return ordenacao.direcao === 'asc' ? numA - numB : numB - numA;
        }

        let valA;
        let valB;

        if (ordenacao.campo === 'grupo') {
          valA = grupoDerivado(a);
          valB = grupoDerivado(b);
        } else if (ordenacao.campo === 'ramal') {
          valA = ramalDerivado(a);
          valB = ramalDerivado(b);
        } else {
          valA = a[ordenacao.campo] || '';
          valB = b[ordenacao.campo] || '';
        }

        valA = valA.toString().toUpperCase();
        valB = valB.toString().toUpperCase();
        if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtradas;
  }, [empresas, filters, ordenacao, grupoDerivado, ramalDerivado]);
  

  const empresasVisiveis = useMemo(() => {
    const inicio = (page - 1) * pageSize;
    return empresasFiltradas.slice(inicio, inicio + pageSize);
  }, [empresasFiltradas, page]);

  // Exportação (depende de empresasFiltradas já definido acima)
  const handleExportar = useCallback(() => {
    const headers = [
      { key: 'cod_folha', label: 'Código' },
      { key: 'razao_social', label: 'Nome' },
      { key: 'grupo_economico', label: 'Grupo Econômico' },
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'status_do_cliente', label: 'Status' },
      { key: 'inicio_contrato', label: 'Início' },
      { key: 'termino_contrato', label: 'Término' },
      { key: 'tributacao', label: 'Tributação' },
      { key: 'sistema', label: 'Sistema' },
      { key: 'grupo', label: 'Grupo' },
      { key: 'resp_dp', label: 'Responsável' },
      { key: 'ramal', label: 'Ramal' },
      { key: 'data_pagto_salario', label: 'Data Pagto' },
      { key: 'classificacao', label: 'Categoria' },
      { key: 'classificacao2', label: 'Classificação' },
      { key: 'matriz', label: 'Matriz' },
      { key: 'enviadctf', label: 'DCTF' },
    ];
    const rows = empresasFiltradas.map(e => ({
      cod_folha: e.cod_folha || '',
      razao_social: (e.razao_social || '').toUpperCase(),
      grupo_economico: (e.grupo_economico || '').toUpperCase(),
      cnpj: e.cnpj || '',
      status_do_cliente: (e.status_do_cliente || '').toUpperCase(),
      inicio_contrato: e.inicio_contrato || '',
      termino_contrato: e.termino_contrato || '',
      tributacao: (e.tributacao || '').toUpperCase(),
      sistema: (e.sistema || '').toUpperCase(),
      grupo: grupoDerivado(e),
      resp_dp: (e.resp_dp || '').toUpperCase(),
      ramal: ramalDerivado(e),
      data_pagto_salario: e.data_pagto_salario || '',
      classificacao: (e.classificacao || '').toUpperCase(),
      classificacao2: (e.classificacao2 || '').toUpperCase(),
      matriz: (e.matriz || '').toUpperCase(),
      enviadctf: (e.enviadctf || '').toUpperCase(),
    }));
    const d = new Date();
    const ts = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    exportToCsv(`empresas_${ts}.csv`, rows, headers);
  }, [empresasFiltradas, grupoDerivado, ramalDerivado]);


  const [count, setCount] = useState(0);
  const toggleSelecionado = (empresa) => {
        setEmpresas(prev =>
          prev.map(e =>
            e === empresa ? { ...e, selecionado: !e.selecionado } : e
          )
        );
      };
  
  const [todosSelecionados, setTodosSelecionados] = useState(false);    
  const toggleTodos = () => {
    const novoValor = !todosSelecionados;
    setTodosSelecionados(novoValor);
    setEmpresas(prev =>
      prev.map(e => ({ ...e, selecionado: novoValor }))
    );
  };

  const options = useMemo(() => {
    const sistemas = new Set();
    const grupos = new Set();
    const responsaveisSet = new Set();

    empresas.forEach((emp) => {
      if (emp.sistema) sistemas.add(emp.sistema);
      const grupo = grupoDerivado(emp);
      if (grupo) grupos.add(grupo);
      const responsavelNome = (emp.resp_dp || '').toString().trim();
      if (responsavelNome) responsaveisSet.add(responsavelNome.toUpperCase());
    });

    return {
      sistema: Array.from(sistemas).sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' })),
      grupo: Array.from(grupos).sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' })),
      resp_dp: Array.from(responsaveisSet).sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' })),
    };
  }, [empresas, grupoDerivado]);

  const selectStylesCompact = {
    control: (base) => ({ ...base, minHeight: 24, height: 24, fontSize: 10 }),
    valueContainer: (base) => ({ ...base, padding: '0 4px' }),
    indicatorsContainer: (base) => ({ ...base, padding: '0 2px' }),
    option: (base) => ({ ...base, fontSize: 10, paddingTop: 4, paddingBottom: 4 }),
    input: (base) => ({ ...base, fontSize: 10 }),
    multiValue: (base) => ({ ...base, margin: 1 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const statusClienteOptions = useMemo(
    () => [
      { value: 'ATIVO', label: 'Ativo' },
      { value: 'INATIVO', label: 'Inativo' },
      { value: 'SUSPENSO', label: 'Suspenso' },
      { value: 'EM PROPOSTA', label: 'Em Proposta' },
    ],
    []
  );

  const sistemaOptions = useMemo(
    () => options.sistema.map((o) => ({ value: o, label: o })),
    [options.sistema]
  );

  const grupoOptions = useMemo(
    () => options.grupo.map((o) => ({ value: o, label: o })),
    [options.grupo]
  );

  // Usa lista completa de responsáveis (não só os filtrados) para manter as opções
  const respOptions = useMemo(
    () =>
      (responsaveis || []).map((r) => {
        const nome = r.nome || '';
        return { value: nome, label: nome };
      }),
    [responsaveis]
  );

  const classificacaoOptions = useMemo(
    () => ['Bronze', 'Diamante', 'Ouro', 'Prata'].sort(compararTexto),
    []
  );

  const classificacao2Options = useMemo(
    () =>
      [
        'BPO FIN',
        'BPO RH',
        'CARNÊ LEÃO',
        'CONSULTORIA',
        'DOMÉSTICA SEM DADOS',
        'DOMÉSTICA COM DADOS',
        'FACULTATIVO',
        'FATOR R',
        'FATOR R + FUNCS',
        'FOLHA COM DADOS',
        'FOLHA SEM DADOS',
        'PRÓ LABORE',
        'SEM MOVIMENTO',
        'TIME OUT',
      ].sort(compararTexto),
    []
  );

  const periodosOrdenados = useMemo(() => {
    return [...periodosEntrega]
      .filter((periodo) => periodo?.descricao)
      .sort((a, b) => compararTexto(a.descricao || '', b.descricao || ''));
  }, [periodosEntrega]);


useEffect(() => {
  setLoading(true);
  api
    .get('api/empresas/', {
      params: { page, page_size: pageSize, ...filters },
    })
    .then(({ data }) => {
      const results = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];
      setEmpresas(results);
      setCount(
        typeof data?.count === 'number' ? data.count : results.length
      );
    })
    .catch((err) => console.error('Erro ao carregar empresas:', err))
    .finally(() => setLoading(false));
}, [filters, page]);



  const handleFilterChange = field => e => {
    setPage(1);
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };


  // const totalPages = Math.ceil(count / pageSize);
  const totalPages = Math.ceil(empresasFiltradas.length / pageSize);

  const renderPages = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
      }
    }

    return pages;
  };

const [modalAberto, setModalAberto] = useState(false);
const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
const [readOnlyModal, setReadOnlyModal] = useState(false);

const abrirModal = (empresa = null, readOnly = false) => {
  if (!empresa) {
    // 👉 Nova empresa → força limpar
    setEmpresaSelecionada(null);
  } else {
    setEmpresaSelecionada(empresa);
  }
  setReadOnlyModal(readOnly);
  setModalAberto(true);
};



const fecharModal = () => {
  setModalAberto(false);
  setEmpresaSelecionada(null);
  setReadOnlyModal(false);
};


const normalizarDecimalParaEnvio = (valor) => {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  if (!texto) return null;

  // remove espaços e caracteres estranhos
  const limpo = texto.replace(/\s/g, '');

  const ultimoComa = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');

  if (ultimoComa > ultimoPonto) {
    // vírgula é separador decimal → remove pontos (milhar) e troca vírgula por ponto
    return limpo.replace(/\./g, '').replace(',', '.');
  }

  // ponto é separador decimal (ou não há vírgula) → mantém apenas dígitos e ponto
  return limpo.replace(/[^0-9.]/g, '');
};

const salvarEmpresa = async (empresa) => {
  try {
    const camposData = [
      "inicio_contrato",
      "termino_contrato",
      "dt_envio_cct",
      "dt_venc_conec_social",
      "venc_procuracao",
      "med_ocupa_proc_venc",
    ];

    const payload = { ...empresa };

    // normaliza datas da empresa
    camposData.forEach((campo) => {
      payload[campo] = payload[campo] ? paraISO(payload[campo]) : null;
    });

    // normaliza honorários (DecimalField no backend)
    payload.honorarios =
      payload.honorarios !== undefined && payload.honorarios !== null && payload.honorarios !== ""
        ? normalizarDecimalParaEnvio(payload.honorarios)
        : null;

    if (payload.resp_dp) {
      const responsavelNome = String(payload.resp_dp || '').toUpperCase();
      const responsavel = responsaveis.find(
        (r) => String(r.nome || '').toUpperCase() === responsavelNome
      );
      payload.grupo = responsavel?.grupo_nome
        ? String(responsavel.grupo_nome).toUpperCase()
        : '';
      payload.ramal = responsavel?.ramal
        ? String(responsavel.ramal).toUpperCase()
        : '';
    }

    delete payload.cnpj_formatado;
    delete payload.id;

    // salva empresa
    let novaEmpresa;
    if (empresaSelecionada) {
      // EDITAR (já existia)
      const res = await api.put(`/api/empresas/${payload.cod_folha}/`, payload);
      novaEmpresa = res.data;
      setEmpresas((prev) =>
        prev.map((e) => (e.cod_folha === payload.cod_folha ? novaEmpresa : e))
      );
    } else {
      // NOVA EMPRESA
      const res = await api.post("/api/empresas/", payload);
      novaEmpresa = res.data;
      setEmpresas((prev) => [...prev, novaEmpresa]);
    }

    // 🔥 sincroniza os CCTs (PUT com fallback para POST) + data_envio em ISO
    if (empresa.ccts && empresa.ccts.length > 0) {
      for (const cct of empresa.ccts) {
        const payloadCCT = {
          ...cct,
          cod_folha: novaEmpresa.cod_folha,
          data_envio: cct.data_envio ? paraISO(cct.data_envio) : null,
        };

        if (cct.id) {
          try {
            await api.put(`/api/ccts/${cct.id}/`, payloadCCT);
          } catch (e) {
            if (e?.response?.status === 404) {
              const { id, ...semId } = payloadCCT;
              await api.post(`/api/ccts/`, semId);
            } else {
              throw e;
            }
          }
        } else {
          const { id, ...semId } = payloadCCT;
          await api.post(`/api/ccts/`, semId);
        }
      }
    }

    // 🔥 sincroniza os PLRs (PUT com fallback para POST) + normalizações
    if (empresa.plrs && empresa.plrs.length > 0) {
      for (const plr of empresa.plrs) {
        const payloadPLR = {
          ...plr,
          cod_folha: novaEmpresa.cod_folha,
          data_entrega: plr.data_entrega ? paraISO(plr.data_entrega) : null,
          valor:
            plr.valor === "" || plr.valor === null || plr.valor === undefined
              ? null
              : String(plr.valor).replace(/\./g, "").replace(",", "."),
        };

        if (plr.id && !String(plr.id).startsWith("tmp-")) {
          try {
            await api.put(`/api/pg-plr/${plr.id}/`, payloadPLR);
          } catch (e) {
            if (e?.response?.status === 404) {
              const { id, ...semId } = payloadPLR;
              await api.post(`/api/pg-plr/`, semId);
            } else {
              throw e;
            }
          }
        } else {
          const { id, ...semId } = payloadPLR;
          await api.post(`/api/pg-plr/`, semId);
        }
      }
    }

    fecharModal();
  } catch (err) {
    console.error("Erro ao salvar empresa:", err.response?.data || err);
    alert("Erro ao salvar empresa");
  }
};


  return (
    <div className="empresas-container">
      {loading && (
        <div className="loading-overlay">
          <Loader2 size={36} className="spin" style={{ color: '#fff' }} />
        </div>
      )}
      <br></br>
      <div className="empresas-titulo">
        <h2>Empresas</h2>
        <div className="empresas-header-info">
          <span>Exibindo: {empresas.length} empresas</span>
        </div>

       <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Botão Filtros Avançados */}
          <button
            onClick={() => setModalFiltrosAberto(true)}
            className={`delegar-botao ${temFiltrosAvancados ? "filtro-ativo" : ""}`}
          >
            <Filter size={14} style={{ marginRight: "4px" }} />
            Filtros
            {temFiltrosAvancados && (
              <span className="filtros-badge">{qtdFiltrosAvancados}</span>
            )}
          </button>

          {/* Botão Exportar ao lado de Filtros (esquerda) */}
          <button onClick={handleExportar} className="delegar-botao" title="Exportar CSV">
            Exportar
          </button>
          

          {(perfilUsuario === 'admin' || perfilUsuario === 'coordenador') && (
            <button onClick={() => abrirModal(null, false)} className="delegar-botao" title="Nova Empresa">
              <Plus size={16} />
            </button>
          )}

          {/* Botão Delegar */}
          <button
            onClick={() => {
              const selecionadas = empresas.filter((e) => e.selecionado);
              if (selecionadas.length === 0) {
                alert("Selecione pelo menos uma empresa para delegar.");
                return;
              }
              setModalDelegarAberto(true);
            }}
            className="delegar-botao"
            title="Delegar Responsável"
          >
            <UserCog size={16} />
          </button>
        </div>
      </div>

      <div className="empresas-tabela-wrapper">
        <table className="empresas-table empresas-table--uppercase">
          <thead>
            <tr>
              <th className="col-texto-muito-curto">#</th>
              <th className="col-texto-muito-curto" onClick={() => handleOrdenar('cod_folha')} style={{ cursor: 'pointer' }}>
                Código {ordenacao.campo === 'cod_folha' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-longo" onClick={() => handleOrdenar('razao_social')} style={{ cursor: 'pointer' }}>
                Nome {ordenacao.campo === 'razao_social' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('grupo_economico')} style={{ cursor: 'pointer' }}>
                Grupo Econ. {ordenacao.campo === 'grupo_economico' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-curto" onClick={() => handleOrdenar('cnpj')} style={{ cursor: 'pointer' }}>
                CNPJ {ordenacao.campo === 'cnpj' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-status text-uppercase" onClick={() => handleOrdenar('status_do_cliente')} style={{ cursor: 'pointer' }}>
                Status {ordenacao.campo === 'status_do_cliente' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-data" onClick={() => handleOrdenar('inicio_contrato')} style={{ cursor: 'pointer' }}>
                Início {ordenacao.campo === 'inicio_contrato' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-data" onClick={() => handleOrdenar('termino_contrato')} style={{ cursor: 'pointer' }}>
                Término {ordenacao.campo === 'termino_contrato' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('tributacao')} style={{ cursor: 'pointer' }}>
                Tributação {ordenacao.campo === 'tributacao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-muito-curto" onClick={() => handleOrdenar('sistema')} style={{ cursor: 'pointer' }}>
                Sistema {ordenacao.campo === 'sistema' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('grupo')} style={{ cursor: 'pointer' }}>
                Grupo {ordenacao.campo === 'grupo' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('resp_dp')} style={{ cursor: 'pointer' }}>
                Responsável {ordenacao.campo === 'resp_dp' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-curto2" onClick={() => handleOrdenar('ramal')} style={{ cursor: 'pointer' }}>
                Ramal {ordenacao.campo === 'ramal' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-data" onClick={() => handleOrdenar('data_pagto_salario')} style={{ cursor: 'pointer' }}>
                Data Pgt. {ordenacao.campo === 'data_pagto_salario' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('classificacao')} style={{ cursor: 'pointer' }}>
                Categoria {ordenacao.campo === 'classificacao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-texto-medio" onClick={() => handleOrdenar('classificacao2')} style={{ cursor: 'pointer' }}>
                Classificação {ordenacao.campo === 'classificacao2' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>

              <th className="col-bool" onClick={() => handleOrdenar('matriz')} style={{ cursor: 'pointer' }}>
                Matriz {ordenacao.campo === 'matriz' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
              <th className="col-bool" onClick={() => handleOrdenar('enviadctf')} style={{ cursor: 'pointer' }}>
                DCTF {ordenacao.campo === 'enviadctf' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
            <tr className="filters-row">
              <th>
                <button type="button" onClick={toggleTodos} title="Selecionar todos" className="checkbox-botao">
                  <input type="checkbox" checked={todosSelecionados} readOnly />
                </button>
              </th>
              <th className="col-texto-muito-curto">
                <input type="text" value={filters.cod_folha} onChange={handleFilterChange('cod_folha')} className={filters.cod_folha ? 'filtro-ativo' : ''} />
              </th>
              <th className="col-texto-longo">
                <input type="text" value={filters.razao_social} onChange={handleFilterChange('razao_social')} className={filters.razao_social ? 'filtro-ativo' : ''} />
              </th>
              <th className="col-texto-curto">
                <input type="text" value={filters.grupo_economico} onChange={handleFilterChange('grupo_economico')} className={filters.grupo_economico ? 'filtro-ativo' : ''} />
              </th>
              <th className="col-texto-curto">
                <input type="text" value={filters.cnpj} onChange={handleFilterChange('cnpj')} className={filters.cnpj ? 'filtro-ativo' : ''} />
              </th>
              <th className="col-status">
                <select value={filters.status_do_cliente} onChange={handleFilterChange('status_do_cliente')} className={filters.status_do_cliente ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Em Proposta">Em Proposta</option>
                </select>
              </th>
              <th className="col-data">
                <input type="date" value={filters.inicio_contrato_inicio} onChange={handleFilterChange('inicio_contrato_inicio')} className={filters.inicio_contrato_inicio ? 'filtro-ativo' : ''} />
                <input type="date" value={filters.inicio_contrato_fim} onChange={handleFilterChange('inicio_contrato_fim')} className={filters.inicio_contrato_fim ? 'filtro-ativo' : ''} />
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={!!filters.inicio_contrato_vazio}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, inicio_contrato_vazio: e.target.checked, inicio_contrato_inicio: '', inicio_contrato_fim: '' }))
                    }
                  />
                  vazios
                </label>
              </th>
              <th className="col-data">
                <input type="date" value={filters.termino_contrato_inicio} onChange={handleFilterChange('termino_contrato_inicio')} className={filters.termino_contrato_inicio ? 'filtro-ativo' : ''} />
                <input type="date" value={filters.termino_contrato_fim} onChange={handleFilterChange('termino_contrato_fim')} className={filters.termino_contrato_fim ? 'filtro-ativo' : ''} />
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={!!filters.termino_contrato_vazio}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, termino_contrato_vazio: e.target.checked, termino_contrato_inicio: '', termino_contrato_fim: '' }))
                    }
                  />
                  vazios
                </label>
              </th>
              <th className="col-texto-medio">
                <input type="text" value={filters.tributacao} onChange={handleFilterChange('tributacao')} className={filters.tributacao ? 'filtro-ativo' : ''} />
              </th>
              <th className="col-texto-muito-curto">
                <select value={filters.sistema} onChange={handleFilterChange('sistema')} className={filters.sistema ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  {options.sistema.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </th>
              <th className="col-texto-medio">
                <select value={filters.grupo} onChange={handleFilterChange('grupo')} className={filters.grupo ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  {options.grupo.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </th>
              <th className="col-texto-medio">
                <select value={filters.resp_dp} onChange={handleFilterChange('resp_dp')} className={filters.resp_dp ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  {options.resp_dp.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </th>
              <th className="col-texto-curto2">
                <input type="text" value={filters.ramal} onChange={handleFilterChange('ramal')} className={filters.ramal ? 'filtro-ativo' : ''} />
              </th>
              
              <th className="col-data">
                <select
                  value={filters.data_pagto_salario_inicio}
                  onChange={handleFilterChange('data_pagto_salario_inicio')}
                  className={filters.data_pagto_salario_inicio ? 'filtro-ativo' : ''}
                >
                  <option value="">Todos</option>
                  {periodosOrdenados.map((periodo) => {
                    const valor = periodo.descricao;
                    return (
                      <option key={periodo.id ?? valor} value={valor}>
                        {valor.toUpperCase()}
                      </option>
                    );
                  })}
                </select>
              </th>
              <th className="col-texto-muito-curto">
                <select value={filters.categoria} onChange={handleFilterChange('categoria')} className={filters.categoria ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  {classificacaoOptions.map((opcao) => (
                    <option key={opcao} value={opcao}>{opcao}</option>
                  ))}
                </select>
              </th>
              <th>
                <select value={filters.classificacao2} onChange={handleFilterChange('classificacao2')}>
                  <option value="">Todos</option>
                  {classificacao2Options.map((opcao) => (
                    <option key={opcao} value={opcao}>{opcao}</option>
                  ))}
                </select>
              </th>
              <th className="col-bool">
                <select value={filters.matriz} onChange={handleFilterChange('matriz')} className={filters.matriz ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </th>
              <th className="col-bool">
                <select value={filters.enviadctf} onChange={handleFilterChange('enviadctf')} className={filters.enviadctf ? 'filtro-ativo' : ''}>
                  <option value="">Todos</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </th>
            </tr>

          </thead>
          <tbody>
            {empresasVisiveis.map(emp => (
              <tr key={emp.cod_folha || emp.id}>
                <td>
                    <input
                      type="checkbox"
                      checked={emp.selecionado || false}
                      onChange={() => toggleSelecionado(emp)}
                    />
                </td>
                <td
                  onClick={() => {
                    if (perfilUsuario === 'admin' || perfilUsuario === 'coordenador') {
                      abrirModal(emp, false);   // edição
                    } else {
                      abrirModal(emp, true);    // somente leitura
                    }
                  }}
                  style={{ cursor: 'pointer', color: '#2B9FAE', fontWeight: 'bold' }}
                >
                  {emp.cod_folha}
                </td>
                <td>{(emp.razao_social || '').toUpperCase()}</td>
                <td>{(emp.grupo_economico || '').toUpperCase()}</td>
                <td>{emp.cnpj_formatado}</td>
                <td className="status-cell"><StatusBadge status={emp.status_do_cliente} /></td>
                <td>{emp.inicio_contrato}</td>
                <td>{emp.termino_contrato}</td>
                <td>{(emp.tributacao || '').toUpperCase()}</td>
                <td>{(emp.sistema || '').toUpperCase()}</td>
                <td>{grupoDerivado(emp)}</td>
                <td>{(emp.resp_dp || '').toUpperCase()}</td>
                <td className="col-texto-curto2">{ramalDerivado(emp)}</td>
                <td>{emp.data_pagto_salario}</td>
                <td>{(emp.classificacao || '').toUpperCase()}</td>
                <td className={`classificacao2 ${emp.classificacao2?.toUpperCase().replace(/\s+/g, '-').replace('+','-')}`}>
                    {(emp.classificacao2 || '').toUpperCase()}
                </td>
                <td className="boolean-cell"><BooleanIcon value={emp.matriz} /></td>
                <td className="boolean-cell"><BooleanIcon value={emp.enviadctf} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(1)} title="Primeira">
            <ChevronsLeft size={16} />
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} title="Anterior">
            <ChevronLeft size={16} />
          </button>

          {renderPages().map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="ellipsis">...</span>
              ) : (
                <button
                  key={p}
                  className={page === p ? 'active' : ''}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}

          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} title="Próxima">
            <ChevronRight size={16} />
          </button>
          <button disabled={page === totalPages} onClick={() => setPage(totalPages)} title="Última">
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
      {modalDelegarAberto && (
        <div className="modal-overlay">
          <div className="modal-conteudo">
            <h3>Delegar Responsável</h3>
            <p>Selecione o novo responsável para as empresas marcadas:</p>

            <select value={novoResponsavel} onChange={e => setNovoResponsavel(e.target.value)}>
              <option value="">Selecione</option>
              {responsaveis.map(r => (
                <option key={r.id} value={r.nome}>{r.nome}</option>
              ))}
            </select>  


            <div className="modal-botoes">
              <button onClick={async () => {
                const selecionadas = empresas.filter(e => e.selecionado);
                if (!novoResponsavel || selecionadas.length === 0) {
                  alert("Preencha o responsável e selecione pelo menos uma empresa.");
                  return;
                }

                if (!window.confirm(`Confirma delegar ${selecionadas.length} empresas para ${novoResponsavel}?`)) return;

                try {
                  // const promises = selecionadas.map(e =>
                  //   api.put(`/api/empresas/${e.cod_folha}/`, { ...e, resp_dp: novoResponsavel })

                  // );

                  const promises = selecionadas.map(e => {
                    const camposData = [
                      "inicio_contrato",
                      "termino_contrato",
                      "dt_envio_cct",
                      "dt_venc_conec_social",
                      "venc_procuracao",
                      "med_ocupa_proc_venc",
                    ];

                    const payload = { ...e, resp_dp: novoResponsavel };

                    // normaliza datas
                    camposData.forEach(campo => {
                      if (payload[campo]) {
                        payload[campo] = paraISO(payload[campo]);
                      }
                    });

                    // limpa campos que não pertencem ao modelo
                    delete payload.cnpj_formatado;
                    delete payload.selecionado;
                    delete payload.id;

                    return api.put(`/api/empresas/${e.cod_folha}/`, payload);
                  });


                  await Promise.all(promises);
                  alert("Delegação concluída.");
                  const { data } = await api.get('api/empresas/', { params: { page: 1, page_size: 5_000_000 } });
                  setEmpresas(data.results);
                  setModalDelegarAberto(false);
                  setNovoResponsavel('');
                } catch (err) {
                  console.error(err);
                  alert("Erro ao delegar.");
                }
              }}>
                Confirmar
              </button>
              <button onClick={() => setModalDelegarAberto(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <EmpresaFormModal
        visivel={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={salvarEmpresa}
        dados={empresaSelecionada}
        readOnly={readOnlyModal}
      />

      {modalFiltrosAberto && (
        <FiltrosAvancadosModal
          visivel={modalFiltrosAberto}
          aoFechar={() => setModalFiltrosAberto(false)}
          filters={filters}
          setFilters={setFilters}
        />
      )}
    </div>
  );
}

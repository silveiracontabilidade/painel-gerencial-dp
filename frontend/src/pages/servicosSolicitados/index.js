// ServicosSolicitados.js
import React, { useEffect, useState, useMemo  } from 'react';
import { Plus, Pencil, Trash2, FileText, CheckCircle, Loader2 } from 'lucide-react';
import EmpresaFormModal from '../empresas/EmpresaFormModal'
import api from '../../api/axios';
import { paraISO } from '../../utils/datas';
import ServicoSolicitadoFormModal from './servicoSolicitadoFormModal';
import './servicos-solicitados.css';
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

export default function ServicosSolicitados() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [empresas, setEmpresas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [loading, setLoading] = useState(false);
  
  const handleExportar = () => {
    const headers = [
      { key: 'empresa', label: 'Empresa' },
      { key: 'empresa_razao', label: 'Razão Social' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'servico', label: 'Serviço' },
      { key: 'detalhes', label: 'Detalhes' },
      { key: 'competencia', label: 'Competência' },
      { key: 'data_solicitacao', label: 'Solicitação' },
      { key: 'data_vencimento', label: 'Vencimento' },
      { key: 'data_para_resposta', label: 'Data Resposta' },
      { key: 'data_conclusao', label: 'Conclusão' },
    ];
    const rows = solicitacoesFiltradas.map(s => {
      const cod = String(s.empresa ?? '');
      const emp = empresaByCodigo.get(cod);
      const empresaRazao = emp?.razao_social || '';
      const responsavel = s.empresa ? (emp?.resp_dp || '') : (s.responsavel_nome || '');
      return {
        empresa: cod || '-',
        empresa_razao: empresaRazao,
        responsavel: responsavel,
        servico: s.servico_nome || '',
        detalhes: renderDetalhes(s),
        competencia: s.competencia || '',
        data_solicitacao: s.data_solicitacao || '',
        data_vencimento: s.data_vencimento || '',
        data_para_resposta: s.data_para_resposta || '',
        data_conclusao: s.data_conclusao || '',
      };
    });
    const data = new Date();
    const ts = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
    exportToCsv(`servicos_solicitados_${ts}.csv`, rows, headers);
  };

  // para mostrar os detalhes da empresa
  const [empresaModalAberto, setEmpresaModalAberto] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  const abrirEmpresaModal = (empresa) => {
    setEmpresaSelecionada(empresa);
    setEmpresaModalAberto(true);
  };

  const fecharEmpresaModal = () => {
    setEmpresaSelecionada(null);
    setEmpresaModalAberto(false);
  };

  //concluir
  const concluir = async (id) => {
      const solicitacao = solicitacoes.find(s => s.id === id);
      if (!solicitacao) return;

      // verifica se é afastamento
      const servico = servicoById.get(String(solicitacao.servico));
      const nomeServico = servico?.nome?.toUpperCase() || "";

      if (nomeServico.includes("AFAST")) {
        if (!solicitacao.afast_retorno) {
          alert("Não é possível concluir: informe a data de retorno do afastamento.");
          return;
        }
      }

      if (!window.confirm('Marcar esta solicitação como concluída?')) return;

      const hojeISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      try {
        await api.patch(`/api/solicitacoes/${id}/`, { data_conclusao: hojeISO });
        carregarSolicitacoes();
      } catch (err) {
        console.error("Erro ao concluir solicitação:", err.response?.data || err);
        alert("Erro ao concluir solicitação");
      }
    };


  // Filtros
  const [filters, setFilters] = useState({
    empresa: '',
    responsavelId: '',
    grupoId: '',
    status: 'aberto',
    prazo: 'todos',
    servicoId: '',       // 👈 novo
    competencia: '',     // 👈 novo
    detalhes: '',        // 👈 novo filtro
  });

  const normalizarDecimalParaEnvio = (valor) => {
    if (valor === null || valor === undefined) return null;
    const texto = String(valor).trim();
    if (!texto) return null;

    const limpo = texto.replace(/\s/g, '');
    const ultimoComa = limpo.lastIndexOf(',');
    const ultimoPonto = limpo.lastIndexOf('.');

    if (ultimoComa > ultimoPonto) {
      return limpo.replace(/\./g, '').replace(',', '.');
    }

    return limpo.replace(/[^0-9.]/g, '');
  };

  useEffect(() => {
    carregarSolicitacoes();
    carregarEmpresas();
    carregarAuxiliares();
  }, []);

  //retornar anexos em serviços
  useEffect(() => {
    api.get('/api/servicos/')
      .then(res => setServicos(res.data.results || res.data))
      .catch(err => console.error("Erro ao carregar serviços:", err));
  }, []);

  //lookup para consulta rápida  
  const servicoById = useMemo(() => {
    const m = new Map();
    servicos.forEach(s => m.set(String(s.id), s));
    return m;
  }, [servicos]);


  //carrega as solicitacoes
  const temFiltro = useMemo(() => {
    return (
      (filters.empresa && filters.empresa.trim() !== '') ||
      (filters.responsavelId && String(filters.responsavelId) !== '') ||
      (filters.grupoId && String(filters.grupoId) !== '') ||
      (filters.servicoId && String(filters.servicoId) !== '') ||
      (filters.competencia && filters.competencia.trim() !== '') ||
      (filters.detalhes && filters.detalhes.trim() !== '') ||
      (filters.prazo && filters.prazo !== 'todos') ||
      (filters.status && filters.status !== 'aberto')
    );
  }, [filters]);

  const carregarSolicitacoes = async () => {
    setLoading(true);
    const params = temFiltro
      ? { page: 1, page_size: 2000 }
      : { page: paginaAtual, page_size: itensPorPagina };
    try {
      const res = await api.get('/api/solicitacoes/', { params });
      const results = res.data?.results ?? res.data;
      setSolicitacoes(results);
      if (!temFiltro) {
        const count = typeof res.data?.count === 'number' ? res.data.count : (Array.isArray(results) ? results.length : 0);
        setTotalCount(count);
      }
    } finally {
      setLoading(false);
    }
  };

  const carregarEmpresas = async () => {
    const res = await api.get('/api/empresas/', { params: { page: 1, page_size: 2000 } });
    setEmpresas(res.data.results || res.data);
  };

  const carregarAuxiliares = async () => {
    const [resResp, resGrupo] = await Promise.all([
      api.get('/api/responsaveis/'),
      api.get('/api/grupos/')
    ]);
    setResponsaveis(resResp.data);
    setGrupos(resGrupo.data);
  };

  const salvarEmpresaDetalhe = async (empresa) => {
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

      camposData.forEach((campo) => {
        payload[campo] = payload[campo] ? paraISO(payload[campo]) : null;
      });

      if (payload.resp_dp) {
        const responsavelNome = String(payload.resp_dp || "").toUpperCase();
        const responsavel = responsaveis.find(
          (r) => String(r.nome || "").toUpperCase() === responsavelNome
        );
        payload.grupo = responsavel?.grupo_nome
          ? String(responsavel.grupo_nome).toUpperCase()
          : "";
        payload.ramal = responsavel?.ramal
          ? String(responsavel.ramal).toUpperCase()
          : "";
      }

      payload.honorarios =
        payload.honorarios !== undefined && payload.honorarios !== null && payload.honorarios !== ""
          ? normalizarDecimalParaEnvio(payload.honorarios)
          : null;

      delete payload.cnpj_formatado;
      delete payload.id;

      let novaEmpresa;
      if (empresaSelecionada) {
        const res = await api.put(`/api/empresas/${payload.cod_folha}/`, payload);
        novaEmpresa = res.data;
      } else {
        const res = await api.post("/api/empresas/", payload);
        novaEmpresa = res.data;
      }

      if (empresa.ccts && empresa.ccts.length > 0) {
        for (const cct of empresa.ccts) {
          const payloadCCT = {
            ...cct,
            cod_folha: novaEmpresa.cod_folha,
            data_envio: cct.data_envio ? paraISO(cct.data_envio) : null,
          };

          if (cct.id && !String(cct.id).startsWith("tmp-")) {
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

      await carregarEmpresas();
      fecharEmpresaModal();
    } catch (err) {
      console.error("Erro ao salvar empresa:", err.response?.data || err);
      alert("Erro ao salvar empresa.");
    }
  };

  // mapa de cores para grupos
  const GRUPO_CORES = {
    "AZUL": "#1E90FF",
    "VERDE": "#2E8B57",
    "VERMELHO": "#DC143C",
    "AMARELO": "#FFF200",
    "ROXO": "#800080",
    "ROSA": "#FF69B4",
    "LILAS": "#C8A2C8",
    "LARANJA": "#FF8C00",
    "MARROM": "#412504",
    "OURO": "#C3996B",   // se tiver
    "PRATA": "#A9A9A9",  // se tiver
    // adicione mais cores aqui
  };

  // Decide se o texto deve ser preto ou branco baseado na cor de fundo
  function getContrastColor(hex) {
    // Remove o "#" e expande formatos curtos tipo #FFF
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Fórmula perceptual de luminância
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.65 ? '#000000' : '#FFFFFF'; // se fundo claro → preto
  }

  // Mapas para lookup rápido
  const empresaByCodigo = useMemo(() => {
    const m = new Map();
    empresas.forEach((e) => {
      const codigoOriginal = String(e.cod_folha ?? '').trim();
      if (!codigoOriginal) return;
      m.set(codigoOriginal, e);
      const codigoNumerico = Number(codigoOriginal);
      if (!Number.isNaN(codigoNumerico)) {
        m.set(String(codigoNumerico), e);
      }
    });
    return m;
  }, [empresas]);

  const respById = useMemo(() => {
    const m = new Map();
    responsaveis.forEach(r => m.set(String(r.id), r));
    return m;
  }, [responsaveis]);

  const grupoById = useMemo(() => {
    const m = new Map();
    grupos.forEach(g => m.set(String(g.id), g));
    return m;
  }, [grupos]);

  const normalize = (v) =>
    String(v ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().toUpperCase();

  const alternarOrdenacao = (campo) => {
    setOrdenacao((prev) => {
      if (prev.campo === campo) {
        return { campo, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' };
      }
      return { campo, direcao: 'asc' };
    });
  };

  const iconeOrdenacao = (campo) => {
    if (ordenacao.campo !== campo) return '';
    return ordenacao.direcao === 'asc' ? '▲' : '▼';
  };

  // Aplica filtros
  const solicitacoesFiltradas = useMemo(() => {
    const termoEmp = normalize(filters.empresa);
    const alvoRespNome = filters.responsavelId
      ? normalize(respById.get(String(filters.responsavelId))?.nome)
      : '';
    const alvoGrupoNome = filters.grupoId
      ? normalize(grupoById.get(String(filters.grupoId))?.nome)
      : '';
    const alvoDetalhes = normalize(filters.detalhes);

    const hoje = new Date();

    return solicitacoes.filter((s) => {
      const cod = String(s.empresa ?? '');
      const emp = empresaByCodigo.get(cod);

      let passaEmpresa = true;
      let passaResp = true;
      let passaGrupo = true;

      if (emp) {
        const codNorm = normalize(emp.cod_folha);
        const razaoNorm = normalize(emp.razao_social);
        const empRespNorm = normalize(emp.resp_dp);
        const empGrupoNorm = normalize(emp.grupo);

        passaEmpresa =
          !termoEmp || codNorm.includes(termoEmp) || razaoNorm.includes(termoEmp);
        passaResp = !alvoRespNome || empRespNorm === alvoRespNome;
        passaGrupo = !alvoGrupoNome || empGrupoNorm === alvoGrupoNome;
      } else {
        if (termoEmp) return false;
        passaResp = !filters.responsavelId || String(s.responsavel || '') === String(filters.responsavelId);
        passaGrupo = !alvoGrupoNome;
      }

      const passaServico = !filters.servicoId || String(s.servico) === String(filters.servicoId);
      const passaCompetencia = !filters.competencia || String(s.competencia || '').includes(filters.competencia);

      // filtro de status
      if (filters.status === "aberto" && s.data_conclusao) return false;
      if (filters.status === "concluido" && !s.data_conclusao) return false;

      // filtro de prazo
      if (filters.prazo !== "todos" && s.data_para_resposta) {
        const resposta = new Date(s.data_para_resposta.split("-").reverse().join("-"));
        const concluido = !!s.data_conclusao;

        if (filters.prazo === "atrasados" && (!concluido && resposta < hoje)) {
          // ok, fica
        } else if (filters.prazo === "atrasados") {
          return false;
        }

        if (filters.prazo === "no_prazo" && (!concluido && resposta >= hoje)) {
          // ok, fica
        } else if (filters.prazo === "no_prazo") {
          return false;
        }
      }

      // filtro por detalhes
      let passaDetalhes = true;
      if (alvoDetalhes) {
        const detalhesStr = normalize(renderDetalhes(s));
        passaDetalhes = detalhesStr.includes(alvoDetalhes);
      }

      return passaEmpresa && passaResp && passaGrupo && passaServico && passaCompetencia && passaDetalhes;
    });
  }, [solicitacoes, empresaByCodigo, filters, respById, grupoById]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filters]);

  const obterValorOrdenacao = (solicitacao, campo) => {
    switch (campo) {
      case 'empresa': {
        const cod = String(solicitacao.empresa ?? '');
        const emp = empresaByCodigo.get(cod);
        if (emp) {
          const parteCodigo = String(emp.cod_folha ?? '').toUpperCase();
          const parteRazao = String(emp.razao_social ?? '').toUpperCase();
          return `${parteCodigo} ${parteRazao}`.trim();
        }
        return cod.toUpperCase();
      }
      case 'responsavel': {
        if (solicitacao.empresa) {
          const emp = empresaByCodigo.get(String(solicitacao.empresa));
          if (emp) return String(emp.resp_dp ?? '').toUpperCase();
        }
        return String(solicitacao.responsavel_nome ?? '').toUpperCase();
      }
      case 'servico_nome':
        return String(solicitacao.servico_nome ?? '').toUpperCase();
      case 'competencia':
        return String(solicitacao.competencia ?? '');
      case 'data_solicitacao':
        return String(solicitacao.data_solicitacao ?? '');
      case 'data_vencimento':
        return String(solicitacao.data_vencimento ?? '');
      case 'data_para_resposta':
        return String(solicitacao.data_para_resposta ?? '');
      case 'data_conclusao':
        return String(solicitacao.data_conclusao ?? '');
      default:
        return '';
    }
  };

  const solicitacoesOrdenadas = useMemo(() => {
    if (!ordenacao.campo) return solicitacoesFiltradas;
    const lista = [...solicitacoesFiltradas];
    lista.sort((a, b) => {
      const valA = obterValorOrdenacao(a, ordenacao.campo);
      const valB = obterValorOrdenacao(b, ordenacao.campo);
      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
    return lista;
  }, [solicitacoesFiltradas, ordenacao]);

  // Se houver filtro, total passa a ser o tamanho filtrado desta coleção carregada
  const totalRegistros = temFiltro ? solicitacoesOrdenadas.length : totalCount;
  const totalPaginas = Math.max(1, Math.ceil((totalRegistros || 0) / itensPorPagina) || 1);

  useEffect(() => {
    setPaginaAtual((prev) => (prev > totalPaginas ? totalPaginas : prev));
  }, [totalPaginas]);

  // Recarrega da API quando paginação muda ou filtros (com estratégia condicional)
  useEffect(() => {
    carregarSolicitacoes();
  }, [paginaAtual, itensPorPagina, temFiltro]);

  // Quando filtros mudam, volta para página 1
  useEffect(() => {
    setPaginaAtual(1);
  }, [filters]);

  // Paginação em memória quando há filtro ativo
  const solicitacoesPagina = useMemo(() => {
    if (!temFiltro) return solicitacoesOrdenadas;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return solicitacoesOrdenadas.slice(inicio, inicio + itensPorPagina);
  }, [temFiltro, solicitacoesOrdenadas, paginaAtual, itensPorPagina]);

  // Paginação agora é no servidor; não fatiar novamente no cliente

  const handleItensPorPaginaChange = (e) => {
    const novoValor = Number(e.target.value) || 10;
    setItensPorPagina(novoValor);
    setPaginaAtual(1);
  };

  const irParaPagina = (alvo) => {
    if (alvo < 1 || alvo > totalPaginas) return;
    setPaginaAtual(alvo);
  };

  // Helpers
  const renderDetalhes = (s) => {
    const tipo = (s.servico_nome || "").toUpperCase();
    let partes = [];

    // Sempre inclui descrição do serviço
    if (s.descricao_servico) {
      partes.push(s.descricao_servico);
    }

    if (tipo.includes("ADMISS")) {
      partes.push(`Admissão: ${s.admissao_data_ini || '-'} ${s.admissao_tipo || ''}`);
      if (s.admissao_deslig_programado)
        partes.push(`Deslig. Prog.: ${s.admissao_deslig_programado}`);
      if (s.admissao_preliminar) {
        partes.push(`Preliminar Enviada: ${s.admissao_preliminar}`);
      }
    }
    else if (tipo.includes("RESCIS")) {
      partes.push(
        `Rescisão: ${s.rescisao_tipo_aviso || '-'} ` +
        `${s.rescisao_data_ini || '-'} ` +
        (s.rescisao_dias_aviso ? `Aviso ${s.rescisao_dias_aviso}` : '') +
        (s.rescisao_tipo ? ` (${s.rescisao_tipo})` : '')
      );
    }
    else if (tipo.includes("FÉRIAS") || tipo.includes("FERIAS")) {
      const detalhesFerias = [
        `Férias: ${s.ferias_data_ini || '-'}`,
        s.ferias_qtd_dias ? `${s.ferias_qtd_dias} dias` : null,
        s.ferias_qtd_dias_abono ? `${s.ferias_qtd_dias_abono} dias abono` : null,
        s.ferias_abono ? `Abono: ${s.ferias_abono}` : null,
      ].filter(Boolean).join(' | ');
      if (detalhesFerias) partes.push(detalhesFerias);
    }
    else if (tipo.includes("AFAST")) {
      partes.push(
        `Afast.: ${s.afast_tipo || '-'} ` +
        `${s.afast_ini || ''} ` +
        (s.afast_dias ? `(${s.afast_dias} dias)` : '') +
        (s.afast_pericia ? ` Perícia: ${s.afast_pericia}` : '')
      );
    }
    else {
      // fallback para outros tipos → usa só identificação
      if (s.identificacao) partes.push(s.identificacao);
    }

    // Sistema da empresa
    const cod = String(s.empresa ?? '');
    const emp = empresaByCodigo.get(cod);
    if (emp && emp.sistema) {
      partes.push(`Sistema: ${emp.sistema}`);
    }

    return partes.filter(Boolean).join(" | ");
  };


  const abrirModal = (solicitacao = null) => {
    setSolicitacaoSelecionada(solicitacao);
    setModalAberto(true);
  };
  const fecharModal = () => {
    setModalAberto(false);
    setSolicitacaoSelecionada(null);
    carregarSolicitacoes();
  };
  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/solicitacoes/${id}/`);
      carregarSolicitacoes();
    }
  };
 
  const renderResponsavelBadge = (nomeExibicao, grupoNome) => {
    const grupoUpper = String(grupoNome || '').toUpperCase();
    const corFundo = GRUPO_CORES[grupoUpper] || '#1a1f3a';
    const corTexto = getContrastColor(corFundo);
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: corFundo,
          color: corTexto,
          fontWeight: 600,
        }}
      >
        {nomeExibicao}
      </span>
    );
  };

  // empresa
  const renderEmpresa = (solicitacao) => {
    const valorEmpresa = solicitacao?.empresa;
    if (valorEmpresa === null || valorEmpresa === undefined || valorEmpresa === '') {
      return '—';
    }

    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    if (!emp) return cod;

    return (
      <span
        onClick={() => abrirEmpresaModal(emp)}
        style={{ cursor: 'pointer', color: '#2B9FAE', fontWeight: 'bold' }}
        title="Clique para ver detalhes"
      >
        {emp.cod_folha} — {emp.razao_social}
      </span>
    );
  };


  const renderResp = (solicitacao) => {
    const valorEmpresa = solicitacao?.empresa;
    if (valorEmpresa === null || valorEmpresa === undefined || valorEmpresa === '') {
      const responsavelId = solicitacao?.responsavel;
      const responsavel = responsavelId ? respById.get(String(responsavelId)) : null;
      const nomeResp = (responsavel?.nome || solicitacao?.responsavel_nome || '-').toUpperCase();
      const grupoNome = responsavel?.grupo ? grupoById.get(String(responsavel.grupo))?.nome : '';
      return renderResponsavelBadge(nomeResp, grupoNome);
    }

    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    if (!emp) return '-';

    const nomeResp = (emp.resp_dp || '-').toUpperCase();
    return renderResponsavelBadge(nomeResp, emp.grupo || '');
  };

  const renderGrupo = (valorEmpresa) => {
    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    return emp?.grupo || '-';
  };

  const handleFilterChange = (campo) => (e) => {
    const val = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [campo]: val }));
  };

  // const limparFiltros = () =>
  //   setFilters({ empresa: '', responsavelId: '', grupoId: '', status: 'todos', prazo: 'todos' });
  const limparFiltros = () =>
    setFilters({
      empresa: '',
      responsavelId: '',
      grupoId: '',
      status: 'aberto',
      prazo: 'todos',
      servicoId: '',
      competencia: '',
      detalhes: '',
    });

  return (
    <div className="servicos-sol-container">
      {loading && (
        <div className="loading-overlay">
          <Loader2 size={36} className="spin" style={{ color: '#fff' }} />
        </div>
      )}
      <div className="servicos-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>To Do</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportar} title="Exportar CSV">
            Exportar
          </button>
          <button onClick={() => abrirModal()} title="Novo Serviço">
            <Plus size={18} /> Novo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="servicos-filtros">
        <div className="campo" style={{ minWidth: 220 }}>
          <label>Empresa (código ou razão)</label>
          <input
            type="text"
            value={filters.empresa}
            onChange={handleFilterChange('empresa')}
            placeholder="Ex.: 0123 ou ACME LTDA"
          />
        </div>

        <div className="campo" style={{ minWidth: 140 }}>
          <label>Responsável</label>
          <select
            value={filters.responsavelId}
            onChange={handleFilterChange('responsavelId')}
          >
            <option value="">Todos</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </div>

        <div className="campo" style={{ minWidth: 120 }}>
          <label>Grupo</label>
        <select
          value={filters.grupoId}
          onChange={handleFilterChange('grupoId')}
        >
          <option value="">Todos</option>
          {grupos
            .slice()
            .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
            .map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
        </select>
      </div>

      <div className="campo" style={{ minWidth: 200 }}>
        <label>Detalhes</label>
        <input
          type="text"
          value={filters.detalhes}
          onChange={handleFilterChange('detalhes')}
          placeholder="Texto livre nos detalhes"
        />
      </div>

        <div className="campo is-pequeno">
          <label>Status</label>
          <select value={filters.status} onChange={handleFilterChange('status')}>
            <option value="todos">Todos</option>
            <option value="aberto">Em aberto</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>

        <div className="campo is-pequeno">
          <label>Prazo</label>
          <select value={filters.prazo} onChange={handleFilterChange('prazo')}>
            <option value="todos">Todos</option>
            <option value="atrasados">Atrasados</option>
            <option value="no_prazo">No Prazo</option>
          </select>
        </div>

        <div className="campo is-pequeno" style={{ maxWidth: 10 }}>
          <label>Serviço</label>
          <select
            value={filters.servicoId}
            onChange={handleFilterChange('servicoId')}
          >
            <option value="">Todos</option>
            {servicos
              .slice()
              .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
              .map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
          </select>
        </div>

        <div className="campo is-pequeno" style={{ width: 10 }}>
          <label>Competência</label>
          <input
            type="text"
            value={filters.competencia}
            onChange={handleFilterChange('competencia')}
            placeholder="Ex.: 092025"
            maxLength={6}
          />
        </div>


        <div>
          <button type="button" onClick={limparFiltros} title="Limpar filtros">
            Limpar
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th className="sortable-header" onClick={() => alternarOrdenacao('empresa')}>
              Empresa {iconeOrdenacao('empresa')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('responsavel')}>
              Responsável {iconeOrdenacao('responsavel')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('servico_nome')}>
              Serviço {iconeOrdenacao('servico_nome')}
            </th>
            <th>Detalhes</th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('competencia')}>
              Competência {iconeOrdenacao('competencia')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('data_solicitacao')}>
              Solicitação {iconeOrdenacao('data_solicitacao')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('data_vencimento')}>
              Vencimento {iconeOrdenacao('data_vencimento')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('data_para_resposta')}>
              Data de Resposta {iconeOrdenacao('data_para_resposta')}
            </th>
            <th className="sortable-header" onClick={() => alternarOrdenacao('data_conclusao')}>
              Conclusão {iconeOrdenacao('data_conclusao')}
            </th>
            <th>Ações</th>
            <th>Materiais</th>
          </tr>
        </thead>
        <tbody>
          {(temFiltro ? solicitacoesPagina : solicitacoesOrdenadas).map((s) => (
            <tr key={s.id} className={s.data_conclusao ? 'linha-concluida' : ''}>
              <td>{renderEmpresa(s)}</td>
              <td>{renderResp(s)}</td>
              <td>{s.servico_nome}</td>
              <td>{renderDetalhes(s)}</td>
              <td>{s.competencia}</td>
              <td>{s.data_solicitacao}</td>
              {/* <td>{s.data_vencimento || '-'}</td> */}
              <td className="data-col">{s.data_vencimento || '-'}</td>
              <td
                className="data-col"
                style={{
                  backgroundColor: '#E6F0FA',
                  color:
                    s.data_para_resposta &&
                    !s.data_conclusao &&
                    new Date(s.data_para_resposta.split('-').reverse().join('-')) < new Date()
                      ? 'red'
                      : 'inherit',
                  fontWeight:
                    s.data_para_resposta &&
                    !s.data_conclusao &&
                    new Date(s.data_para_resposta.split('-').reverse().join('-')) < new Date()
                      ? 'bold'
                      : 'normal',
                }}
              >
                {s.data_para_resposta || '-'}
              </td>
              <td className="data-col">{s.data_conclusao || '-'}</td>
              <td className="acoes">
                <button onClick={() => abrirModal(s)} title="Editar">
                  <Pencil size={16} />
                </button>
                <button onClick={() => excluir(s.id)} title="Excluir">
                  <Trash2 size={16} />
                </button>
                 {!s.data_conclusao && (
                    <button onClick={() => concluir(s.id)} title="Concluir">
                      <CheckCircle size={16} />
                    </button>
                  )}
              </td>
              <td className="materiais">
                  {servicoById.get(String(s.servico))?.checklist && (
                    <a href={servicoById.get(String(s.servico)).checklist} target="_blank" rel="noopener noreferrer" title="Checklist">
                      <FileText size={16} />
                    </a>
                  )}
                  {servicoById.get(String(s.servico))?.instrucao_trabalho && (
                    <a href={servicoById.get(String(s.servico)).instrucao_trabalho} target="_blank" rel="noopener noreferrer" title="Instrução de Trabalho">
                      <FileText size={16} />
                    </a>
                  )}
                  {servicoById.get(String(s.servico))?.video_explicativo && (
                    <a href={servicoById.get(String(s.servico)).video_explicativo} target="_blank" rel="noopener noreferrer" title="Vídeo Explicativo">
                      <FileText size={16} />
                    </a>
                  )}
                  {servicoById.get(String(s.servico))?.topico_rapido && (
                    <a href={servicoById.get(String(s.servico)).topico_rapido} target="_blank" rel="noopener noreferrer" title="Tópico Rápido">
                      <FileText size={16} />
                    </a>
                  )}
                </td>
            </tr>
          ))}

          {solicitacoesFiltradas.length === 0 && (
            <tr>
              <td colSpan={11} style={{ textAlign: 'center', opacity: 0.7, padding: '8px 0' }}>
                Nenhum registro encontrado com os filtros atuais.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="paginacao-controles">
        <div className="paginacao-info">
          {totalRegistros > 0 ? (
            <>
              Mostrando{' '}
              <strong>
                {(paginaAtual - 1) * itensPorPagina + 1}-
                {Math.min(paginaAtual * itensPorPagina, totalRegistros)}
              </strong>{' '}
              de <strong>{totalRegistros}</strong>
            </>
          ) : (
            'Nenhum registro para exibir'
          )}
        </div>
        <div className="paginacao-botoes">
          <button
            type="button"
            onClick={() => irParaPagina(1)}
            disabled={paginaAtual === 1}
          >
            «
          </button>
          <button
            type="button"
            onClick={() => irParaPagina(paginaAtual - 1)}
            disabled={paginaAtual === 1}
          >
            ‹
          </button>
          <span>
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </span>
          <button
            type="button"
            onClick={() => irParaPagina(paginaAtual + 1)}
            disabled={paginaAtual === totalPaginas}
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => irParaPagina(totalPaginas)}
            disabled={paginaAtual === totalPaginas}
          >
            »
          </button>
        </div>
        <div className="paginacao-page-size">
          <label>Itens por página</label>
          <select value={itensPorPagina} onChange={handleItensPorPaginaChange}>
            {[10, 20, 30, 40, 50].map((qtd) => (
              <option key={qtd} value={qtd}>
                {qtd}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* detalhes do servico     */}
      {modalAberto && (
        <ServicoSolicitadoFormModal
          dados={solicitacaoSelecionada}
          fechar={fecharModal}
        />
      )}

      {/* modal de detalhes da empresa */}
      {empresaModalAberto && (
        <EmpresaFormModal
          visivel={empresaModalAberto}
          aoFechar={fecharEmpresaModal}
          aoSalvar={salvarEmpresaDetalhe}
          dados={empresaSelecionada}
        />
      )}
    </div>
  );
}

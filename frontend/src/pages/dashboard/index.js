import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import api from '../../api/axios';
import ServicoSolicitadoFormModal from '../servicosSolicitados/servicoSolicitadoFormModal';
import './Dashboard.css';

const ResumoServicosDetalhesModal = ({
  aberto,
  onClose,
  contexto,
  detalhes,
  carregando,
  erro,
  filtroResponsavel,
  setFiltroResponsavel,
  filtroServico,
  setFiltroServico,
  onAbrirSolicitacao,
  formatarData,
}) => {
  const collator = useMemo(
    () =>
      new Intl.Collator('pt-BR', {
        sensitivity: 'base',
        numeric: true,
        ignorePunctuation: true,
      }),
    []
  );

  const normalizar = (valor) => (valor ?? '').toString().trim();

  const responsaveisOpcoes = useMemo(() => {
    const valores = new Set();
    detalhes.forEach((item) => {
      valores.add(normalizar(item?.responsavel));
    });
    const lista = Array.from(valores);
    lista.sort(collator.compare);
    return ['todos', ...lista];
  }, [detalhes, collator]);

  const servicosOpcoes = useMemo(() => {
    const valores = new Set();
    detalhes.forEach((item) => {
      valores.add(normalizar(item?.servico));
    });
    const lista = Array.from(valores);
    lista.sort(collator.compare);
    return ['todos', ...lista];
  }, [detalhes, collator]);

  const detalhesFiltrados = useMemo(() => {
    return detalhes.filter((item) => {
      const responsavelAtual = normalizar(item?.responsavel);
      const servicoAtual = normalizar(item?.servico);
      const passaResponsavel =
        filtroResponsavel === 'todos' || responsavelAtual === filtroResponsavel;
      const passaServico = filtroServico === 'todos' || servicoAtual === filtroServico;
      return passaResponsavel && passaServico;
    });
  }, [detalhes, filtroResponsavel, filtroServico]);

  const contextoDescricao = useMemo(() => {
    if (!contexto) return '';
    const partes = [];
    if (contexto.tipo_label) {
      partes.push(contexto.tipo_label);
    }
    if (contexto.grupo) {
      partes.push(`Grupo: ${contexto.grupo}`);
    }
    if (contexto.responsavel) {
      partes.push(`Responsável: ${contexto.responsavel}`);
    }
    if (!contexto.grupo && !contexto.responsavel) {
      partes.push('Todos os grupos');
    }
    return partes.join(' • ');
  }, [contexto]);

  const periodoDescricao = useMemo(() => {
    if (!contexto?.periodo) return '';
    const { inicio, fim } = contexto.periodo;
    if (!inicio && !fim) return '';
    if (inicio && fim) {
      return `Período: ${formatarData(inicio)} a ${formatarData(fim)}`;
    }
    if (inicio) {
      return `Período a partir de ${formatarData(inicio)}`;
    }
    return `Período até ${formatarData(fim)}`;
  }, [contexto, formatarData]);

  const handleFechar = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRowClick = useCallback(
    (item) => {
      if (!item?.id || !onAbrirSolicitacao) {
        return;
      }
      onAbrirSolicitacao(item);
    },
    [onAbrirSolicitacao]
  );

  const handleRowKeyDown = useCallback(
    (event, item) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleRowClick(item);
      }
    },
    [handleRowClick]
  );

  useEffect(() => {
    if (filtroResponsavel !== 'todos' && !responsaveisOpcoes.includes(filtroResponsavel)) {
      setFiltroResponsavel('todos');
    }
  }, [filtroResponsavel, responsaveisOpcoes, setFiltroResponsavel]);

  useEffect(() => {
    if (filtroServico !== 'todos' && !servicosOpcoes.includes(filtroServico)) {
      setFiltroServico('todos');
    }
  }, [filtroServico, servicosOpcoes, setFiltroServico]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="dashboard-modal" role="dialog" aria-modal="true">
      <div className="dashboard-modal__content">
        <header className="dashboard-modal__header">
          <h3 className="dashboard-modal__title">Detalhes dos serviços</h3>
          <button type="button" className="dashboard-modal__close" onClick={handleFechar}>
            Fechar
          </button>
        </header>
        {contextoDescricao && <p className="dashboard-modal__context">{contextoDescricao}</p>}
        {periodoDescricao && (
          <p className="dashboard-modal__context dashboard-modal__context--muted">{periodoDescricao}</p>
        )}
        <div className="dashboard-modal__filters">
          <label className="dashboard-modal__filter" htmlFor="dashboard-modal-responsavel">
            <span>Responsável</span>
            <select
              id="dashboard-modal-responsavel"
              value={filtroResponsavel}
              onChange={(event) => setFiltroResponsavel(event.target.value)}
            >
              {responsaveisOpcoes.map((opcao) => (
                <option key={`modal-responsavel-${opcao || 'sem'}`} value={opcao}>
                  {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-modal__filter" htmlFor="dashboard-modal-servico">
            <span>Serviço</span>
            <select
              id="dashboard-modal-servico"
              value={filtroServico}
              onChange={(event) => setFiltroServico(event.target.value)}
            >
              {servicosOpcoes.map((opcao) => (
                <option key={`modal-servico-${opcao || 'sem'}`} value={opcao}>
                  {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                </option>
              ))}
            </select>
          </label>
        </div>

        {erro ? (
          <div className="dashboard-modal__alert">{erro}</div>
        ) : carregando ? (
          <div className="dashboard-modal__loading-inline">
            <Loader2 className="dashboard-modal__loading-icon" size={20} />
            <span>Carregando serviços...</span>
          </div>
        ) : detalhesFiltrados.length === 0 ? (
          <div className="dashboard-modal__empty">
            Nenhum serviço encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="dashboard-modal__table-wrapper">
            <table className="dashboard-table dashboard-modal__table">
              <thead>
                <tr>
                  <th scope="col">Responsável</th>
                  <th scope="col">Empresa</th>
                  <th scope="col">Serviço</th>
                  <th scope="col">Detalhe</th>
                  <th scope="col">Data resposta</th>
                </tr>
              </thead>
              <tbody>
                {detalhesFiltrados.map((item) => {
                  const chave = item.id ? `detalhe-${item.id}` : `detalhe-${item.empresa}-${item.servico}`;
                  const isClickable = Boolean(item?.id && onAbrirSolicitacao);
                  const linhaProps = isClickable
                    ? {
                        onClick: () => handleRowClick(item),
                        onKeyDown: (event) => handleRowKeyDown(event, item),
                        tabIndex: 0,
                        className: 'dashboard-table__row--clickable',
                      }
                    : {};

                  return (
                    <tr key={chave} {...linhaProps}>
                      <td>{item.responsavel || '—'}</td>
                      <td>{item.empresa || '—'}</td>
                      <td>{item.servico || '—'}</td>
                      <td>{item.detalhe || '—'}</td>
                      <td>{formatarData(item.data_resposta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const RESUMO_SERVICOS_COLUNAS = [
  { chave: 'fechados_periodo', titulo: 'Fechados no período' },
  { chave: 'vencer_7', titulo: 'Venc. em 7 dias' },
  { chave: 'vencer_15', titulo: 'Venc. em 15 dias' },
  { chave: 'vencer_30', titulo: 'Venc. em 30 dias' },
];

const toInputDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
};

const getDefaultStart = () => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getDefaultEnd = () => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('empresas');
  const [startDate, setStartDate] = useState(getDefaultStart);
  const [endDate, setEndDate] = useState(getDefaultEnd);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [erroEmpresas, setErroEmpresas] = useState('');
  const [dadosEmpresas, setDadosEmpresas] = useState(null);
  const [expandedGrupos, setExpandedGrupos] = useState(() => new Set());
  const [expandedClassificacao, setExpandedClassificacao] = useState(() => new Set());
  const [loadingServicos, setLoadingServicos] = useState(false);
  const [erroServicos, setErroServicos] = useState('');
  const [dadosServicos, setDadosServicos] = useState(null);
  const [expandedServicos, setExpandedServicos] = useState(() => new Set());
  const [expandedCardsServicos, setExpandedCardsServicos] = useState(() => new Set(['atrasados', 'vencem_hoje', 'resumo', 'afast_sem_pericia', 'afast_sem_retorno', 'afast_fup_pendente']));
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState('');
  const [dadosResumo, setDadosResumo] = useState(null);
  const [ordenacaoAtrasados, setOrdenacaoAtrasados] = useState({
    campo: 'responsavel',
    direcao: 'asc',
  });
  const [ordenacaoVencemHoje, setOrdenacaoVencemHoje] = useState({
    campo: 'responsavel',
    direcao: 'asc',
  });
  const [filtroResponsavelAtrasados, setFiltroResponsavelAtrasados] = useState('todos');
  const [filtroResponsavelVencemHoje, setFiltroResponsavelVencemHoje] = useState('todos');
  const [filtroServicoAtrasados, setFiltroServicoAtrasados] = useState('todos');
  const [filtroServicoVencemHoje, setFiltroServicoVencemHoje] = useState('todos');
  const [filtroGrupoAtrasados, setFiltroGrupoAtrasados] = useState('todos');
  const [filtroGrupoVencemHoje, setFiltroGrupoVencemHoje] = useState('todos');
  const [filtroGrupoAfastSemPericia, setFiltroGrupoAfastSemPericia] = useState('todos');
  const [filtroResponsavelAfastSemPericia, setFiltroResponsavelAfastSemPericia] = useState('todos');
  const [filtroServicoAfastSemPericia, setFiltroServicoAfastSemPericia] = useState('todos');
  const [filtroGrupoAfastSemRetorno, setFiltroGrupoAfastSemRetorno] = useState('todos');
  const [filtroResponsavelAfastSemRetorno, setFiltroResponsavelAfastSemRetorno] = useState('todos');
  const [filtroServicoAfastSemRetorno, setFiltroServicoAfastSemRetorno] = useState('todos');
  const [filtroGrupoAfastFupPendente, setFiltroGrupoAfastFupPendente] = useState('todos');
  const [filtroResponsavelAfastFupPendente, setFiltroResponsavelAfastFupPendente] = useState('todos');
  const [filtroServicoAfastFupPendente, setFiltroServicoAfastFupPendente] = useState('todos');
  const [modalServicoAberto, setModalServicoAberto] = useState(false);
  const [servicoSelecionadoDashboard, setServicoSelecionadoDashboard] = useState(null);
  const [carregandoDetalheServico, setCarregandoDetalheServico] = useState(false);
  const [reloadServicos, setReloadServicos] = useState(0);
  const [resumoModalAberto, setResumoModalAberto] = useState(false);
  const [resumoModalCarregando, setResumoModalCarregando] = useState(false);
  const [resumoModalErro, setResumoModalErro] = useState('');
  const [resumoModalContexto, setResumoModalContexto] = useState(null);
  const [resumoModalDados, setResumoModalDados] = useState([]);
  const [filtroResumoResponsavel, setFiltroResumoResponsavel] = useState('todos');
  const [filtroResumoServico, setFiltroResumoServico] = useState('todos');

  const periodoValido = useMemo(() => {
    if (!startDate || !endDate) return false;
    return startDate <= endDate;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!periodoValido) {
      setErroEmpresas('Selecione um período válido.');
      return;
    }

    let isMounted = true;
    const carregar = async () => {
      setLoadingEmpresas(true);
      setErroEmpresas('');
      try {
        const { data } = await api.get('/api/dashboard/empresas/', {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        });
        if (!isMounted) return;
        setDadosEmpresas(data);
      } catch (error) {
        if (!isMounted) return;
        console.error('Erro ao carregar indicadores de empresas:', error);
        setErroEmpresas('Não foi possível carregar os indicadores neste momento.');
      } finally {
        if (isMounted) {
          setLoadingEmpresas(false);
        }
      }
    };

    carregar();

    return () => {
      isMounted = false;
    };
  }, [periodoValido, startDate, endDate]);

  useEffect(() => {
    setExpandedGrupos(new Set());
  }, [dadosEmpresas?.tempos_por_grupo]);

useEffect(() => {
  setExpandedClassificacao(new Set());
}, [dadosEmpresas?.classificacao_por_grupo]);

useEffect(() => {
  setExpandedServicos(new Set());
}, [dadosServicos?.resumo_grupo]);

useEffect(() => {
  if (!periodoValido) {
    setErroServicos('Selecione um período válido.');
    setDadosServicos(null);
    setExpandedServicos(new Set());
    setLoadingServicos(false);
    return;
  }

  let isMounted = true;
  const carregar = async () => {
    setLoadingServicos(true);
    setErroServicos('');
    try {
      const { data } = await api.get('/api/dashboard/servicos/', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      if (!isMounted) return;
      setDadosServicos(data);
    } catch (error) {
      if (!isMounted) return;
      console.error('Erro ao carregar indicadores de serviços:', error);
      setErroServicos('Não foi possível carregar os indicadores de serviços.');
    } finally {
      if (isMounted) {
        setLoadingServicos(false);
      }
    }
  };

  carregar();

  return () => {
    isMounted = false;
  };
}, [periodoValido, startDate, endDate, reloadServicos]);

useEffect(() => {
  if (!periodoValido) {
    setErroResumo('Selecione um período válido.');
    setDadosResumo(null);
    setLoadingResumo(false);
    return;
  }

  let isMounted = true;
  const carregarResumo = async () => {
    setLoadingResumo(true);
    setErroResumo('');
    try {
      const { data } = await api.get('/api/dashboard/resumo/', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      if (!isMounted) return;
      setDadosResumo(data);
    } catch (error) {
      if (!isMounted) return;
      console.error('Erro ao carregar indicadores de resumo:', error);
      setErroResumo('Não foi possível carregar os indicadores de resumo.');
    } finally {
      if (isMounted) {
        setLoadingResumo(false);
      }
    }
  };

  carregarResumo();

  return () => {
    isMounted = false;
  };
}, [periodoValido, startDate, endDate]);

  const motivosSaida = dadosEmpresas?.motivos_saida ?? [];
  const movimentacao = dadosEmpresas?.movimentacao ?? { novas: 0, saidas: 0 };
  const temposPorGrupo = dadosEmpresas?.tempos_por_grupo ?? {};
  const tempoLinhas = Array.isArray(temposPorGrupo.linhas) ? temposPorGrupo.linhas : [];
  const tempoTotais = temposPorGrupo.totais || { tempo_estimado: '00:00', tempo_efetivo: '00:00' };
  const atrasadosServicos = dadosServicos?.atrasados ?? [];
  const vencemHojeServicos = dadosServicos?.vencem_hoje ?? [];
  const afastamentosDados = dadosServicos?.afastamentos ?? {};
  const afastamentosSemPericia = Array.isArray(afastamentosDados.sem_pericia)
    ? afastamentosDados.sem_pericia
    : [];
  const afastamentosSemRetorno = Array.isArray(afastamentosDados.sem_retorno)
    ? afastamentosDados.sem_retorno
    : [];
  const afastamentosFupPendente = Array.isArray(afastamentosDados.ultimo_fup_pendente)
    ? afastamentosDados.ultimo_fup_pendente
    : [];
  const resumoServicos = dadosServicos?.resumo_grupo ?? {};
  const resumoServicosLinhas = Array.isArray(resumoServicos.linhas) ? resumoServicos.linhas : [];
  const resumoServicosTotais = resumoServicos.totais || {
    fechados_periodo: 0,
    vencer_7: 0,
    vencer_15: 0,
    vencer_30: 0,
  };

  const resumoServicosColunas = RESUMO_SERVICOS_COLUNAS;

  const servicosColunasBase = useMemo(
    () => [
      { campo: 'responsavel', label: 'Responsável', tipo: 'string' },
      { campo: 'empresa', label: 'Empresa', tipo: 'string' },
      { campo: 'servico', label: 'Serviço', tipo: 'string' },
      { campo: 'detalhe', label: 'Detalhe', tipo: 'string' },
      { campo: 'data_resposta', label: 'Data resposta', tipo: 'date' },
    ],
    []
  );

  const servicosColunasAtrasados = useMemo(
    () => [...servicosColunasBase, { campo: 'dias_em_atraso', label: 'Dias em atraso', tipo: 'number' }],
    [servicosColunasBase]
  );

  const servicosColunasVencemHoje = useMemo(() => [...servicosColunasBase], [servicosColunasBase]);
  const afastamentoColunas = useMemo(
    () => [
      { campo: 'responsavel', label: 'Responsável', tipo: 'string' },
      { campo: 'empresa', label: 'Empresa', tipo: 'string' },
      { campo: 'servico', label: 'Serviço', tipo: 'string' },
      { campo: 'detalhe', label: 'Detalhe', tipo: 'string' },
      { campo: 'data_solicitacao', label: 'Data solicitação', tipo: 'date' },
    ],
    []
  );
  const fallbackOrdenacaoServicos = useMemo(() => ['responsavel', 'empresa', 'servico'], []);
  const collatorServicos = useMemo(
    () =>
      new Intl.Collator('pt-BR', {
        sensitivity: 'base',
        numeric: true,
        ignorePunctuation: true,
      }),
    []
  );

  const estaCardExpandido = (id) => expandedCardsServicos.has(id);
  const toggleCardServicos = (id) => {
    setExpandedCardsServicos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }
      return proximo;
    });
  };
  const normalizarTexto = (valor) => (valor ?? '').toString().trim();

  const criarOpcoesFiltro = useCallback(
    (lista, campo) => {
      const valores = new Set();
      lista.forEach((linha) => {
        valores.add(normalizarTexto(linha?.[campo]));
      });
      const opcoes = Array.from(valores);
      opcoes.sort(collatorServicos.compare);
      return ['todos', ...opcoes];
    },
    [collatorServicos]
  );

  const filtrarAfastamentos = useCallback((lista, filtros) => {
    return lista.filter((linha) => {
      const grupoAtual = normalizarTexto(linha?.grupo);
      const responsavelAtual = normalizarTexto(linha?.responsavel);
      const servicoAtual = normalizarTexto(linha?.servico);

      const passaGrupo = filtros.grupo === 'todos' || grupoAtual === filtros.grupo;
      const passaResponsavel = filtros.responsavel === 'todos' || responsavelAtual === filtros.responsavel;
      const passaServico = filtros.servico === 'todos' || servicoAtual === filtros.servico;

      return passaGrupo && passaResponsavel && passaServico;
    });
  }, []);

  const ordenarPorDataSolicitacao = useCallback((lista) => {
    return [...lista].sort((a, b) => {
      const dataA = a?.data_solicitacao ? Date.parse(a.data_solicitacao) : Number.NEGATIVE_INFINITY;
      const dataB = b?.data_solicitacao ? Date.parse(b.data_solicitacao) : Number.NEGATIVE_INFINITY;
      return dataB - dataA;
    });
  }, []);

  const obterDescricaoFup = useCallback((linha) => {
    if (!linha) return null;
    const status = (linha.ultimo_fup_status || '').toUpperCase();
    if (status === 'ATRASADO') {
      return `Último FUP: ${linha.ultimo_fup || '—'} (Atrasado)`;
    }
    if (status === 'NAO_INFORMADO') {
      return 'Último FUP: Não informado';
    }
    if (linha.ultimo_fup) {
      return `Último FUP: ${linha.ultimo_fup}`;
    }
    return null;
  }, []);

  const responsaveisAtrasadosOpcoes = useMemo(() => {
    const valores = new Set();
    atrasadosServicos.forEach((linha) => {
      valores.add(linha?.responsavel ?? '');
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [atrasadosServicos, collatorServicos]);

  const responsaveisVencemHojeOpcoes = useMemo(() => {
    const valores = new Set();
    vencemHojeServicos.forEach((linha) => {
      valores.add(linha?.responsavel ?? '');
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [vencemHojeServicos, collatorServicos]);

  const servicosAtrasadosOpcoes = useMemo(() => {
    const valores = new Set();
    atrasadosServicos.forEach((linha) => {
      valores.add(normalizarTexto(linha?.servico));
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [atrasadosServicos, collatorServicos]);

  const servicosVencemHojeOpcoes = useMemo(() => {
    const valores = new Set();
    vencemHojeServicos.forEach((linha) => {
      valores.add(normalizarTexto(linha?.servico));
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [vencemHojeServicos, collatorServicos]);

  const gruposAtrasadosOpcoes = useMemo(() => {
    const valores = new Set();
    atrasadosServicos.forEach((linha) => {
      valores.add(normalizarTexto(linha?.grupo));
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [atrasadosServicos, collatorServicos]);

  const gruposVencemHojeOpcoes = useMemo(() => {
    const valores = new Set();
    vencemHojeServicos.forEach((linha) => {
      valores.add(normalizarTexto(linha?.grupo));
    });
    const lista = Array.from(valores);
    lista.sort(collatorServicos.compare);
    return ['todos', ...lista];
  }, [vencemHojeServicos, collatorServicos]);

  const afastSemPericiaGrupoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemPericia, 'grupo'),
    [afastamentosSemPericia, criarOpcoesFiltro]
  );
  const afastSemPericiaResponsavelOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemPericia, 'responsavel'),
    [afastamentosSemPericia, criarOpcoesFiltro]
  );
  const afastSemPericiaServicoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemPericia, 'servico'),
    [afastamentosSemPericia, criarOpcoesFiltro]
  );

  const afastSemRetornoGrupoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemRetorno, 'grupo'),
    [afastamentosSemRetorno, criarOpcoesFiltro]
  );
  const afastSemRetornoResponsavelOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemRetorno, 'responsavel'),
    [afastamentosSemRetorno, criarOpcoesFiltro]
  );
  const afastSemRetornoServicoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosSemRetorno, 'servico'),
    [afastamentosSemRetorno, criarOpcoesFiltro]
  );

  const afastFupPendenteGrupoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosFupPendente, 'grupo'),
    [afastamentosFupPendente, criarOpcoesFiltro]
  );
  const afastFupPendenteResponsavelOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosFupPendente, 'responsavel'),
    [afastamentosFupPendente, criarOpcoesFiltro]
  );
  const afastFupPendenteServicoOpcoes = useMemo(
    () => criarOpcoesFiltro(afastamentosFupPendente, 'servico'),
    [afastamentosFupPendente, criarOpcoesFiltro]
  );

  const compararValoresServicos = (valorA, valorB, tipo) => {
    if (tipo === 'number') {
      const convertidoA = Number(valorA);
      const convertidoB = Number(valorB);
      const numeroA = Number.isFinite(convertidoA) ? convertidoA : 0;
      const numeroB = Number.isFinite(convertidoB) ? convertidoB : 0;
      if (numeroA === numeroB) return 0;
      return numeroA < numeroB ? -1 : 1;
    }

    if (tipo === 'date') {
      const timeA = valorA ? Date.parse(valorA) : Number.NaN;
      const timeB = valorB ? Date.parse(valorB) : Number.NaN;
      const normalizadoA = Number.isNaN(timeA) ? Number.NEGATIVE_INFINITY : timeA;
      const normalizadoB = Number.isNaN(timeB) ? Number.NEGATIVE_INFINITY : timeB;
      if (normalizadoA === normalizadoB) return 0;
      return normalizadoA < normalizadoB ? -1 : 1;
    }

    const textoA = (valorA ?? '').toString().trim();
    const textoB = (valorB ?? '').toString().trim();
    return collatorServicos.compare(textoA, textoB);
  };

  const ordenarServicosLista = (lista, ordenacao, colunas) => {
    if (!Array.isArray(lista) || lista.length === 0) {
      return [];
    }

    const colunasValidas = Array.isArray(colunas) && colunas.length > 0 ? colunas : servicosColunasBase;
    const { campo, direcao } = ordenacao;
    const direcaoMultiplicador = direcao === 'desc' ? -1 : 1;
    const colunaPrimaria = colunasValidas.find((coluna) => coluna.campo === campo) ?? colunasValidas[0];

    const obterValor = (item, chave) => {
      if (!item || typeof item !== 'object') return undefined;
      return item[chave];
    };

    const listaOrdenada = [...lista];

    listaOrdenada.sort((itemA, itemB) => {
      const comparacaoPrimaria = compararValoresServicos(
        obterValor(itemA, campo),
        obterValor(itemB, campo),
        colunaPrimaria.tipo
      );

      if (comparacaoPrimaria !== 0) {
        return comparacaoPrimaria * direcaoMultiplicador;
      }

      for (const fallbackCampo of fallbackOrdenacaoServicos) {
        if (fallbackCampo === campo) continue;
        const colunaFallback = colunasValidas.find((coluna) => coluna.campo === fallbackCampo);
        if (!colunaFallback) {
          continue;
        }
        const comparacaoFallback = compararValoresServicos(
          obterValor(itemA, fallbackCampo),
          obterValor(itemB, fallbackCampo),
          colunaFallback.tipo
        );
        if (comparacaoFallback !== 0) {
          return comparacaoFallback;
        }
      }

      return 0;
    });

    return listaOrdenada;
  };

  const atrasadosServicosFiltrados = useMemo(() => {
    return atrasadosServicos.filter((linha) => {
      const responsavelAtual = linha?.responsavel ?? '';
      const servicoAtual = normalizarTexto(linha?.servico);
      const grupoAtual = normalizarTexto(linha?.grupo);
      const passaResponsavel =
        filtroResponsavelAtrasados === 'todos' || responsavelAtual === filtroResponsavelAtrasados;
      const passaServico = filtroServicoAtrasados === 'todos' || servicoAtual === filtroServicoAtrasados;
      const passaGrupo = filtroGrupoAtrasados === 'todos' || grupoAtual === filtroGrupoAtrasados;
      return passaResponsavel && passaServico && passaGrupo;
    });
  }, [atrasadosServicos, filtroResponsavelAtrasados, filtroServicoAtrasados, filtroGrupoAtrasados]);

  const vencemHojeServicosFiltrados = useMemo(() => {
    return vencemHojeServicos.filter((linha) => {
      const responsavelAtual = linha?.responsavel ?? '';
      const servicoAtual = normalizarTexto(linha?.servico);
      const grupoAtual = normalizarTexto(linha?.grupo);
      const passaResponsavel =
        filtroResponsavelVencemHoje === 'todos' || responsavelAtual === filtroResponsavelVencemHoje;
      const passaServico = filtroServicoVencemHoje === 'todos' || servicoAtual === filtroServicoVencemHoje;
      const passaGrupo = filtroGrupoVencemHoje === 'todos' || grupoAtual === filtroGrupoVencemHoje;
      return passaResponsavel && passaServico && passaGrupo;
    });
  }, [vencemHojeServicos, filtroResponsavelVencemHoje, filtroServicoVencemHoje, filtroGrupoVencemHoje]);

  const atrasadosServicosOrdenados = useMemo(
    () => ordenarServicosLista(atrasadosServicosFiltrados, ordenacaoAtrasados, servicosColunasAtrasados),
    [atrasadosServicosFiltrados, ordenacaoAtrasados, servicosColunasAtrasados]
  );

  const vencemHojeServicosOrdenados = useMemo(
    () => ordenarServicosLista(vencemHojeServicosFiltrados, ordenacaoVencemHoje, servicosColunasVencemHoje),
    [vencemHojeServicosFiltrados, ordenacaoVencemHoje, servicosColunasVencemHoje]
  );

  const afastSemPericiaFiltrados = useMemo(
    () =>
      filtrarAfastamentos(afastamentosSemPericia, {
        grupo: filtroGrupoAfastSemPericia,
        responsavel: filtroResponsavelAfastSemPericia,
        servico: filtroServicoAfastSemPericia,
      }),
    [afastamentosSemPericia, filtrarAfastamentos, filtroGrupoAfastSemPericia, filtroResponsavelAfastSemPericia, filtroServicoAfastSemPericia]
  );

  const afastSemRetornoFiltrados = useMemo(
    () =>
      filtrarAfastamentos(afastamentosSemRetorno, {
        grupo: filtroGrupoAfastSemRetorno,
        responsavel: filtroResponsavelAfastSemRetorno,
        servico: filtroServicoAfastSemRetorno,
      }),
    [afastamentosSemRetorno, filtrarAfastamentos, filtroGrupoAfastSemRetorno, filtroResponsavelAfastSemRetorno, filtroServicoAfastSemRetorno]
  );

  const afastFupPendenteFiltrados = useMemo(
    () =>
      filtrarAfastamentos(afastamentosFupPendente, {
        grupo: filtroGrupoAfastFupPendente,
        responsavel: filtroResponsavelAfastFupPendente,
        servico: filtroServicoAfastFupPendente,
      }),
    [afastamentosFupPendente, filtrarAfastamentos, filtroGrupoAfastFupPendente, filtroResponsavelAfastFupPendente, filtroServicoAfastFupPendente]
  );

  const afastSemPericiaOrdenados = useMemo(
    () => ordenarPorDataSolicitacao(afastSemPericiaFiltrados),
    [ordenarPorDataSolicitacao, afastSemPericiaFiltrados]
  );

  const afastSemRetornoOrdenados = useMemo(
    () => ordenarPorDataSolicitacao(afastSemRetornoFiltrados),
    [ordenarPorDataSolicitacao, afastSemRetornoFiltrados]
  );

  const afastFupPendenteOrdenados = useMemo(
    () => ordenarPorDataSolicitacao(afastFupPendenteFiltrados),
    [ordenarPorDataSolicitacao, afastFupPendenteFiltrados]
  );

  const atualizarOrdenacaoServicos = (campo, tabela) => {
    const atualizarEstado =
      tabela === 'vencem_hoje' ? setOrdenacaoVencemHoje : setOrdenacaoAtrasados;

    atualizarEstado((anterior) => {
      if (anterior.campo === campo) {
        return {
          campo,
          direcao: anterior.direcao === 'asc' ? 'desc' : 'asc',
        };
      }
      return { campo, direcao: 'asc' };
    });
  };

  useEffect(() => {
    if (
      filtroResponsavelAtrasados !== 'todos' &&
      !responsaveisAtrasadosOpcoes.includes(filtroResponsavelAtrasados)
    ) {
      setFiltroResponsavelAtrasados('todos');
    }
  }, [filtroResponsavelAtrasados, responsaveisAtrasadosOpcoes]);

  useEffect(() => {
    if (
      filtroResponsavelVencemHoje !== 'todos' &&
      !responsaveisVencemHojeOpcoes.includes(filtroResponsavelVencemHoje)
    ) {
      setFiltroResponsavelVencemHoje('todos');
    }
  }, [filtroResponsavelVencemHoje, responsaveisVencemHojeOpcoes]);

  useEffect(() => {
    if (filtroServicoAtrasados !== 'todos' && !servicosAtrasadosOpcoes.includes(filtroServicoAtrasados)) {
      setFiltroServicoAtrasados('todos');
    }
  }, [filtroServicoAtrasados, servicosAtrasadosOpcoes]);

  useEffect(() => {
    if (filtroServicoVencemHoje !== 'todos' && !servicosVencemHojeOpcoes.includes(filtroServicoVencemHoje)) {
      setFiltroServicoVencemHoje('todos');
    }
  }, [filtroServicoVencemHoje, servicosVencemHojeOpcoes]);

  useEffect(() => {
    if (filtroGrupoAtrasados !== 'todos' && !gruposAtrasadosOpcoes.includes(filtroGrupoAtrasados)) {
      setFiltroGrupoAtrasados('todos');
    }
  }, [filtroGrupoAtrasados, gruposAtrasadosOpcoes]);

  useEffect(() => {
    if (filtroGrupoVencemHoje !== 'todos' && !gruposVencemHojeOpcoes.includes(filtroGrupoVencemHoje)) {
      setFiltroGrupoVencemHoje('todos');
    }
  }, [filtroGrupoVencemHoje, gruposVencemHojeOpcoes]);

  useEffect(() => {
    if (filtroGrupoAfastSemPericia !== 'todos' && !afastSemPericiaGrupoOpcoes.includes(filtroGrupoAfastSemPericia)) {
      setFiltroGrupoAfastSemPericia('todos');
    }
  }, [filtroGrupoAfastSemPericia, afastSemPericiaGrupoOpcoes]);

  useEffect(() => {
    if (
      filtroResponsavelAfastSemPericia !== 'todos' &&
      !afastSemPericiaResponsavelOpcoes.includes(filtroResponsavelAfastSemPericia)
    ) {
      setFiltroResponsavelAfastSemPericia('todos');
    }
  }, [filtroResponsavelAfastSemPericia, afastSemPericiaResponsavelOpcoes]);

  useEffect(() => {
    if (filtroServicoAfastSemPericia !== 'todos' && !afastSemPericiaServicoOpcoes.includes(filtroServicoAfastSemPericia)) {
      setFiltroServicoAfastSemPericia('todos');
    }
  }, [filtroServicoAfastSemPericia, afastSemPericiaServicoOpcoes]);

  useEffect(() => {
    if (filtroGrupoAfastSemRetorno !== 'todos' && !afastSemRetornoGrupoOpcoes.includes(filtroGrupoAfastSemRetorno)) {
      setFiltroGrupoAfastSemRetorno('todos');
    }
  }, [filtroGrupoAfastSemRetorno, afastSemRetornoGrupoOpcoes]);

  useEffect(() => {
    if (
      filtroResponsavelAfastSemRetorno !== 'todos' &&
      !afastSemRetornoResponsavelOpcoes.includes(filtroResponsavelAfastSemRetorno)
    ) {
      setFiltroResponsavelAfastSemRetorno('todos');
    }
  }, [filtroResponsavelAfastSemRetorno, afastSemRetornoResponsavelOpcoes]);

  useEffect(() => {
    if (filtroServicoAfastSemRetorno !== 'todos' && !afastSemRetornoServicoOpcoes.includes(filtroServicoAfastSemRetorno)) {
      setFiltroServicoAfastSemRetorno('todos');
    }
  }, [filtroServicoAfastSemRetorno, afastSemRetornoServicoOpcoes]);

  useEffect(() => {
    if (
      filtroGrupoAfastFupPendente !== 'todos' &&
      !afastFupPendenteGrupoOpcoes.includes(filtroGrupoAfastFupPendente)
    ) {
      setFiltroGrupoAfastFupPendente('todos');
    }
  }, [filtroGrupoAfastFupPendente, afastFupPendenteGrupoOpcoes]);

  useEffect(() => {
    if (
      filtroResponsavelAfastFupPendente !== 'todos' &&
      !afastFupPendenteResponsavelOpcoes.includes(filtroResponsavelAfastFupPendente)
    ) {
      setFiltroResponsavelAfastFupPendente('todos');
    }
  }, [filtroResponsavelAfastFupPendente, afastFupPendenteResponsavelOpcoes]);

  useEffect(() => {
    if (
      filtroServicoAfastFupPendente !== 'todos' &&
      !afastFupPendenteServicoOpcoes.includes(filtroServicoAfastFupPendente)
    ) {
      setFiltroServicoAfastFupPendente('todos');
    }
  }, [filtroServicoAfastFupPendente, afastFupPendenteServicoOpcoes]);

  const abrirSolicitacaoServico = useCallback(
    async (linha) => {
      if (!linha?.id || carregandoDetalheServico) {
        return;
      }
      setCarregandoDetalheServico(true);
      setServicoSelecionadoDashboard(null);
      try {
        const { data } = await api.get(`/api/solicitacoes/${linha.id}/`);
        setServicoSelecionadoDashboard(data);
        setModalServicoAberto(true);
      } catch (error) {
        console.error('Erro ao carregar a solicitação selecionada:', error);
        window.alert('Não foi possível abrir a solicitação selecionada. Tente novamente.');
      } finally {
        setCarregandoDetalheServico(false);
      }
    },
    [carregandoDetalheServico]
  );

  const fecharSolicitacaoServico = useCallback(() => {
    setModalServicoAberto(false);
    setServicoSelecionadoDashboard(null);
    setReloadServicos((prev) => prev + 1);
  }, []);

  const abrirResumoDetalhes = useCallback(
    async ({ tipo, grupo, responsavel }) => {
      if (!tipo) {
        return;
      }

      setResumoModalAberto(true);
      setResumoModalCarregando(true);
      setResumoModalErro('');
      setResumoModalDados([]);
      setFiltroResumoResponsavel('todos');
      setFiltroResumoServico('todos');
      setResumoModalContexto({
        tipo,
        grupo: grupo || null,
        responsavel: responsavel || null,
      });

      try {
        const params = {
          detalhes_tipo: tipo,
        };
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }
        if (grupo) {
          params.grupo = grupo;
        }
        if (responsavel) {
          params.responsavel = responsavel;
        }

        const { data } = await api.get('/api/dashboard/servicos/', {
          params,
        });

        setResumoModalDados(Array.isArray(data?.detalhes) ? data.detalhes : []);
        if (data?.contexto) {
          setResumoModalContexto((prev) => ({
            ...(prev || {}),
            ...data.contexto,
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar serviços do resumo:', error);
        setResumoModalErro('Não foi possível carregar os serviços deste indicador.');
      } finally {
        setResumoModalCarregando(false);
      }
    },
    [startDate, endDate]
  );

  const fecharResumoDetalhes = useCallback(() => {
    setResumoModalAberto(false);
    setResumoModalDados([]);
    setResumoModalErro('');
    setResumoModalContexto(null);
    setFiltroResumoResponsavel('todos');
    setFiltroResumoServico('todos');
  }, []);

  const classificacaoColunasPadrao = ['bronze', 'prata', 'ouro', 'diamante', 'nao_classificadas'];
  const classificacaoColunas =
    Array.isArray(dadosEmpresas?.classificacao_colunas) && dadosEmpresas.classificacao_colunas.length
      ? dadosEmpresas.classificacao_colunas.filter((col) => classificacaoColunasPadrao.includes(col))
      : classificacaoColunasPadrao;

  const classificacaoLabels = {
    bronze: 'Bronze',
    prata: 'Prata',
    ouro: 'Ouro',
    diamante: 'Diamante',
    nao_classificadas: 'Não classificadas',
  };

  const formatQuantidade = useMemo(
    () => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }),
    []
  );
  const formatMoeda = useMemo(
    () => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }),
    []
  );
  const formatTempo = (valor) => {
    if (valor === null || valor === undefined) return '00:00';
    const texto = String(valor).trim();
    if (!texto) return '00:00';
    if (/^\d+$/.test(texto)) {
      const numero = Number(texto);
      const horas = Math.floor(numero / 60);
      const minutos = numero % 60;
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }
    if (texto.includes(':')) {
      const partes = texto.split(':');
      const horas = (partes[0] ?? '0').padStart(2, '0');
      const minutos = (partes[1] ?? '0').padStart(2, '0');
      return `${horas}:${minutos}`;
    }
    return texto;
  };

  const renderResumoCelula = (valorBruto, tipo, grupo, responsavel) => {
    const numero = Number(valorBruto);
    const quantidade = Number.isFinite(numero) ? numero : 0;
    const chaveResponsavel = responsavel || null;
    if (quantidade <= 0) {
      return formatQuantidade.format(quantidade);
    }

    return (
      <button
        type="button"
        className="dashboard-table__cell-button"
        onClick={() => abrirResumoDetalhes({ tipo, grupo: grupo || null, responsavel: chaveResponsavel })}
      >
        {formatQuantidade.format(quantidade)}
      </button>
    );
  };
  const toggleGrupo = (grupo) => {
    if (!grupo) return;
    setExpandedGrupos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(grupo)) {
        proximo.delete(grupo);
      } else {
        proximo.add(grupo);
      }
      return proximo;
    });
  };

  const toggleServicosGrupo = (grupo) => {
    if (!grupo) return;
    setExpandedServicos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(grupo)) {
        proximo.delete(grupo);
      } else {
        proximo.add(grupo);
      }
      return proximo;
    });
  };

  const toggleClassificacao = (grupo) => {
    if (!grupo) return;
    setExpandedClassificacao((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(grupo)) {
        proximo.delete(grupo);
      } else {
        proximo.add(grupo);
      }
      return proximo;
    });
  };

  const parseQuantidade = (valor) => {
    if (valor && typeof valor === 'object' && 'qtd' in valor) {
      return parseQuantidade(valor.qtd);
    }
    if (valor === null || valor === undefined || valor === '') return 0;
    const texto = String(valor).trim();
    if (!texto) return 0;
    const normalizado = texto.replace(/\./g, '').replace(',', '.');
    const numero = Number(normalizado);
    if (Number.isFinite(numero)) {
      return Math.round(numero);
    }
    return 0;
  };

  const parseHonorarios = (valor) => {
    if (valor && typeof valor === 'object' && 'honorarios' in valor) {
      return parseHonorarios(valor.honorarios);
    }
    if (valor === null || valor === undefined || valor === '') return 0;
    let bruto = valor;
    if (typeof bruto === 'string') {
      bruto = bruto.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    }
    const numero = Number(bruto);
    if (!Number.isFinite(numero)) return 0;
    return numero / 100;
  };

  const linhasClassificacao = useMemo(() => {
    const linhas = Array.isArray(dadosEmpresas?.classificacao_por_grupo)
      ? dadosEmpresas.classificacao_por_grupo
      : [];

    return linhas.map((linha) => {
      const grupoLabel = String(linha?.grupo || 'Sem Grupo').toUpperCase();
      const registro = {
        grupo: grupoLabel,
      };

      const colab = Number(linha?.colab ?? 0);
      registro.colab = Number.isFinite(colab) ? colab : 0;

      let totalQtd = 0;
      let totalHonor = 0;

            classificacaoColunas.forEach((col) => {
              const dadosColuna = {
                qtd: parseQuantidade(linha?.[col]),
                honorarios: parseHonorarios(linha?.[col]),
              };
        registro[col] = dadosColuna;
        totalQtd += dadosColuna.qtd;
        totalHonor += dadosColuna.honorarios;
      });

      registro.total = {
        qtd: totalQtd,
        honorarios: totalHonor,
      };

      const responsaveisLinha = Array.isArray(linha?.responsaveis)
        ? linha.responsaveis
        : [];

      registro.responsaveis = responsaveisLinha.map((resp) => {
        const label = String(resp?.responsavel || 'Sem Responsável').toUpperCase();
        const infoColunas = {};
        let totalQtdResp = 0;
        let totalHonorResp = 0;
        classificacaoColunas.forEach((col) => {
          const dados = {
            qtd: parseQuantidade(resp?.[col]),
            honorarios: parseHonorarios(resp?.[col]),
          };
          infoColunas[col] = dados;
          totalQtdResp += dados.qtd;
          totalHonorResp += dados.honorarios;
        });
        return {
          responsavel: label,
          colunas: infoColunas,
          total: {
            qtd: totalQtdResp,
            honorarios: totalHonorResp,
          },
        };
      });

      return registro;
    });
  }, [dadosEmpresas, classificacaoColunas]);

  const classificacaoTotais = useMemo(() => {
    const totais = classificacaoColunas.reduce((acc, col) => {
      acc[col] = { qtd: 0, honorarios: 0 };
      return acc;
    }, {});
    totais.total = { qtd: 0, honorarios: 0 };

    linhasClassificacao.forEach((linha) => {
      classificacaoColunas.forEach((col) => {
        const dadosColuna = linha[col] || { qtd: 0, honorarios: 0 };
        totais[col].qtd += dadosColuna.qtd;
        totais[col].honorarios += dadosColuna.honorarios;
      });

      totais.total.qtd += linha.total.qtd;
      totais.total.honorarios += linha.total.honorarios;
    });

    return totais;
  }, [linhasClassificacao, classificacaoColunas]);

  const formatHonorarios = (valor) => formatMoeda.format(valor ?? 0);
  const formatData = (valor) => {
    if (!valor) return '—';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleDateString('pt-BR');
  };
  const parseDecimal = (valor) => (valor == null ? 0 : Number(valor));

  const resumoQuadro01 = useMemo(() => {
    const dados = dadosResumo?.quadro_01 || {};
    return {
      multas: {
        total: parseDecimal(dados?.multas?.total),
        meta: parseDecimal(dados?.multas?.meta),
      },
      avulsos: {
        total: parseDecimal(dados?.avulsos?.total),
        meta: parseDecimal(dados?.avulsos?.meta),
      },
    };
  }, [dadosResumo]);

  const totalColspan = classificacaoColunas.length * 2 + 4;

  const movimentacaoDetalhada = useMemo(() => {
    const linhasBrutas = Array.isArray(dadosEmpresas?.movimentacao_detalhada?.linhas)
      ? dadosEmpresas.movimentacao_detalhada.linhas
      : [];

    const linhas = linhasBrutas
      .map((linha) => ({
        grupo: String(linha?.grupo || 'Sem Grupo').toUpperCase(),
        responsavel: String(linha?.responsavel || 'Sem Responsável').toUpperCase(),
        entrada: {
          qtd: parseQuantidade(linha?.entrada?.qtd),
          honorarios: parseHonorarios(linha?.entrada?.honorarios),
        },
        saida: {
          qtd: parseQuantidade(linha?.saida?.qtd),
          honorarios: parseHonorarios(linha?.saida?.honorarios),
        },
      }))
      .sort((a, b) => {
        const grupoCmp = a.grupo.localeCompare(b.grupo, 'pt', { sensitivity: 'base' });
        if (grupoCmp !== 0) return grupoCmp;
        return a.responsavel.localeCompare(b.responsavel, 'pt', { sensitivity: 'base' });
      });

    const totaisEntrada = {
      qtd: linhas.reduce((acc, item) => acc + (item.entrada.qtd ?? 0), 0),
      honorarios: linhas.reduce((acc, item) => acc + (item.entrada.honorarios ?? 0), 0),
    };
    const totaisSaida = {
      qtd: linhas.reduce((acc, item) => acc + (item.saida.qtd ?? 0), 0),
      honorarios: linhas.reduce((acc, item) => acc + (item.saida.honorarios ?? 0), 0),
    };

    const totaisInformados = dadosEmpresas?.movimentacao_detalhada?.totais;
    if (totaisInformados) {
      totaisEntrada.qtd = parseQuantidade(totaisInformados.entrada?.qtd);
      totaisEntrada.honorarios = parseHonorarios(totaisInformados.entrada?.honorarios);
      totaisSaida.qtd = parseQuantidade(totaisInformados.saida?.qtd);
      totaisSaida.honorarios = parseHonorarios(totaisInformados.saida?.honorarios);
    }

    return {
      linhas,
      totais: {
        entrada: totaisEntrada,
        saida: totaisSaida,
      },
    };
  }, [dadosEmpresas]);
  const totalColab = Number.isFinite(Number(dadosEmpresas?.colaboradores_total))
    ? Number(dadosEmpresas.colaboradores_total)
    : linhasClassificacao.reduce((acc, linha) => acc + (linha.colab ?? 0), 0);

  const movimentacaoLinhas = movimentacaoDetalhada.linhas;
  const movimentacaoTotais = movimentacaoDetalhada.totais;

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-page__subtitle">
            Acompanhe os principais indicadores das empresas atendidas.
          </p>
        </div>
        <div className="dashboard-page__filters">
          <label>
            <span>De</span>
            <input
              type="date"
              value={startDate}
              onChange={(evt) => setStartDate(evt.target.value)}
            />
          </label>
          <span className="dashboard-page__separator">até</span>
          <label>
            <span>Até</span>
            <input
              type="date"
              value={endDate}
              onChange={(evt) => setEndDate(evt.target.value)}
            />
          </label>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tabs__item ${activeTab === 'empresas' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('empresas')}
        >
          Empresas
        </button>
        <button
          type="button"
          className={`dashboard-tabs__item ${activeTab === 'servicos' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('servicos')}
        >
          Serviços
        </button>
        <button
          type="button"
          className={`dashboard-tabs__item ${activeTab === 'resumo' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('resumo')}
        >
          Resumo
        </button>
      </nav>

      {activeTab === 'empresas' ? (
        <section className="dashboard-section">
          {!periodoValido && (
            <div className="dashboard-page__alert">
              Selecione um período válido para consultar os indicadores.
            </div>
          )}

          {erroEmpresas && periodoValido && (
            <div className="dashboard-page__alert dashboard-page__alert--error">
              {erroEmpresas}
            </div>
          )}

          <div className="dashboard-grid">
            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <h2>Empresas ativas x classificação</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <div className="dashboard-card__table-wrapper">
                <table className="dashboard-table">
                  <colgroup>
                    <col className="dashboard-table__col-grupo" />
                    <col className="dashboard-table__col-colab" />
                    {classificacaoColunas.map((col) => (
                      <Fragment key={`colgroup-${col}`}>
                        <col className="dashboard-table__col-qtd" />
                        <col className="dashboard-table__col-valor" />
                      </Fragment>
                    ))}
                    <col className="dashboard-table__col-qtd" />
                    <col className="dashboard-table__col-valor" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" rowSpan={2}>Grupo</th>
                      <th scope="col" rowSpan={2} className="dashboard-table__colab">Colab</th>
                      {classificacaoColunas.map((col) => (
                        <th key={col} scope="col" colSpan={2}>
                          {classificacaoLabels[col] ?? col}
                        </th>
                      ))}
                      <th scope="col" colSpan={2}>Total</th>
                    </tr>
                    <tr>
                      {classificacaoColunas.map((col) => (
                        <Fragment key={`${col}-sub`}>
                          <th scope="col" className="dashboard-table__qtd">Qtd</th>
                          <th scope="col" className="dashboard-table__valor">Honorários</th>
                        </Fragment>
                      ))}
                      <th scope="col" className="dashboard-table__qtd">Qtd</th>
                      <th scope="col" className="dashboard-table__valor">Honorários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasClassificacao.length === 0 ? (
                      <tr>
                        <td
                          colSpan={totalColspan}
                          className="dashboard-table__empty"
                        >
                          Nenhuma empresa ativa no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {linhasClassificacao.map((linha) => {
                          const grupoLabel = linha.grupo || 'SEM GRUPO';
                          const responsaveis = Array.isArray(linha.responsaveis) ? linha.responsaveis : [];
                          const hasChildren = responsaveis.length > 0;
                          const isExpanded = expandedClassificacao.has(grupoLabel);
                          return (
                            <Fragment key={`class-${grupoLabel}`}>
                              <tr>
                                <th scope="row" className="dashboard-classificacao__cell--label">
                                  <span className="dashboard-classificacao__label">
                                    {hasChildren ? (
                                      <button
                                        type="button"
                                        className="dashboard-tempo__toggle"
                                        onClick={() => toggleClassificacao(grupoLabel)}
                                        aria-label={isExpanded ? 'Recolher responsáveis' : 'Expandir responsáveis'}
                                      >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                    ) : (
                                      <span className="dashboard-tempo__no-toggle" />
                                    )}
                                    {grupoLabel}
                                  </span>
                                </th>
                                <td className="dashboard-table__colab">
                                  {formatQuantidade.format(linha.colab ?? 0)}
                                </td>
                                {classificacaoColunas.map((col) => (
                                  <Fragment key={`${grupoLabel}-${col}`}>
                                    <td className="dashboard-table__qtd">
                                      {formatQuantidade.format(linha[col]?.qtd ?? 0)}
                                    </td>
                                    <td className="dashboard-table__valor">
                                      {formatHonorarios(linha[col]?.honorarios ?? 0)}
                                    </td>
                                  </Fragment>
                                ))}
                                <td className="dashboard-table__qtd">
                                  {formatQuantidade.format(linha.total.qtd)}
                                </td>
                                <td className="dashboard-table__valor">
                                  {formatHonorarios(linha.total.honorarios)}
                                </td>
                              </tr>
                              {hasChildren && isExpanded && responsaveis.map((resp) => {
                                const respLabel = resp.responsavel || 'SEM RESPONSÁVEL';
                                return (
                                  <tr key={`class-${grupoLabel}-${respLabel}`}>
                                    <td className="dashboard-tempo__cell--child dashboard-classificacao__cell--child">
                                      {respLabel}
                                    </td>
                                    <td className="dashboard-table__colab dashboard-classificacao__colab-child">
                                      —
                                    </td>
                                    {classificacaoColunas.map((col) => (
                                      <Fragment key={`resp-${grupoLabel}-${respLabel}-${col}`}>
                                        <td className="dashboard-table__qtd">
                                          {formatQuantidade.format(resp.colunas[col]?.qtd ?? 0)}
                                        </td>
                                        <td className="dashboard-table__valor">
                                          {formatHonorarios(resp.colunas[col]?.honorarios ?? 0)}
                                        </td>
                                      </Fragment>
                                    ))}
                                    <td className="dashboard-table__qtd">
                                      {formatQuantidade.format(resp.total?.qtd ?? 0)}
                                    </td>
                                    <td className="dashboard-table__valor">
                                      {formatHonorarios(resp.total?.honorarios ?? 0)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                        <tr className="dashboard-table__total-row">
                          <th scope="row">TOTAIS</th>
                          <td className="dashboard-table__colab">
                            {formatQuantidade.format(totalColab)}
                          </td>
                          {classificacaoColunas.map((col) => (
                            <Fragment key={`total-${col}`}>
                              <td className="dashboard-table__qtd">
                                {formatQuantidade.format(classificacaoTotais[col]?.qtd ?? 0)}
                              </td>
                              <td className="dashboard-table__valor">
                                {formatHonorarios(classificacaoTotais[col]?.honorarios ?? 0)}
                              </td>
                            </Fragment>
                          ))}
                          <td className="dashboard-table__qtd">
                            {formatQuantidade.format(classificacaoTotais.total?.qtd ?? 0)}
                          </td>
                          <td className="dashboard-table__valor">
                            {formatHonorarios(classificacaoTotais.total?.honorarios ?? 0)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )
              )}
              )}
              )
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <h2>Tempo por grupo e responsável</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <div className="dashboard-card__table-wrapper">
                <table className="dashboard-table dashboard-table--tempo">
                  <thead>
                    <tr>
                      <th scope="col">Grupo / Responsável</th>
                      <th scope="col">Tempo estimado</th>
                      <th scope="col">Tempo efetivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempoLinhas.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="dashboard-table__empty">
                          Nenhuma empresa ativa com tempos registrados no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {tempoLinhas.map((linha) => {
                          const responsaveis = Array.isArray(linha.responsaveis) ? linha.responsaveis : [];
                          const hasChildren = responsaveis.length > 0;
                          const grupoLabel = linha.grupo || 'SEM GRUPO';
                          const isExpanded = expandedGrupos.has(grupoLabel);
                          return (
                            <Fragment key={`tempo-${grupoLabel}`}>
                              <tr>
                                <th scope="row" className="dashboard-tempo__cell--label">
                                  <span className="dashboard-tempo__label">
                                    {hasChildren ? (
                                      <button
                                        type="button"
                                        className="dashboard-tempo__toggle"
                                        onClick={() => toggleGrupo(grupoLabel)}
                                        aria-label={isExpanded ? 'Recolher responsáveis' : 'Expandir responsáveis'}
                                      >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                      </button>
                                    ) : (
                                      <span className="dashboard-tempo__no-toggle" />
                                    )}
                                    {grupoLabel}
                                  </span>
                                </th>
                                <td>{formatTempo(linha.tempo_estimado)}</td>
                                <td>{formatTempo(linha.tempo_efetivo)}</td>
                              </tr>
                              {hasChildren && isExpanded && responsaveis.map((resp) => {
                                const responsavelLabel = resp.responsavel || 'SEM RESPONSÁVEL';
                                return (
                                  <tr key={`tempo-${grupoLabel}-${responsavelLabel}`}>
                                    <td className="dashboard-tempo__cell--child">
                                      {responsavelLabel}
                                    </td>
                                    <td>{formatTempo(resp.tempo_estimado)}</td>
                                    <td>{formatTempo(resp.tempo_efetivo)}</td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                        <tr className="dashboard-table__total-row">
                          <th scope="row" className="dashboard-tempo__cell--label">TOTAL</th>
                          <td>{formatTempo(tempoTotais.tempo_estimado)}</td>
                          <td>{formatTempo(tempoTotais.tempo_efetivo)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </article>


            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <h2>Movimentação por responsável</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <div className="dashboard-card__table-wrapper">
                <table className="dashboard-table dashboard-table--mov">
                  <colgroup>
                    <col className="dashboard-table__col-grupo" />
                    <col className="dashboard-table__col-resp" />
                    <col className="dashboard-table__col-qtd" />
                    <col className="dashboard-table__col-valor" />
                    <col className="dashboard-table__col-qtd" />
                    <col className="dashboard-table__col-valor" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" rowSpan={2}>Grupo</th>
                      <th scope="col" rowSpan={2}>Responsável</th>
                      <th scope="col" colSpan={2}>Entrada</th>
                      <th scope="col" colSpan={2}>Saída</th>
                    </tr>
                    <tr>
                      <th scope="col" className="dashboard-table__qtd">Qtd</th>
                      <th scope="col" className="dashboard-table__valor">Honorários</th>
                      <th scope="col" className="dashboard-table__qtd">Qtd</th>
                      <th scope="col" className="dashboard-table__valor">Honorários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacaoLinhas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="dashboard-table__empty">
                          Nenhuma movimentação registrada no período selecionado.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {movimentacaoLinhas.map((linha) => (
                          <tr key={`${linha.grupo}-${linha.responsavel}`}>
                            <th scope="row">{linha.grupo}</th>
                            <td className="dashboard-table__col-resp">{linha.responsavel}</td>
                            <td className="dashboard-table__qtd">
                              {formatQuantidade.format(linha.entrada.qtd)}
                            </td>
                            <td className="dashboard-table__valor">
                              {formatHonorarios(linha.entrada.honorarios)}
                            </td>
                            <td className="dashboard-table__qtd">
                              {formatQuantidade.format(linha.saida.qtd)}
                            </td>
                            <td className="dashboard-table__valor">
                              {formatHonorarios(linha.saida.honorarios)}
                            </td>
                          </tr>
                        ))}
                        <tr className="dashboard-table__total-row">
                          <th scope="row">TOTAIS</th>
                          <td className="dashboard-table__col-resp">—</td>
                          <td className="dashboard-table__qtd">
                            {formatQuantidade.format(movimentacaoTotais.entrada.qtd)}
                          </td>
                          <td className="dashboard-table__valor">
                            {formatHonorarios(movimentacaoTotais.entrada.honorarios)}
                          </td>
                          <td className="dashboard-table__qtd">
                            {formatQuantidade.format(movimentacaoTotais.saida.qtd)}
                          </td>
                          <td className="dashboard-table__valor">
                            {formatHonorarios(movimentacaoTotais.saida.honorarios)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="dashboard-card">
              <header className="dashboard-card__header">
                <h2>Movimentação de empresas</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <ul className="dashboard-card__list">
                <li>
                  <span>Novas no período</span>
                  <strong>{movimentacao.novas ?? 0}</strong>
                </li>
                <li>
                  <span>Saíram no período</span>
                  <strong>{movimentacao.saidas ?? 0}</strong>
                </li>
              </ul>
            </article>

            <article className="dashboard-card">
              <header className="dashboard-card__header">
                <h2>Motivos de saída</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              {motivosSaida.length === 0 ? (
                <p className="dashboard-card__empty">
                  Nenhuma empresa saiu no período selecionado.
                </p>
              ) : (
                <ul className="dashboard-card__list dashboard-card__list--columns">
                  {motivosSaida.map((item) => (
                    <li key={item.motivo || 'nao-informado'}>
                      <span>{item.motivo || 'Não informado'}</span>
                      <strong>{item.quantidade ?? 0}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>
      ) : activeTab === 'servicos' ? (
        <section className="dashboard-section">
          {!periodoValido && (
            <div className="dashboard-page__alert">
              Selecione um período válido para consultar os indicadores.
            </div>
          )}

          {erroServicos && periodoValido && (
            <div className="dashboard-page__alert dashboard-page__alert--error">
              {erroServicos}
            </div>
          )}

          <div className="dashboard-grid">
            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Serviços atrasados</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('atrasados')}
                    aria-label={estaCardExpandido('atrasados') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('atrasados') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="dashboard-card__filters">
                    <label className="dashboard-card__filter" htmlFor="filtro-grupo-atrasados">
                      <span>Grupo</span>
                      <select
                        id="filtro-grupo-atrasados"
                        className="dashboard-card__select"
                        value={filtroGrupoAtrasados}
                        onChange={(event) => setFiltroGrupoAtrasados(event.target.value)}
                      >
                        {gruposAtrasadosOpcoes.map((opcao) => (
                          <option
                            key={`filtro-atrasados-grupo-${opcao === '' ? 'sem-grupo' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="filtro-responsavel-atrasados">
                      <span>Responsável</span>
                      <select
                        id="filtro-responsavel-atrasados"
                        className="dashboard-card__select"
                        value={filtroResponsavelAtrasados}
                        onChange={(event) => setFiltroResponsavelAtrasados(event.target.value)}
                      >
                        {responsaveisAtrasadosOpcoes.map((opcao) => (
                          <option
                            key={`filtro-atrasados-${opcao === '' ? 'sem-responsavel' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="filtro-servico-atrasados">
                      <span>Serviço</span>
                      <select
                        id="filtro-servico-atrasados"
                        className="dashboard-card__select"
                        value={filtroServicoAtrasados}
                        onChange={(event) => setFiltroServicoAtrasados(event.target.value)}
                      >
                        {servicosAtrasadosOpcoes.map((opcao) => (
                          <option
                            key={`filtro-atrasados-servico-${opcao === '' ? 'sem-servico' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
              {estaCardExpandido('atrasados') && (
                <div className="dashboard-card__table-wrapper dashboard-card__table-wrapper--fixed">
                  <table className="dashboard-table dashboard-table--servicos-list">
                    <colgroup>
                      <col className="dashboard-table__col-resp" />
                      <col className="dashboard-table__col-empresa" />
                      <col className="dashboard-table__col-servico" />
                      <col className="dashboard-table__col-detalhe" />
                      <col className="dashboard-table__col-data" />
                      <col className="dashboard-table__col-qtd" />
                    </colgroup>
                    <thead>
                      <tr>
                        {servicosColunasAtrasados.map((coluna) => {
                          const estaOrdenando = ordenacaoAtrasados.campo === coluna.campo;
                          const indicador = estaOrdenando
                            ? ordenacaoAtrasados.direcao === 'asc'
                              ? '▲'
                              : '▼'
                            : null;
                          return (
                            <th scope="col" key={`atrasados-${coluna.campo}`}>
                              <button
                                type="button"
                                className="dashboard-table__sort-button"
                                onClick={() => atualizarOrdenacaoServicos(coluna.campo, 'atrasados')}
                              >
                                <span>{coluna.label}</span>
                                {indicador && (
                                  <span className="dashboard-table__sort-indicator">{indicador}</span>
                                )}
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {atrasadosServicosOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={servicosColunasAtrasados.length} className="dashboard-table__empty">
                            Nenhum serviço em atraso encontrado para o período.
                          </td>
                        </tr>
                      ) : (
                        atrasadosServicosOrdenados.map((linha, index) => {
                          const rowKey =
                            linha?.id != null
                              ? `atrasados-${linha.id}`
                              : `atraso-${linha.responsavel}-${linha.empresa}-${index}`;
                          const isClickable = linha?.id != null;
                          const rowProps = isClickable
                            ? {
                                onClick: () => abrirSolicitacaoServico(linha),
                                onKeyDown: (event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    abrirSolicitacaoServico(linha);
                                  }
                                },
                                tabIndex: 0,
                                className: 'dashboard-table__row--clickable',
                              }
                            : {};
                          return (
                            <tr key={rowKey} {...rowProps}>
                              <td className="dashboard-table__col-resp">{linha.responsavel}</td>
                              <td className="dashboard-table__col-empresa">{linha.empresa}</td>
                              <td className="dashboard-table__col-servico">{linha.servico || '—'}</td>
                              <td className="dashboard-table__col-detalhe">{linha.detalhe || '—'}</td>
                              <td className="dashboard-table__col-data">{formatData(linha.data_resposta)}</td>
                              <td className="dashboard-table__qtd">
                                {formatQuantidade.format(linha.dias_em_atraso ?? 0)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Serviços que vencem hoje</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('vencem_hoje')}
                    aria-label={estaCardExpandido('vencem_hoje') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('vencem_hoje') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="dashboard-card__filters">
                    <label className="dashboard-card__filter" htmlFor="filtro-grupo-vencem-hoje">
                      <span>Grupo</span>
                      <select
                        id="filtro-grupo-vencem-hoje"
                        className="dashboard-card__select"
                        value={filtroGrupoVencemHoje}
                        onChange={(event) => setFiltroGrupoVencemHoje(event.target.value)}
                      >
                        {gruposVencemHojeOpcoes.map((opcao) => (
                          <option
                            key={`filtro-vencem-grupo-${opcao === '' ? 'sem-grupo' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="filtro-responsavel-vencem-hoje">
                      <span>Responsável</span>
                      <select
                        id="filtro-responsavel-vencem-hoje"
                        className="dashboard-card__select"
                        value={filtroResponsavelVencemHoje}
                        onChange={(event) => setFiltroResponsavelVencemHoje(event.target.value)}
                      >
                        {responsaveisVencemHojeOpcoes.map((opcao) => (
                          <option
                            key={`filtro-vencem-hoje-${opcao === '' ? 'sem-responsavel' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="filtro-servico-vencem-hoje">
                      <span>Serviço</span>
                      <select
                        id="filtro-servico-vencem-hoje"
                        className="dashboard-card__select"
                        value={filtroServicoVencemHoje}
                        onChange={(event) => setFiltroServicoVencemHoje(event.target.value)}
                      >
                        {servicosVencemHojeOpcoes.map((opcao) => (
                          <option
                            key={`filtro-vencem-hoje-servico-${opcao === '' ? 'sem-servico' : opcao}`}
                            value={opcao}
                          >
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
{estaCardExpandido('vencem_hoje') && (
                <div className="dashboard-card__table-wrapper dashboard-card__table-wrapper--fixed">
                  <table className="dashboard-table dashboard-table--servicos-list">
                    <colgroup>
                      <col className="dashboard-table__col-resp" />
                      <col className="dashboard-table__col-empresa" />
                      <col className="dashboard-table__col-servico" />
                      <col className="dashboard-table__col-detalhe" />
                      <col className="dashboard-table__col-data" />
                    </colgroup>
                    <thead>
                      <tr>
                        {servicosColunasVencemHoje.map((coluna) => {
                          const estaOrdenando = ordenacaoVencemHoje.campo === coluna.campo;
                          const indicador = estaOrdenando
                            ? ordenacaoVencemHoje.direcao === 'asc'
                              ? '▲'
                              : '▼'
                            : null;
                          return (
                            <th scope="col" key={`vencem-${coluna.campo}`}>
                              <button
                                type="button"
                                className="dashboard-table__sort-button"
                                onClick={() => atualizarOrdenacaoServicos(coluna.campo, 'vencem_hoje')}
                              >
                                <span>{coluna.label}</span>
                                {indicador && (
                                  <span className="dashboard-table__sort-indicator">{indicador}</span>
                                )}
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {vencemHojeServicosOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={servicosColunasVencemHoje.length} className="dashboard-table__empty">
                            Nenhum serviço com vencimento hoje.
                          </td>
                        </tr>
                      ) : (
                        vencemHojeServicosOrdenados.map((linha, index) => {
                          const rowKey =
                            linha?.id != null
                              ? `vencem-${linha.id}`
                              : `vencem-${linha.responsavel}-${linha.empresa}-${index}`;
                          const isClickable = linha?.id != null;
                          const rowProps = isClickable
                            ? {
                                onClick: () => abrirSolicitacaoServico(linha),
                                onKeyDown: (event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    abrirSolicitacaoServico(linha);
                                  }
                                },
                                tabIndex: 0,
                                className: 'dashboard-table__row--clickable',
                              }
                            : {};
                          return (
                            <tr key={rowKey} {...rowProps}>
                              <td className="dashboard-table__col-resp">{linha.responsavel}</td>
                              <td className="dashboard-table__col-empresa">{linha.empresa}</td>
                              <td className="dashboard-table__col-servico">{linha.servico || '—'}</td>
                              <td className="dashboard-table__col-detalhe">{linha.detalhe || '—'}</td>
                              <td className="dashboard-table__col-data">{formatData(linha.data_resposta)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Resumo de serviços por grupo</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('resumo')}
                    aria-label={estaCardExpandido('resumo') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('resumo') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
              {estaCardExpandido('resumo') && (
                <div className="dashboard-card__table-wrapper">
                  <table className="dashboard-table dashboard-table--servicos-resumo">
                    <thead>
                      <tr>
                        <th scope="col">Grupo / Responsável</th>
                        {resumoServicosColunas.map((coluna) => (
                          <th scope="col" key={`resumo-head-${coluna.chave}`}>
                            {coluna.titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resumoServicosLinhas.length === 0 ? (
                        <tr>
                          <td colSpan={resumoServicosColunas.length + 1} className="dashboard-table__empty">
                            Nenhum serviço encontrado para os critérios selecionados.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {resumoServicosLinhas.map((linha) => {
                            const grupoLabel = linha.grupo || 'SEM GRUPO';
                            const responsaveis = Array.isArray(linha.responsaveis) ? linha.responsaveis : [];
                            const hasChildren = responsaveis.length > 0;
                            const isExpanded = expandedServicos.has(grupoLabel);
                            return (
                              <Fragment key={`resumo-serv-${grupoLabel}`}>
                                <tr>
                                  <th scope="row" className="dashboard-tempo__cell--label">
                                    <span className="dashboard-tempo__label">
                                      {hasChildren ? (
                                        <button
                                          type="button"
                                          className="dashboard-tempo__toggle"
                                          onClick={() => toggleServicosGrupo(grupoLabel)}
                                          aria-label={isExpanded ? 'Recolher responsáveis' : 'Expandir responsáveis'}
                                        >
                                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                      ) : (
                                        <span className="dashboard-tempo__no-toggle" />
                                      )}
                                      {grupoLabel}
                                    </span>
                                  </th>
                                  {resumoServicosColunas.map((coluna) => (
                                    <td key={`resumo-${grupoLabel}-${coluna.chave}`}>
                                      {renderResumoCelula(
                                        linha[coluna.chave] ?? 0,
                                        coluna.chave,
                                        grupoLabel,
                                        null
                                      )}
                                    </td>
                                  ))}
                                </tr>
                                {hasChildren && isExpanded && responsaveis.map((resp) => {
                                  const respLabel = resp.responsavel || 'SEM RESPONSÁVEL';
                                  return (
                                    <tr key={`resumo-serv-${grupoLabel}-${respLabel}`}>
                                      <td className="dashboard-tempo__cell--child">
                                        {respLabel}
                                      </td>
                                      {resumoServicosColunas.map((coluna) => (
                                        <td key={`resumo-${grupoLabel}-${respLabel}-${coluna.chave}`}>
                                          {renderResumoCelula(
                                            resp[coluna.chave] ?? 0,
                                            coluna.chave,
                                            grupoLabel,
                                            respLabel
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </Fragment>
                            );
                          })}
                          <tr className="dashboard-table__total-row">
                            <th scope="row" className="dashboard-tempo__cell--label">TOTAL</th>
                            {resumoServicosColunas.map((coluna) => (
                              <td key={`resumo-total-${coluna.chave}`}>
                                {renderResumoCelula(
                                  resumoServicosTotais[coluna.chave] ?? 0,
                                  coluna.chave,
                                  null,
                                  null
                                )}
                              </td>
                            ))}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Afastamentos sem data de perícia</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('afast_sem_pericia')}
                    aria-label={estaCardExpandido('afast_sem_pericia') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('afast_sem_pericia') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="dashboard-card__filters">
                    <label className="dashboard-card__filter" htmlFor="afast-sem-pericia-grupo">
                      <span>Grupo</span>
                      <select
                        id="afast-sem-pericia-grupo"
                        className="dashboard-card__select"
                        value={filtroGrupoAfastSemPericia}
                        onChange={(event) => setFiltroGrupoAfastSemPericia(event.target.value)}
                      >
                        {afastSemPericiaGrupoOpcoes.map((opcao) => (
                          <option key={`afast-sem-pericia-grupo-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-sem-pericia-responsavel">
                      <span>Responsável</span>
                      <select
                        id="afast-sem-pericia-responsavel"
                        className="dashboard-card__select"
                        value={filtroResponsavelAfastSemPericia}
                        onChange={(event) => setFiltroResponsavelAfastSemPericia(event.target.value)}
                      >
                        {afastSemPericiaResponsavelOpcoes.map((opcao) => (
                          <option key={`afast-sem-pericia-responsavel-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-sem-pericia-servico">
                      <span>Serviço</span>
                      <select
                        id="afast-sem-pericia-servico"
                        className="dashboard-card__select"
                        value={filtroServicoAfastSemPericia}
                        onChange={(event) => setFiltroServicoAfastSemPericia(event.target.value)}
                      >
                        {afastSemPericiaServicoOpcoes.map((opcao) => (
                          <option key={`afast-sem-pericia-servico-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
              {estaCardExpandido('afast_sem_pericia') && (
                <div className="dashboard-card__table-wrapper dashboard-card__table-wrapper--fixed">
                  <table className="dashboard-table dashboard-table--servicos-list">
                    <thead>
                      <tr>
                        {afastamentoColunas.map((coluna) => (
                          <th scope="col" key={`afast-sem-pericia-${coluna.campo}`}>
                            {coluna.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {afastSemPericiaOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={afastamentoColunas.length} className="dashboard-table__empty">
                            Nenhum afastamento encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        afastSemPericiaOrdenados.map((linha) => {
                          const chave = linha.id
                            ? `afast-sem-pericia-${linha.id}`
                            : `${linha.responsavel}-${linha.empresa}`;
                          const fupDescricao = obterDescricaoFup(linha);
                          return (
                            <tr
                              key={chave}
                              className={linha.id ? 'dashboard-table__row--clickable' : undefined}
                              onClick={() => linha.id && abrirSolicitacaoServico(linha)}
                              onKeyDown={(event) => {
                                if (!linha.id) return;
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  abrirSolicitacaoServico(linha);
                                }
                              }}
                              tabIndex={linha.id ? 0 : undefined}
                            >
                              <td>{linha.responsavel || '—'}</td>
                              <td>{linha.empresa || '—'}</td>
                              <td>{linha.servico || '—'}</td>
                              <td>
                                {linha.detalhe || '—'}
                                {fupDescricao && (
                                  <div className="dashboard-table__subinfo">{fupDescricao}</div>
                                )}
                              </td>
                              <td>{formatData(linha.data_solicitacao)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Afastamentos sem data de retorno</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('afast_sem_retorno')}
                    aria-label={estaCardExpandido('afast_sem_retorno') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('afast_sem_retorno') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="dashboard-card__filters">
                    <label className="dashboard-card__filter" htmlFor="afast-sem-retorno-grupo">
                      <span>Grupo</span>
                      <select
                        id="afast-sem-retorno-grupo"
                        className="dashboard-card__select"
                        value={filtroGrupoAfastSemRetorno}
                        onChange={(event) => setFiltroGrupoAfastSemRetorno(event.target.value)}
                      >
                        {afastSemRetornoGrupoOpcoes.map((opcao) => (
                          <option key={`afast-sem-retorno-grupo-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-sem-retorno-responsavel">
                      <span>Responsável</span>
                      <select
                        id="afast-sem-retorno-responsavel"
                        className="dashboard-card__select"
                        value={filtroResponsavelAfastSemRetorno}
                        onChange={(event) => setFiltroResponsavelAfastSemRetorno(event.target.value)}
                      >
                        {afastSemRetornoResponsavelOpcoes.map((opcao) => (
                          <option key={`afast-sem-retorno-responsavel-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-sem-retorno-servico">
                      <span>Serviço</span>
                      <select
                        id="afast-sem-retorno-servico"
                        className="dashboard-card__select"
                        value={filtroServicoAfastSemRetorno}
                        onChange={(event) => setFiltroServicoAfastSemRetorno(event.target.value)}
                      >
                        {afastSemRetornoServicoOpcoes.map((opcao) => (
                          <option key={`afast-sem-retorno-servico-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
              {estaCardExpandido('afast_sem_retorno') && (
                <div className="dashboard-card__table-wrapper dashboard-card__table-wrapper--fixed">
                  <table className="dashboard-table dashboard-table--servicos-list">
                    <thead>
                      <tr>
                        {afastamentoColunas.map((coluna) => (
                          <th scope="col" key={`afast-sem-retorno-${coluna.campo}`}>
                            {coluna.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {afastSemRetornoOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={afastamentoColunas.length} className="dashboard-table__empty">
                            Nenhum afastamento encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        afastSemRetornoOrdenados.map((linha) => {
                          const chave = linha.id
                            ? `afast-sem-retorno-${linha.id}`
                            : `${linha.responsavel}-${linha.empresa}`;
                          const fupDescricao = obterDescricaoFup(linha);
                          return (
                            <tr
                              key={chave}
                              className={linha.id ? 'dashboard-table__row--clickable' : undefined}
                              onClick={() => linha.id && abrirSolicitacaoServico(linha)}
                              onKeyDown={(event) => {
                                if (!linha.id) return;
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  abrirSolicitacaoServico(linha);
                                }
                              }}
                              tabIndex={linha.id ? 0 : undefined}
                            >
                              <td>{linha.responsavel || '—'}</td>
                              <td>{linha.empresa || '—'}</td>
                              <td>{linha.servico || '—'}</td>
                              <td>
                                {linha.detalhe || '—'}
                                {fupDescricao && (
                                  <div className="dashboard-table__subinfo">{fupDescricao}</div>
                                )}
                              </td>
                              <td>{formatData(linha.data_solicitacao)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Afastamentos com Último FUP não informado ou atrasado</h2>
                </div>
                <div className="dashboard-card__actions">
                  <button
                    type="button"
                    className="dashboard-tempo__toggle"
                    onClick={() => toggleCardServicos('afast_fup_pendente')}
                    aria-label={estaCardExpandido('afast_fup_pendente') ? 'Recolher quadro' : 'Expandir quadro'}
                  >
                    {estaCardExpandido('afast_fup_pendente') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="dashboard-card__filters">
                    <label className="dashboard-card__filter" htmlFor="afast-fup-pendente-grupo">
                      <span>Grupo</span>
                      <select
                        id="afast-fup-pendente-grupo"
                        className="dashboard-card__select"
                        value={filtroGrupoAfastFupPendente}
                        onChange={(event) => setFiltroGrupoAfastFupPendente(event.target.value)}
                      >
                        {afastFupPendenteGrupoOpcoes.map((opcao) => (
                          <option key={`afast-fup-pendente-grupo-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-fup-pendente-responsavel">
                      <span>Responsável</span>
                      <select
                        id="afast-fup-pendente-responsavel"
                        className="dashboard-card__select"
                        value={filtroResponsavelAfastFupPendente}
                        onChange={(event) => setFiltroResponsavelAfastFupPendente(event.target.value)}
                      >
                        {afastFupPendenteResponsavelOpcoes.map((opcao) => (
                          <option key={`afast-fup-pendente-responsavel-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="dashboard-card__filter" htmlFor="afast-fup-pendente-servico">
                      <span>Serviço</span>
                      <select
                        id="afast-fup-pendente-servico"
                        className="dashboard-card__select"
                        value={filtroServicoAfastFupPendente}
                        onChange={(event) => setFiltroServicoAfastFupPendente(event.target.value)}
                      >
                        {afastFupPendenteServicoOpcoes.map((opcao) => (
                          <option key={`afast-fup-pendente-servico-${opcao || 'sem'}`} value={opcao}>
                            {opcao === 'todos' ? 'Todos' : opcao || 'Não informado'}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
                </div>
              </header>
              {estaCardExpandido('afast_fup_pendente') && (
                <div className="dashboard-card__table-wrapper dashboard-card__table-wrapper--fixed">
                  <table className="dashboard-table dashboard-table--servicos-list">
                    <thead>
                      <tr>
                        {afastamentoColunas.map((coluna) => (
                          <th scope="col" key={`afast-fup-pendente-${coluna.campo}`}>
                            {coluna.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {afastFupPendenteOrdenados.length === 0 ? (
                        <tr>
                          <td colSpan={afastamentoColunas.length} className="dashboard-table__empty">
                            Nenhum afastamento encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        afastFupPendenteOrdenados.map((linha) => {
                          const chave = linha.id
                            ? `afast-fup-pendente-${linha.id}`
                            : `${linha.responsavel}-${linha.empresa}`;
                          const fupDescricao = obterDescricaoFup(linha);
                          return (
                            <tr
                              key={chave}
                              className={linha.id ? 'dashboard-table__row--clickable' : undefined}
                              onClick={() => linha.id && abrirSolicitacaoServico(linha)}
                              onKeyDown={(event) => {
                                if (!linha.id) return;
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  abrirSolicitacaoServico(linha);
                                }
                              }}
                              tabIndex={linha.id ? 0 : undefined}
                            >
                              <td>{linha.responsavel || '—'}</td>
                              <td>{linha.empresa || '—'}</td>
                              <td>{linha.servico || '—'}</td>
                              <td>
                                {linha.detalhe || '—'}
                                {fupDescricao && (
                                  <div className="dashboard-table__subinfo">{fupDescricao}</div>
                                )}
                              </td>
                              <td>{formatData(linha.data_solicitacao)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>
        </section>
      ) : (
        <section className="dashboard-section">
          {!periodoValido && (
            <div className="dashboard-page__alert">
              Selecione um período válido para consultar os indicadores.
            </div>
          )}

          {erroResumo && periodoValido && (
            <div className="dashboard-page__alert dashboard-page__alert--error">
              {erroResumo}
            </div>
          )}

          <div className="dashboard-grid">
            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <h2>Quadro 01 • Multas e Avulsos</h2>
                {loadingResumo && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <div className="dashboard-summary__intro">
                <p>
                  Totais financeiros comparados às metas proporcionais do período selecionado.
                </p>
              </div>
              <div className="dashboard-summary__table-wrapper">
                <table className="dashboard-summary-table">
                  <thead>
                    <tr>
                      <th scope="col" aria-label="Indicador" />
                      <th scope="col">Multas</th>
                      <th scope="col">Avulsos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Total</th>
                      <td>{formatMoeda.format(resumoQuadro01.multas.total)}</td>
                      <td>{formatMoeda.format(resumoQuadro01.avulsos.total)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Meta</th>
                      <td>{formatMoeda.format(resumoQuadro01.multas.meta)}</td>
                      <td>{formatMoeda.format(resumoQuadro01.avulsos.meta)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        </section>
      )}
      {modalServicoAberto && servicoSelecionadoDashboard && (
        <ServicoSolicitadoFormModal
          dados={servicoSelecionadoDashboard}
          fechar={fecharSolicitacaoServico}
        />
      )}
      <ResumoServicosDetalhesModal
        aberto={resumoModalAberto}
        onClose={fecharResumoDetalhes}
        contexto={resumoModalContexto}
        detalhes={resumoModalDados}
        carregando={resumoModalCarregando}
        erro={resumoModalErro}
        filtroResponsavel={filtroResumoResponsavel}
        setFiltroResponsavel={setFiltroResumoResponsavel}
        filtroServico={filtroResumoServico}
        setFiltroServico={setFiltroResumoServico}
        onAbrirSolicitacao={abrirSolicitacaoServico}
        formatarData={formatData}
      />
      {carregandoDetalheServico && (
        <div className="dashboard-modal__loading" role="status" aria-live="polite">
          <div className="dashboard-modal__loading-content">
            <Loader2 className="dashboard-modal__loading-icon" size={24} />
            <span>Carregando solicitação...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

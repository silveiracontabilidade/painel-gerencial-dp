import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import ServicoSolicitadoFormModal from '../servicosSolicitados/servicoSolicitadoFormModal';
import './Dashboard.css';

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
  const [modalServicoAberto, setModalServicoAberto] = useState(false);
  const [servicoSelecionadoDashboard, setServicoSelecionadoDashboard] = useState(null);
  const [carregandoDetalheServico, setCarregandoDetalheServico] = useState(false);
  const [reloadServicos, setReloadServicos] = useState(0);

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

  const motivosSaida = dadosEmpresas?.motivos_saida ?? [];
  const movimentacao = dadosEmpresas?.movimentacao ?? { novas: 0, saidas: 0 };
  const temposPorGrupo = dadosEmpresas?.tempos_por_grupo ?? {};
  const tempoLinhas = Array.isArray(temposPorGrupo.linhas) ? temposPorGrupo.linhas : [];
  const tempoTotais = temposPorGrupo.totais || { tempo_estimado: '00:00', tempo_efetivo: '00:00' };
  const atrasadosServicos = dadosServicos?.atrasados ?? [];
  const vencemHojeServicos = dadosServicos?.vencem_hoje ?? [];
  const resumoServicos = dadosServicos?.resumo_grupo ?? {};
  const resumoServicosLinhas = Array.isArray(resumoServicos.linhas) ? resumoServicos.linhas : [];
  const resumoServicosTotais = resumoServicos.totais || {
    fechados_periodo: 0,
    vencer_7: 0,
    vencer_15: 0,
    vencer_30: 0,
  };

  const servicosColunas = useMemo(
    () => [
      { campo: 'responsavel', label: 'Responsável', tipo: 'string' },
      { campo: 'empresa', label: 'Empresa', tipo: 'string' },
      { campo: 'servico', label: 'Serviço', tipo: 'string' },
      { campo: 'detalhe', label: 'Detalhe', tipo: 'string' },
      { campo: 'data_resposta', label: 'Data resposta', tipo: 'date' },
      { campo: 'dias_em_atraso', label: 'Dias em atraso', tipo: 'number' },
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

  const ordenarServicosLista = (lista, ordenacao) => {
    if (!Array.isArray(lista) || lista.length === 0) {
      return [];
    }

    const { campo, direcao } = ordenacao;
    const direcaoMultiplicador = direcao === 'desc' ? -1 : 1;
    const colunaPrimaria = servicosColunas.find((coluna) => coluna.campo === campo) ?? servicosColunas[0];

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
        const colunaFallback =
          servicosColunas.find((coluna) => coluna.campo === fallbackCampo) ?? colunaPrimaria;
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
    if (filtroResponsavelAtrasados === 'todos') {
      return atrasadosServicos;
    }
    return atrasadosServicos.filter((linha) => (linha?.responsavel ?? '') === filtroResponsavelAtrasados);
  }, [atrasadosServicos, filtroResponsavelAtrasados]);

  const vencemHojeServicosFiltrados = useMemo(() => {
    if (filtroResponsavelVencemHoje === 'todos') {
      return vencemHojeServicos;
    }
    return vencemHojeServicos.filter((linha) => (linha?.responsavel ?? '') === filtroResponsavelVencemHoje);
  }, [vencemHojeServicos, filtroResponsavelVencemHoje]);

  const atrasadosServicosOrdenados = useMemo(
    () => ordenarServicosLista(atrasadosServicosFiltrados, ordenacaoAtrasados),
    [atrasadosServicosFiltrados, ordenacaoAtrasados]
  );

  const vencemHojeServicosOrdenados = useMemo(
    () => ordenarServicosLista(vencemHojeServicosFiltrados, ordenacaoVencemHoje),
    [vencemHojeServicosFiltrados, ordenacaoVencemHoje]
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
      ) : (
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
                  <select
                    className="dashboard-card__select"
                    value={filtroResponsavelAtrasados}
                    onChange={(event) => setFiltroResponsavelAtrasados(event.target.value)}
                    aria-label="Filtrar responsável em Serviços atrasados"
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
                </div>
                {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
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
                      {servicosColunas.map((coluna) => {
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
                        <td colSpan={servicosColunas.length} className="dashboard-table__empty">
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
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <div className="dashboard-card__title-group">
                  <h2>Serviços que vencem hoje</h2>
                  <select
                    className="dashboard-card__select"
                    value={filtroResponsavelVencemHoje}
                    onChange={(event) => setFiltroResponsavelVencemHoje(event.target.value)}
                    aria-label="Filtrar responsável em Serviços que vencem hoje"
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
                </div>
                {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
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
                      {servicosColunas.map((coluna) => {
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
                        <td colSpan={servicosColunas.length} className="dashboard-table__empty">
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
            </article>

            <article className="dashboard-card dashboard-card--full">
              <header className="dashboard-card__header">
                <h2>Resumo de serviços por grupo</h2>
                {loadingServicos && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <div className="dashboard-card__table-wrapper">
                <table className="dashboard-table dashboard-table--servicos-resumo">
                  <thead>
                    <tr>
                      <th scope="col">Grupo / Responsável</th>
                      <th scope="col">Fechados no período</th>
                      <th scope="col">Venc. em 7 dias</th>
                      <th scope="col">Venc. em 15 dias</th>
                      <th scope="col">Venc. em 30 dias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoServicosLinhas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="dashboard-table__empty">
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
                                <td>{formatQuantidade.format(linha.fechados_periodo ?? 0)}</td>
                                <td>{formatQuantidade.format(linha.vencer_7 ?? 0)}</td>
                                <td>{formatQuantidade.format(linha.vencer_15 ?? 0)}</td>
                                <td>{formatQuantidade.format(linha.vencer_30 ?? 0)}</td>
                              </tr>
                              {hasChildren && isExpanded && responsaveis.map((resp) => {
                                const respLabel = resp.responsavel || 'SEM RESPONSÁVEL';
                                return (
                                  <tr key={`resumo-serv-${grupoLabel}-${respLabel}`}>
                                    <td className="dashboard-tempo__cell--child">
                                      {respLabel}
                                    </td>
                                    <td>{formatQuantidade.format(resp.fechados_periodo ?? 0)}</td>
                                    <td>{formatQuantidade.format(resp.vencer_7 ?? 0)}</td>
                                    <td>{formatQuantidade.format(resp.vencer_15 ?? 0)}</td>
                                    <td>{formatQuantidade.format(resp.vencer_30 ?? 0)}</td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                        <tr className="dashboard-table__total-row">
                          <th scope="row" className="dashboard-tempo__cell--label">TOTAL</th>
                          <td>{formatQuantidade.format(resumoServicosTotais.fechados_periodo ?? 0)}</td>
                          <td>{formatQuantidade.format(resumoServicosTotais.vencer_7 ?? 0)}</td>
                          <td>{formatQuantidade.format(resumoServicosTotais.vencer_15 ?? 0)}</td>
                          <td>{formatQuantidade.format(resumoServicosTotais.vencer_30 ?? 0)}</td>
                        </tr>
                      </>
                    )}
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

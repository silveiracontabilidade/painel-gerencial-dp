import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../api/axios';
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

  const motivosSaida = dadosEmpresas?.motivos_saida ?? [];
  const movimentacao = dadosEmpresas?.movimentacao ?? { novas: 0, saidas: 0 };

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
      const registro = {
        grupo: String(linha?.grupo || 'Sem Grupo').toUpperCase(),
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
                        {linhasClassificacao.map((linha) => (
                          <tr key={linha.grupo || 'sem-grupo'}>
                            <th scope="row">{linha.grupo}</th>
                            <td className="dashboard-table__colab">
                              {formatQuantidade.format(linha.colab ?? 0)}
                            </td>
                            {classificacaoColunas.map((col) => (
                              <Fragment key={`${linha.grupo || 'sem'}-${col}`}>
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
                        ))}
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
          <article className="dashboard-card dashboard-card--full">
            <header className="dashboard-card__header">
              <h2>Serviços</h2>
            </header>
            <p className="dashboard-card__empty">
              Em breve traremos indicadores desta aba.
            </p>
          </article>
        </section>
      )}
    </div>
  );
};

export default Dashboard;

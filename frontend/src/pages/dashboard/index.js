import React, { useEffect, useMemo, useState } from 'react';
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

  const classificacao = dadosEmpresas?.classificacao_ativas ?? {};
  const motivosSaida = dadosEmpresas?.motivos_saida ?? [];
  const movimentacao = dadosEmpresas?.movimentacao ?? { novas: 0, saidas: 0 };
  const totalEmpresasAtivas =
    classificacao.total ??
    ['bronze', 'prata', 'ouro', 'diamante', 'nao_classificadas', 'outros']
      .map((key) => Number(classificacao[key] ?? 0))
      .reduce((acc, curr) => acc + curr, 0);

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
            <article className="dashboard-card">
              <header className="dashboard-card__header">
                <h2>Empresas Ativas</h2>
                {loadingEmpresas && <Loader2 className="dashboard-card__spinner" size={18} />}
              </header>
              <ul className="dashboard-card__list">
                <li>
                  <span>Bronze</span>
                  <strong>{classificacao.bronze ?? 0}</strong>
                </li>
                <li>
                  <span>Prata</span>
                  <strong>{classificacao.prata ?? 0}</strong>
                </li>
                <li>
                  <span>Ouro</span>
                  <strong>{classificacao.ouro ?? 0}</strong>
                </li>
                <li>
                  <span>Diamante</span>
                  <strong>{classificacao.diamante ?? 0}</strong>
                </li>
                <li>
                  <span>Não classificadas</span>
                  <strong>{classificacao.nao_classificadas ?? 0}</strong>
                </li>
                {classificacao.outros ? (
                  <li>
                    <span>Outros</span>
                    <strong>{classificacao.outros}</strong>
                  </li>
                ) : null}
                <li className="dashboard-card__total">
                  <span>Total geral</span>
                  <strong>{totalEmpresasAtivas}</strong>
                </li>
              </ul>
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

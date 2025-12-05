import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import './relatorios.css';

const formatoCompetencia = (valor) => {
  if (!valor) return '';
  const apenasNum = valor.replace(/[^\d]/g, '').slice(0, 6);
  if (apenasNum.length < 6) return '';
  const ano = apenasNum.slice(0, 4);
  const mes = apenasNum.slice(4, 6);
  return `${ano}-${mes}`;
};

const toDisplayCompetencia = (valor) => {
  if (!valor) return '';
  const [ano, mes] = valor.split('-');
  return `${mes}/${ano}`;
};

const exportarXls = (dados, colunas, nomeArquivo) => {
  if (!dados || dados.length === 0) return;
  const header = colunas.map((c) => c.label).join('\t');
  const linhas = dados.map((linha) =>
    colunas
      .map((c) => {
        const val = linha[c.chave];
        if (val === null || val === undefined) return '';
        return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
      })
      .join('\t')
  );
  const conteudo = [header, ...linhas].join('\n');
  const blob = new Blob([conteudo], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo}.xls`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function RelatorioBase({
  titulo,
  descricao,
  endpoint,
  colunas,
  nomeArquivo,
  mostrarCompetencia = true,
  filtros = [],
}) {
  const [competencia, setCompetencia] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });
  const [filtroValores, setFiltroValores] = useState(() =>
    Object.fromEntries(filtros.map((f) => [f.chave, '']))
  );
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [meta, setMeta] = useState({});

  const competenciaDisplay = useMemo(() => toDisplayCompetencia(competencia), [competencia]);

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const params = {};
      const res = await api.get(endpoint, {
        params: (() => {
          if (mostrarCompetencia) {
            params.competencia = competencia?.replace('-', '');
          }
          filtros.forEach((f) => {
            const val = filtroValores[f.chave];
            if (val) params[f.chave] = val;
          });
          return params;
        })(),
      });
      setDados(res.data.resultado || []);
      setMeta({
        competencia: res.data.competencia,
        total: res.data.total,
      });
    } catch (err) {
      console.error('Erro ao carregar relatório', err);
      setErro('Não foi possível carregar o relatório.');
      setDados([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (mostrarCompetencia) {
      carregar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia, mostrarCompetencia, JSON.stringify(filtroValores)]);

  useEffect(() => {
    if (!mostrarCompetencia) {
      carregar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarCompetencia, JSON.stringify(filtroValores)]);

  const handleFiltroChange = (chave, valor) => {
    setFiltroValores((prev) => ({ ...prev, [chave]: valor }));
  };

  const handleCompetenciaChange = (valor) => {
    const normalizado = formatoCompetencia(valor);
    if (normalizado) {
      setCompetencia(normalizado);
    } else {
      setCompetencia('');
    }
  };

  return (
    <div className="relatorio-container">
      <div className="relatorio-header">
        <div>
          <h2>{titulo}</h2>
          {descricao && <p className="relatorio-descricao">{descricao}</p>}
        </div>
        <div className="relatorio-acoes">
          {filtros.map((filtro) => (
            <label key={filtro.chave}>
              {filtro.label}:
              <select
                value={filtroValores[filtro.chave] || ''}
                onChange={(e) => handleFiltroChange(filtro.chave, e.target.value)}
              >
                <option value="">Todos</option>
                {(filtro.opcoes || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {mostrarCompetencia && (
            <label>
              Competência:
              <input
                type="month"
                value={competencia}
                onChange={(e) => handleCompetenciaChange(e.target.value)}
              />
            </label>
          )}
          <button
            className="btn-primario"
            onClick={() => exportarXls(dados, colunas, `${nomeArquivo}_${competenciaDisplay || 'competencia'}`)}
            disabled={!dados.length}
          >
            Exportar XLS
          </button>
        </div>
      </div>

      <div className="relatorio-meta">
        {mostrarCompetencia ? (
          <span>Competência: {meta.competencia || competenciaDisplay || '-'}</span>
        ) : (
          <span>Base: dados cadastrais (planilha gerencial)</span>
        )}
        <span>Total: {meta.total ?? dados.length}</span>
      </div>

      {erro && <div className="relatorio-erro">{erro}</div>}
      {carregando && <div className="relatorio-loading">Carregando...</div>}

      {!carregando && !erro && (
        <div className="relatorio-tabela-wrapper">
          <table className="relatorio-tabela">
            <thead>
              <tr>
                {colunas.map((col) => (
                  <th key={col.chave} style={col.style || {}}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan={colunas.length} className="relatorio-vazio">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                dados.map((linha, idx) => (
                  <tr key={`${linha.cod_folha || idx}-${idx}`}>
                    {colunas.map((col) => (
                      <td key={col.chave} style={col.style || {}}>
                        {linha[col.chave] || col.fallback || ''}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

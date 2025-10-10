import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Play } from 'lucide-react';
import api from '../../api/axios';
import './Agenda.css';

export default function AgendaBase() {
  const [itens, setItens] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
const [dados, setDados] = useState({
    periodo: '',
    dia: '',
    mes: '',
    nome: '',
    descricao: '',
    servico: '',
    tipo_distribuicao: '',
    usa_data_agenda: true,
    campo_periodo_empresa: '',
    regras: [],
  });

  // opções fixas
  const periodos = ['mensal', 'semestral', 'anual'];
  const distribuicoes = ['empresa', 'analista', 'coordenador', 'analista e coordenador'];
  const ID_TEMP = 'novo';
  const camposPeriodoEmpresa = [
    { value: 'dt_adiantamento_entrega', label: 'Entrega do adiantamento' },
    { value: 'plr_dt_entrega', label: 'Entrega do PLR' },
    { value: 'dt_13_adiantamento_entrega', label: 'Adiantamento 13º' },
    { value: 'dt_13_entrega', label: 'Entrega 13º' },
    { value: 'ponto_entrega', label: 'Entrega do ponto' },
  ];

  const camposRegra = [
    { value: 'CLASSIFICACAO2', label: 'Classificação 2' },
    { value: 'SECCONCI', label: 'SECONCI' },
    { value: 'APURA_VT', label: 'Apura VT' },
    { value: 'SERV_PREST', label: 'Serviços Prestados' },
    { value: 'PLANILHA_CONVENIO', label: 'Planilha Convênio' },
    { value: 'PLANILHA_FOLHA', label: 'Planilha Folha' },
    { value: 'DESON', label: 'Desoneração' },
    { value: 'ADIANTAMENTO', label: 'Adiantamento' },
    { value: 'PLR', label: 'PLR' },
    { value: 'DT_13_ADIANTAMENTO_ENTREGA', label: 'Adiantamento 13º' },
    { value: 'DT_13_ENTREGA', label: 'Entrega 13º' },
    { value: 'ENVIA_PONTO', label: 'Envia ponto' },
  ];

  const operadoresRegra = [
    { value: 'IGUAL', label: 'Igual' },
    { value: 'DIFERENTE', label: 'Diferente' },
    { value: 'CONTEM', label: 'Contém' },
    { value: 'NAO_CONTEM', label: 'Não contém' },
  ];

  const conectoresRegra = [
    { value: 'AND', label: 'E (AND)' },
    { value: 'OR', label: 'Ou (OR)' },
  ];

  // estados auxiliares
  const [ordenacao, setOrdenacao] = useState({ campo: '', direcao: 'asc' });
  const [filtros, setFiltros] = useState({
    periodo: '',
    dia: '',
    mes: '',
    nome: '',
    descricao: '',
    servico: '',
    tipo_distribuicao: '',
  });
  const [servicos, setServicos] = useState([]);
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [competenciaLote, setCompetenciaLote] = useState({ mes: '', ano: '' });
  const [processandoLote, setProcessandoLote] = useState(false);
  const [resultadoLote, setResultadoLote] = useState(null);
  const [erroLote, setErroLote] = useState('');
  const [modalRegrasAberto, setModalRegrasAberto] = useState(false);
  const [regrasTemp, setRegrasTemp] = useState([]);
  const [regraItemId, setRegraItemId] = useState(null);

  useEffect(() => {
    carregarItens();
  }, []);

  useEffect(() => {
    api.get('/api/servicos/', { params: { page: 1, page_size: 1000 } })
      .then((res) => setServicos(res.data.results || res.data))
      .catch((err) => console.error('Erro ao carregar serviços:', err));
  }, []);

  const carregarItens = async () => {
    const res = await api.get('/api/agenda-base/');
    const dadosApi = res.data.results || res.data;
    const normalizados = dadosApi.map((item) => {
      const usaAgenda = (item.usa_data_agenda === undefined || item.usa_data_agenda === null)
        ? true
        : Boolean(item.usa_data_agenda);
      return {
        ...item,
        regras: item.regras || [],
        usa_data_agenda: usaAgenda,
        campo_periodo_empresa: item.campo_periodo_empresa ?? '',
      };
    });
    setItens(normalizados);
  };

  /* ---------- ordenação ---------- */
  const handleOrdenar = (campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
  };

  const itensOrdenados = useMemo(() => {
    if (!ordenacao.campo) return itens;
    return [...itens].sort((a, b) => {
      const valA = (a[ordenacao.campo] || '').toString().toUpperCase();
      const valB = (b[ordenacao.campo] || '').toString().toUpperCase();
      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });
  }, [itens, ordenacao]);

  const servicosMap = useMemo(() => {
    const map = new Map();
    servicos.forEach((servico) => map.set(String(servico.id), servico));
    return map;
  }, [servicos]);

  /* ---------- filtros ---------- */
  const handleFiltro = (campo) => (e) => {
    setFiltros({ ...filtros, [campo]: e.target.value });
  };

  const itensFiltrados = useMemo(() => {
    return itensOrdenados.filter((i) =>
      (!filtros.periodo || i.periodo?.toLowerCase().includes(filtros.periodo.toLowerCase())) &&
      (!filtros.dia || String(i.dia).includes(filtros.dia)) &&
      (!filtros.mes || String(i.mes).includes(filtros.mes)) &&
      (!filtros.nome || i.nome?.toLowerCase().includes(filtros.nome.toLowerCase())) &&
      (!filtros.descricao || i.descricao?.toLowerCase().includes(filtros.descricao.toLowerCase())) &&
      (!filtros.servico || String(i.servico ?? '') === filtros.servico) &&
      (!filtros.tipo_distribuicao || i.tipo_distribuicao?.toLowerCase().includes(filtros.tipo_distribuicao.toLowerCase()))
    );
  }, [itensOrdenados, filtros]);

  const abrirModalLote = () => {
    const hoje = new Date();
    setCompetenciaLote({
      mes: String(hoje.getMonth() + 1).padStart(2, '0'),
      ano: String(hoje.getFullYear()),
    });
    setResultadoLote(null);
    setErroLote('');
    setModalLoteAberto(true);
  };

  const fecharModalLote = () => {
    if (processandoLote) return;
    setModalLoteAberto(false);
  };

  const handleCompetenciaLote = (campo) => (e) => {
    setCompetenciaLote({ ...competenciaLote, [campo]: e.target.value });
  };

  const executarLote = async () => {
    setErroLote('');
    setResultadoLote(null);

    const mesNumero = Number(competenciaLote.mes);
    const anoNumero = Number(competenciaLote.ano);

    if (!mesNumero || !anoNumero) {
      setErroLote('Informe mês e ano.');
      return;
    }

    if (mesNumero < 1 || mesNumero > 12) {
      setErroLote('O mês deve estar entre 1 e 12.');
      return;
    }

    if (anoNumero < 2000) {
      setErroLote('Informe um ano válido (>= 2000).');
      return;
    }

    setProcessandoLote(true);
    try {
      const res = await api.post('/api/agenda-base/gerar-servicos/', {
        mes: mesNumero,
        ano: anoNumero,
      });
      setResultadoLote(res.data);
    } catch (err) {
      const mensagem = err.response?.data?.detail || 'Falha ao gerar serviços.';
      setErroLote(mensagem);
    } finally {
      setProcessandoLote(false);
    }
  };

  /* ---------- novo / editar / cancelar ---------- */
  const novo = () => {
    const linhaVazia = {
      id: ID_TEMP,
      periodo: '',
      dia: '',
      mes: '',
      nome: '',
      descricao: '',
      servico: '',
      servico_nome: '',
      tipo_distribuicao: '',
      usa_data_agenda: true,
      campo_periodo_empresa: '',
      regras: [],
    };
    setItens([linhaVazia, ...itens]);
    setEditandoId(ID_TEMP);
    setDados(linhaVazia);
  };

  const editar = (item) => {
    setEditandoId(item.id);
    const usaAgenda = (item.usa_data_agenda === undefined || item.usa_data_agenda === null)
      ? true
      : Boolean(item.usa_data_agenda);
    setDados({
      ...item,
      periodo: (item.periodo || '').toLowerCase().trim(),
      servico: item.servico ? String(item.servico) : '',
      usa_data_agenda: usaAgenda,
      campo_periodo_empresa: item.campo_periodo_empresa ?? '',
      regras: (item.regras || []).map((regra, index) => ({
        id: regra.id,
        campo: regra.campo,
        operador: regra.operador,
        valor: regra.valor,
        conector: regra.conector,
        ordem: regra.ordem ?? index + 1,
      })),
    });
  };

  const cancelar = () => {
    if (editandoId === ID_TEMP) {
      setItens(itens.filter((i) => i.id !== ID_TEMP));
    }
    setEditandoId(null);
    setDados({
      periodo: '',
      dia: '',
      mes: '',
      nome: '',
      descricao: '',
      servico: '',
      tipo_distribuicao: '',
      usa_data_agenda: true,
      campo_periodo_empresa: '',
      regras: [],
    });
  };

  /* ---------- salvar ---------- */
  const salvar = async (id) => {
    if (!dados.periodo || !dados.dia || !dados.nome || !dados.descricao || !dados.tipo_distribuicao) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    if (dados.periodo !== 'mensal' && (dados.mes === '' || dados.mes === null)) {
      alert('O campo "Mês" é obrigatório quando o período for semestral ou anual.');
      return;
    }

    if (dados.usa_data_agenda === false && !dados.campo_periodo_empresa) {
      alert('Selecione o campo de referência para calcular a data nas empresas.');
      return;
    }

    const payload = {
      periodo: (dados.periodo || '').toLowerCase().trim(),
      dia: dados.dia,
      nome: dados.nome,
      descricao: dados.descricao,
      servico: dados.servico ? Number(dados.servico) : null,
      tipo_distribuicao: dados.tipo_distribuicao,
      usa_data_agenda: dados.usa_data_agenda !== false,
      campo_periodo_empresa: dados.usa_data_agenda !== false
        ? null
        : (dados.campo_periodo_empresa || null),
      regras: (dados.regras || []).map((regra, index) => ({
        id: regra.id,
        campo: regra.campo,
        operador: regra.operador,
        valor: regra.valor,
        conector: regra.conector || 'AND',
        ordem: regra.ordem || index + 1,
      })),
    };

    if (dados.periodo === 'mensal') {
      payload.mes = null;
    } else {
      payload.mes = dados.mes === '' ? null : parseInt(dados.mes, 10);
    }

    try {
      if (id === 'novo') {
        await api.post('/api/agenda-base/', payload);
      } else {
        await api.put(`/api/agenda-base/${id}/`, payload);
      }
      setEditandoId(null);
      carregarItens();
    } catch (err) {
      console.error('Erro ao salvar:', err.response?.data || err.message);
      alert('Erro ao salvar. Verifique os campos.');
    }
  };

  const formatarFonteData = (item) => {
    const usaAgenda = item?.usa_data_agenda ?? true;
    if (usaAgenda) return 'Agenda';
    if (!item?.campo_periodo_empresa) return '-';
    const encontrado = camposPeriodoEmpresa.find((opcao) => opcao.value === item.campo_periodo_empresa);
    return encontrado ? encontrado.label : item.campo_periodo_empresa;
  };

  const handleFonteDataChange = (valor) => {
    if (valor === 'agenda') {
      setDados((prev) => ({ ...prev, usa_data_agenda: true, campo_periodo_empresa: '' }));
    } else {
      setDados((prev) => ({ ...prev, usa_data_agenda: false, campo_periodo_empresa: valor }));
    }
  };

  const abrirModalRegras = (item) => {
    const origem = editandoId === item.id ? (dados.regras || []) : (item.regras || []);
    const copia = origem.length > 0
      ? origem.map((regra, index) => ({
          id: regra.id,
          campo: regra.campo || '',
          operador: regra.operador || 'IGUAL',
          valor: regra.valor || '',
          conector: regra.conector || 'AND',
          ordem: regra.ordem || index + 1,
        }))
      : [{ campo: '', operador: 'IGUAL', valor: '', conector: 'AND', ordem: 1 }];
    setRegraItemId(item.id);
    setRegrasTemp(copia);
    setModalRegrasAberto(true);
  };

  const fecharModalRegras = () => {
    setModalRegrasAberto(false);
    setRegraItemId(null);
  };

  const atualizarRegra = (index, campo, valor) => {
    const novoValor = ['campo', 'operador', 'conector'].includes(campo)
      ? (valor || '').toUpperCase()
      : valor;
    setRegrasTemp((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: novoValor };
      return copia;
    });
  };

  const adicionarRegra = () => {
    setRegrasTemp((prev) => ([
      ...prev,
      { campo: '', operador: 'IGUAL', valor: '', conector: 'AND', ordem: prev.length + 1 },
    ]));
  };

  const removerRegra = (index) => {
    setRegrasTemp((prev) =>
      prev.filter((_, i) => i !== index).map((regra, idx) => ({ ...regra, ordem: idx + 1 }))
    );
  };

  const salvarRegrasModal = () => {
    const normalizadas = regrasTemp.map((regra, index) => ({
      ...regra,
      ordem: index + 1,
    }));

    if (regraItemId === editandoId) {
      setDados((prev) => ({ ...prev, regras: normalizadas }));
    }

    setItens((prev) =>
      prev.map((item) => (item.id === regraItemId ? { ...item, regras: normalizadas } : item))
    );

    fecharModalRegras();
  };

  /* ---------- excluir ---------- */
  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/agenda-base/${id}/`);
      carregarItens();
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <h2>Agenda Base</h2>
        <div className="agenda-actions">
          <button type="button" onClick={abrirModalLote} disabled={processandoLote}>
            <Play size={16} />
            <span>Gerar serviços</span>
          </button>
          <button onClick={novo} disabled={editandoId !== null}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleOrdenar('periodo')}>
              Período {ordenacao.campo === 'periodo' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('dia')}>
              Dia {ordenacao.campo === 'dia' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('mes')}>
              Mês {ordenacao.campo === 'mes' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('nome')}>
              Nome {ordenacao.campo === 'nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('servico_nome')}>
              Serviço {ordenacao.campo === 'servico_nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('descricao')}>
              Descrição {ordenacao.campo === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('tipo_distribuicao')}>
              Distribuir por {ordenacao.campo === 'tipo_distribuicao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th>Data base</th>
            <th>Regras</th>
            <th>Ações</th>
          </tr>

          {/* linha de filtros */}
          <tr className="linha-filtros">
            <th>
              <select value={filtros.periodo} onChange={handleFiltro('periodo')}>
                <option value="">Todos</option>
                {periodos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </th>
            <th>
              <input type="number" value={filtros.dia} onChange={handleFiltro('dia')} />
            </th>
            <th>
              <input type="number" value={filtros.mes} onChange={handleFiltro('mes')} />
            </th>
            <th>
              <input type="text" value={filtros.nome} onChange={handleFiltro('nome')} />
            </th>
            <th>
              <select value={filtros.servico} onChange={handleFiltro('servico')}>
                <option value="">Todos</option>
                {servicos.map((servico) => (
                  <option key={servico.id} value={String(servico.id)}>{servico.nome}</option>
                ))}
              </select>
            </th>
            <th>
              <input type="text" value={filtros.descricao} onChange={handleFiltro('descricao')} />
            </th>
            <th>
              <select value={filtros.tipo_distribuicao} onChange={handleFiltro('tipo_distribuicao')}>
                <option value="">Todos</option>
                {distribuicoes.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {itensFiltrados.map((item) => (
            <tr key={item.id}>
              {['periodo', 'dia', 'mes', 'nome', 'servico', 'descricao', 'tipo_distribuicao'].map((campo) => (
                <td key={campo}>
                  {editandoId === item.id ? (
                    campo === 'periodo' ? (
                      <select
                        value={dados.periodo}
                        onChange={(e) => setDados({ ...dados, periodo: e.target.value })}
                      >
                        <option value="">--</option>
                        {periodos.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : campo === 'servico' ? (
                      <select
                        value={dados.servico ?? ''}
                        onChange={(e) => setDados({ ...dados, servico: e.target.value })}
                      >
                        <option value="">--</option>
                        {servicos.map((servico) => (
                          <option key={servico.id} value={String(servico.id)}>{servico.nome}</option>
                        ))}
                      </select>
                    ) : campo === 'tipo_distribuicao' ? (
                      <select
                        value={dados.tipo_distribuicao}
                        onChange={(e) => setDados({ ...dados, tipo_distribuicao: e.target.value })}
                      >
                        <option value="">--</option>
                        {distribuicoes.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    ) : ['nome', 'descricao'].includes(campo) ? (
                      <textarea
                        rows={4}
                        style={{ overflowY: 'auto', resize: 'vertical' }}
                        value={dados[campo] ?? ''}
                        onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
                      />
                    ) : (
                      <input
                        type={(campo === 'dia' || campo === 'mes') ? 'number' : 'text'}
                        value={dados[campo] ?? ''}
                        onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
                      />
                    )
                  ) : (
                    campo === 'servico'
                      ? (item.servico_nome || servicosMap.get(String(item.servico))?.nome || '-')
                      : (item[campo] || '-')
                  )}
                </td>
              ))}

              <td>
                {editandoId === item.id ? (
                  <select
                    className="agenda-data-select"
                    value={dados.usa_data_agenda ? 'agenda' : (dados.campo_periodo_empresa || '')}
                    onChange={(e) => handleFonteDataChange(e.target.value)}
                  >
                    <option value="agenda">Data da agenda</option>
                    {camposPeriodoEmpresa.map((opcao) => (
                      <option key={opcao.value || 'selecione'} value={opcao.value}>{opcao.label}</option>
                    ))}
                  </select>
                ) : (
                  formatarFonteData(item)
                )}
              </td>

              <td>
                {editandoId === item.id ? (
                  <div className="agenda-regras-cell">
                    <span>{(dados.regras || []).length} regra(s)</span>
                    <button type="button" onClick={() => abrirModalRegras(item)}>Editar</button>
                  </div>
                ) : (
                  <span>{(item.regras || []).length}</span>
                )}
              </td>

              <td className="acoes">
                {editandoId === item.id ? (
                  <>
                    <button onClick={() => salvar(item.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(item)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(item.id)} title="Excluir"><Trash2 size={16} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {modalLoteAberto && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal">
            <h3>Gerar serviços em lote</h3>

            <div className="agenda-modal-campos">
              <label>
                Mês
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={competenciaLote.mes}
                  onChange={handleCompetenciaLote('mes')}
                  placeholder="MM"
                />
              </label>
              <label>
                Ano
                <input
                  type="number"
                  min="2000"
                  value={competenciaLote.ano}
                  onChange={handleCompetenciaLote('ano')}
                  placeholder="AAAA"
                />
              </label>
            </div>

            {erroLote && <div className="agenda-modal-alerta">{erroLote}</div>}

            {resultadoLote && (
              <div className="agenda-modal-resultado">
                <p>
                  Competência: <strong>{resultadoLote.competencia}</strong>
                </p>
                <p>
                  Serviços criados: <strong>{resultadoLote.total_criados}</strong>
                </p>
                <p>
                  Já existiam: <strong>{resultadoLote.total_duplicados}</strong>
                </p>
                {resultadoLote.itens_sem_servico?.length > 0 && (
                  <p>
                    Itens sem serviço: {resultadoLote.itens_sem_servico.join(', ')}
                  </p>
                )}
                {resultadoLote.itens_sem_destino?.length > 0 && (
                  <p>
                    Itens sem destino: {resultadoLote.itens_sem_destino.join(', ')}
                  </p>
                )}
                {resultadoLote.itens_fora_periodo?.length > 0 && (
                  <p>
                    Itens fora do período: {resultadoLote.itens_fora_periodo.join(', ')}
                  </p>
                )}
                {resultadoLote.detalhes?.length > 0 && (
                  <div className="agenda-modal-detalhes">
                    <strong>Resumo por item</strong>
                    <ul>
                      {resultadoLote.detalhes.slice(0, 10).map((detalhe) => (
                        <li key={detalhe.agenda_id}>
                          {detalhe.nome} — {detalhe.criadas ?? 0} criadas, {detalhe.duplicadas ?? 0} duplicadas
                          {detalhe.motivo ? ` (${detalhe.motivo})` : ''}
                        </li>
                      ))}
                    </ul>
                    {resultadoLote.detalhes.length > 10 && (
                      <p className="agenda-modal-observacao">
                        Mostrando os 10 primeiros itens.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="agenda-modal-acoes">
              <button type="button" onClick={fecharModalLote} disabled={processandoLote}>
                Fechar
              </button>
              <button type="button" onClick={executarLote} disabled={processandoLote}>
                {processandoLote ? 'Gerando...' : 'Executar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {modalRegrasAberto && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal agenda-modal-regras">
            <h3>Regras da agenda</h3>

            <div className="agenda-regras-list">
              {regrasTemp.map((regra, index) => (
                <div className="agenda-regra-linha" key={`${regra.id || 'novo'}-${index}`}>
                  {index > 0 && (
                    <div className="agenda-regra-col agenda-regra-col--conector">
                      <label>Conector</label>
                      <select
                        value={regra.conector || 'AND'}
                        onChange={(e) => atualizarRegra(index, 'conector', e.target.value)}
                      >
                        {conectoresRegra.map((opcao) => (
                          <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="agenda-regra-col">
                    <label>Campo</label>
                    <select
                      value={regra.campo || ''}
                      onChange={(e) => atualizarRegra(index, 'campo', e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {camposRegra.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="agenda-regra-col">
                    <label>Operador</label>
                    <select
                      value={regra.operador || 'IGUAL'}
                      onChange={(e) => atualizarRegra(index, 'operador', e.target.value)}
                    >
                      {operadoresRegra.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="agenda-regra-col agenda-regra-col--valor">
                    <label>Valor</label>
                    <input
                      type="text"
                      value={regra.valor || ''}
                      onChange={(e) => atualizarRegra(index, 'valor', e.target.value.toUpperCase())}
                    />
                  </div>
                  {regrasTemp.length > 1 && (
                    <button
                      type="button"
                      className="agenda-regra-remover"
                      onClick={() => removerRegra(index)}
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              {regrasTemp.length === 0 && (
                <p className="agenda-regra-vazia">Nenhuma regra cadastrada.</p>
              )}
            </div>

            <div className="agenda-regras-acoes">
              <button type="button" onClick={adicionarRegra}>Adicionar regra</button>
            </div>

            <div className="agenda-modal-acoes">
              <button type="button" onClick={fecharModalRegras}>Cancelar</button>
              <button type="button" onClick={salvarRegrasModal}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

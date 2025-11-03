import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, Check, X, Play } from 'lucide-react';
import api from '../../api/axios';
import './Agenda.css';

const ordenarPt = (a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' });

const CAMPOS_REGRA_CONFIG = [
  { value: 'CLASSIFICACAO2', label: 'Classificação' },
  { value: 'SECCONCI', label: 'SECONCI' },
  { value: 'APURA_VT', label: 'Apura VT' },
  { value: 'SERV_PREST', label: 'Serviços Prestados' },
  { value: 'PLANILHA_CONVENIO', label: 'Planilha Convênio' },
  { value: 'PLANILHA_FOLHA', label: 'Planilha Folha' },
  { value: 'DESON', label: 'Desoneração' },
  { value: 'ADIANTAMENTO', label: 'Adiantamento' },
  { value: 'PLR', label: 'PLR' },
  { value: 'TEM_PAT', label: 'PAT' },
  { value: 'DT_13_ADIANTAMENTO_ENTREGA', label: '13º adiantamento' },
  { value: 'DT_13_ENTREGA', label: '13º pagamento' },
  { value: 'ENVIA_PONTO', label: 'Envia ponto' },
];

const CAMPOS_BOOLEANOS = new Set([
  'SECCONCI',
  'APURA_VT',
  'SERV_PREST',
  'PLANILHA_CONVENIO',
  'PLANILHA_FOLHA',
  'DESON',
  'ADIANTAMENTO',
  'PLR',
  'TEM_PAT',
  'ENVIA_PONTO',
]);

const CAMPOS_PREENCHIMENTO = new Set(['DT_13_ADIANTAMENTO_ENTREGA', 'DT_13_ENTREGA']);
const CAMPOS_SEM_OPERADOR = new Set([...CAMPOS_BOOLEANOS, ...CAMPOS_PREENCHIMENTO]);

const LABEL_POR_CAMPO = CAMPOS_REGRA_CONFIG.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const formatarDistribuicao = (valor) => {
  if (!valor) return '-';
  return valor
    .split(' ')
    .map((parte) => {
      const texto = (parte || '').toLowerCase();
      if (!texto) return '';
      if (['e', 'de', 'da', 'do', 'das', 'dos'].includes(texto)) {
        return texto;
      }
      return texto.charAt(0).toUpperCase() + texto.slice(1);
    })
    .join(' ');
};

const CLASSIFICACAO2_OPTIONS = [
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
].sort(ordenarPt);

export default function AgendaBase() {
  const [itens, setItens] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dados, setDados] = useState({
    periodo: '',
    dia: '1',
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
    { value: 'data_entrega_folha', label: 'Data Entrega Folha' },
    { value: 'dt_13_adiantamento_entrega', label: '13º adiantamento' },
    { value: 'dt_13_entrega', label: '13º pagamento' },
    { value: 'ponto_entrega', label: 'Entrega do ponto' },
  ];

  const camposRegra = CAMPOS_REGRA_CONFIG;
  const obterLabelCampo = (campo) => LABEL_POR_CAMPO[campo] || campo;
  const ehCampoSemOperador = (campo) => CAMPOS_SEM_OPERADOR.has(campo);
  const ehCampoBooleano = (campo) => CAMPOS_BOOLEANOS.has(campo);
  const ehCampoPreenchimento = (campo) => CAMPOS_PREENCHIMENTO.has(campo);
  const construirRegraNormalizada = (regra, index = 0) => {
    const campoUpper = (regra.campo || '').toUpperCase();
    const base = {
      id: regra.id,
      campo: campoUpper,
      operador: (regra.operador || 'IGUAL').toUpperCase(),
      valor: regra.valor || '',
      conector: (regra.conector || 'AND').toUpperCase(),
      ordem: regra.ordem ?? index + 1,
    };

    if (ehCampoBooleano(campoUpper)) {
      base.operador = 'IGUAL';
      base.valor = base.valor || 'Sim';
    }

    if (ehCampoPreenchimento(campoUpper)) {
      base.operador = 'IGUAL';
      base.valor = 'PREENCHIDO';
    }

    return base;
  };

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
    fonte_data: '',
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
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [selecionados, setSelecionados] = useState([]);
  const [modoGeracao, setModoGeracao] = useState('todos');
  const seletorTodosRef = useRef(null);

  useEffect(() => {
    api.get('/api/me')
      .then(({ data }) => setPerfilUsuario(data.perfil))
      .catch((err) => console.error('Erro ao buscar perfil:', err));
  }, []);

  useEffect(() => {
    carregarItens();
  }, []);

  useEffect(() => {
    api.get('/api/servicos/', { params: { page: 1, page_size: 5_000_000 } })
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
        tipo_distribuicao: item.tipo_distribuicao ? item.tipo_distribuicao.toLowerCase().trim() : '',
      };
    });
    setItens(normalizados);
    setSelecionados((prev) => {
      const validos = new Set(normalizados.map((item) => String(item.id)));
      return prev.filter((id) => validos.has(id));
    });
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

  const podeEditar = perfilUsuario === 'admin' || perfilUsuario === 'coordenador';

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
      (!filtros.tipo_distribuicao || i.tipo_distribuicao?.toLowerCase() === filtros.tipo_distribuicao.toLowerCase()) &&
      (!filtros.fonte_data || (
        filtros.fonte_data === 'agenda'
          ? (i.usa_data_agenda ?? true)
          : (i.usa_data_agenda === false && i.campo_periodo_empresa === filtros.fonte_data)
      ))
    );
  }, [itensOrdenados, filtros]);

  const selecionadosSet = useMemo(() => new Set(selecionados.map(String)), [selecionados]);
  const itensSelecionaveisVisiveis = useMemo(
    () => itensFiltrados.filter((item) => item.id !== ID_TEMP),
    [itensFiltrados]
  );
  const nenhumSelecionado = selecionados.length === 0;
  const todosVisiveisSelecionados = itensSelecionaveisVisiveis.length > 0
    && itensSelecionaveisVisiveis.every((item) => selecionadosSet.has(String(item.id)));
  const algumVisivelSelecionado = itensSelecionaveisVisiveis.some((item) =>
    selecionadosSet.has(String(item.id))
  );

  useEffect(() => {
    if (seletorTodosRef.current) {
      seletorTodosRef.current.indeterminate = algumVisivelSelecionado && !todosVisiveisSelecionados;
    }
  }, [algumVisivelSelecionado, todosVisiveisSelecionados]);

  const alternarSelecaoItem = (id) => {
    const chave = String(id);
    if (chave === ID_TEMP) {
      return;
    }
    setSelecionados((prev) => {
      const atual = new Set(prev);
      if (atual.has(chave)) {
        atual.delete(chave);
      } else {
        atual.add(chave);
      }
      return Array.from(atual);
    });
  };

  const alternarSelecionarTodosVisiveis = () => {
    setSelecionados((prev) => {
      const atual = new Set(prev);
      if (todosVisiveisSelecionados) {
        itensSelecionaveisVisiveis.forEach((item) => {
          atual.delete(String(item.id));
        });
      } else {
        itensSelecionaveisVisiveis.forEach((item) => {
          atual.add(String(item.id));
        });
      }
      return Array.from(atual);
    });
  };

  const abrirModalLote = () => {
    if (!podeEditar) return;
    const hoje = new Date();
    setCompetenciaLote({
      mes: String(hoje.getMonth() + 1).padStart(2, '0'),
      ano: String(hoje.getFullYear()),
    });
    setResultadoLote(null);
    setErroLote('');
    setModoGeracao(selecionados.length ? 'selecionados' : 'todos');
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
    if (!podeEditar) return;
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

    const payload = {
      mes: mesNumero,
      ano: anoNumero,
    };

    if (modoGeracao === 'selecionados') {
      const idsNumericos = selecionados
        .map((id) => Number(id))
        .filter((valor) => !Number.isNaN(valor));

      if (!idsNumericos.length) {
        setErroLote('Selecione ao menos um item válido da agenda.');
        return;
      }

      if (idsNumericos.length !== selecionados.length) {
        setErroLote('Não foi possível identificar todos os itens selecionados. Atualize a seleção e tente novamente.');
        return;
      }

      payload.agenda_ids = idsNumericos;
    }

    setProcessandoLote(true);
    try {
      const res = await api.post('/api/agenda-base/gerar-servicos/', payload);
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
    if (!podeEditar) return;
    const linhaVazia = {
      id: ID_TEMP,
      periodo: '',
      dia: '1',
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
    if (!podeEditar) return;
    setEditandoId(item.id);
    const usaAgenda = (item.usa_data_agenda === undefined || item.usa_data_agenda === null)
      ? true
      : Boolean(item.usa_data_agenda);
    setDados({
      ...item,
      periodo: (item.periodo || '').toLowerCase().trim(),
      dia: item.dia !== undefined && item.dia !== null ? String(item.dia) : '1',
      mes: item.mes !== undefined && item.mes !== null ? String(item.mes) : '',
      servico: item.servico ? String(item.servico) : '',
      tipo_distribuicao: item.tipo_distribuicao ? item.tipo_distribuicao.toLowerCase().trim() : '',
      usa_data_agenda: usaAgenda,
      campo_periodo_empresa: item.campo_periodo_empresa ?? '',
      regras: (item.regras || []).map((regra, index) => construirRegraNormalizada(regra, index)),
    });
  };

  const cancelar = () => {
    if (editandoId === ID_TEMP) {
      setItens(itens.filter((i) => i.id !== ID_TEMP));
    }
    setEditandoId(null);
    setDados({
      periodo: '',
      dia: '1',
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
    if (!podeEditar) return;
    const usaAgenda = dados.usa_data_agenda !== false;

    if (!dados.nome || !dados.descricao || !dados.servico || !dados.tipo_distribuicao) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    if (usaAgenda) {
      if (!dados.periodo || !dados.dia) {
        alert('Informe período e dia quando a data base for a agenda.');
        return;
      }

      if (dados.periodo !== 'mensal' && (dados.mes === '' || dados.mes === null)) {
        alert('Informe o mês quando o período não for mensal.');
        return;
      }
    }

    if (!usaAgenda && !dados.campo_periodo_empresa) {
      alert('Selecione o campo de referência para calcular a data nas empresas.');
      return;
    }

    const periodoNormalizado = usaAgenda ? (dados.periodo || '').toLowerCase().trim() : null;
    const diaBruto = dados.dia === '' || dados.dia === null ? null : Number(dados.dia);
    const servicoNumero = Number(dados.servico);

    if (usaAgenda && (diaBruto === null || Number.isNaN(diaBruto))) {
      alert('Informe um dia válido.');
      return;
    }

    const diaPayload = usaAgenda
      ? diaBruto
      : (Number.isNaN(diaBruto) || diaBruto === null ? 1 : diaBruto);

    if (Number.isNaN(servicoNumero)) {
      alert('Selecione um serviço válido.');
      return;
    }

    const payload = {
      periodo: periodoNormalizado,
      dia: diaPayload,
      nome: dados.nome,
      descricao: dados.descricao,
      servico: servicoNumero,
      tipo_distribuicao: dados.tipo_distribuicao
        ? dados.tipo_distribuicao.toLowerCase().trim()
        : null,
      usa_data_agenda: usaAgenda,
      campo_periodo_empresa: usaAgenda
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

    if (!usaAgenda || periodoNormalizado === 'mensal') {
      payload.mes = null;
    } else {
      const mesNormalizado = dados.mes === '' || dados.mes === null ? null : Number(dados.mes);
      payload.mes = Number.isNaN(mesNormalizado) ? null : mesNormalizado;
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

  const obterLabelCampoPeriodo = (valor) => {
    if (!valor) return '';
    const encontrado = camposPeriodoEmpresa.find((opcao) => opcao.value === valor);
    return encontrado ? encontrado.label : valor;
  };

  const formatarPeriodoDetalhe = (detalhe) => {
    const periodo = (detalhe?.periodo || '').toLowerCase();
    const mes = detalhe?.mes != null ? String(detalhe.mes).padStart(2, '0') : '';
    if (!periodo) return 'Não definido';
    if (periodo === 'mensal') return 'Mensal';
    if (periodo === 'semestral') {
      return `Semestral${mes ? ` (mês base ${mes})` : ''}`;
    }
    if (periodo === 'anual') {
      return `Anual${mes ? ` (mês base ${mes})` : ''}`;
    }
    return periodo;
  };

  const formatarDataBaseDetalhe = (detalhe) => {
    const usaAgenda = detalhe?.usa_data_agenda;
    if (usaAgenda || usaAgenda === undefined || usaAgenda === null) {
      const partes = [];
      if (detalhe?.dia != null) {
        partes.push(`dia ${String(detalhe.dia).padStart(2, '0')}`);
      }
      if (detalhe?.mes != null) {
        partes.push(`mês ${String(detalhe.mes).padStart(2, '0')}`);
      }
      const info = partes.length ? partes.join(', ') : 'sem dia definido';
      return `Agenda (${info})`;
    }
    if (detalhe?.campo_periodo_empresa) {
      return `Empresa (${obterLabelCampoPeriodo(detalhe.campo_periodo_empresa)})`;
    }
    return '-';
  };

  const baixarLogExecucao = () => {
    if (!resultadoLote) return;
    const linhas = [];
    linhas.push(`Competência: ${resultadoLote.competencia ?? '-'}`);
    linhas.push(`Serviços criados: ${resultadoLote.total_criados ?? 0}`);
    linhas.push(`Já existiam: ${resultadoLote.total_duplicados ?? 0}`);
    linhas.push('');

    if (Array.isArray(resultadoLote.itens_solicitados)) {
      const totalSelecionados = resultadoLote.itens_solicitados.length;
      const totalProcessados = Array.isArray(resultadoLote.itens_processados_ids)
        ? resultadoLote.itens_processados_ids.length
        : 0;
      const totalNaoEncontrados = Array.isArray(resultadoLote.itens_nao_encontrados)
        ? resultadoLote.itens_nao_encontrados.length
        : 0;
      linhas.push('Seleção aplicada:');
      linhas.push(`- Itens selecionados: ${totalSelecionados}`);
      linhas.push(`- Itens processados: ${totalProcessados}`);
      if (totalNaoEncontrados > 0) {
        linhas.push(`- Itens ignorados (não disponíveis): ${totalNaoEncontrados}`);
      }
      linhas.push('');
    }

    const detalhes = Array.isArray(resultadoLote.detalhes) ? resultadoLote.detalhes : [];
    const idsSemDestino = new Set((resultadoLote.itens_sem_destino || []).map((valor) => Number(valor)));
    const idsForaPeriodo = new Set((resultadoLote.itens_fora_periodo || []).map((valor) => Number(valor)));

    const montarLinhaResumo = (detalhe) => {
      const distribuicao = formatarDistribuicao(detalhe.tipo_distribuicao);
      const dataBase = formatarDataBaseDetalhe(detalhe);
      const periodoTexto = formatarPeriodoDetalhe(detalhe);
      return `- Serviço: ${detalhe.nome || '-'}; Distribuir por: ${distribuicao}; Data base: ${dataBase}; Período: ${periodoTexto}`;
    };

    const semDestino = detalhes.filter((detalhe) => idsSemDestino.has(Number(detalhe.agenda_id)));
    linhas.push('Itens sem destino:');
    if (semDestino.length === 0) {
      linhas.push('- Nenhum item sem destino.');
    } else {
      semDestino.forEach((detalhe) => {
        linhas.push(montarLinhaResumo(detalhe));
        if (detalhe.motivo) {
          linhas.push(`  Motivo: ${detalhe.motivo}`);
        }
      });
    }
    linhas.push('');

    const foraPeriodo = detalhes.filter((detalhe) => idsForaPeriodo.has(Number(detalhe.agenda_id)));
    linhas.push('Itens fora do período:');
    if (foraPeriodo.length === 0) {
      linhas.push('- Nenhum item fora do período.');
    } else {
      foraPeriodo.forEach((detalhe) => {
        linhas.push(montarLinhaResumo(detalhe));
        if (detalhe.motivo) {
          linhas.push(`  Motivo: ${detalhe.motivo}`);
        }
      });
    }
    linhas.push('');

    linhas.push('Resumo por item:');
    if (detalhes.length === 0) {
      linhas.push('- Nenhum item retornado.');
    } else {
      detalhes.forEach((detalhe) => {
        const linhaBase = `- ${detalhe.nome || '-'} | Distribuição: ${formatarDistribuicao(detalhe.tipo_distribuicao)} | Período: ${formatarPeriodoDetalhe(detalhe)} | Criadas: ${detalhe.criadas ?? 0} | Duplicadas: ${detalhe.duplicadas ?? 0} | Status: ${(detalhe.status || '').toUpperCase()}`;
        linhas.push(linhaBase);
        linhas.push(`  Data base: ${formatarDataBaseDetalhe(detalhe)}`);
        if (typeof detalhe.empresas_processadas === 'number') {
          linhas.push(`  Empresas processadas: ${detalhe.empresas_processadas}`);
        }
        if (detalhe.responsaveis_gerados?.length) {
          const responsaveis = detalhe.responsaveis_gerados
            .map((resp) => {
              const empresas = Array.isArray(resp.empresas) && resp.empresas.length > 0
                ? ` [empresas: ${resp.empresas.join(', ')}]`
                : '';
              const grupos = Array.isArray(resp.grupos) && resp.grupos.length > 0
                ? ` [grupos: ${resp.grupos.join(', ')}]`
                : '';
              return `${resp.nome}${empresas}${grupos}`;
            })
            .join('; ');
          linhas.push(`  Responsáveis gerados: ${responsaveis}`);
        }
        if (detalhe.analistas_nao_encontrados?.length) {
          linhas.push(`  Analistas não encontrados: ${detalhe.analistas_nao_encontrados.join(', ')}`);
        }
        if (detalhe.coordenadores_nao_encontrados?.length) {
          linhas.push(`  Coordenadores não encontrados: ${detalhe.coordenadores_nao_encontrados.join(', ')}`);
        }
        if (detalhe.motivo) {
          linhas.push(`  Motivo: ${detalhe.motivo}`);
        }
        linhas.push('');
      });
    }

    const conteudo = linhas.join('\n');
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log_execucao_${resultadoLote.competencia || 'lote'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFonteDataChange = (valor) => {
    if (valor === 'agenda') {
      setDados((prev) => ({
        ...prev,
        usa_data_agenda: true,
        campo_periodo_empresa: '',
      }));
    } else {
      setDados((prev) => ({
        ...prev,
        usa_data_agenda: false,
        campo_periodo_empresa: valor,
      }));
    }
  };

  const abrirModalRegras = (item) => {
    if (!podeEditar) return;
    const origem = editandoId === item.id ? (dados.regras || []) : (item.regras || []);
    const copia = origem.length > 0
      ? origem.map((regra, index) => construirRegraNormalizada(regra, index))
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

  const handleCampoChange = (index, valor) => {
    const campoNormalizado = (valor || '').toUpperCase();
    setRegrasTemp((prev) => {
      const copia = [...prev];
      const atual = { ...copia[index], campo: campoNormalizado };

      if (ehCampoBooleano(campoNormalizado)) {
        atual.operador = 'IGUAL';
        atual.valor = 'Sim';
      } else if (ehCampoPreenchimento(campoNormalizado)) {
        atual.operador = 'IGUAL';
        atual.valor = 'PREENCHIDO';
      } else {
        atual.operador = atual.operador || 'IGUAL';
        if (campoNormalizado === 'CLASSIFICACAO2') {
          const possuiValor = CLASSIFICACAO2_OPTIONS.includes(atual.valor || '');
          atual.valor = possuiValor ? atual.valor : '';
        }
      }

      copia[index] = atual;
      return copia;
    });
  };

  const adicionarRegra = () => {
    if (!podeEditar) return;
    setRegrasTemp((prev) => ([
      ...prev,
      { campo: '', operador: 'IGUAL', valor: '', conector: 'AND', ordem: prev.length + 1 },
    ]));
  };

  const removerRegra = (index) => {
    if (!podeEditar) return;
    setRegrasTemp((prev) =>
      prev.filter((_, i) => i !== index).map((regra, idx) => ({ ...regra, ordem: idx + 1 }))
    );
  };

  const salvarRegrasModal = () => {
    if (!podeEditar) return;
    const normalizadas = regrasTemp.map((regra, index) => {
      const base = construirRegraNormalizada(regra, index);
      base.ordem = index + 1;
      return base;
    });

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
    if (!podeEditar) return;
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
        {podeEditar && (
          <div className="agenda-actions">
            <button type="button" onClick={abrirModalLote} disabled={processandoLote}>
              <Play size={16} />
              <span>Gerar serviços</span>
            </button>
            <button onClick={novo} disabled={editandoId !== null}>
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th className="agenda-col-selecao">
              <input
                ref={seletorTodosRef}
                type="checkbox"
                checked={todosVisiveisSelecionados && itensSelecionaveisVisiveis.length > 0}
                onChange={alternarSelecionarTodosVisiveis}
                disabled={!podeEditar || itensSelecionaveisVisiveis.length === 0}
              />
            </th>
            <th onClick={() => handleOrdenar('nome')}>
              Nome {ordenacao.campo === 'nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('descricao')}>
              Descrição {ordenacao.campo === 'descricao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('servico_nome')}>
              Serviço {ordenacao.campo === 'servico_nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('tipo_distribuicao')}>
              Distribuir por {ordenacao.campo === 'tipo_distribuicao' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th>Data base</th>
            <th onClick={() => handleOrdenar('periodo')}>
              Período {ordenacao.campo === 'periodo' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('dia')}>
              Dia {ordenacao.campo === 'dia' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th onClick={() => handleOrdenar('mes')}>
              Mês {ordenacao.campo === 'mes' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
            </th>
            <th>Regras</th>
            <th>Ações</th>
          </tr>

          {/* linha de filtros */}
          <tr className="linha-filtros">
            <th className="agenda-col-selecao"></th>
            <th>
              <input type="text" value={filtros.nome} onChange={handleFiltro('nome')} />
            </th>
            <th>
              <input type="text" value={filtros.descricao} onChange={handleFiltro('descricao')} />
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
              <select value={filtros.tipo_distribuicao} onChange={handleFiltro('tipo_distribuicao')}>
                <option value="">Todos</option>
                {distribuicoes.map((opcao) => (
                  <option key={opcao} value={opcao}>{formatarDistribuicao(opcao)}</option>
                ))}
              </select>
            </th>
            <th>
              <select value={filtros.fonte_data} onChange={handleFiltro('fonte_data')}>
                <option value="">Todos</option>
                <option value="agenda">Data da agenda</option>
                {camposPeriodoEmpresa.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                ))}
              </select>
            </th>
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
            <th></th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {itensFiltrados.map((item) => {
            const emEdicao = editandoId === item.id;
            const usaAgendaLinha = emEdicao ? (dados.usa_data_agenda !== false) : (item.usa_data_agenda ?? true);
            const servicoNome = item.servico_nome || servicosMap.get(String(item.servico))?.nome || '-';
            const periodoMostrar = usaAgendaLinha ? (item.periodo || '') : '';
            const diaMostrar = usaAgendaLinha && item.dia !== undefined && item.dia !== null ? item.dia : '';
            const mesMostrar = usaAgendaLinha && item.periodo !== 'mensal' && item.mes !== undefined && item.mes !== null
              ? item.mes
              : '';

            return (
              <tr key={item.id}>
                <td className="agenda-col-selecao">
                  {item.id !== ID_TEMP ? (
                    <input
                      type="checkbox"
                      checked={selecionadosSet.has(String(item.id))}
                      onChange={() => alternarSelecaoItem(item.id)}
                      disabled={!podeEditar}
                    />
                  ) : null}
                </td>
                <td>
                  {emEdicao ? (
                    <textarea
                      rows={4}
                      style={{ overflowY: 'auto', resize: 'vertical' }}
                      value={dados.nome ?? ''}
                      onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                    />
                  ) : (
                    item.nome || '-'
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <textarea
                      rows={4}
                      style={{ overflowY: 'auto', resize: 'vertical' }}
                      value={dados.descricao ?? ''}
                      onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                    />
                  ) : (
                    item.descricao || '-'
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <select
                      value={dados.servico ?? ''}
                      onChange={(e) => setDados({ ...dados, servico: e.target.value })}
                    >
                      <option value="">--</option>
                      {servicos.map((servico) => (
                        <option key={servico.id} value={String(servico.id)}>{servico.nome}</option>
                      ))}
                    </select>
                  ) : (
                    servicoNome
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <select
                      value={dados.tipo_distribuicao ?? ''}
                      onChange={(e) => setDados({ ...dados, tipo_distribuicao: e.target.value })}
                    >
                      <option value="">--</option>
                      {distribuicoes.map((opcao) => (
                        <option key={opcao} value={opcao}>{formatarDistribuicao(opcao)}</option>
                      ))}
                    </select>
                  ) : (
                    formatarDistribuicao(item.tipo_distribuicao)
                  )}
                </td>

                <td>
                  {emEdicao ? (
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
                  {emEdicao ? (
                    <select
                      value={dados.usa_data_agenda ? dados.periodo : ''}
                      disabled={!dados.usa_data_agenda}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setDados((prev) => ({
                          ...prev,
                          periodo: valor,
                          mes: valor === 'mensal' ? '' : prev.mes,
                        }));
                      }}
                    >
                      <option value="">--</option>
                      {periodos.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  ) : (
                    (usaAgendaLinha && periodoMostrar) || ''
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dados.usa_data_agenda ? (dados.dia ?? '') : ''}
                      disabled={!dados.usa_data_agenda}
                      onChange={(e) => setDados({ ...dados, dia: e.target.value })}
                    />
                  ) : (
                    usaAgendaLinha ? (diaMostrar || '') : ''
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={
                        dados.usa_data_agenda && dados.periodo !== 'mensal'
                          ? (dados.mes ?? '')
                          : ''
                      }
                      disabled={!dados.usa_data_agenda || dados.periodo === 'mensal'}
                      onChange={(e) => setDados({ ...dados, mes: e.target.value })}
                    />
                  ) : (
                    usaAgendaLinha ? (mesMostrar || '') : ''
                  )}
                </td>

                <td>
                  {emEdicao ? (
                    <div className="agenda-regras-cell">
                      <span>{(dados.regras || []).length} regra(s)</span>
                      <button type="button" onClick={() => abrirModalRegras(item)}>Editar</button>
                    </div>
                  ) : (
                    <span>{(item.regras || []).length}</span>
                  )}
                </td>

                <td className="acoes">
                  {podeEditar ? (
                    emEdicao ? (
                      <>
                        <button onClick={() => salvar(item.id)} title="Salvar"><Check size={16} /></button>
                        <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => editar(item)} title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => excluir(item.id)} title="Excluir"><Trash2 size={16} /></button>
                      </>
                    )
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            );
          })}
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

            <div className="agenda-modal-campos">
              <label>
                Itens a processar
                <select value={modoGeracao} onChange={(e) => setModoGeracao(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="selecionados">Selecionados</option>
                </select>
              </label>
            </div>

            {modoGeracao === 'selecionados' && nenhumSelecionado && (
              <div className="agenda-modal-info">
                Selecione itens na agenda para usar esta opção.
              </div>
            )}

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
                <button
                  type="button"
                  className="agenda-modal-log"
                  onClick={baixarLogExecucao}
                >
                  Baixar log de execução
                </button>
              </div>
            )}

            <div className="agenda-modal-acoes">
              <button type="button" onClick={fecharModalLote} disabled={processandoLote}>
                Fechar
              </button>
              {!resultadoLote && (
                <button
                  type="button"
                  onClick={executarLote}
                  disabled={processandoLote || (modoGeracao === 'selecionados' && nenhumSelecionado)}
                >
                  {processandoLote ? 'Gerando...' : 'Executar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {modalRegrasAberto && (
        <div className="agenda-modal-backdrop">
          <div className="agenda-modal agenda-modal-regras">
            <h3>Regras da agenda</h3>

            <div className="agenda-regras-list">
              {regrasTemp.map((regra, index) => {
                const campoAtual = (regra.campo || '').toUpperCase();
                const labelCampo = obterLabelCampo(campoAtual);
                const semOperador = ehCampoSemOperador(campoAtual);
                const campoBooleano = ehCampoBooleano(campoAtual);
                const campoPreenchimento = ehCampoPreenchimento(campoAtual);
                const campoClassificacao = campoAtual === 'CLASSIFICACAO2';

                return (
                  <div className="agenda-regra-linha" key={`${regra.id || 'novo'}-${index}`}>
                    <div className="agenda-regra-campos">
                      <div className="agenda-regra-col agenda-regra-col--conector">
                        <label className={index === 0 ? 'agenda-regra-label--placeholder' : ''}>Conector</label>
                        {index > 0 ? (
                          <select
                            value={regra.conector || 'AND'}
                            onChange={(e) => atualizarRegra(index, 'conector', e.target.value)}
                          >
                            {conectoresRegra.map((opcao) => (
                              <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="agenda-regra-input--placeholder" />
                        )}
                      </div>
                      <div className="agenda-regra-col">
                        <label>Campo</label>
                        <select
                          value={regra.campo || ''}
                          onChange={(e) => handleCampoChange(index, e.target.value)}
                        >
                          <option value="">Selecione</option>
                          {camposRegra.map((opcao) => (
                            <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                          ))}
                        </select>
                      </div>
                      {semOperador ? (
                        <div className="agenda-regra-col agenda-regra-col--placeholder">
                          <label>Operador</label>
                          <div className="agenda-regra-input--placeholder" />
                        </div>
                      ) : (
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
                      )}
                      <div className="agenda-regra-col agenda-regra-col--valor">
                        <label>Valor</label>
                        {semOperador ? (
                          <span className="agenda-regra-texto">
                            {campoBooleano && labelCampo
                              ? `Empresa com ${labelCampo} = Sim`
                              : campoPreenchimento && labelCampo
                                ? `Empresa com ${labelCampo} preenchido`
                                : 'Condição aplicada automaticamente'}
                          </span>
                        ) : campoClassificacao ? (
                          <select
                            value={regra.valor || ''}
                            onChange={(e) => atualizarRegra(index, 'valor', e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {CLASSIFICACAO2_OPTIONS.map((opcao) => (
                              <option key={opcao} value={opcao}>{opcao}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={regra.valor || ''}
                            onChange={(e) => atualizarRegra(index, 'valor', e.target.value.toUpperCase())}
                          />
                        )}
                      </div>
                    </div>
                    {regrasTemp.length > 1 && (
                      <button
                        type="button"
                        className="agenda-regra-remover"
                        onClick={() => removerRegra(index)}
                        title="Remover regra"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
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

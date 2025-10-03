// ServicosSolicitados.js
import React, { useEffect, useState, useMemo  } from 'react';
import { Plus, Pencil, Trash2, FileText, CheckCircle } from 'lucide-react';
import EmpresaFormModal from '../empresas/EmpresaFormModal'
import api from '../../api/axios';
import ServicoSolicitadoFormModal from './servicoSolicitadoFormModal';
import './servicos-solicitados.css';

export default function ServicosSolicitados() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);

  const [servicos, setServicos] = useState([]);

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
    status: 'todos', // todos | aberto | concluido
    prazo: 'todos',  // todos | atrasados | no_prazo
  });

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
  const carregarSolicitacoes = async () => {
    const res = await api.get('/api/solicitacoes/');
    setSolicitacoes(res.data.results || res.data);
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
    "MARROM": "#412504ff",
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
    empresas.forEach(e => m.set(String(e.cod_folha), e));
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

  // Aplica filtros
  const solicitacoesFiltradas = useMemo(() => {
    const termoEmp = normalize(filters.empresa);
    const alvoRespNome = filters.responsavelId
      ? normalize(respById.get(String(filters.responsavelId))?.nome)
      : '';
    const alvoGrupoNome = filters.grupoId
      ? normalize(grupoById.get(String(filters.grupoId))?.nome)
      : '';

    const hoje = new Date();

    return solicitacoes.filter((s) => {
      const cod = String(s.empresa ?? '');
      const emp = empresaByCodigo.get(cod);

      if (!emp && (termoEmp || alvoRespNome || alvoGrupoNome)) return false;
      if (!emp) return true;

      const codNorm = normalize(emp.cod_folha);
      const razaoNorm = normalize(emp.razao_social);
      const empRespNorm = normalize(emp.resp_dp);
      const empGrupoNorm = normalize(emp.grupo);

      const passaEmpresa =
        !termoEmp || codNorm.includes(termoEmp) || razaoNorm.includes(termoEmp);

      const passaResp = !alvoRespNome || empRespNorm === alvoRespNome;
      const passaGrupo = !alvoGrupoNome || empGrupoNorm === alvoGrupoNome;

      // filtro de status
      if (filters.status === "aberto" && s.data_conclusao) return false;
      if (filters.status === "concluido" && !s.data_conclusao) return false;

      // filtro de prazo
      if (filters.prazo !== "todos" && s.data_vencimento) {
        const venc = new Date(s.data_vencimento.split("-").reverse().join("-"));
        const concluido = !!s.data_conclusao;

        if (filters.prazo === "atrasados" && (!concluido && venc < hoje)) {
          // ok, fica
        } else if (filters.prazo === "atrasados") {
          return false;
        }

        if (filters.prazo === "no_prazo" && (!concluido && venc >= hoje)) {
          // ok, fica
        } else if (filters.prazo === "no_prazo") {
          return false;
        }
      }

      return passaEmpresa && passaResp && passaGrupo;
    });
  }, [solicitacoes, empresaByCodigo, filters, respById, grupoById]);

  // Helpers
  const renderDetalhes = (s) => {
    const tipo = (s.servico_nome || "").toUpperCase();
    let partes = [];

    // Sempre inclui descrição do serviço
    if (s.descricao_servico) {
      partes.push(`Descrição: ${s.descricao_servico}`);
    }

    if (tipo.includes("ADMISS")) {
      partes.push(`Admissão: ${s.admissao_data_ini || '-'} ${s.admissao_tipo || ''}`);
      if (s.admissao_deslig_programado)
        partes.push(`Deslig. Prog.: ${s.admissao_deslig_programado}`);
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
      partes.push(
        `Férias: ${s.ferias_data_ini || '-'} ` +
        (s.ferias_abono ? `${s.ferias_abono} abono` : '')
      );
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
 
  // empresa
  const renderEmpresa = (valorEmpresa) => {
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


  const renderResp = (valorEmpresa) => {
    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    if (!emp) return '-';

    const nomeResp = (emp.resp_dp || '-').toUpperCase();
    const nomeGrupo = String(emp.grupo || '').toUpperCase();
    const corFundo = GRUPO_CORES[nomeGrupo] || '#000';
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
        {nomeResp}
      </span>
    );
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

  const limparFiltros = () =>
    setFilters({ empresa: '', responsavelId: '', grupoId: '', status: 'todos', prazo: 'todos' });

  return (
    <div className="servicos-sol-container">
      <div className="servicos-header">
        <h2>Serviços Solicitados</h2>
        <button onClick={() => abrirModal()} title="Novo Serviço">
          <Plus size={18} /> Novo
        </button>
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

        <div className="campo" style={{ minWidth: 220 }}>
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

        <div className="campo" style={{ minWidth: 200 }}>
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

        <div className="campo">
          <label>Status</label>
          <select value={filters.status} onChange={handleFilterChange('status')}>
            <option value="todos">Todos</option>
            <option value="aberto">Em aberto</option>
            <option value="concluido">Concluídos</option>
          </select>
        </div>

        <div className="campo">
          <label>Prazo</label>
          <select value={filters.prazo} onChange={handleFilterChange('prazo')}>
            <option value="todos">Todos</option>
            <option value="atrasados">Atrasados</option>
            <option value="no_prazo">No Prazo</option>
          </select>
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
            <th>Empresa</th>
            <th>Responsável</th>
            <th>Serviço</th>
            <th>Detalhes</th>
            <th>Competência</th>
            <th>Solicitação</th>
            <th>Vencimento</th>
            <th>Conclusão</th>
            <th>Ações</th>
            <th>Materiais</th>
          </tr>
        </thead>
        <tbody>
          {solicitacoesFiltradas.map((s) => (
            <tr key={s.id}>
              <td>{renderEmpresa(s.empresa)}</td>
              <td>{renderResp(s.empresa)}</td>
              <td>{s.servico_nome}</td>
              <td>{renderDetalhes(s)}</td>
              <td>{s.competencia}</td>
              <td>{s.data_solicitacao}</td>
              {/* <td>{s.data_vencimento || '-'}</td> */}
              <td
                style={{
                  backgroundColor: '#E6F0FA', // azul claro fixo no fundo
                  color:
                    s.data_vencimento &&
                    !s.data_conclusao &&
                    new Date(s.data_vencimento.split('-').reverse().join('-')) < new Date()
                      ? 'red'
                      : 'inherit',
                  fontWeight:
                    s.data_vencimento &&
                    !s.data_conclusao &&
                    new Date(s.data_vencimento.split('-').reverse().join('-')) < new Date()
                      ? 'bold'
                      : 'normal',
                }}
              >
                {s.data_vencimento || '-'}
              </td>
              <td>{s.data_conclusao || '-'}</td>
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
          aoSalvar={() => {}} // aqui pode deixar vazio, pois na listagem de solicitações talvez não precise salvar
          dados={empresaSelecionada}
        />
      )}
    </div>
  );
}
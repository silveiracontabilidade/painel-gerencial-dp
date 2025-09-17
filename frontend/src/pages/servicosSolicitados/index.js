// ServicosSolicitados.js
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
    let partes = [];
    if (s.identificacao) partes.push(s.identificacao);
    if (s.admissao_data_ini || s.admissao_tipo) {
      partes.push(`Admissão: ${s.admissao_data_ini || '-'} ${s.admissao_tipo || ''}`);
    }
    if (s.rescisao_tipo_aviso || s.rescisao_data_ini || s.rescisao_dias_aviso) {
      partes.push(
        `Rescisão: ${s.rescisao_tipo_aviso || '-'}, ` +
        `${s.rescisao_data_ini || '-'}, ` +
        `${s.rescisao_dias_aviso ? `Aviso ${s.rescisao_dias_aviso}` : ''}`
      );
    }
    if (s.ferias_data_ini || s.ferias_abono) {
      partes.push(
        `Férias: ${s.ferias_data_ini || '-'}, ` +
        `${s.ferias_abono ? `${s.ferias_abono} abono` : ''}`
      );
    }
    if (s.afast_tipo || s.afast_ini) {
      partes.push(`Afast.: ${s.afast_tipo || '-'} ${s.afast_ini || ''}`);
    }
    return partes.join(" | ");
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

  const renderEmpresa = (valorEmpresa) => {
    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    return emp ? `${emp.cod_folha} — ${emp.razao_social}` : cod;
  };
  const renderResp = (valorEmpresa) => {
    const cod = String(valorEmpresa ?? '');
    const emp = empresaByCodigo.get(cod);
    return emp?.resp_dp || '-';
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
    <div className="servicos-container">
      <div className="servicos-header">
        <h2>Serviços Solicitados</h2>
        <button onClick={() => abrirModal()} title="Novo Serviço">
          <Plus size={18} /> Novo
        </button>
      </div>

      {/* Filtros */}
      <div className="servicos-filtros">
        <div className="campo" style={{ minWidth: 260 }}>
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
            <th>Grupo</th>
            <th>Serviço</th>
            <th>Detalhes</th>
            <th>Competência</th>
            <th>Solicitação</th>
            <th>Vencimento</th>
            <th>Conclusão</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {solicitacoesFiltradas.map((s) => (
            <tr key={s.id}>
              <td>{renderEmpresa(s.empresa)}</td>
              <td>{renderResp(s.empresa)}</td>
              <td>{renderGrupo(s.empresa)}</td>
              <td>{s.servico_nome}</td>
              <td>{renderDetalhes(s)}</td>
              <td>{s.competencia}</td>
              <td>{s.data_solicitacao}</td>
              <td>{s.data_vencimento || '-'}</td>
              <td>{s.data_conclusao || '-'}</td>
              <td className="acoes">
                <button onClick={() => abrirModal(s)} title="Editar">
                  <Pencil size={16} />
                </button>
                <button onClick={() => excluir(s.id)} title="Excluir">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}

          {solicitacoesFiltradas.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', opacity: 0.7, padding: '8px 0' }}>
                Nenhum registro encontrado com os filtros atuais.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAberto && (
        <ServicoSolicitadoFormModal
          dados={solicitacaoSelecionada}
          fechar={fecharModal}
        />
      )}
    </div>
  );
}

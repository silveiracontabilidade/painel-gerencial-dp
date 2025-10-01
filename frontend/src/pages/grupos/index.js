import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './Grupos.css';

export default function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // filtro + ordenação
  const [filtroNome, setFiltroNome] = useState("");
  const [ordenacao, setOrdenacao] = useState({ campo: "nome", direcao: "asc" });

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const { data } = await api.get("/api/me");
        setPerfilUsuario(data.perfil);
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      }
    }
    fetchPerfil();
  }, []);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [resGrupos, resResponsaveis] = await Promise.all([
      api.get('/api/grupos/'),
      api.get('/api/responsaveis/')
    ]);
    setGrupos(resGrupos.data.results || resGrupos.data);
    setResponsaveis(resResponsaveis.data.results || resResponsaveis.data);
  };

  const editar = (grupo) => {
    setEditandoId(grupo.id);
    setDadosEditados({ nome: grupo.nome, coordenadora: grupo.coordenadora });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvar = async (id) => {
    await api.put(`/api/grupos/${id}/`, dadosEditados);
    setEditandoId(null);
    setDadosEditados({});
    carregarDados();
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/grupos/${id}/`);
      carregarDados();
    }
  };

  const novo = async () => {
    const novoGrupo = { nome: 'Novo Grupo', coordenadora: null };
    const res = await api.post('/api/grupos/', novoGrupo);

    const grupoCriado = { ...res.data, __novo: true };
    setEditandoId(res.data.id);
    setDadosEditados(grupoCriado);

    setGrupos(prev => [grupoCriado, ...prev]);
  };

  // ordenação
  const handleOrdenar = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  // aplica filtro + ordenação
  const gruposVisiveis = useMemo(() => {
    const novos = grupos.filter(g => g.__novo);
    let lista = grupos.filter(g => !g.__novo);

    if (filtroNome) {
      const f = filtroNome.toUpperCase();
      lista = lista.filter(g => (g.nome || "").toUpperCase().includes(f));
    }

    if (ordenacao.campo) {
      lista.sort((a, b) => {
        const valA = (a[ordenacao.campo] || "").toString().toUpperCase();
        const valB = (b[ordenacao.campo] || "").toString().toUpperCase();
        if (valA < valB) return ordenacao.direcao === "asc" ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === "asc" ? 1 : -1;
        return 0;
      });
    }

    return [...novos, ...lista];
  }, [grupos, filtroNome, ordenacao]);

  return (
    <div className="grupos-container">
      <div className="grupos-header">
        <h2>Grupos Gerenciais</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Grupo">
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Filtro */}
      <div className="filtro-nome">
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th
              onClick={() => handleOrdenar("nome")}
              className={
                ordenacao.campo === "nome"
                  ? ordenacao.direcao === "asc"
                    ? "ordenado-asc"
                    : "ordenado-desc"
                  : ""
              }
            >
              Nome
            </th>
            <th
              onClick={() => handleOrdenar("coordenadora_nome")}
              className={
                ordenacao.campo === "coordenadora_nome"
                  ? ordenacao.direcao === "asc"
                    ? "ordenado-asc"
                    : "ordenado-desc"
                  : ""
              }
            >
              Coordenadora
            </th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {gruposVisiveis.map((grupo) => (
            <tr key={grupo.id}>
              <td>
                {editandoId === grupo.id ? (
                  <input
                    value={dadosEditados.nome}
                    onChange={(e) =>
                      setDadosEditados({ ...dadosEditados, nome: e.target.value })
                    }
                  />
                ) : (
                  grupo.nome
                )}
              </td>
              <td>
                {editandoId === grupo.id ? (
                  <select
                    value={dadosEditados.coordenadora || ''}
                    onChange={(e) =>
                      setDadosEditados({
                        ...dadosEditados,
                        coordenadora: e.target.value || null,
                      })
                    }
                  >
                    <option value="">-- Nenhuma --</option>
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  grupo.coordenadora_nome || '-'
                )}
              </td>
              <td className="acoes">
                {perfilUsuario === "admin" || perfilUsuario === "coordenador" ? (
                  editandoId === grupo.id ? (
                    <>
                      <button onClick={() => salvar(grupo.id)} title="Salvar">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelar} title="Cancelar">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editar(grupo)} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => excluir(grupo.id)} title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

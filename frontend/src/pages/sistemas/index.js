import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './sistemas.css';

export default function Sistemas() {
  const [sistemas, setSistemas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // filtro + ordenação
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'nome', direcao: 'asc' });

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
    const res = await api.get('/api/sistemas/');
    setSistemas(res.data.results || res.data);
  };

  const editar = (sistema) => {
    setEditandoId(sistema.id);
    setDadosEditados({ nome: sistema.nome });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvar = async (id) => {
    if (!dadosEditados.nome || dadosEditados.nome.trim() === '') {
      alert("O campo Nome é obrigatório.");
      return;
    }
    try {
      if (id === 'novo') {
        const res = await api.post('/api/sistemas/', { nome: dadosEditados.nome.trim() });
        setSistemas(prev => [{ ...res.data, __novo: true }, ...prev]);
      } else {
        await api.put(`/api/sistemas/${id}/`, { nome: dadosEditados.nome.trim() });
      }
      setEditandoId(null);
      setDadosEditados({});
      carregarDados();
    } catch (err) {
      console.error("Erro ao salvar sistema:", err.response?.data || err);
      alert("Erro ao salvar sistema.");
    }
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/sistemas/${id}/`);
      carregarDados();
    }
  };

  const novo = () => {
    setEditandoId('novo');
    setDadosEditados({ nome: 'Novo Sistema' });
  };

  const handleOrdenar = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  // aplica filtro + ordenação
  const sistemasVisiveis = useMemo(() => {
    const novos = sistemas.filter(s => s.__novo);
    let lista = sistemas.filter(s => !s.__novo);

    if (filtro) {
      const f = filtro.toUpperCase();
      lista = lista.filter(s => (s.nome || '').toUpperCase().includes(f));
    }

    if (ordenacao.campo) {
      lista.sort((a, b) => {
        const valA = (a[ordenacao.campo] || '').toString().toUpperCase();
        const valB = (b[ordenacao.campo] || '').toString().toUpperCase();
        if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return [...novos, ...lista];
  }, [sistemas, filtro, ordenacao]);

  return (
    <div className="sistemas-container">
      <div className="sistemas-header">
        <h2>Sistemas</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Sistema">
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* filtro */}
      <div className="filtro-nome">
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {editandoId === 'novo' && (
            <tr>
              <td>
                <input
                  value={dadosEditados.nome}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                />
              </td>
              <td className="acoes">
                <button onClick={() => salvar('novo')} title="Salvar"><Check size={16} /></button>
                <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
              </td>
            </tr>
          )}

          {sistemasVisiveis.map((sistema) => (
            <tr key={sistema.id}>
              <td>
                {editandoId === sistema.id ? (
                  <input
                    value={dadosEditados.nome}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                  />
                ) : (
                  sistema.nome
                )}
              </td>
              <td className="acoes">
                {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                  editandoId === sistema.id ? (
                    <>
                      <button onClick={() => salvar(sistema.id)} title="Salvar"><Check size={16} /></button>
                      <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editar(sistema)} title="Editar"><Pencil size={16} /></button>
                      <button onClick={() => excluir(sistema.id)} title="Excluir"><Trash2 size={16} /></button>
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

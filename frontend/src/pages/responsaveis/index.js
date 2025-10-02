import { Plus, Pencil, Trash2, Check, X, KeyRound } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './Responsaveis.css';

export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'nome', direcao: 'asc' });

  useEffect(() => {
    async function fetchPerfil() {
      try {
        const { data } = await api.get('/api/me');
        setPerfilUsuario(data.perfil);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      }
    }
    fetchPerfil();
  }, []);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [resResp, resGrupos] = await Promise.all([
      api.get('/api/responsaveis/'),
      api.get('/api/grupos/')
    ]);
    setResponsaveis(resResp.data.results || resResp.data);
    setGrupos(resGrupos.data.results || resGrupos.data);
  };

  const editar = (r) => {
    setEditandoId(r.id);
    setDadosEditados({
      usuario: r.usuario,
      nome: r.nome,
      email: r.email,
      ramal: r.ramal,
      grupo: r.grupo,
      perfil: r.perfil,
      status: r.status || 'SIM'
    });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const resetarSenha = async (username) => {
    if (!window.confirm("Confirma resetar a senha deste usuário para 'Mudar123'?")) return;
    try {
      await api.post(`/api/usuarios/${username}/reset-password/`);
      alert("Senha redefinida para: Mudar123");
    } catch (err) {
      console.error("Erro ao resetar senha:", err.response?.data || err);
      alert("Erro ao resetar senha.");
    }
  };

  const alternarStatus = async (r) => {
    const novoStatus = r.status === "SIM" ? "NÃO" : "SIM";
    if (!window.confirm(`Confirma ${novoStatus === "NÃO" ? "inativar" : "reativar"} este responsável?`)) return;

    try {
      await api.put(`/api/responsaveis/${r.id}/`, { ...r, status: novoStatus });
      carregarDados();
    } catch (err) {
      console.error("Erro ao atualizar status:", err.response?.data || err);
      alert("Erro ao atualizar status do responsável.");
    }
  };

  const salvar = async (id) => {
    const payload = {
      usuario: dadosEditados.usuario.trim(),
      nome: dadosEditados.nome.trim(),
      email: dadosEditados.email.trim(),
      ramal: dadosEditados.ramal?.trim() || null,
      grupo: dadosEditados.grupo ? Number(dadosEditados.grupo) : null,
      perfil: dadosEditados.perfil,
      status: dadosEditados.status || 'SIM'
    };

    try {
      if (id === 'novo') {
        const res = await api.post('/api/responsaveis/', payload);
        setResponsaveis(prev => [{ ...res.data, __novo: true }, ...prev]);
      } else {
        await api.put(`/api/responsaveis/${id}/`, payload);
      }
      setEditandoId(null);
      setDadosEditados({});
      carregarDados();
    } catch (err) {
      console.error("Erro ao salvar responsável:", err.response?.data || err);
      alert("Erro ao salvar responsável.");
    }
  };

  const novo = () => {
    setEditandoId('novo');
    setDadosEditados({
      usuario: '',
      nome: '',
      email: '',
      ramal: '',
      grupo: null,
      perfil: 'especialista',
      status: 'SIM'
    });
  };

  const handleOrdenar = (campo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const responsaveisVisiveis = useMemo(() => {
    const novos = responsaveis.filter(r => r.__novo);
    let lista = responsaveis.filter(r => !r.__novo);

    if (filtro) {
      const f = filtro.toUpperCase();
      lista = lista.filter(r =>
        (r.usuario || '').toUpperCase().includes(f) ||
        (r.nome || '').toUpperCase().includes(f) ||
        (r.email || '').toUpperCase().includes(f)
      );
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
  }, [responsaveis, filtro, ordenacao]);

  return (
    <div className="responsaveis-container">
      <div className="responsaveis-header">
        <h2>Responsáveis</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Responsável">
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* filtro */}
      <div className="filtro-nome">
        <input
          type="text"
          placeholder="Filtrar por usuário, nome ou email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th className="col-usuario" onClick={() => handleOrdenar("usuario")}>Usuário</th>
            <th className="col-nome" onClick={() => handleOrdenar("nome")}>Nome</th>
            <th className="col-email" onClick={() => handleOrdenar("email")}>Email</th>
            <th className="col-ramal" onClick={() => handleOrdenar("ramal")}>Ramal</th>
            <th className="col-grupo" onClick={() => handleOrdenar("grupo_nome")}>Grupo</th>
            <th className="col-status" onClick={() => handleOrdenar("status")}>Ativo</th>
            <th className="col-perfil" onClick={() => handleOrdenar("perfil")}>Perfil</th>
            <th className="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          {/* linha de novo */}
          {editandoId === "novo" && (
            <tr>
              <td><input value={dadosEditados.usuario} onChange={e => setDadosEditados({ ...dadosEditados, usuario: e.target.value })} /></td>
              <td><input value={dadosEditados.nome} onChange={e => setDadosEditados({ ...dadosEditados, nome: e.target.value })} /></td>
              <td><input value={dadosEditados.email} onChange={e => setDadosEditados({ ...dadosEditados, email: e.target.value })} /></td>
              <td><input value={dadosEditados.ramal} onChange={e => setDadosEditados({ ...dadosEditados, ramal: e.target.value })} /></td>
              <td>
                <select value={dadosEditados.grupo || ''} onChange={e => setDadosEditados({ ...dadosEditados, grupo: e.target.value })}>
                  <option value="">--</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </td>
              <td>
                <select value={dadosEditados.status} onChange={e => setDadosEditados({ ...dadosEditados, status: e.target.value })}>
                  <option value="SIM">SIM</option>
                  <option value="NÃO">NÃO</option>
                </select>
              </td>
              <td>
                <select value={dadosEditados.perfil} onChange={e => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}>
                  <option value="admin">admin</option>
                  <option value="especialista">especialista</option>
                  <option value="especialista_senior">especialista_senior</option>
                  <option value="coordenador">coordenador</option>
                </select>
              </td>
              <td className="acoes">
                <button onClick={() => salvar("novo")}><Check size={16} /></button>
                <button onClick={cancelar}><X size={16} /></button>
              </td>
            </tr>
          )}

          {/* linhas existentes */}
          {responsaveisVisiveis.map(r => (
            <tr key={r.id}>
              {editandoId === r.id ? (
                <>
                  <td className="col-usuario">
                    <input
                      value={dadosEditados.usuario}
                      onChange={e => setDadosEditados({ ...dadosEditados, usuario: e.target.value })}
                    />
                  </td>
                  <td className="col-nome">
                    <input
                      value={dadosEditados.nome}
                      onChange={e => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                    />
                  </td>
                  <td className="col-email">
                    <input
                      value={dadosEditados.email}
                      onChange={e => setDadosEditados({ ...dadosEditados, email: e.target.value })}
                    />
                  </td>
                  <td className="col-ramal">
                    <input
                      value={dadosEditados.ramal || ''}
                      onChange={e => setDadosEditados({ ...dadosEditados, ramal: e.target.value })}
                    />
                  </td>
                  <td className="col-grupo">
                    <select
                      value={dadosEditados.grupo || ''}
                      onChange={e => setDadosEditados({ ...dadosEditados, grupo: e.target.value })}
                    >
                      <option value="">--</option>
                      {grupos.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-status">
                    <select
                      value={dadosEditados.status}
                      onChange={e => setDadosEditados({ ...dadosEditados, status: e.target.value })}
                    >
                      <option value="SIM">SIM</option>
                      <option value="NÃO">NÃO</option>
                    </select>
                  </td>
                  <td className="col-perfil">
                    <select
                      value={dadosEditados.perfil}
                      onChange={e => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}
                    >
                      <option value="admin">admin</option>
                      <option value="especialista">especialista</option>
                      <option value="especialista_senior">especialista_senior</option>
                      <option value="coordenador">coordenador</option>
                    </select>
                  </td>
                  <td className="acoes">
                    <button onClick={() => salvar(r.id)}><Check size={16} /></button>
                    <button onClick={cancelar}><X size={16} /></button>
                  </td>
                </>

              ) : (
                <>
                  <td>{r.usuario}</td>
                  <td className='col-nome'>{r.nome}</td>
                  <td>{r.email}</td>
                  <td>{r.ramal || '-'}</td>
                  <td>{r.grupo_nome || '-'}</td>
                  {/* <td>{r.status || '-'}</td> */}
                  <td>
                    <span
                      className={`status-circle ${r.status === "SIM" ? "ativo" : "inativo"}`}
                      title={r.status === "SIM" ? "Ativo - clique para inativar" : "Inativo - clique para reativar"}
                      onClick={() => alternarStatus(r)}
                    />
                  </td>

                  <td>{r.perfil}</td>
                  <td className="acoes">
                    {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                      <>
                        <button onClick={() => editar(r)} title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => resetarSenha(r.usuario)} title="Resetar Senha"><KeyRound size={16} /></button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

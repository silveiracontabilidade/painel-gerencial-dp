import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Responsaveis.css';

export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);

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
      perfil: r.perfil
    });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  // const salvar = async (id) => {
  //   const payload = {
  //     usuario: dadosEditados.usuario,
  //     nome: dadosEditados.nome,
  //     email: dadosEditados.email,
  //     ramal: dadosEditados.ramal || null,
  //     grupo: dadosEditados.grupo ? Number(dadosEditados.grupo) : null,
  //     perfil: dadosEditados.perfil
  //   };

  //   if (id === 'novo') {
  //     await api.post('/api/responsaveis/', payload);
  //   } else {
  //     await api.put(`/api/responsaveis/${id}/`, payload);
  //   }
  //   setEditandoId(null);
  //   setDadosEditados({});
  //   carregarDados();
  // };

  const salvar = async (id) => {
    // validação básica antes de enviar
    if (!dadosEditados.usuario || dadosEditados.usuario.trim() === "") {
      alert("O campo Usuário é obrigatório.");
      return;
    }
    if (!dadosEditados.nome || dadosEditados.nome.trim() === "") {
      alert("O campo Nome é obrigatório.");
      return;
    }
    if (!dadosEditados.email || dadosEditados.email.trim() === "") {
      alert("O campo Email é obrigatório.");
      return;
    }
    // regex simples para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dadosEditados.email)) {
      alert("Informe um email válido.");
      return;
    }

    const perfisValidos = ["admin", "especialista", "especialista_senior", "coordenador"];
    if (!perfisValidos.includes(dadosEditados.perfil)) {
      alert("Perfil inválido. Selecione uma opção válida.");
      return;
    }

    const payload = {
      usuario: dadosEditados.usuario.trim(),
      nome: dadosEditados.nome.trim(),
      email: dadosEditados.email.trim(),
      ramal: dadosEditados.ramal?.trim() || null,
      grupo: dadosEditados.grupo ? Number(dadosEditados.grupo) : null,
      perfil: dadosEditados.perfil
    };

    try {
      if (id === 'novo') {
        await api.post('/api/responsaveis/', payload);
      } else {
        await api.put(`/api/responsaveis/${id}/`, payload);
      }

      setEditandoId(null);
      setDadosEditados({});
      carregarDados();
    } catch (err) {
      console.error("Erro ao salvar responsável:", err.response?.data || err);
      if (err.response?.data) {
        // monta mensagens do backend
        const mensagens = Object.entries(err.response.data)
          .map(([campo, msgs]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("\n");
        alert(`Erro ao salvar:\n${mensagens}`);
      } else {
        alert("Erro inesperado ao salvar.");
      }
    }
  };


  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/responsaveis/${id}/`);
      carregarDados();
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
      perfil: 'especialista'
    });
  };

  return (
    <div className="responsaveis-container">
      {/* <div className="responsaveis-header">
        <h2>Responsáveis</h2>
        <button onClick={novo} disabled={editandoId !== null} title="Novo Responsável">
          <Plus size={18} />
        </button>
      </div> */}
      <div className="responsaveis-header">
        <h2>Responsáveis</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Responsável">
            <Plus size={18} />
          </button>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th className="col-usuario">Usuário</th>
            <th className="col-nome">Nome</th>
            <th className="col-email">Email</th>
            <th className="col-ramal">Ramal</th>
            <th className="col-grupo">Grupo</th>
            <th className="col-perfil">Perfil</th>
            <th className="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          {editandoId === 'novo' && (
            <tr>
              <td><input type="text" value={dadosEditados.usuario || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, usuario: e.target.value })} /></td>
              <td><input type="text" value={dadosEditados.nome || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })} /></td>
              <td><input type="email" value={dadosEditados.email || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, email: e.target.value })} /></td>
              <td><input type="text" value={dadosEditados.ramal || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, ramal: e.target.value })} /></td>
              <td>
                <select value={dadosEditados.grupo || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, grupo: e.target.value || null })}>
                  <option value="">-- Nenhum --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </td>
              <td>
                <select value={dadosEditados.perfil} onChange={(e) => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}>
                  <option value="admin">Administrador</option>
                  <option value="especialista">Especialista</option>
                  <option value="especialista_senior">Especialista Senior</option>
                  <option value="coordenador">Coordenador</option>
                </select>
              </td>
              <td className="acoes">
                <button onClick={() => salvar('novo')} title="Salvar"><Check size={16} /></button>
                <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
              </td>
            </tr>
          )}

          {responsaveis.map((r) => (
            <tr key={r.id}>
              <td>{editandoId === r.id ? <input type="text" value={dadosEditados.usuario || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, usuario: e.target.value })} /> : r.usuario}</td>
              <td>{editandoId === r.id ? <input type="text" value={dadosEditados.nome || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })} /> : r.nome}</td>
              <td>{editandoId === r.id ? <input type="email" value={dadosEditados.email || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, email: e.target.value })} /> : r.email}</td>
              <td>{editandoId === r.id ? <input type="text" value={dadosEditados.ramal || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, ramal: e.target.value })} /> : (r.ramal || '-')}</td>
              <td>
                {editandoId === r.id ? (
                  <select value={dadosEditados.grupo || ''} onChange={(e) => setDadosEditados({ ...dadosEditados, grupo: e.target.value || null })}>
                    <option value="">-- Nenhum --</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                  </select>
                ) : (r.grupo_nome || '-')}
              </td>
              <td>
                {editandoId === r.id ? (
                  <select value={dadosEditados.perfil} onChange={(e) => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}>
                    <option value="admin">Administrador</option>
                    <option value="especialista">Especialista</option>
                    <option value="especialista_senior">Especialista Senior</option>
                    <option value="coordenador">Coordenador</option>
                  </select>
                ) : r.perfil}
              </td>
              <td className="acoes">
                {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                  editandoId === r.id ? (
                    <>
                      <button onClick={() => salvar(r.id)} title="Salvar"><Check size={16} /></button>
                      <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editar(r)} title="Editar"><Pencil size={16} /></button>
                      <button onClick={() => excluir(r.id)} title="Excluir"><Trash2 size={16} /></button>
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

import { Plus, Pencil, Trash2, Check, X, KeyRound, Lock } from 'lucide-react';
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

  // 🔑 Reset de senha pelo admin (Mudar123)
  // const resetarSenha = async (id) => {
  //   if (!window.confirm("Confirma resetar a senha deste usuário para 'Mudar123'?")) return;
  //   try {
  //     await api.post(`/api/usuarios/${id}/reset-password/`);
  //     alert("Senha redefinida para: Mudar123");
  //   } catch (err) {
  //     console.error("Erro ao resetar senha:", err.response?.data || err);
  //     alert("Erro ao resetar senha.");
  //   }
  // };
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

  // 🔒 Troca de senha do usuário logado
  const trocarMinhaSenha = async () => {
    const old_password = prompt("Digite sua senha atual:");
    if (!old_password) return;
    const new_password = prompt("Digite a nova senha:");
    if (!new_password) return;

    try {
      await api.put("/api/change-password/", { old_password, new_password });
      alert("Senha alterada com sucesso!");
    } catch (err) {
      console.error("Erro ao alterar senha:", err.response?.data || err);
      alert("Erro ao alterar senha.");
    }
  };

  const salvar = async (id) => {
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
      <div className="responsaveis-header">
        <h2>Responsáveis</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Responsável">
            <Plus size={18} />
          </button>
        )}
        {/* Botão para trocar a senha do usuário logado */}
        <button onClick={trocarMinhaSenha} title="Trocar minha senha">
          <Lock size={18} />
        </button>
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
          {responsaveis.map((r) => (
            <tr key={r.id}>
              <td>{r.usuario}</td>
              <td>{r.nome}</td>
              <td>{r.email}</td>
              <td>{r.ramal || '-'}</td>
              <td>{r.grupo_nome || '-'}</td>
              <td>{r.perfil}</td>
              <td className="acoes">
                {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                  <>
                    <button onClick={() => editar(r)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(r.id)} title="Excluir"><Trash2 size={16} /></button>
                    
                    <button onClick={() => resetarSenha(r.usuario)} title="Resetar Senha">
                      <KeyRound size={16} />
                    </button>
                    
                  </>
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

import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Grupos.css';

export default function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const [resGrupos, resResponsaveis] = await Promise.all([
      api.get('/api/grupos/'),
      api.get('/api/responsaveis/')
    ]);
    // setGrupos(resGrupos.data);
    setGrupos(resGrupos.data.results || resGrupos.data); // compatível com ambos os formatos
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
    carregarDados();
    setEditandoId(res.data.id);
    setDadosEditados(novoGrupo);
  };

  return (
    <div className="grupos-container">
      <div className="grupos-header">
        <h2>Grupos Gerenciais</h2>
        <button onClick={novo} disabled={editandoId !== null} title="Novo Grupo">
          <Plus size={18} />
        </button>
        {/* <button onClick={novo} disabled={editandoId !== null}>Novo Grupo</button> */}
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Coordenadora</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo) => (
            <tr key={grupo.id}>
              <td>
                {editandoId === grupo.id ? (
                  <input
                    value={dadosEditados.nome}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                  />
                ) : (
                  grupo.nome
                )}
              </td>
              <td>
                {editandoId === grupo.id ? (
                  <select
                    value={dadosEditados.coordenadora || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, coordenadora: e.target.value || null })}
                  >
                    <option value="">-- Nenhuma --</option>
                    {responsaveis.map(r => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                ) : (
                  grupo.coordenadora_nome || '-'
                )}
              </td>
             <td className="acoes">
                {editandoId === grupo.id ? (
                  <>
                    <button onClick={() => salvar(grupo.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(grupo)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(grupo.id)} title="Excluir"><Trash2 size={16} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

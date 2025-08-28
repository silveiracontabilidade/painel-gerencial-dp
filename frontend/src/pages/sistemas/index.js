import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './sistemas.css';

export default function Sistemas() {
  const [sistemas, setSistemas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

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
    await api.put(`/api/sistemas/${id}/`, dadosEditados);
    setEditandoId(null);
    setDadosEditados({});
    carregarDados();
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/sistemas/${id}/`);
      carregarDados();
    }
  };

  const novo = async () => {
    const novoSistema = { nome: 'Novo Sistema' };
    const res = await api.post('/api/sistemas/', novoSistema);
    carregarDados();
    setEditandoId(res.data.id);
    setDadosEditados(novoSistema);
  };

  return (
    <div className="sistemas-container">
      <div className="sistemas-header">
        <h2>Sistemas</h2>
        <button onClick={novo} disabled={editandoId !== null} title="Novo Sistema">
          <Plus size={18} />
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sistemas.map((sistema) => (
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
                {editandoId === sistema.id ? (
                  <>
                    <button onClick={() => salvar(sistema.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(sistema)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(sistema.id)} title="Excluir"><Trash2 size={16} /></button>
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

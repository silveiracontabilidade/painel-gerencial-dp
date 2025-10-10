import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './periodos.css';

export default function PeriodosEntrega() {
  const [periodos, setPeriodos] = useState([]);
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
    const res = await api.get('/api/periodos-entrega/');
    setPeriodos(res.data.results || res.data);
  };

  const editar = (periodo) => {
    setEditandoId(periodo.id);
    setDadosEditados({ dia: periodo.dia, tipo: periodo.tipo });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
    carregarDados(); // remove linha "novo" se cancelar
  };

  const salvar = async (id) => {
    try {
      if (id === 'novo') {
        await api.post('/api/periodos-entrega/', dadosEditados);
      } else {
        await api.put(`/api/periodos-entrega/${id}/`, dadosEditados);
      }
      setEditandoId(null);
      setDadosEditados({});
      carregarDados();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        // Pega a mensagem do backend (já vem traduzida pelo DRF)
        const msg = Object.values(err.response.data).flat().join('\n');
        alert(`Erro ao salvar: ${msg}`);
      } else {
        console.error(err);
        alert('Erro inesperado ao salvar o período.');
      }
    }
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/periodos-entrega/${id}/`);
      carregarDados();
    }
  };

  const novo = () => {
    if (editandoId) return; // impede novo enquanto está editando
    const novoPeriodo = { id: 'novo', dia: '', tipo: 'DIA', descricao: '' };
    setPeriodos([novoPeriodo, ...periodos]);
    setEditandoId('novo');
    setDadosEditados(novoPeriodo);
  };

  return (
    <div className="periodos-container">
      <div className="periodos-header">
        <h2>Períodos de Entrega</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Período">
            <Plus size={18} />
          </button>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {periodos.map((p) => (
            <tr key={p.id}>
              <td>
                {editandoId === p.id ? (
                  <input
                    type="number"
                    value={dadosEditados.dia}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, dia: e.target.value })}
                  />
                ) : (
                  p.dia
                )}
              </td>
              <td>
                {editandoId === p.id ? (
                  <select
                    value={dadosEditados.tipo}
                    onChange={(e) =>
                      setDadosEditados({ ...dadosEditados, tipo: e.target.value })
                    }
                  >
                    <option value="DIA">Dia Corrido</option>
                    <option value="DIA_UTIL">Dia Útil</option>
                    <option value="DIAS_ANTES">Dias Antes</option> {/* 👈 novo */}
                  </select>
                ) : (
                  p.tipo === 'DIA_UTIL'
                    ? 'Dia Útil'
                    : p.tipo === 'DIAS_ANTES'
                    ? `${p.dia} dias antes`
                    : 'Dia Corrido'
                )}
              </td>
              <td>{p.descricao}</td>
              <td className="acoes">
                {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                  editandoId === p.id ? (
                    <>
                      <button onClick={() => salvar(p.id)} title="Salvar"><Check size={16} /></button>
                      <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editar(p)} title="Editar"><Pencil size={16} /></button>
                      <button onClick={() => excluir(p.id)} title="Excluir"><Trash2 size={16} /></button>
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

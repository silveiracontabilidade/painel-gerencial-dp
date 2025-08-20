import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Servicos.css';

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    const res = await api.get('/api/servicos/');
    const dadosFormatados = (res.data.results || res.data).map(s => ({
      ...s,
      tempo_execucao: s.tempo_execucao?.slice(0, 5) || '00:00', // "hh:mm:ss" → "hh:mm"
    }));
    setServicos(dadosFormatados);
  };

  const editar = (servico) => {
    setEditandoId(servico.id);
    setDadosEditados({ ...servico });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvar = async (id) => {
    const payload = {
      ...dadosEditados,
      tempo_execucao: dadosEditados.tempo_execucao + ':00', // "hh:mm" → "hh:mm:ss"
    };
    await api.put(`/api/servicos/${id}/`, payload);
    cancelar();
    carregarServicos();
  };

  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/servicos/${id}/`);
      carregarServicos();
    }
  };

  const novo = async () => {
    const novoServico = { nome: 'Novo Serviço', prazo_dias: 0, tempo_execucao: '00:00' };
    const res = await api.post('/api/servicos/', { ...novoServico, tempo_execucao: '00:00:00' });
    setEditandoId(res.data.id);
    setDadosEditados(novoServico);
    carregarServicos();
  };

  return (
    <div className="servicos-container">
      <div className="servicos-header">
        <h2>Serviços</h2>
        <button onClick={novo} disabled={editandoId !== null}>
          <Plus size={18} />
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th className="col-nome">Nome</th>
            <th className="col-prazo">Prazo (dias)</th>
            <th className="col-tempo">Tempo Execução</th>
            <th className="col-acoes">Ações</th>
          </tr>
        </thead>
        <tbody>
          {servicos.map(servico => (
            <tr key={servico.id}>
              <td>
                {editandoId === servico.id ? (
                  <input
                    value={dadosEditados.nome}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                  />
                ) : (
                  servico.nome
                )}
              </td>
              <td>
                {editandoId === servico.id ? (
                  <input
                    type="number"
                    value={dadosEditados.prazo_dias}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, prazo_dias: e.target.value })}
                  />
                ) : (
                  servico.prazo_dias
                )}
              </td>
              <td>
                {editandoId === servico.id ? (
                  <input
                    type="time"
                    value={dadosEditados.tempo_execucao}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, tempo_execucao: e.target.value })}
                  />
                ) : (
                  servico.tempo_execucao
                )}
              </td>
              <td className="acoes">
                {editandoId === servico.id ? (
                  <>
                    <button onClick={() => salvar(servico.id)}><Check size={16} /></button>
                    <button onClick={cancelar}><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(servico)}><Pencil size={16} /></button>
                    <button onClick={() => excluir(servico.id)}><Trash2 size={16} /></button>
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



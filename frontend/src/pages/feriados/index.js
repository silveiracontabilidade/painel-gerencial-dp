import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import api from '../../api/axios';
import './feriados.css';

export default function Feriados() {
  const [feriados, setFeriados] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      const res = await api.get('/api/feriados/', { params: { page_size: 500 } });
      setFeriados(res.data.results || res.data);
    } catch (err) {
      console.error('Erro ao carregar feriados:', err);
      alert('Não foi possível carregar feriados.');
    }
  };

  const novo = () => {
    setEditandoId('novo');
    setDadosEditados({
      data: '',
      descricao: '',
      uf: '',
      municipio: '',
    });
  };

  const editar = (feriado) => {
    setEditandoId(feriado.id);
    setDadosEditados({
      data: feriado.data || '',
      descricao: feriado.descricao || '',
      uf: feriado.uf || '',
      municipio: feriado.municipio || '',
    });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvar = async (id) => {
    const payload = {
      data: dadosEditados.data,
      descricao: dadosEditados.descricao?.trim() || '',
      uf: dadosEditados.uf?.toUpperCase() || '',
      municipio: dadosEditados.municipio?.trim() || '',
    };
    if (!payload.data || !payload.descricao) {
      alert('Data e descrição são obrigatórias.');
      return;
    }
    try {
      if (id === 'novo') {
        await api.post('/api/feriados/', payload);
      } else {
        await api.put(`/api/feriados/${id}/`, payload);
      }
      setEditandoId(null);
      setDadosEditados({});
      carregar();
    } catch (err) {
      console.error('Erro ao salvar feriado:', err.response?.data || err);
      alert('Erro ao salvar feriado.');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Confirma exclusão do feriado?')) return;
    try {
      await api.delete(`/api/feriados/${id}/`);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir feriado:', err.response?.data || err);
      alert('Erro ao excluir feriado.');
    }
  };

  const feriadosOrdenados = useMemo(
    () =>
      [...feriados].sort((a, b) => (a.data || '').localeCompare(b.data || '')),
    [feriados]
  );

  return (
    <div className="feriados-container">
      <div className="feriados-header">
        <h2>Feriados</h2>
        <button onClick={novo} disabled={editandoId !== null}>
          <Plus size={16} /> Novo
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>UF</th>
            <th>Município</th>
            <th className="acoes-col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {editandoId === 'novo' && (
            <tr>
              <td>
                <input
                  type="date"
                  value={dadosEditados.data}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, data: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={dadosEditados.descricao}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, descricao: e.target.value })}
                  placeholder="Descrição"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={dadosEditados.uf}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, uf: e.target.value })}
                  maxLength={2}
                  placeholder="UF"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={dadosEditados.municipio}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, municipio: e.target.value })}
                  placeholder="Município"
                />
              </td>
              <td className="acoes">
                <button onClick={() => salvar('novo')} title="Salvar"><Check size={16} /></button>
                <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
              </td>
            </tr>
          )}

          {feriadosOrdenados.map((feriado) => (
            <tr key={feriado.id}>
              <td>
                {editandoId === feriado.id ? (
                  <input
                    type="date"
                    value={dadosEditados.data}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, data: e.target.value })}
                  />
                ) : (
                  feriado.data
                )}
              </td>
              <td>
                {editandoId === feriado.id ? (
                  <input
                    type="text"
                    value={dadosEditados.descricao}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, descricao: e.target.value })}
                  />
                ) : (
                  feriado.descricao
                )}
              </td>
              <td>
                {editandoId === feriado.id ? (
                  <input
                    type="text"
                    value={dadosEditados.uf}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, uf: e.target.value })}
                    maxLength={2}
                  />
                ) : (
                  feriado.uf || '—'
                )}
              </td>
              <td>
                {editandoId === feriado.id ? (
                  <input
                    type="text"
                    value={dadosEditados.municipio}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, municipio: e.target.value })}
                  />
                ) : (
                  feriado.municipio || '—'
                )}
              </td>
              <td className="acoes">
                {editandoId === feriado.id ? (
                  <>
                    <button onClick={() => salvar(feriado.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(feriado)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(feriado.id)} title="Excluir"><Trash2 size={16} /></button>
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

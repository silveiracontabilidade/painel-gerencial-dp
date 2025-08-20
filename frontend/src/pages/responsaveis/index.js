import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Responsaveis.css';

export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});

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

  const salvar = async (id) => {
    if (id === 'novo') {
      await api.post('/api/responsaveis/', dadosEditados);
    } else {
      await api.put(`/api/responsaveis/${id}/`, dadosEditados);
    }
    setEditandoId(null);
    setDadosEditados({});
    carregarDados();
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
      perfil: 'operador'
    });
  };

  return (
    <div className="responsaveis-container">
      <div className="responsaveis-header">
        <h2>Responsáveis</h2>
        <button onClick={novo} disabled={editandoId !== null} title="Novo Responsável">
          <Plus size={18} />
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
          {editandoId === 'novo' && (
            <tr>
              <td className="col-usuario">
                <input
                  type="text"
                  value={dadosEditados.usuario || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, usuario: e.target.value })}
                />
              </td>
              <td className="col-nome">
                <input
                  type="text"
                  value={dadosEditados.nome || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                />
              </td>
              <td className="col-email">
                <input
                  type="text"
                  value={dadosEditados.email || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, email: e.target.value })}
                />
              </td>
              <td className="col-ramal">
                <input
                  type="text"
                  value={dadosEditados.ramal || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, ramal: e.target.value })}
                />
              </td>
              <td className="col-grupo">
                <select
                  value={dadosEditados.grupo || ''}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, grupo: e.target.value || null })}
                >
                  <option value="">-- Nenhum --</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>{g.nome}</option>
                  ))}
                </select>
              </td>
              <td className="col-perfil">
                <select
                  value={dadosEditados.perfil}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="operador">Operador</option>
                </select>
              </td>
              <td className="col-acoes acoes">
                <button onClick={() => salvar('novo')} title="Salvar"><Check size={16} /></button>
                <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
              </td>
            </tr>
          )}

          {responsaveis.map((r) => (
            <tr key={r.id}>
              <td className="col-usuario">
                {editandoId === r.id ? (
                  <input
                    type="text"
                    value={dadosEditados.usuario || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, usuario: e.target.value })}
                  />
                ) : (
                  r.usuario
                )}
              </td>
              <td className="col-nome">
                {editandoId === r.id ? (
                  <input
                    type="text"
                    value={dadosEditados.nome || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                  />
                ) : (
                  r.nome
                )}
              </td>
              <td className="col-email">
                {editandoId === r.id ? (
                  <input
                    type="text"
                    value={dadosEditados.email || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, email: e.target.value })}
                  />
                ) : (
                  r.email
                )}
              </td>
              <td className="col-ramal">
                {editandoId === r.id ? (
                  <input
                    type="text"
                    value={dadosEditados.ramal || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, ramal: e.target.value })}
                  />
                ) : (
                  r.ramal || '-'
                )}
              </td>
              <td className="col-grupo">
                {editandoId === r.id ? (
                  <select
                    value={dadosEditados.grupo || ''}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, grupo: e.target.value || null })}
                  >
                    <option value="">-- Nenhum --</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>{g.nome}</option>
                    ))}
                  </select>
                ) : (
                  r.grupo_nome || '-'
                )}
              </td>
              <td className="col-perfil">
                {editandoId === r.id ? (
                  <select
                    value={dadosEditados.perfil}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, perfil: e.target.value })}
                  >
                    <option value="admin">Administrador</option>
                    <option value="operador">Coordenador</option>
                    <option value="operador">Operador</option>
                  </select>
                ) : (
                  r.perfil
                )}
              </td>
              <td className="col-acoes acoes">
                {editandoId === r.id ? (
                  <>
                    <button onClick={() => salvar(r.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(r)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(r.id)} title="Excluir"><Trash2 size={16} /></button>
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

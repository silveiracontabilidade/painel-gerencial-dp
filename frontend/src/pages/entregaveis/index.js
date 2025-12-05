import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardList, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import './entregaveis.css';

export default function Entregaveis() {
  const [entregaveis, setEntregaveis] = useState([]);
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
    try {
      const res = await api.get('/api/entregaveis/', { params: { page_size: 500 } });
      setEntregaveis(res.data.results || res.data);
    } catch (err) {
      console.error('Erro ao carregar entregáveis:', err);
      alert('Não foi possível carregar os entregáveis.');
    }
  };

  const novo = () => {
    setEditandoId('novo');
    setDadosEditados({
      nome: '',
      descricao: '',
      periodo_entrega: '',
    });
  };

  const editar = (registro) => {
    setEditandoId(registro.id);
    setDadosEditados({
      nome: registro.nome || '',
      descricao: registro.descricao || '',
      periodo_entrega: registro.periodo_entrega || '',
    });
  };

  const cancelar = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvar = async (id) => {
    const payload = {
      nome: (dadosEditados.nome || '').trim(),
      descricao: (dadosEditados.descricao || '').trim(),
      periodo_entrega: (dadosEditados.periodo_entrega || '').trim(),
    };

    if (!payload.nome) {
      alert('O nome do entregável é obrigatório.');
      return;
    }

    try {
      if (id === 'novo') {
        const res = await api.post('/api/entregaveis/', payload);
        setEntregaveis((prev) => [{ ...res.data, __novo: true }, ...prev]);
      } else {
        await api.put(`/api/entregaveis/${id}/`, payload);
      }
      setEditandoId(null);
      setDadosEditados({});
      await carregarDados();
    } catch (err) {
      console.error('Erro ao salvar entregável:', err.response?.data || err);
      alert('Erro ao salvar entregável.');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Confirma a exclusão do entregável?')) return;
    try {
      await api.delete(`/api/entregaveis/${id}/`);
      await carregarDados();
    } catch (err) {
      console.error('Erro ao excluir entregável:', err.response?.data || err);
      alert('Erro ao excluir entregável.');
    }
  };

  const handleOrdenar = (campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
  };

  const entregaveisVisiveis = useMemo(() => {
    const novos = entregaveis.filter((e) => e.__novo);
    let lista = entregaveis.filter((e) => !e.__novo);

    if (filtro) {
      const f = filtro.toUpperCase();
      lista = lista.filter((item) => {
        const nome = (item.nome || '').toUpperCase();
        const periodo = (item.periodo_entrega || '').toUpperCase();
        const desc = (item.descricao || '').toUpperCase();
        return nome.includes(f) || periodo.includes(f) || desc.includes(f);
      });
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
  }, [entregaveis, filtro, ordenacao]);

  const podeEditar = perfilUsuario === 'admin' || perfilUsuario === 'coordenador';

  return (
    <div className="entregaveis-container">
      <div className="entregaveis-header">
        <div className="entregaveis-header__titles">
          <h2>Entregáveis</h2>
          <p>Cadastro informativo para consulta rápida no topo</p>
        </div>
        {podeEditar && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo entregável">
            <Plus size={16} />
            <span>Novo</span>
          </button>
        )}
      </div>

      <div className="entregaveis-filtros">
        <input
          type="text"
          placeholder="Filtrar por nome, período ou descrição..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="legenda">
          <ClipboardList size={14} /> <span>Use este cadastro para alimentar a consulta rápida do menu.</span>
        </div>
      </div>

      <div className="entregaveis-tabela-wrapper">
        <table className="entregaveis-tabela">
          <thead>
            <tr>
              <th
                onClick={() => handleOrdenar('nome')}
                className={ordenacao.campo === 'nome' ? `ord-${ordenacao.direcao}` : ''}
              >
                Nome
              </th>
              <th
                onClick={() => handleOrdenar('periodo_entrega')}
                className={ordenacao.campo === 'periodo_entrega' ? `ord-${ordenacao.direcao}` : ''}
              >
                Período de entrega
              </th>
              <th>Descrição</th>
              <th className="acoes-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {editandoId === 'novo' && (
              <tr>
                <td>
                  <input
                    type="text"
                    value={dadosEditados.nome}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                    placeholder="Nome do entregável"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={dadosEditados.periodo_entrega}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, periodo_entrega: e.target.value })}
                    placeholder="Ex.: 5º dia útil"
                  />
                </td>
                <td>
                  <textarea
                    value={dadosEditados.descricao}
                    onChange={(e) => setDadosEditados({ ...dadosEditados, descricao: e.target.value })}
                    placeholder="Descrição ou observações"
                  />
                </td>
                <td className="acoes">
                  <button onClick={() => salvar('novo')} title="Salvar">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelar} title="Cancelar">
                    <X size={16} />
                  </button>
                </td>
              </tr>
            )}

            {entregaveisVisiveis.map((item) => (
              <tr key={item.id}>
                <td>
                  {editandoId === item.id ? (
                    <input
                      type="text"
                      value={dadosEditados.nome}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                    />
                  ) : (
                    item.nome
                  )}
                </td>
                <td>
                  {editandoId === item.id ? (
                    <input
                      type="text"
                      value={dadosEditados.periodo_entrega}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, periodo_entrega: e.target.value })}
                    />
                  ) : (
                    item.periodo_entrega || '-'
                  )}
                </td>
                <td>
                  {editandoId === item.id ? (
                    <textarea
                      value={dadosEditados.descricao}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, descricao: e.target.value })}
                    />
                  ) : (
                    <div className="descricao-texto">{item.descricao || '-'}</div>
                  )}
                </td>
                <td className="acoes">
                  {podeEditar ? (
                    editandoId === item.id ? (
                      <>
                        <button onClick={() => salvar(item.id)} title="Salvar">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelar} title="Cancelar">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => editar(item)} title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => excluir(item.id)} title="Excluir">
                          <Trash2 size={16} />
                        </button>
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
    </div>
  );
}

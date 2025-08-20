import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import api from '../../api/axios';
import './Agenda.css';

export default function AgendaBase() {
  const [itens, setItens] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dados, setDados] = useState({
    periodo: '',
    dia: '',
    mes: '',
    nome: '',
    descricao: '',
    responsabilidade: '',
    observacao: ''
  });

  const periodos = ['mensal', 'semestral', 'anual'];
  const ID_TEMP = 'novo';            // id fictício para a linha provisória

  useEffect(() => {
    carregarItens();
  }, []);

  const carregarItens = async () => {
    const res = await api.get('/api/agenda-base/');
    setItens(res.data.results || res.data);
  };

  /* ---------- fluxo “+ Novo” ---------- */
  const novo = () => {
    const linhaVazia = {
      id: ID_TEMP,
      periodo: '',
      dia: '',
      mes: '',
      nome: '',
      descricao: '',
      responsabilidade: '',
      observacao: ''
    };
    setItens([linhaVazia, ...itens]);
    setEditandoId(ID_TEMP);
    setDados(linhaVazia);
  };

  /* ---------- editar / cancelar ---------- */
  // const editar = (item) => {
  //   setEditandoId(item.id);
  //   setDados({...item, periodo: (item.periodo || '').toLowercase().trim()});
  // };

  const editar = (item) => {
  setEditandoId(item.id);
  setDados({
    ...item,
    periodo: (item.periodo || '').toLowerCase().trim(), // 👈 normaliza
    });
  };

  const cancelar = () => {
    // se era o item “novo”, tira-o da tabela
    if (editandoId === ID_TEMP) {
      setItens(itens.filter((i) => i.id !== ID_TEMP));
    }
    setEditandoId(null);
    setDados({
      periodo: '',
      dia: '',
      mes: '',
      nome: '',
      descricao: '',
      responsabilidade: '',
      observacao: ''
    });
  };

  const salvar = async (id) => {
  if (!dados.periodo || !dados.dia || !dados.nome || !dados.descricao || !dados.responsabilidade) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  // if (dados.periodo === 'mensal' && !dados.mes) {
  //   alert('O campo "Mês" é obrigatório quando o período for "mensal".');
  //   return;
  // }

  // exigir mês apenas quando NÃO for mensal
  if (dados.periodo !== 'mensal' && (dados.mes === '' || dados.mes === null)) {
    alert('O campo "Mês" é obrigatório quando o período for semestral ou anual.');
    return;
  }
  const payload = {
    // periodo: dados.periodo,
    periodo: (dados.periodo || '').toLowerCase().trim(),
    dia: dados.dia,
    nome: dados.nome,
    descricao: dados.descricao,
    responsabilidade: dados.responsabilidade,
    observacao: dados.observacao
  };

  // só envia o campo mes se o período for diferente de 'mensal'
  // if (dados.periodo !== 'mensal') {
  //   payload.mes = dados.mes === '' ? null : parseInt(dados.mes);
  // } else {
  //   payload.mes = null;
  // }

  // montar payload.mes
  if (dados.periodo === 'mensal') {
    payload.mes = null; // 👈 mensal => mes = null
  } else {
    payload.mes = dados.mes === '' ? null : parseInt(dados.mes, 10);
  }

  try {
    if (id === 'novo') {
      await api.post('/api/agenda-base/', payload);
    } else {
      await api.put(`/api/agenda-base/${id}/`, payload);
    }
    setEditandoId(null);
    carregarItens();
  } catch (err) {
    console.error('Erro ao salvar:', err.response?.data || err.message);
    alert('Erro ao salvar. Verifique os campos.');
  }
};


  /* ---------- excluir ---------- */
  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/agenda-base/${id}/`);
      carregarItens();
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="agenda-container">
      <div className="agenda-header">
        <h2>Agenda Base</h2>
        <button onClick={novo} disabled={editandoId !== null}>
          <Plus size={18} />
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Período</th><th>Dia</th><th>Mês</th><th>Nome</th>
            <th>Descrição</th><th>Responsável</th><th>Observação</th><th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              {['periodo','dia','mes','nome','descricao','responsabilidade','observacao'].map((campo) => (
                <td key={campo}>
                  {editandoId === item.id ? (
                    campo === 'periodo' ? (
                      <select
                        value={dados.periodo}
                        onChange={(e) => setDados({ ...dados, periodo: e.target.value })}
                      >
                        <option value="">--</option>
                        {periodos.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      ['nome', 'descricao', 'observacao'].includes(campo) ? (
                        <textarea
                          rows={4}
                          style={{ overflowY: 'auto', resize: 'vertical' }}
                          value={dados[campo] ?? ''}
                          onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
                        />
                      ) : (
                        <input
                          type={(campo === 'dia' || campo === 'mes') ? 'number' : 'text'}
                          value={dados[campo] ?? ''}
                          onChange={(e) => setDados({ ...dados, [campo]: e.target.value })}
                        />
                      )
                    )
                  ) : (
                    item[campo] || '-'
                  )}
                </td>
              ))}

              <td className="acoes">
                {editandoId === item.id ? (
                  <>
                    <button onClick={() => salvar(item.id)} title="Salvar"><Check size={16} /></button>
                    <button onClick={cancelar} title="Cancelar"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(item)} title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => excluir(item.id)} title="Excluir"><Trash2 size={16} /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {
          }
        </tbody>
      </table>
    </div>
  );
}

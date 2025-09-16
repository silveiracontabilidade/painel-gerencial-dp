import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Servicos.css';

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
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
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    const res = await api.get('/api/servicos/');
    const dadosFormatados = (res.data.results || res.data).map(s => ({
      ...s,
      tempo_execucao: s.tempo_execucao || '00:00', // já vem "HH:MM"
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
    let tempo = dadosEditados.tempo_execucao || "0:00";

    // garante sempre HH:MM
    if (!tempo.includes(":")) tempo = `${tempo}:00`;

    const [h, m] = tempo.split(":");
    const hh = parseInt(h, 10) || 0;
    const mm = parseInt(m, 10) || 0;

    const formatado = `${hh}:${mm.toString().padStart(2, "0")}`;

    const payload = {
      ...dadosEditados,
      tempo_execucao: formatado, // sempre HH:MM:00
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
    const novoServico = { nome: "Novo Serviço", prazo_dias: 0, tempo_execucao: "0:00" };

    const payload = {
      ...novoServico,
      tempo_execucao: "0:00",
    };

    const res = await api.post("/api/servicos/", payload);
    setEditandoId(res.data.id);
    setDadosEditados(novoServico);
    carregarServicos();
  };

  return (
    <div className="servicos-container">
      <div className="servicos-header">
        <h2>Serviços</h2>
        {(perfilUsuario === "admin" || perfilUsuario === "coordenador") && (
          <button onClick={novo} disabled={editandoId !== null} title="Novo Serviço">
            <Plus size={18} />
          </button>
        )}
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
                    type="text"
                    value={dadosEditados.tempo_execucao}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/\D/g, ""); // só dígitos

                      if (valor.length === 0) {
                        setDadosEditados({ ...dadosEditados, tempo_execucao: "" });
                        return;
                      }

                      if (valor.length <= 2) {
                        // Só horas ainda (ex: "5" → "5")
                        setDadosEditados({ ...dadosEditados, tempo_execucao: valor });
                      } else {
                        const horas = valor.slice(0, -2); // tudo menos os 2 últimos
                        let minutos = valor.slice(-2);

                        if (parseInt(minutos, 10) > 59) minutos = "59";

                        const formatado = `${parseInt(horas, 10)}:${minutos.padStart(2, "0")}`;
                        setDadosEditados({ ...dadosEditados, tempo_execucao: formatado });
                      }
                    }}
                    placeholder="HH:MM"
                  />

                ) : (
                  servico.tempo_execucao
                )}
              </td>
              <td className="acoes">
                {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                  editandoId === servico.id ? (
                    <>
                      <button onClick={() => salvar(servico.id)}><Check size={16} /></button>
                      <button onClick={cancelar}><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => editar(servico)}><Pencil size={16} /></button>
                      <button onClick={() => excluir(servico.id)}><Trash2 size={16} /></button>
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



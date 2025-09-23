// Servicos.js
import { Plus, Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './Servicos.css';

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);

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
      tempo_execucao: s.tempo_execucao || '00:00',
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
    setCarregando(true);
    try {
      const formData = new FormData();
      formData.append("nome", dadosEditados.nome);
      formData.append("prazo_dias", dadosEditados.prazo_dias);
      formData.append("tempo_execucao", dadosEditados.tempo_execucao);

      // checklist
      if (dadosEditados.checklist === "") {
        formData.append("checklist", "");
      } else if (dadosEditados.checklist instanceof File) {
        formData.append("checklist", dadosEditados.checklist);
      }
      // instrucao
      if (dadosEditados.instrucao_trabalho === "") {
        formData.append("instrucao_trabalho", "");
      } else if (dadosEditados.instrucao_trabalho instanceof File) {
        formData.append("instrucao_trabalho", dadosEditados.instrucao_trabalho);
      }
      // video
      if (dadosEditados.video_explicativo === "") {
        formData.append("video_explicativo", "");
      } else if (dadosEditados.video_explicativo instanceof File) {
        formData.append("video_explicativo", dadosEditados.video_explicativo);
      }
      // topico
      if (dadosEditados.topico_rapido === "") {
        formData.append("topico_rapido", "");
      } else if (dadosEditados.topico_rapido instanceof File) {
        formData.append("topico_rapido", dadosEditados.topico_rapido);
      }

      await api.put(`/api/servicos/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      cancelar();
      carregarServicos();
    } finally {
      setCarregando(false);
    }
  };


  const excluir = async (id) => {
    if (window.confirm('Confirma a exclusão?')) {
      await api.delete(`/api/servicos/${id}/`);
      carregarServicos();
    }
  };

  const novo = async () => {
    const formData = new FormData();
    formData.append("nome", "Novo Serviço");
    formData.append("prazo_dias", 0);
    formData.append("tempo_execucao", "00:00");

    const res = await api.post("/api/servicos/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setEditandoId(res.data.id);
    setDadosEditados({
      id: res.data.id,
      nome: "Novo Serviço",
      prazo_dias: 0,
      tempo_execucao: "00:00",
    });
    carregarServicos();
  };


  // helper para renderizar cada campo de anexo
  const renderAnexo = (servico, campo, accept) => {
      // Valor que deve ser exibido: se está editando, usa dadosEditados; senão, usa servico
      const valorAtual = editandoId === servico.id ? dadosEditados[campo] : servico[campo];

      // Função helper para montar a URL corretamente
      const getHref = (valor) => {
        if (!valor) return "#";
        return valor.startsWith("http") ? valor : `/media/${valor}`;
      };

      return editandoId === servico.id ? (
        <>
          <label className="file-upload">
            ...
            <input
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setCarregandoArquivo(true);
                  setDadosEditados({ ...dadosEditados, [campo]: file });
                  setTimeout(() => setCarregandoArquivo(false), 300);
                }
              }}
            />
          </label>

          {valorAtual && !(valorAtual instanceof File) && (
            <>
              <a href={getHref(valorAtual)} target="_blank" rel="noreferrer">
                <FileText size={18} />
              </a>
              <button
                type="button"
                className="anexo-remover"
                onClick={() => setDadosEditados({ ...dadosEditados, [campo]: "" })}
                title="Remover"
              >
                <X size={14} />
              </button>
            </>
          )}

          {valorAtual instanceof File && (
            <span className="file-name">{valorAtual.name}</span>
          )}
        </>
      ) : (
        valorAtual ? (
          <a href={getHref(valorAtual)} target="_blank" rel="noreferrer">
            <FileText size={18} />
          </a>
        ) : "-"
      );
    };


  return (
     <>
    {(carregando || carregandoArquivo) && (
      <div className="modal-backdrop">
        <div className="modal-content">
          <div className="spinner"></div>
          <p>Carregando arquivo, aguarde...</p>
        </div>
      </div>
    )}
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
            <th className="col-anexo">Checklist</th>
            <th className="col-anexo">Instrução</th>
            <th className="col-anexo">Vídeo</th>
            <th className="col-anexo">Tópico Rápido</th>
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
                      let valor = e.target.value.replace(/\D/g, "");
                      if (valor.length === 0) {
                        setDadosEditados({ ...dadosEditados, tempo_execucao: "" });
                        return;
                      }
                      if (valor.length <= 2) {
                        setDadosEditados({ ...dadosEditados, tempo_execucao: valor });
                      } else {
                        const horas = valor.slice(0, -2);
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

              <td className="col-anexo">{renderAnexo(servico, "checklist", "application/pdf")}</td>
              <td className="col-anexo">{renderAnexo(servico, "instrucao_trabalho", "application/pdf")}</td>
              <td className="col-anexo">{renderAnexo(servico, "video_explicativo", "video/*")}</td>
              <td className="col-anexo">{renderAnexo(servico, "topico_rapido", "application/pdf")}</td>

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
  </>
  );     
}




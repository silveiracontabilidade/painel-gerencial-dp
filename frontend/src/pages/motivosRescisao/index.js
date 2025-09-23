// MotivosRescisao.js
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import "./MotivosRescisao.css";

export default function MotivosRescisao() {
  const [motivos, setMotivos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novo, setNovo] = useState({ descricao: "", mensagem: "" });
  const [adicionando, setAdicionando] = useState(false); // controla linha de inclusão
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    try {
      setCarregando(true);
      const { data } = await api.get("/api/motivos-rescisao/");
      setMotivos(data.results || data);
    } catch (err) {
      console.error("Erro ao carregar motivos:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvar = async (motivo) => {
    try {
      if (motivo.id) {
        await api.put(`/api/motivos-rescisao/${motivo.id}/`, motivo);
      } else {
        await api.post("/api/motivos-rescisao/", motivo);
      }
      carregar();
      setEditandoId(null);
      setNovo({ descricao: "", mensagem: "" });
    } catch (err) {
      console.error("Erro ao salvar motivo:", err);
      alert("Erro ao salvar motivo");
    }
  };

  const excluir = async (id) => {
    if (!window.confirm("Confirma excluir este motivo?")) return;
    try {
      await api.delete(`/api/motivos-rescisao/${id}/`);
      carregar();
    } catch (err) {
      console.error("Erro ao excluir motivo:", err);
      alert("Erro ao excluir motivo");
    }
  };

  return (
    <div className="motivos-container">
      <div className="motivos-header">
        <h2>Tipos de Aviso Prévio</h2>
        <button
          onClick={() => {
            setAdicionando(true);
            setNovo({ descricao: "", mensagem: "" });
          }}
          disabled={adicionando} // evita abrir várias linhas
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <table className="motivos-table">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th style={{ width: "250px" }}>Descrição</th>
              <th style={{ minWidth: "400px" }}>Mensagem</th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha de inclusão aparece só quando clicado em "Adicionar" */}
            {adicionando && (
              <tr>
                <td>—</td>
                <td>
                  <input
                    type="text"
                    value={novo.descricao}
                    onChange={(e) =>
                      setNovo({ ...novo, descricao: e.target.value })
                    }
                    placeholder="Nova descrição"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={novo.mensagem}
                    onChange={(e) =>
                      setNovo({ ...novo, mensagem: e.target.value })
                    }
                    placeholder="Mensagem opcional"
                  />
                </td>
                <td className="acoes">
                  <button
                    onClick={() => {
                      if (!novo.descricao) {
                        alert("Preencha a descrição");
                        return;
                      }
                      salvar(novo);
                      setAdicionando(false);
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={() => setAdicionando(false)}>
                    <X size={16} />
                  </button>
                </td>
              </tr>
            )}

            {/* Listagem normal */}
            {motivos.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  {editandoId === m.id ? (
                    <input
                      type="text"
                      value={m.descricao}
                      onChange={(e) =>
                        setMotivos((prev) =>
                          prev.map((item) =>
                            item.id === m.id
                              ? { ...item, descricao: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  ) : (
                    m.descricao
                  )}
                </td>
                <td>
                  {editandoId === m.id ? (
                    <input
                      type="text"
                      value={m.mensagem || ""}
                      onChange={(e) =>
                        setMotivos((prev) =>
                          prev.map((item) =>
                            item.id === m.id
                              ? { ...item, mensagem: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  ) : (
                    m.mensagem
                  )}
                </td>
                <td className="acoes">
                  {editandoId === m.id ? (
                    <>
                      <button onClick={() => salvar(m)}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditandoId(null)}>
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditandoId(m.id)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => excluir(m.id)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

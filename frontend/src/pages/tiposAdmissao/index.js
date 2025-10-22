import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import "./TiposAdmissao.css";

export default function TiposAdmissao() {
  const [tipos, setTipos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novo, setNovo] = useState({ descricao: "", mensagem: "" });
  const [adicionando, setAdicionando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [ordenacao, setOrdenacao] = useState({ campo: "descricao", direcao: "asc" });

  const carregar = async () => {
    try {
      setCarregando(true);
      const { data } = await api.get("/api/tipos-admissao/");
      setTipos(data.results || data);
    } catch (err) {
      console.error("Erro ao carregar tipos de admissão:", err);
      alert("Erro ao carregar tipos de admissão.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvar = async (tipo) => {
    try {
      if (tipo.id) {
        await api.put(`/api/tipos-admissao/${tipo.id}/`, tipo);
      } else {
        await api.post("/api/tipos-admissao/", tipo);
      }
      await carregar();
      setEditandoId(null);
      setNovo({ descricao: "", mensagem: "" });
    } catch (err) {
      console.error("Erro ao salvar tipo de admissão:", err);
      alert("Erro ao salvar tipo de admissão.");
    }
  };

  const excluir = async (id) => {
    if (!window.confirm("Confirma excluir este tipo de admissão?")) return;
    try {
      await api.delete(`/api/tipos-admissao/${id}/`);
      carregar();
    } catch (err) {
      console.error("Erro ao excluir tipo de admissão:", err);
      alert("Erro ao excluir tipo de admissão.");
    }
  };

  const handleOrdenar = (campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const tiposVisiveis = useMemo(() => {
    let lista = [...tipos];

    if (filtro) {
      const termo = filtro.toUpperCase();
      lista = lista.filter((tipo) =>
        (tipo.descricao || "").toUpperCase().includes(termo)
      );
    }

    if (ordenacao.campo) {
      lista.sort((a, b) => {
        const valA = (a[ordenacao.campo] || "").toString().toUpperCase();
        const valB = (b[ordenacao.campo] || "").toString().toUpperCase();
        if (valA < valB) return ordenacao.direcao === "asc" ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === "asc" ? 1 : -1;
        return 0;
      });
    }

    return lista;
  }, [tipos, filtro, ordenacao]);

  return (
    <div className="tipos-container">
      <div className="tipos-header">
        <h2>Tipos de Admissão</h2>
        <button
          onClick={() => {
            setAdicionando(true);
            setNovo({ descricao: "", mensagem: "" });
          }}
          disabled={adicionando}
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="filtro-nome">
        <input
          type="text"
          placeholder="Filtrar por descrição..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th
                style={{ width: "250px", cursor: "pointer" }}
                onClick={() => handleOrdenar("descricao")}
                className={
                  ordenacao.campo === "descricao"
                    ? ordenacao.direcao === "asc"
                      ? "ordenado-asc"
                      : "ordenado-desc"
                    : ""
                }
              >
                Descrição
              </th>
              <th
                style={{ minWidth: "400px", cursor: "pointer" }}
                onClick={() => handleOrdenar("mensagem")}
                className={
                  ordenacao.campo === "mensagem"
                    ? ordenacao.direcao === "asc"
                      ? "ordenado-asc"
                      : "ordenado-desc"
                    : ""
                }
              >
                Mensagem
              </th>
              <th className="acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {adicionando && (
              <tr>
                <td>—</td>
                <td>
                  <input
                    type="text"
                    value={novo.descricao}
                    onChange={(e) =>
                      setNovo((prev) => ({ ...prev, descricao: e.target.value }))
                    }
                    placeholder="Nova descrição"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={novo.mensagem}
                    onChange={(e) =>
                      setNovo((prev) => ({ ...prev, mensagem: e.target.value }))
                    }
                    placeholder="Mensagem opcional"
                  />
                </td>
                <td className="acoes">
                  <button
                    onClick={() => {
                      if (!novo.descricao) {
                        alert("Preencha a descrição.");
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

            {tiposVisiveis.map((tipo) => (
              <tr key={tipo.id}>
                <td>{tipo.id}</td>
                <td>
                  {editandoId === tipo.id ? (
                    <input
                      type="text"
                      value={tipo.descricao}
                      onChange={(e) =>
                        setTipos((prev) =>
                          prev.map((item) =>
                            item.id === tipo.id
                              ? { ...item, descricao: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  ) : (
                    tipo.descricao
                  )}
                </td>
                <td>
                  {editandoId === tipo.id ? (
                    <input
                      type="text"
                      value={tipo.mensagem || ""}
                      onChange={(e) =>
                        setTipos((prev) =>
                          prev.map((item) =>
                            item.id === tipo.id
                              ? { ...item, mensagem: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  ) : (
                    tipo.mensagem
                  )}
                </td>
                <td className="acoes">
                  {editandoId === tipo.id ? (
                    <>
                      <button onClick={() => salvar(tipo)}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditandoId(null)}>
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditandoId(tipo.id)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => excluir(tipo.id)}>
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

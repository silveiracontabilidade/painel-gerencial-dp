// Servicos.js
import { Plus, Pencil, Trash2, Check, X, FileText } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import './Servicos.css';

export default function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  // estado da ordenação
  // novos estados p/ filtro + ordenação
  const [filtroNome, setFiltroNome] = useState("");
  const [ordenacao, setOrdenacao] = useState({ campo: "nome", direcao: "asc" });

  // função para alternar ordenação
  const handleOrdenar = (campo) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };


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
      categoria: s.categoria || '',
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
      formData.append("nome", dadosEditados.nome || "");
      formData.append("prazo_dias", dadosEditados.prazo_dias ?? "");
      formData.append("tempo_execucao", dadosEditados.tempo_execucao || "");
      formData.append("mensagem", dadosEditados.mensagem || "");
      formData.append("categoria", dadosEditados.categoria || "");

      // anexos
      const campos = ["checklist","instrucao_trabalho","video_explicativo","topico_rapido"];
      campos.forEach(campo=>{
        const val = dadosEditados[campo];
        if (val === "") formData.append(campo,"");
        else if (val instanceof File) formData.append(campo,val);
      });

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
  formData.append("mensagem", "");
  formData.append("categoria", "");

  const res = await api.post("/api/servicos/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const novoServico = {
    id: res.data.id,
    nome: "Novo Serviço",
    prazo_dias: 0,
    tempo_execucao: "00:00",
    mensagem: "",
    categoria: "",
    __novo: true, // 🔥 marca como novo
  };

  setEditandoId(res.data.id);
  setDadosEditados(novoServico);

  setServicos(prev => [novoServico, ...prev]);
};

  // helper renderiza anexos
  const renderAnexo = (servico, campo, accept) => {
    const valorAtual = editandoId === servico.id ? dadosEditados[campo] : servico[campo];
    const getHref = (valor) => (!valor ? "#" : valor.startsWith("http") ? valor : `/media/${valor}`);

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

        {valorAtual instanceof File && <span className="file-name">{valorAtual.name}</span>}
      </>
    ) : valorAtual ? (
      <a href={getHref(valorAtual)} target="_blank" rel="noreferrer">
        <FileText size={18} />
      </a>
    ) : (
      "-"
    );
  };

  // aplica filtro + ordenação
  const servicosVisiveis = useMemo(() => {
    // separa novos dos outros
    const novos = servicos.filter(s => s.__novo);
    let lista = servicos.filter(s => !s.__novo);

    // aplica filtro
    if (filtroNome) {
      const f = filtroNome.toUpperCase();
      lista = lista.filter(s => (s.nome || "").toUpperCase().includes(f));
    }

    // aplica ordenação
    if (ordenacao.campo) {
      lista.sort((a, b) => {
        const valA = (a[ordenacao.campo] || "").toString().toUpperCase();
        const valB = (b[ordenacao.campo] || "").toString().toUpperCase();
        if (valA < valB) return ordenacao.direcao === "asc" ? -1 : 1;
        if (valA > valB) return ordenacao.direcao === "asc" ? 1 : -1;
        return 0;
      });
    }

    // sempre devolve novos primeiro
    return [...novos, ...lista];
  }, [servicos, filtroNome, ordenacao]);

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

        {/* Campo filtro */}
        <div className="filtro-nome">
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th onClick={() => handleOrdenar("nome")} style={{cursor:"pointer"}} className='col-nome'>
                Nome {ordenacao.campo==="nome" && (ordenacao.direcao==="asc"?"▲":"▼")}
              </th>
              <th onClick={() => handleOrdenar("categoria")} style={{cursor:"pointer"}} className='col-categoria'>
                Categoria {ordenacao.campo==="categoria" && (ordenacao.direcao==="asc"?"▲":"▼")}
              </th>
              <th onClick={() => handleOrdenar("prazo_dias")} style={{cursor:"pointer"}}>
                Prazo (dias) {ordenacao.campo==="prazo_dias" && (ordenacao.direcao==="asc"?"▲":"▼")}
              </th>
              <th onClick={() => handleOrdenar("tempo_execucao")} style={{cursor:"pointer"}}>
                Tempo Execução {ordenacao.campo==="tempo_execucao" && (ordenacao.direcao==="asc"?"▲":"▼")}
              </th>
              <th className='col-mensagem'>Mensagem</th>
              <th>Checklist</th>
              <th>Instrução</th>
              <th>Vídeo</th>
              <th>Tópico Rápido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicosVisiveis.map(servico => (
              <tr key={servico.id}>
                <td>
                  {editandoId === servico.id ? (
                    <input
                      value={dadosEditados.nome || ""}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, nome: e.target.value })}
                    />
                  ) : (
                    servico.nome
                  )}
                </td>
                <td className="col-categoria">
                  {editandoId === servico.id ? (
                    <input
                      type="text"
                      value={dadosEditados.categoria || ""}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, categoria: e.target.value })}
                    />
                  ) : (
                    servico.categoria || "-"
                  )}
                </td>
                <td className="col-prazo">
                  {editandoId === servico.id ? (
                    <input
                      type="number"
                      value={dadosEditados.prazo_dias ?? ""}
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
                      value={dadosEditados.tempo_execucao || ""}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, tempo_execucao: e.target.value })}
                      placeholder="HH:MM"
                    />
                  ) : (
                    servico.tempo_execucao
                  )}
                </td>
                <td>
                  {editandoId === servico.id ? (
                    <input
                      type="text"
                      value={dadosEditados.mensagem || ""}
                      onChange={(e) => setDadosEditados({ ...dadosEditados, mensagem: e.target.value })}
                    />
                  ) : (
                    servico.mensagem
                  )}
                </td>

                <td>{renderAnexo(servico,"checklist","application/pdf")}</td>
                <td>{renderAnexo(servico,"instrucao_trabalho","application/pdf")}</td>
                <td>{renderAnexo(servico,"video_explicativo","video/*")}</td>
                <td>{renderAnexo(servico,"topico_rapido","application/pdf")}</td>

                <td className="acoes">
                  {(perfilUsuario === "admin" || perfilUsuario === "coordenador") ? (
                    editandoId === servico.id ? (
                      <>
                        <button className="btn-salvar" onClick={() => salvar(servico.id)}>
                          <Check size={16} />
                        </button>
                        <button className="btn-cancelar" onClick={cancelar}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-editar" onClick={() => editar(servico)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-excluir" onClick={() => excluir(servico.id)}>
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
    </>
  );
}


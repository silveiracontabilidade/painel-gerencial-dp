import React, { useState } from "react";
import "./EmpresaFormModal.css"; // reaproveita estilos já usados

export default function FiltrosAvancadosModal({ visivel, aoFechar, filters, setFilters }) {
  const [abertos, setAbertos] = useState({}); // controla blocos abertos/fechados

  if (!visivel) return null;

  const toggleBloco = (id) => {
    setAbertos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleChange = (campo) => (e) => {
    setFilters((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const limparFiltros = () => {
    setFilters({});
    aoFechar();
  };

  const blocos = [
    {
      id: "GERENCIAL",
      titulo: "Gerencial",
      campos: [
        { campo: "sci_report", label: "SCI Report", tipo: "flag" },
        { campo: "visitacao", label: "Visitação", tipo: "text" },
        { campo: "tempo_demandado", label: "Tempo Demandado", tipo: "text" },
      ],
    },
    {
      id: "FOLHA",
      titulo: "Folha",
      campos: [
        { campo: "serv_prest", label: "Serviços Prestados", tipo: "flag" },
        { campo: "serv_tom", label: "Serviços Tomados", tipo: "flag" },
        { campo: "deson", label: "Desoneração", tipo: "flag" },
        { campo: "secconci", label: "SECONCI", tipo: "flag" },
        { campo: "planilha_folha", label: "Planilha Folha", tipo: "flag" },
        { campo: "planilha_convenio", label: "Planilha Convênio", tipo: "flag" },
        { campo: "sst", label: "SST", tipo: "flag" },
        { campo: "apura_vt", label: "Apura VT", tipo: "flag" },
        { campo: "opc_rec_patronal", label: "Opção Rec. Patronal", tipo: "text" },
      ],
    },
    {
      id: "PLR",
      titulo: "PLR",
      campos: [
        { campo: "plr", label: "Tem PLR?", tipo: "flag" },
        { campo: "plr_dt_entrega_inicio", label: "PLR - Entrega Início", tipo: "date" },
        { campo: "plr_dt_entrega_fim", label: "PLR - Entrega Fim", tipo: "date" },
        { campo: "plr_dt_pagto_inicio", label: "PLR - Pagto Início", tipo: "date" },
        { campo: "plr_dt_pagto_fim", label: "PLR - Pagto Fim", tipo: "date" },
      ],
    },
    {
      id: "ADIANTAMENTO",
      titulo: "Adiantamento",
      campos: [
        { campo: "adiantamento", label: "Tem Adiantamento?", tipo: "flag" },
        { campo: "perc_adiantamento_min", label: "Perc. Adiantamento Min", tipo: "number" },
        { campo: "perc_adiantamento_max", label: "Perc. Adiantamento Max", tipo: "number" },
        { campo: "dt_adiantamento_entrega_inicio", label: "Entrega Início", tipo: "date" },
        { campo: "dt_adiantamento_entrega_fim", label: "Entrega Fim", tipo: "date" },
        { campo: "dt_adiantamento_pagamento_inicio", label: "Pagto Início", tipo: "date" },
        { campo: "dt_adiantamento_pagamento_fim", label: "Pagto Fim", tipo: "date" },
      ],
    },
    {
      id: "PONTO",
      titulo: "Ponto",
      campos: [
        { campo: "periodo_ponto", label: "Período Ponto", tipo: "text" },
        { campo: "tipo_ponto", label: "Tipo Ponto", tipo: "text" },
        { campo: "ponto_ini", label: "Ponto Início", tipo: "text" },
        { campo: "ponto_fim", label: "Ponto Fim", tipo: "text" },
        { campo: "fecha_ponto", label: "Fecha Ponto", tipo: "text" },
        { campo: "envia_ponto", label: "Envia Ponto?", tipo: "flag" },
        { campo: "honorarios_min", label: "Honorários Min", tipo: "number" },
        { campo: "honorarios_max", label: "Honorários Max", tipo: "number" },
      ],
    },
    {
      id: "DECIMO_TERCEIRO",
      titulo: "Décimo Terceiro",
      campos: [
        { campo: "dt_13_entrega_inicio", label: "13º Entrega Início", tipo: "date" },
        { campo: "dt_13_entrega_fim", label: "13º Entrega Fim", tipo: "date" },
        { campo: "dt_13_adiantamento_entrega_inicio", label: "13º Adiant. Início", tipo: "date" },
        { campo: "dt_13_adiantamento_entrega_fim", label: "13º Adiant. Fim", tipo: "date" },
      ],
    },
    {
      id: "PROCURACAO",
      titulo: "Procuração",
      campos: [
        { campo: "venc_procuracao_inicio", label: "Procuração Início", tipo: "date" },
        { campo: "venc_procuracao_fim", label: "Procuração Fim", tipo: "date" },
        { campo: "venc_fgts_digital_inicio", label: "FGTS Digital Início", tipo: "date" },
        { campo: "venc_fgts_digital_fim", label: "FGTS Digital Fim", tipo: "date" },
      ],
    },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h3>Filtros Avançados</h3>

        <button onClick={aoFechar} className="modal-fechar">
            x
        </button>

        {blocos.map((bloco) => (
          <div className="bloco" key={bloco.id}>
            <h4 onClick={() => toggleBloco(bloco.id)} style={{ cursor: "pointer" }}>
              {bloco.titulo} {abertos[bloco.id] ? "▲" : "▼"}
            </h4>
            {abertos[bloco.id] && (
              <div className="linha" style={{ flexWrap: "wrap", gap: "16px" }}>
                {bloco.campos.map((c) => (
                  <div
                    className={`campo ${c.tipo === "flag" ? "campo-micro-flag" : ""}`}
                    key={c.campo}
                  >
                    <label
                      className={c.tipo === "flag" ? "flag-label" : ""}
                      style={{ fontSize: "10px" }}
                    >
                      {c.label}
                    </label>

                    {c.tipo === "flag" ? (
                      <input
                        type="checkbox"
                        className="flag-checkbox-avancados"
                        checked={filters[c.campo] === "SIM"}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [c.campo]: e.target.checked ? "SIM" : "NÃO",
                          }))
                        }
                      />
                    ) : c.tipo === "select" ? (
                      <select value={filters[c.campo] || ""} onChange={handleChange(c.campo)}>
                        <option value="">Todos</option>
                        {c.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.tipo}
                        value={filters[c.campo] || ""}
                        onChange={handleChange(c.campo)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="botoes">
          <button onClick={aoFechar}>Aplicar</button>
          <button className="cancelar" onClick={limparFiltros}>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

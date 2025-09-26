// ChangePasswordModal.js
import React, { useState } from "react";
import api from "../../api/axios";
import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ visivel, aoFechar }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  if (!visivel) return null;

  const handleSubmit = async () => {
    setErro(""); setSucesso("");
    try {
      const { data } = await api.put("/api/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      });
      setSucesso(data.status);
      setOldPassword(""); setNewPassword(""); setNewPassword2("");
    } catch (err) {
      setErro(err.response?.data?.old_password || err.response?.data?.new_password || "Erro ao alterar senha");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="change-password-modal">
        <h3>Alterar Senha</h3>
        <div className="campo">
          <label>Senha Atual</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div className="campo">
          <label>Nova Senha</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="campo">
          <label>Repetir Nova Senha</label>
          <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} />
        </div>

        {erro && <p className="erro">{erro}</p>}
        {sucesso && <p className="sucesso">{sucesso}</p>}

        <div className="botoes">
          <button onClick={handleSubmit}>OK</button>
          <button className="cancelar" onClick={aoFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

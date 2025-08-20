import React, { useState } from 'react';
import api from '../../api/axios';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/token/', {
        username,
        password
      });

      localStorage.setItem('token', res.data.access);
      localStorage.setItem('refreshToken', res.data.refresh);

      window.location.href = '/empresas';
    } catch (err) {
      setErro('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {erro && <p className="erro">{erro}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

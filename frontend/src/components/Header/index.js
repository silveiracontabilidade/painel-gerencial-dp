import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { User } from 'lucide-react';
import api from '../../api/axios';
import logoImg from '../../assets/images/logo.png';
import './Header.css';

const Header = () => {
  const [menuAberto, setMenuAberto] = useState(null);
  const [nomeUsuario, setNomeUsuario] = useState('Usuário');

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.user_id;

        const res = await api.get(`/api/usuarios/${userId}/`);
        setNomeUsuario(res.data.username || 'Usuário');
      } catch (err) {
        console.error('Erro ao buscar nome do usuário:', err);
      }
    };

    carregarUsuario();
  }, []);

  const toggleMenu = (id) => {
    setMenuAberto(menuAberto === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };


  return (
    <header className="header">
      <div className="header__inner">
        {/* Branding */}
        <div className="header__branding">
          <img src={logoImg} alt="Silveira Contabilidade" className="branding__logo" />
          <div className="branding__text">
            <span className="branding__main">Painel Gerencial</span>
            <span className="branding__sub">DP</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="header__nav">
          <ul className="menu__top">
            <li><NavLink to="/">Dashboard</NavLink></li>

            <li onMouseEnter={() => toggleMenu('principal')} onMouseLeave={() => toggleMenu(null)}>
              <span className="menu__title">Principal</span>
              {menuAberto === 'principal' && (
                <ul className="submenu">
                  <li><NavLink to="/empresas">Empresas</NavLink></li>
                  <li><NavLink to="/servicos-solicitados">Serviços Diários</NavLink></li>
                  <li><NavLink to="/atividades">Atividades</NavLink></li>
                </ul>
              )}
            </li>
            <li
              onMouseEnter={() => toggleMenu('cadastros')}
              onMouseLeave={(e) => {
                const target = e.relatedTarget;
                if (!target || !(target instanceof Node) || !e.currentTarget.contains(target)) {
                  toggleMenu(null);
                }
              }}
            >
              <span className="menu__title">Cadastros</span>
              {menuAberto === 'cadastros' && (
                <ul className="submenu">
                  <li><NavLink to="/grupos">Grupos</NavLink></li>
                  <li><NavLink to="/responsaveis">Responsáveis</NavLink></li>
                  <li><NavLink to="/servicos">Serviços</NavLink></li>
                  <li><NavLink to="/agenda">Agenda</NavLink></li>
                </ul>
              )}
            </li>
            <li onMouseEnter={() => toggleMenu('usuario')} onMouseLeave={() => toggleMenu(null)}>
              <span className="menu__title"><User size={20} /></span>
              {menuAberto === 'usuario' && (
                <ul className="submenu submenu-usuario">
                  <li className="info">{nomeUsuario}</li>
                  <li onClick={handleLogout}>Sair</li>
                </ul>
              )}
            </li>

          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;

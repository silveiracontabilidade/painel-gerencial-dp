import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, User, X } from 'lucide-react';
import api from '../../api/axios';
import logoImg from '../../assets/images/logo.png';
import './Header.css';
import ChangePasswordModal from './ChangePasswordModal';

// importe o modal

const Header = () => {
  const [menuAberto, setMenuAberto] = useState(null);
  const [nomePessoa, setNomePessoa] = useState('');
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [entregaveisVisivel, setEntregaveisVisivel] = useState(false);
  const [entregaveis, setEntregaveis] = useState([]);
  const [carregandoEntregaveis, setCarregandoEntregaveis] = useState(false);
  const [erroEntregaveis, setErroEntregaveis] = useState('');

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await api.get(`/api/me`);
        setNomePessoa(res.data.nome || '');              
      } catch (err) {
        console.error('Erro ao buscar nome do usuário:', err);
      }
    };
    carregarUsuario();
  }, []);

  const carregarEntregaveis = async () => {
    setCarregandoEntregaveis(true);
    setErroEntregaveis('');
    try {
      const res = await api.get('/api/entregaveis/', { params: { page_size: 500 } });
      setEntregaveis(res.data.results || res.data);
    } catch (err) {
      console.error('Erro ao buscar entregáveis:', err);
      setErroEntregaveis('Não foi possível carregar os entregáveis.');
    } finally {
      setCarregandoEntregaveis(false);
    }
  };

  useEffect(() => {
    if (entregaveisVisivel) {
      carregarEntregaveis();
    }
  }, [entregaveisVisivel]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setEntregaveisVisivel(false);
      }
    };
    if (entregaveisVisivel) {
      document.addEventListener('keydown', onEsc);
    }
    return () => document.removeEventListener('keydown', onEsc);
  }, [entregaveisVisivel]);

  const toggleMenu = (id) => {
    setMenuAberto(menuAberto === id ? null : id);
  };

  const abrirEntregaveisRapido = () => {
    setMenuAberto(null);
    setEntregaveisVisivel(true);
  };

  const fecharEntregaveisRapido = () => {
    setEntregaveisVisivel(false);
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
            <span className="branding__main">PLANNUS  </span>
            <span className="branding__sub">DP</span>
          </div>
        </div>

        {/* Navegação */}
        <nav className="header__nav">
          <ul className="menu__top">
            <li><NavLink to="/dashboard">Dashboard</NavLink></li>

            <li onMouseEnter={() => toggleMenu('principal')} onMouseLeave={() => toggleMenu(null)}>
              <span className="menu__title">Principal</span>
              {menuAberto === 'principal' && (
                <ul className="submenu">
                  <li><NavLink to="/empresas">Empresas</NavLink></li>
                  <li><NavLink to="/servicos-solicitados">To Do</NavLink></li>
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
                  <li><NavLink to="/agenda">Agenda</NavLink></li>
                  <li><NavLink to="/grupos">Grupos</NavLink></li>
                  <li><NavLink to="/motivos-rescisao">Tipo Aviso Prévio</NavLink></li>
                  <li><NavLink to="/tipos-admissao">Tipos de Admissão</NavLink></li>
                  <li><NavLink to="/periodos">Periodos</NavLink></li>
                  <li><NavLink to="/feriados">Feriados</NavLink></li>
                  <li><NavLink to="/entregaveis">Entregáveis</NavLink></li>
                  <li><NavLink to="/responsaveis">Responsáveis</NavLink></li>
                  <li><NavLink to="/servicos">Serviços</NavLink></li>
                  <li><NavLink to="/sistemas">Sistemas</NavLink></li>
                </ul>
              )}
            </li>
            <li
              onMouseEnter={() => toggleMenu('relatorios')}
              onMouseLeave={(e) => {
                const target = e.relatedTarget;
                if (!target || !(target instanceof Node) || !e.currentTarget.contains(target)) {
                  toggleMenu(null);
                }
              }}
            >
              <span className="menu__title">Relatórios</span>
              {menuAberto === 'relatorios' && (
                <ul className="submenu">
                  <li><NavLink to="/relatorios/dctfweb">DCTFWEB</NavLink></li>
                  <li><NavLink to="/relatorios/fgts-digital">FGTS Digital</NavLink></li>
                </ul>
              )}
            </li>
            <li className="menu__icon" onClick={abrirEntregaveisRapido} title="Entregáveis (consulta rápida)">
              <ClipboardList size={20} />
            </li>
            <li onMouseEnter={() => toggleMenu('usuario')} onMouseLeave={() => toggleMenu(null)}>
              <span className="menu__title"><User size={20} /></span>
              {menuAberto === 'usuario' && (
                <ul className="submenu submenu-usuario">
                  <li className="info">{nomePessoa}</li>
                  <li onClick={() => setModalSenhaAberto(true)}>Alterar Senha</li>
                  <li onClick={handleLogout}>Sair</li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Modal de Alterar Senha */}
      {entregaveisVisivel && (
        <div className="entregaveis-rapido__overlay" onClick={fecharEntregaveisRapido}>
          <div className="entregaveis-rapido__modal" onClick={(e) => e.stopPropagation()}>
            <div className="entregaveis-rapido__header">
              <div>
                <p className="titulo">Entregáveis</p>
                <span>Consulta rápida</span>
              </div>
              <button onClick={fecharEntregaveisRapido} aria-label="Fechar entregáveis">
                <X size={16} />
              </button>
            </div>
            <div className="entregaveis-rapido__body">
              {carregandoEntregaveis && <p>Carregando entregáveis...</p>}
              {erroEntregaveis && !carregandoEntregaveis && <p className="erro">{erroEntregaveis}</p>}
              {!carregandoEntregaveis && !erroEntregaveis && (
                entregaveis.length ? (
                  <ul>
                    {entregaveis.map((item) => (
                      <li key={item.id}>
                        <div className="linha">
                          <strong>{item.nome}</strong>
                          <span className="periodo">{item.periodo_entrega || '—'}</span>
                        </div>
                        {item.descricao ? <div className="descricao">{item.descricao}</div> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum entregável cadastrado.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
      {modalSenhaAberto && (
        <ChangePasswordModal
          visivel={modalSenhaAberto}
          aoFechar={() => setModalSenhaAberto(false)}
        />
      )}
    </header>
  );
};

export default Header;

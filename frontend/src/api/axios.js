import axios from 'axios';

// ⚙️ Criação do cliente Axios com baseURL e suporte a cookies/sessão
const api = axios.create({
  baseURL: '/',  // com proxy no package.json, aponta pro Django
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true  // necessário para autenticação baseada em sessão
});

// 🛡️ Interceptador de requisição (futuro: inserir token JWT)
api.interceptors.request.use(
  config => {
    // Se estiver usando JWT, descomente abaixo:
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 🚨 Interceptador de respostas com tratamento global de erro
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.warn('Sessão expirada ou não autenticado.');
        // Redirecionar pro login, se necessário:
        // window.location.href = '/login';
      } else if (status >= 500) {
        console.error('Erro no servidor:', error.response.data);
      }
    } else {
      console.error('Erro na requisição:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

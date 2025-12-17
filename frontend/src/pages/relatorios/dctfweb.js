import React, { useEffect, useState } from 'react';
import RelatorioBase from './RelatorioBase';
import api from '../../api/axios';

const colunas = [
  { chave: 'cod_folha', label: 'Cód. Empresa', style: { width: '11%' } },
  { chave: 'razao_social', label: 'Nome', style: { width: '24%' } },
  { chave: 'cnpj', label: 'CNPJ', style: { width: '14%' } },
  { chave: 'status_do_cliente', label: 'Status', style: { width: '10%' } },
  { chave: 'sistema', label: 'Sistema', style: { width: '10%' } },
  { chave: 'grupo', label: 'Grupo', style: { width: '10%' } },
  { chave: 'resp_dp', label: 'Responsável', style: { width: '11%' } },
  { chave: 'matriz', label: 'Matriz', style: { width: '5%' } },
  { chave: 'enviadctf', label: 'DCTF', style: { width: '5%' } },
];

export default function RelatorioDCTFWEB() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [resResp, resGrupos] = await Promise.all([
          api.get('/api/responsaveis/', { params: { page_size: 500 } }),
          api.get('/api/grupos/'),
        ]);
        const respLista = (resResp.data.results || resResp.data || []).map((r) => ({
          value: r.nome,
          label: r.nome,
        }));
        const gruposLista = (resGrupos.data.results || resGrupos.data || []).map((g) => ({
          value: g.nome,
          label: g.nome,
        }));
        setResponsaveis(respLista);
        setGrupos(gruposLista);
      } catch (err) {
        console.error('Erro ao carregar filtros de relatório:', err);
      }
    };
    carregar();
  }, []);

  return (
    <RelatorioBase
      titulo="Relatório DCTFWEB"
      descricao="Empresas elegíveis para emissão de DCTFWEB conforme filtros padrão."
      endpoint="/api/relatorios/dctfweb/"
      colunas={colunas}
      nomeArquivo="relatorio_dctfweb"
      filtros={[
        { chave: 'responsavel', label: 'Responsável', opcoes: responsaveis },
        { chave: 'grupo', label: 'Grupo', opcoes: grupos },
      ]}
    />
  );
}

-- Criação da tabela de motivos de término
CREATE TABLE IF NOT EXISTS pg_motivos_termino (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL UNIQUE,
    mensagem TEXT
);

-- Dados iniciais
INSERT INTO pg_motivos_termino (descricao, mensagem) VALUES
    ('ADESÃO AO REGIME MEI', ''),
    ('CANCELOU ENTRADA', ''),
    ('CLIENTE DESAPARECEU', ''),
    ('CONFLITO DE INTERESSES', ''),
    ('DECIDIU PELA MOVIMENTAÇÃO DE LIVRO CAIXA', ''),
    ('DESACORDO COMERCIAL', ''),
    ('DESLIGAMENTO DE COLABORADOR', ''),
    ('EM ENCERRAMENTO', ''),
    ('ENCERROU', ''),
    ('EXTINTA', ''),
    ('FALECIMENTO EMPREGADOR', ''),
    ('INADIMPLENTE', ''),
    ('INCORPORAÇÃO', ''),
    ('INSATISFAÇÃO COM ATENDIMENTO', ''),
    ('INSOLVÊNCIA', ''),
    ('INTERNALIZAÇÃO CONTÁBIL', ''),
    ('PARCERIA COM OUTRO CONTADOR', ''),
    ('REDUÇÃO DE CUSTOS', ''),
    ('VENDA', '')
ON CONFLICT (descricao) DO NOTHING;

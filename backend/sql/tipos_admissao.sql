-- Criação da tabela de tipos de admissão
CREATE TABLE IF NOT EXISTS pg_tipos_admissao (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL UNIQUE,
    mensagem TEXT
);

-- Dados iniciais
INSERT INTO pg_tipos_admissao (descricao, mensagem) VALUES
    ('CLT', ''),
    ('Estagiário', 'Obrigatório informar a data do desligamento programado.'),
    ('Prazo determinado', 'Obrigatório informar a data do desligamento programado.'),
    ('Autônomo', ''),
    ('Prolaborista', ''),
    ('Intermitente', '')
ON CONFLICT (descricao) DO NOTHING;

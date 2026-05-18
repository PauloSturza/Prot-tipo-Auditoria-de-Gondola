-- TABELAS PRINCIPAIS
CREATE TABLE vendedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE administradores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL
);

CREATE TABLE lojas (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    endereco TEXT,
    lat_loja DECIMAL(10, 8), 
    lng_loja DECIMAL(11, 8)
);

-- RELACIONAMENTOS E REGISTOS
CREATE TABLE vendedor_loja (
    vendedor_id INT REFERENCES vendedores(id),
    loja_id INT REFERENCES lojas(id),
    PRIMARY KEY (vendedor_id, loja_id)
);

CREATE TABLE visitas (
    id SERIAL PRIMARY KEY,
    vendedor_id INT REFERENCES vendedores(id),
    loja_id INT REFERENCES lojas(id),
    url_foto TEXT NOT NULL,
    lat_registro DECIMAL(10, 8), 
    lng_registro DECIMAL(11, 8),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_ia VARCHAR(50) DEFAULT 'Pendente'
);

-- DADOS DE TESTE
INSERT INTO vendedores (nome, email, senha_hash) VALUES ('Representante 01', 'vendedor@teste.com', '123');
INSERT INTO administradores (nome, email, senha_hash) VALUES ('Admin Geral', 'admin@teste.com', 'admin123');
INSERT INTO lojas (nome_fantasia, lat_loja, lng_loja) VALUES ('Supermercado Central', -23.5505, -46.6333);
INSERT INTO vendedor_loja (vendedor_id, loja_id) VALUES (1, 1);
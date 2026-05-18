# Protótipo — Auditoria de Gôndola

Sistema para registro e acompanhamento de visitas de promotores a pontos de venda (PDVs). O promotor acessa pelo celular, tira uma foto da gôndola e a visita é salva com localização GPS. O gestor acompanha tudo pelo painel administrativo.

---

## Funcionalidades

**App do Promotor (mobile)**
- Login com e-mail e senha
- Lista de lojas vinculadas ao promotor
- Captura de foto via câmera do celular
- Registro automático de coordenadas GPS no momento da visita

**Painel Admin (desktop)**
- Relatório de visitas com filtro por período e zoom nas fotos
- Geração de PDF de cobertura de PDVs (quais lojas foram ou não visitadas no período)
- Cadastro e ativação/desativação de promotores
- Cadastro e ativação/desativação de lojas
- Gestão de rotas (vínculo entre promotor e loja)

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Backend | Python · FastAPI · psycopg2 |
| Banco de dados | PostgreSQL |
| Frontend | HTML · Tailwind CSS · JavaScript |
| PDF | fpdf2 |

---

## Estrutura do Projeto

```
├── backend/
│   ├── main.py           # API FastAPI com todas as rotas
│   ├── requirements.txt  # Dependências Python
│   └── uploads/          # Fotos registradas (não versionado)
├── database/
│   └── setup.sql         # Script de criação das tabelas
└── frontend/
    ├── index.html        # App do promotor (mobile)
    ├── admin.html        # Painel administrativo
    └── js/
        ├── app.js        # Utilitários compartilhados
        ├── relatorios.js
        ├── vendedores.js
        ├── lojas.js
        └── vinculos.js
```

---

## Como rodar localmente

### 1. Banco de dados

Crie o banco e execute o script de setup:

```bash
psql -U postgres -c "CREATE DATABASE paodealho_db;"
psql -U postgres -d paodealho_db -f database/setup.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Crie o arquivo `.env` na pasta `backend/` com as variáveis abaixo:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=paodealho_db
DB_USER=postgres
DB_PASSWORD=sua_senha
```

Inicie o servidor:

```bash
uvicorn main:app --reload
```

### 3. Frontend

Abra `frontend/index.html` no navegador para o app do promotor, ou `frontend/admin.html` para o painel admin.

> Atualize a constante `API_URL` em `frontend/js/app.js` para apontar para o endereço do seu servidor.

---

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/login/vendedor` | Autenticação do promotor |
| GET | `/vendedor/{id}/lojas` | Lojas vinculadas ao promotor |
| POST | `/upload` | Registro de visita com foto e GPS |
| GET | `/admin/visitas` | Relatório de visitas (com filtro de data) |
| GET/POST | `/admin/vendedores` | Listagem e cadastro de promotores |
| PUT | `/admin/vendedores/{id}/toggle` | Ativar/desativar promotor |
| GET/POST | `/admin/lojas` | Listagem e cadastro de lojas |
| PUT | `/admin/lojas/{id}/toggle` | Ativar/desativar loja |
| GET/POST | `/admin/vinculos` | Listagem e criação de rotas |
| DELETE | `/admin/vinculos/{vid}/{lid}` | Remoção de rota |
| GET | `/admin/pdf-cobertura` | Download do relatório PDF |

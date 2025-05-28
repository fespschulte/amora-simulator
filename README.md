# aMora - Simulador de Compra de Imóveis

Um simulador completo para análise de compra de imóveis, desenvolvido com React/Next.js (frontend), FastAPI (backend) e PostgreSQL (database).

## Tecnologias

- **Front-end:** React/Next.js
- **Back-end:** FastAPI (Python)
- **Banco de Dados:** PostgreSQL
- **Infraestrutura:** Docker Compose
- **ORM:** SQLAlchemy
- **Migrações:** Alembic
- **Autenticação:** JWT (passlib, python-jose)
- **Validação:** Pydantic
- **Testes:** Pytest (Backend), Jest/React Testing Library (Frontend)

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para desenvolvimento local do frontend)
- Python 3.8+ (para desenvolvimento local do backend)

## Configuração do Ambiente

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/amora.git
cd amora
```

2. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
SECRET_KEY=sua_chave_secreta_aqui
```

3. Inicie todos os serviços usando Docker Compose:

```bash
docker compose up -d
```

Os serviços estarão disponíveis em:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

## Desenvolvimento

### Frontend (Desenvolvimento Local)

```bash
cd amora-simulator-frontend
npm install
npm run dev
```

### Backend (Desenvolvimento Local)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Banco de Dados

O banco de dados PostgreSQL é gerenciado automaticamente pelo Docker Compose. Para executar migrações manualmente:

```bash
cd backend
alembic upgrade head
```

## Testes

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd amora-simulator-frontend
npm test
```

## Funcionalidades

- Autenticação de usuários (registro e login)
- Simulação de compra de imóveis
- Cálculo de valores de entrada e financiamento
- Histórico de simulações
- Dashboard com resumo das simulações

## Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Validação de dados com Pydantic
- Proteção contra CSRF
- Headers de segurança configurados

## Documentação da API

A documentação interativa da API está disponível em:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

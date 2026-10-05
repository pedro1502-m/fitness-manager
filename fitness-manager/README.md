# Fitness Manager

Sistema web para gerenciamento de treinos, dieta e alunos.
Stack: HTML/CSS/JS Vanilla · Node.js + Express · MySQL · JWT + bcryptjs.

## Estrutura

```
fitness-manager/
├── backend/
│   ├── server.js
│   └── src/{config,controllers,middlewares,routes,utils}
├── database/{schema.sql,seed.sql}
├── frontend/{index.html,dashboard.html,css/,js/}
├── .env.example
└── package.json
```

## Como executar

1. `npm install`
2. Crie o banco: `mysql -u root -p < database/schema.sql`
3. (Opcional) Dados de teste: `mysql -u root -p < database/seed.sql`  → login `aluno@teste.com` / `123456`
4. `cp .env.example .env` e ajuste DB_PASSWORD e JWT_SECRET
5. `npm start` e acesse http://localhost:3000

## Endpoints (todos exceto /auth/register e /auth/login exigem `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Cadastro (retorna token) |
| POST | /api/auth/login | Login (retorna token) |
| GET/PUT | /api/auth/profile | Ver/editar perfil (peso, altura, objetivo) |
| GET/POST | /api/workouts | Listar / criar treinos |
| GET/PUT/DELETE | /api/workouts/:id | Detalhe / editar / excluir treino |
| POST | /api/workouts/:id/exercises | Adicionar exercício |
| PUT/DELETE | /api/workouts/:id/exercises/:exerciseId | Editar / remover exercício |
| GET/POST | /api/meals?date=AAAA-MM-DD | Listar / registrar refeições |
| PUT/DELETE | /api/meals/:id | Editar / excluir refeição |
| GET | /api/dashboard?date=AAAA-MM-DD | Resumo do usuário |

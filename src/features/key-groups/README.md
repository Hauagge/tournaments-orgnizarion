# Key Groups

Fluxo operacional no dia do campeonato:

1. Criar a chave
   `POST /competitions/:competitionId/key-groups`
   body:
   ```json
   {
     "name": "Chave A",
     "categoryId": "cat-1",
     "athleteIds": ["a1", "a2"]
   }
   ```

2. Listar chaves da competição
   `GET /competitions/:competitionId/key-groups`

3. Abrir detalhe da chave
   `GET /key-groups/:keyGroupId`

4. Ajustar metadados da chave
   `PATCH /key-groups/:keyGroupId`
   body:
   ```json
   {
     "name": "Chave A - Juvenil",
     "categoryId": "cat-1"
   }
   ```

5. Adicionar atleta à chave
   `POST /key-groups/:keyGroupId/athletes/:athleteId`

6. Remover atleta da chave
   `DELETE /key-groups/:keyGroupId/athletes/:athleteId`

7. Gerar lutas todos contra todos
   `POST /key-groups/:keyGroupId/generate-fights`

8. Travar chave
   `POST /key-groups/:keyGroupId/lock`

9. Exportar PDF das chaves da competição
   `GET /competitions/:competitionId/brackets/pdf`

Regras aplicadas no frontend:
- no máximo 4 atletas por chave
- atleta não pode entrar em duas chaves ao mesmo tempo
- chave travada não aceita alterações
- não permite gerar lutas com menos de 2 atletas

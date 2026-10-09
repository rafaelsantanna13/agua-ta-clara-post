# Água Tá Clara — Postagem móvel

Este repositório público recebe automaticamente os arquivos mais recentes gerados pelo pipeline privado `rafaelsantanna13/agua-ta-clara` e publica a central móvel via GitHub Pages.

## Renovação do token de publicação

A comunicação do repositório privado `agua-ta-clara` para este repositório usa um Fine-grained Personal Access Token armazenado no secret `POST_REPO_TOKEN` do repositório privado.

### Situação atual

O token `Agua-Ta-Clara-Post` foi criado em 09/10/2026 e, conforme a configuração exibida no GitHub, expira em **07/01/2027**. O GitHub não permitiu alterar a expiração do token existente. Portanto, quando estiver próximo da data de expiração, deve-se criar um novo token e substituir o secret. Não é necessário alterar código.

### Como renovar

1. Acesse **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Crie um novo Fine-grained Personal Access Token.
3. Use um nome como `Agua-Ta-Clara-Post`.
4. Em **Repository access**, escolha **Only select repositories** e selecione somente `rafaelsantanna13/agua-ta-clara-post`.
5. Em **Repository permissions**, conceda **Contents: Read and write**. Não conceda permissões de usuário nem permissões adicionais desnecessárias.
6. Gere o token e copie seu valor. Não publique o token em issues, commits, documentação ou chats.
7. No repositório privado `rafaelsantanna13/agua-ta-clara`, acesse **Settings → Secrets and variables → Actions**.
8. Edite o repository secret `POST_REPO_TOKEN` e substitua somente o valor pelo novo token.
9. Execute manualmente um dos workflows operacionais e confirme que a etapa **Publish latest cards to mobile site** terminou com sucesso.
10. Confirme que este repositório recebeu os novos `01_surf.png`, `02_natacao_mergulho.png`, `03_remo_ze_marola.png`, `caption.txt` e `run.json`, e que o workflow do GitHub Pages terminou com sucesso.

Se o token expirar antes da renovação, a página continuará disponível com a última rodada publicada, mas novos cards deixarão de ser enviados pelo pipeline privado até que `POST_REPO_TOKEN` seja substituído.

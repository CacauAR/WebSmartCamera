# WebSmartCamera - Plataforma Web de Ensino com Câmera Integrada a um Sistema Embarcado

   Este projeto propõe trazer a Internet das Coisas para a sala de aula utilizando um sistema embarcado integrado à uma câmera, onde o professor será capaz de projetar e/ou transmitir suas aulas sem perder a interação com os alunos, adicionando assim uma nova dinâmica às aulas além de quadro e slides. O projeto também visa o armazenamento do vídeo após a realização das aulas para acesso posterior. Adicionalmente, a plataforma que engloba a transmissão é robusta e controla o acesso dos usuários.

## Instalação

1) Primeiramente: `sudo apt-get update && apt-get upgrade`;

2) Depois clone o repositório: `git clone https://github.com/CacauAR/WebSmartCamera.git`;

3) Instale as dependências: npm install ;

4) Instale o ffmpeg, garantindo a captura do áudio (Dicas aqui: https://raspberrypi.stackexchange.com/questions/70479/ffmpeg-unknown-input-format-alsa);

5) Instale o Node.js e o npm (Instruções aqui: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions);

6) Instale o Mysql (Instruções aqui: https://www.linode.com/docs/databases/mysql/how-to-install-mysql-on-debian-8/);

7) Altere as informações em config/database.js para as suas configurações do Mysql;

8) Execute `node scripts/create_database.js` (Cria o banco de dados);

9) Dê start: `node server.js` (em dev: npm start)

10) Visite em seu browser a página principal com o endereço do seu host, normalmente algo parecido com: `http://192.168.[...]:8080` 

* Observação: Em routes/index.js linha 566, estão as informações relativas ao processo ffmpeg. Nossa câmera está em `/dev/video0` e o áudio é acessado via `hw:1,0`, se seus inputs forem diferentes, altere esses dados.

## Tutorial 

Navegação entre páginas gerais:

 * Página Principal - Home 

 Para o usuário administrador : vazia.

 Para o usuário professor : exibe links com o nome das disciplinas e as turmas que o professor leciona.

 Para o usuário aluno : exibe as turmas com links que o aluno está matriculado.

 
 * Visualizar perfil : home > navbar com opções de usuário > profile

       
        Exibe os dados do usuário logado:     
        Nome do usuário
        Tipo de usuário (aluno, professor, administador)
        Matrícula
        Email
        
 Alterar imagem do perfil:
            Clique no botão "Mudar Foto" e selecione do diretório local uma imagem tipo jpeg, gif ou png. Esta é atualizada no banco de dados automaticamente.

 * Visualizar notificações: home > navbar com opções de usuário 

   Exibe lembretes de arquivos relacionados às turmas em que o usuário está envolvido que foram adicionados recentemente.

 * Visualizar estudantes matriculados em uma turma: 
home > disciplina - turma > lista_alunos

 Exibe uma lista com nome e matrícula dos estudantes.

 * Baixar arquivos de material didático relacionados às disciplinas envolvidas : home > disciplina - turma > Material Didático 


 * Logout : home > navbar com opções de usuário > logout

### Usuário Administrador

   Ferramentas:

* Cadastrar Usuário : home > barra lateral de ferramentas> signup
    
        Preencha o formulário :
            Tipo do usuário : aluno, professor, administrador
            Nome : máximo 80 characteres 
            Senha : máximo 60 characteres
            Sexo: M (Masculino) / F (Feminino)
            Matrícula : máximo 7 characteres
            Email : máximo 100 characteres

* Lista Disciplinas : home > barra lateral de ferramentas > lista_disciplinas 

       Exibe uma tabela com código e nome das disciplinas cadastradas
     
  Para cadastrar uma disciplina preencha o formulário :
       
        Código da disciplina : máximo 6 characteres (Ex: INF100)
        Nome Disciplina : máximo 60 characteres

* Lista Professores : home > barra lateral de ferramentas > lista_professores
        
        Exibe uma tabela com nome, matricula, email dos professores cadastrados.
 
* Lista Turmas : home > barra lateral de ferramentas > lista_turmas
        
  Exibe as turmas cadastradas. 
  
        Para cadastrar uma turma preencha o formulário :
         Código da disciplina : selecione uma opção da lista de disciplinas 
         Matrícula Professor(a) : selecione uma opção da lista de professores

        Observações: 
            O id da turma é incrementado automaticamente quando for cadastrada mais de uma turma de uma mesma disciplina.

* Matrícula de estudantes : home > barra lateral de ferramentas > matricular

 Exibe uma lista com o id da turma, código da disciplina e matrícula do estudante que está matriculado nesta

        Para matricular um estudante em uma turma preencha o formulário:
         Código da disciplina - turma : selecione uma opção da lista de turmas
         Matrícula Aluno(a) : selecione uma opção da lista de alunos


### Usuário Professor

Ferramentas:

* Adicionar arquivos à página da turma : home > disciplina - turma 

        Preencha o formulário:
         Título do arquivo 
         Arquivo em formato pdf selecionado do diretório local 

* Começar uma transmissão de aula: home > disciplina - turma > Iniciar transmissão > Confirmação

 Para encerrar a transmissão apenas clique no botão à direita abaixo da tela do vídeo. Neste ato o professor(a) será questionado(a) se deseja salvar o vídeo para exibição posterior na página da turma.

### Usuário Aluno

* Assistir à uma aula sendo transmitida ao vivo : home > disciplina - turma > Assistir transmissão

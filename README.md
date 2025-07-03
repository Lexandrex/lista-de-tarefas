# Projeto de Gestão de Equipes e Atividades

## 2. Introdução

### 2.1 Apresentação do Projeto
Este projeto consiste no desenvolvimento de uma aplicação web voltada para a gestão de equipes e atividades. A ferramenta permitirá o registro de usuários, autenticação, atribuição de hierarquia e acompanhamento do progresso de atividades. O objetivo é fornecer uma plataforma eficiente para organização de tarefas e equipes, garantindo flexibilidade e personalização para os usuários.

### 2.2 Justificativa
Em ambientes corporativos e acadêmicos, a organização e o monitoramento de tarefas são cruciais para o sucesso de projetos. No entanto, sem uma ferramenta apropriada, o acompanhamento das atividades pode se tornar caótico e ineficaz. Este software tem como objetivo otimizar a gestão de equipes e atividades, proporcionando uma experiência mais estruturada e eficiente. Dessa forma, ele facilita o gerenciamento de projetos, permitindo que os usuários visualizem e acompanhem o progresso de forma mais ágil e precisa.

### 2.3 Público-Alvo
O software será usado por organizações, equipes de trabalho e indivíduos que buscam organizar e acompanhar atividades, com destaque para gestores e membros de equipes.

---

## 3. Modelagem do Software

### 3.1 Requisitos Funcionais

- **RF001:** Registro com e-mail e senha.
- **RF002:** Login com senha.
- **RF003:** Atualização de perfil (Nome e E-mail).
- **RF004:** Redefinição de senha.
- **RF005:** Atribuição de hierarquia para usuários Admin.
- **RF006:** Criação de atividades e equipes por usuários Admin.
- **RF007:** Edição de atividades e equipes por usuários Admin.
- **RF008:** Atribuição de atividades às equipes por usuários Admin.
- **RF009:** Exclusão de usuários comuns por usuários Admin.
- **RF010:** Visualização das equipes pelos usuários.
- **RF011:** Acompanhamento do progresso das atividades pelos usuários.

### 3.2 Requisitos Não Funcionais

- **RNF001:** Customização da interface.
- **RNF002:** Validação de campos para evitar SQL Injection.
- **RNF003:** Comunicação rápida com o servidor.
- **RNF004:** Uso da paleta de cores da empresa.
- **RNF005:** Desenvolvimento em HTML.
- **RNF006:** Interface intuitiva.
- **RNF007:** Criptografia de senhas de usuários.
- **RNF008:** Suporte a alto tráfego.
- **RNF009:** Compatibilidade com navegadores diversos.
- **RNF010:** Compatibilidade com dispositivos móveis.

---

## 4. Casos de Uso

### Caso de Uso: Registrar Usuário
- **Ator:** Novo Usuário
- **Fluxo Principal:** O usuário insere e-mail e senha em um formulário de registro. O sistema valida as informações, armazena no banco de dados e exibe uma confirmação de sucesso.

### Caso de Uso: Atribuir Atividades
- **Ator:** Usuário Admin
- **Fluxo Principal:** O administrador seleciona uma equipe e cria uma nova atividade. O sistema armazena as informações no banco de dados e envia notificações aos membros da equipe.

### Caso de Uso: Acompanhar Progresso
- **Ator:** Usuário Autenticado
- **Fluxo Principal:** O usuário acessa o painel de atividades e visualiza o progresso de suas tarefas. O sistema exibe o status e permite atualizações conforme necessário.

---

## 5. Plano de Trabalho

- **Alexandre:**
  - Definir atividades
  - Levantamento de requisitos
  - Desenvolvimento do back-end
  - Criação de protótipo no Figma
  - Relatório final

- **Felipe:**
  - Desenvolvimento de autenticação de dois fatores
  - Criação do banco de dados
  - Testes unitários
  - Desenvolvimento do front-end

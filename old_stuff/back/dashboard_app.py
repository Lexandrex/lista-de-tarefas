import streamlit as st
import pandas as pd
import plotly.express as px
from supabase_client import *

st.set_page_config(page_title="MyDashboard", layout="wide")
st.title("MyDashboard")

menu = st.sidebar.selectbox("Menu", ["Login", "Cadastro"])

# Login
if menu == "Login":
    st.sidebar.subheader("Login")
    email = st.sidebar.text_input("Email")
    senha = st.sidebar.text_input("Senha", type="password")
    if st.sidebar.button("Entrar"):
        res = login_usuario(email, senha)
        if res.user and res.session:
            st.session_state['user_id'] = res.user.id
            st.session_state['token'] = res.session.access_token
            st.session_state['logado'] = True
            st.rerun()
        else:
            st.error("Falha no login.")

# Cadastro
elif menu == "Cadastro":
    st.sidebar.subheader("Cadastro")
    email = st.sidebar.text_input("Novo Email")
    senha = st.sidebar.text_input("Nova Senha", type="password")
    if st.sidebar.button("Cadastrar"):
        res = cadastro_usuario(email, senha)
        st.success("Cadastro realizado! Confirme o email.")

# Usuário logado
if st.session_state.get('logado'):
    st.success(f"Logado com sucesso! ID: {st.session_state['user_id']}")

# Upload Excel
    uploaded_file = st.file_uploader("Faça o upload de um arquivo Excel:", type=["xlsx", "xls"])

    if uploaded_file:
        df = pd.read_excel(uploaded_file)
        if st.button("Salvar Upload"):
            salvar_upload(uploaded_file.name, df, st.session_state['user_id'], st.session_state['token'])
            st.success("Arquivo salvo no Supabase!")
            st.rerun()

# Buscar tabelas
    uploads = buscar_uploads_usuario(st.session_state['user_id'], st.session_state['token'])
    tabelas = buscar_tabelas_criadas(st.session_state['user_id'], st.session_state['token'])

    nomes_tabelas = [item['nome'] for item in uploads + tabelas]
    nomes_tabelas.append("Criar nova tabela")

    escolha = st.selectbox("Selecione uma tabela:", nomes_tabelas)

# Criar nova tabela
    if escolha == "Criar nova tabela":
        if "tabela_em_criacao" not in st.session_state:
            st.session_state["tabela_em_criacao"] = False

        if not st.session_state["tabela_em_criacao"]:
            linhas = st.number_input("Número de linhas:", 1, 50, 5)
            colunas = st.number_input("Número de colunas:", 1, 20, 5)

            col_names = [st.text_input(f"Nome da Coluna {i+1}:") for i in range(colunas)]

            if st.button("Criar Tabela"):
                if "" in col_names or len(set(col_names)) != len(col_names):
                    st.error("Todos os nomes devem ser preenchidos e únicos!")
                else:
                    df_vazia = pd.DataFrame([[None]*colunas for _ in range(linhas)], columns=col_names)
                    st.session_state["tabela_temp"] = df_vazia
                    st.session_state["tabela_em_criacao"] = True
                    st.rerun()

        else:
            st.subheader("Preencha os dados:")
            edited_df = st.data_editor(st.session_state["tabela_temp"], use_container_width=True)
            nome_tabela = st.text_input("Nome da tabela:")

            if st.button("Salvar nova tabela"):
                if nome_tabela.strip() == "":
                    st.error("Digite um nome válido!")
                else:
                    salvar_tabela_criada(nome_tabela, edited_df, st.session_state['user_id'], st.session_state['token'])
                    st.success("Tabela salva com sucesso!")
                    del st.session_state["tabela_temp"]
                    del st.session_state["tabela_em_criacao"]
                    st.rerun()

# Visualização de tabela existente
    else:
        tabela, origem, id_tabela = None, None, None

        for t in uploads:
            if t['nome'] == escolha:
                tabela = pd.DataFrame(t['dados_json'])
                origem = "upload"
                id_tabela = t['id']
                break

        for t in tabelas:
            if t['nome'] == escolha:
                tabela = pd.DataFrame(t['dados_json'])
                origem = "manual"
                id_tabela = t['id']
                break

        if tabela is not None:
            st.subheader(f"Tabela: {escolha}")

            modo_edicao = st.session_state.get(f"editar_{escolha}", False)

            col1, col2 = st.columns(2)

            with col1:
                if st.button("Editar Tabela"):
                    st.session_state[f"editar_{escolha}"] = not modo_edicao
                    st.rerun()

            with col2:
                if st.button("Excluir Tabela"):
                    st.session_state['confirmar_delete'] = True

            if st.session_state.get('confirmar_delete'):
                st.warning("Deseja mesmo excluir essa tabela?")
                col_s, col_c = st.columns(2)
                with col_s:
                    if st.button("Sim"):
                        deletar_tabela("uploads" if origem == "upload" else "tabelas_criadas", id_tabela, st.session_state['token'], origem)
                        st.success("Tabela deletada!")
                        del st.session_state['confirmar_delete']
                        st.rerun()
                with col_c:
                    if st.button("Cancelar"):
                        del st.session_state['confirmar_delete']
                        st.rerun()

            if modo_edicao:
                tabela_editada = st.data_editor(tabela, use_container_width=True)
                if st.button("Salvar alterações"):
                    if origem == "upload":
                        atualizar_upload(id_tabela, tabela_editada, st.session_state['token'])
                    else:
                        atualizar_tabela_criada(id_tabela, tabela_editada, st.session_state['token'])
                    st.success("Alterações salvas!")
                    st.session_state[f"editar_{escolha}"] = False
                    st.rerun()
            else:
                st.dataframe(tabela)

            ferramentas_selecionadas = st.multiselect("Ferramentas:", [
                "Estatísticas Básicas",
                "Contagem de Valores",
                "Detecção de Nulos",
                "Correlação",
                "Gráfico de Barras",
                "Histograma",
                "Boxplot"
            ])

            if ferramentas_selecionadas:
                for i in range(0, len(ferramentas_selecionadas), 3):
                    cols = st.columns(3)
                    for j, ferramenta in enumerate(ferramentas_selecionadas[i:i+3]):
                        with cols[j]:
                            st.markdown(f"### {ferramenta}")
                            executar_ferramenta(ferramenta, tabela, i, j)

else:
    st.warning("Faça login para usar o sistema.")
import os
import pandas as pd
import json
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_user_client(token):
    from supabase import ClientOptions
    options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
    return create_client(SUPABASE_URL, SUPABASE_KEY, options)

# Função universal para deletar tabela (uploads ou tabelas_criadas)
def deletar_tabela(nome_tabela, id_tabela, token, origem):
    url = f"{SUPABASE_URL}/rest/v1/{nome_tabela}?id=eq.{id_tabela}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Prefer": "return=minimal"
    }
    response = httpx.delete(url, headers=headers)
    if response.status_code not in (200, 204):
        raise Exception(f"Erro ao deletar: {response.json()}")

# Cadastro
def cadastro_usuario(email, senha):
    res = supabase.auth.sign_up({
        "email": email,
        "password": senha,
    })
    return res

# Login
def login_usuario(email, senha):
    res = supabase.auth.sign_in_with_password({
        "email": email,
        "password": senha,
    })
    return res

# Salvar Upload Excel
def salvar_upload(nome, df, user_id, token):
    dados_json = df.to_json(orient='records')
    url = f"{SUPABASE_URL}/rest/v1/uploads"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "nome": nome,
        "user_id": user_id,
        "dados_json": json.loads(dados_json)
    }
    response = httpx.post(url, headers=headers, json=payload)
    if response.status_code != 201:
        raise Exception(f"Erro ao inserir: {response.json()}")
    return response.json()

# Atualizar uploads
def atualizar_upload(id, df, token):
    dados_json = df.to_json(orient='records')
    url = f"{SUPABASE_URL}/rest/v1/uploads?id=eq.{id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Prefer": "return=representation"
    }
    response = httpx.patch(url, headers=headers, json={"dados_json": json.loads(dados_json)})
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json()}")
    return response.json()

# Atualizar tabelas criadas
def atualizar_tabela_criada(id, df, token):
    dados_json = df.to_json(orient='records')
    url = f"{SUPABASE_URL}/rest/v1/tabelas_criadas?id=eq.{id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Prefer": "return=representation"
    }
    response = httpx.patch(url, headers=headers, json={"dados_json": json.loads(dados_json)})
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json()}")
    return response.json()

# Buscar uploads do usuário
def buscar_uploads_usuario(user_id, token):
    url = f"{SUPABASE_URL}/rest/v1/uploads?user_id=eq.{user_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    response = httpx.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json()}")
    return response.json()

# Buscar tabelas criadas
def buscar_tabelas_criadas(user_id, token):
    url = f"{SUPABASE_URL}/rest/v1/tabelas_criadas?user_id=eq.{user_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}"
    }
    response = httpx.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Erro: {response.json()}")
    return response.json()

def salvar_tabela_criada(nome, df, user_id, token):
    dados_json = df.to_json(orient='records')
    url = f"{SUPABASE_URL}/rest/v1/tabelas_criadas"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "nome": nome,
        "user_id": user_id,
        "dados_json": json.loads(dados_json)
    }
    response = httpx.post(url, headers=headers, json=payload)
    if response.status_code != 201:
        raise Exception(f"Erro ao inserir: {response.json()}")
    return response.json()
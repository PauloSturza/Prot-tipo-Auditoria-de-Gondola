from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Optional
from fastapi.staticfiles import StaticFiles
from fpdf import FPDF
from fastapi.responses import Response
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Serve as fotos salvas pelo promotor diretamente pela URL /uploads/...
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5433"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

class LoginReq(BaseModel):
    email: str
    senha: str


# ==========================================
# ROTAS DO APP MOBILE (Promotor)
# ==========================================

# Autentica o promotor pelo e-mail e senha, retorna o ID e nome
@app.post("/login/vendedor")
def login_vendedor(req: LoginReq):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, nome FROM vendedores WHERE email=%s AND senha_hash=%s AND ativo=TRUE", (req.email, req.senha))
    user = cur.fetchone()
    conn.close()
    if user: return user
    raise HTTPException(status_code=401, detail="Credenciais inválidas")

# Retorna as lojas vinculadas a um promotor específico
@app.get("/vendedor/{vendedor_id}/lojas")
def listar_lojas(vendedor_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT l.id, l.nome_fantasia FROM lojas l JOIN vendedor_loja vl ON l.id = vl.loja_id WHERE vl.vendedor_id = %s", (vendedor_id,))
    lojas = cur.fetchall()
    conn.close()
    return lojas

# Salva a foto da gôndola junto com as coordenadas GPS da visita
@app.post("/upload")
async def salvar_visita(
    vendedor_id: int = Form(...),
    loja_id: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    foto: UploadFile = File(...)
):
    if not os.path.exists("uploads"): os.makedirs("uploads")
    path = f"uploads/{foto.filename}"

    with open(path, "wb") as f:
        f.write(await foto.read())

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO visitas (vendedor_id, loja_id, url_foto, lat_registro, lng_registro)
        VALUES (%s,%s,%s,%s,%s)
    """, (vendedor_id, loja_id, path, lat, lng))
    conn.commit()
    conn.close()

    return {"status": "sucesso", "mensagem": "Visita registrada!"}


# ==========================================
# ROTAS DO PAINEL ADMIN
# ==========================================

# Retorna todas as visitas registradas; aceita filtro por intervalo de datas
@app.get("/admin/visitas")
def relatorio_visitas(inicio: Optional[str] = None, fim: Optional[str] = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT v.id, ven.nome as vendedor, l.nome_fantasia as loja,
               v.url_foto, v.lat_registro, v.lng_registro, v.data_hora
        FROM visitas v
        JOIN vendedores ven ON v.vendedor_id = ven.id
        JOIN lojas l ON v.loja_id = l.id
        WHERE 1=1
    """
    params = []

    if inicio and fim:
        query += " AND v.data_hora::date >= %s AND v.data_hora::date <= %s"
        params.extend([inicio, fim])

    query += " ORDER BY v.data_hora DESC"

    cur.execute(query, params)
    visitas = cur.fetchall()
    conn.close()
    return visitas

# Retorna todos os promotores cadastrados (ativos e inativos)
@app.get("/admin/vendedores")
def listar_vendedores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, nome, email, ativo FROM vendedores ORDER BY nome")
    vendedores = cur.fetchall()
    conn.close()
    return vendedores

# Cadastra um novo promotor no sistema
@app.post("/admin/vendedores")
def criar_vendedor(nome: str = Form(...), email: str = Form(...), senha: str = Form(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO vendedores (nome, email, senha_hash) VALUES (%s, %s, %s)", (nome, email, senha))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Ativa ou desativa o acesso de um promotor sem excluir seu histórico
@app.put("/admin/vendedores/{vendedor_id}/toggle")
def toggle_vendedor(vendedor_id: int, ativo: bool):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE vendedores SET ativo = %s WHERE id = %s", (ativo, vendedor_id))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Retorna todas as lojas com a lista de promotores vinculados a cada uma
@app.get("/admin/lojas")
def listar_todas_lojas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # COALESCE evita retornar NULL quando a loja não tem nenhum promotor vinculado
    query = """
        SELECT l.id, l.nome_fantasia, l.lat_loja, l.lng_loja, l.ativo,
               COALESCE(string_agg(v.nome, ', '), 'Nenhum Promotor') as promotores
        FROM lojas l
        LEFT JOIN vendedor_loja vl ON l.id = vl.loja_id
        LEFT JOIN vendedores v ON vl.vendedor_id = v.id
        GROUP BY l.id, l.nome_fantasia, l.lat_loja, l.lng_loja, l.ativo
        ORDER BY l.nome_fantasia
    """
    cur.execute(query)
    lojas = cur.fetchall()
    conn.close()
    return lojas

# Cadastra uma nova loja (PDV) com nome e coordenadas GPS
@app.post("/admin/lojas")
def criar_loja(nome: str = Form(...), lat: float = Form(...), lng: float = Form(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO lojas (nome_fantasia, lat_loja, lng_loja) VALUES (%s, %s, %s)", (nome, lat, lng))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Ativa ou desativa uma loja sem excluir seu histórico de visitas
@app.put("/admin/lojas/{loja_id}/toggle")
def toggle_loja(loja_id: int, ativo: bool):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE lojas SET ativo = %s WHERE id = %s", (ativo, loja_id))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Cria a rota entre um promotor e uma loja (vínculo na tabela vendedor_loja)
@app.post("/admin/vinculos")
def vincular_loja(vendedor_id: int = Form(...), loja_id: int = Form(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    # ON CONFLICT evita erro ao tentar criar um vínculo que já existe
    cur.execute("""
        INSERT INTO vendedor_loja (vendedor_id, loja_id)
        VALUES (%s, %s) ON CONFLICT DO NOTHING
    """, (vendedor_id, loja_id))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Remove a rota entre um promotor e uma loja
@app.delete("/admin/vinculos/{vendedor_id}/{loja_id}")
def deletar_vinculo(vendedor_id: int, loja_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM vendedor_loja WHERE vendedor_id = %s AND loja_id = %s", (vendedor_id, loja_id))
    conn.commit()
    conn.close()
    return {"status": "sucesso"}

# Retorna todos os vínculos promotor-loja para exibição na aba de gestão de rotas
@app.get("/admin/vinculos")
def listar_vinculos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT
            v.id as vendedor_id, v.nome as vendedor_nome,
            l.id as loja_id, l.nome_fantasia as loja_nome
        FROM vendedor_loja vl
        JOIN vendedores v ON vl.vendedor_id = v.id
        JOIN lojas l ON vl.loja_id = l.id
        ORDER BY v.nome, l.nome_fantasia
    """
    cur.execute(query)
    vinculos = cur.fetchall()
    conn.close()
    return vinculos

# Gera e retorna o relatório de cobertura de PDVs em PDF para download
@app.get("/admin/pdf-cobertura")
def gerar_pdf_cobertura(inicio: str, fim: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # LEFT JOIN garante que lojas sem visita no período também apareçam no relatório
    query = """
        SELECT l.nome_fantasia as loja,
               COUNT(v.id) as qtd_visitas,
               string_agg(DISTINCT ven.nome, ', ') as vendedor,
               MAX(v.data_hora) as ultima_visita
        FROM lojas l
        LEFT JOIN visitas v ON l.id = v.loja_id
            AND v.data_hora::date >= %s AND v.data_hora::date <= %s
        LEFT JOIN vendedores ven ON v.vendedor_id = ven.id
        WHERE l.ativo = TRUE
        GROUP BY l.nome_fantasia
        ORDER BY l.nome_fantasia ASC
    """
    cur.execute(query, (inicio, fim))
    dados = cur.fetchall()
    conn.close()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, f"Relatorio de Cobertura - PDVs", ln=True, align='C')
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 10, f"Periodo: {inicio} ate {fim}", ln=True, align='C')
    pdf.ln(10)

    # Cabeçalho da tabela
    pdf.set_font("Arial", "B", 10)
    pdf.set_fill_color(200, 220, 255)
    pdf.cell(80, 10, "Loja (PDV)", 1, 0, 'C', True)
    pdf.cell(20, 10, "Visitada?", 1, 0, 'C', True)
    pdf.cell(50, 10, "Promotor(es)", 1, 0, 'C', True)
    pdf.cell(40, 10, "Ultima Visita", 1, 1, 'C', True)

    pdf.set_font("Arial", "", 9)
    for d in dados:
        if d['qtd_visitas'] > 0:
            visitada = "SIM"
            vendedor = str(d['vendedor'])
            # Formato: data da última visita + total de visitas no período entre parênteses
            data = f"{d['ultima_visita'].strftime('%d/%m/%Y')} ({d['qtd_visitas']}x)"
        else:
            visitada = "NAO"
            vendedor = "-"
            data = "-"

        # Trunca o texto para não quebrar o layout da célula no PDF
        pdf.cell(80, 8, str(d['loja'])[:35], 1)
        pdf.cell(20, 8, visitada, 1, 0, 'C')
        pdf.cell(50, 8, str(vendedor)[:20], 1, 0, 'C')
        pdf.cell(40, 8, data, 1, 1, 'C')

    response_content = bytes(pdf.output())
    return Response(
        content=response_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=relatorio_cobertura.pdf"}
    )
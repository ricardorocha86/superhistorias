"""
API Backend para o Super Histórias
Expõe o processo de criação de histórias via SSE (Server-Sent Events)
Salva histórias e imagens em disco para histórico
"""
import re
import os
import glob
import asyncio
import time
import json
import base64
import uuid
import traceback
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

load_dotenv()  # Tenta local primeiro
load_dotenv(dotenv_path="../.env")  # Tenta pasta pai (Scripts)

# === CONFIGURAÇÃO DE MODELOS ===
GEMINI_TEXT_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-3-flash-preview")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3-pro-image-preview")

# === CONFIGURAÇÃO DE VALIDAÇÃO DE IMAGENS ===
MAX_IMAGE_SIZE_MB = 10  # Tamanho máximo por imagem em MB
MAX_IMAGE_DIMENSION = 2048  # Dimensão máxima (largura ou altura)

# === CLASSE DE LOGGING POR HISTÓRIA ===
# === CLASSE DE LOGGING POR HISTÓRIA ===
class StoryLogger:
    """Logger que salva todas as operações em um arquivo de log na pasta da história"""
    
    def __init__(self):
        self.buffer = []
        self.file_path = None
        self.original_start_time = datetime.now()
        self.api_stats = {
            "calls": 0,
            "total_tokens_input": 0,
            "total_tokens_output": 0,
            "image_generated": 0,
            "errors": 0
        }
        # Estrutura para rastrear detalhes de cada imagem
        self.image_details = {} 
        # Ex: "imagem capa": { "status": "pending", "tentativas": 0, "erros": [] }
        # Estrutura para rastrear detalhes de cada imagem
        self.image_details = {} 
        # Ex: "imagem capa": { "status": "pending", "tentativas": 0, "erros": [] }
    
    def start_file_logging(self, folder_path: str, story_title: str):
        """Inicia o logging em arquivo e despeja o buffer"""
        self.file_path = os.path.join(folder_path, "generation_log.txt")
        
        # Cria o cabeçalho
        header = f"""
================================================================================
                    SUPER HISTÓRIAS - LOG DE GERAÇÃO
================================================================================
História: {story_title}
Início do Processo: {self.original_start_time.strftime('%Y-%m-%d %H:%M:%S')}
Modelo de Texto: {GEMINI_TEXT_MODEL}
Modelo de Imagem: {GEMINI_IMAGE_MODEL}
================================================================================
"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            f.write(header)
            
        # Despeja buffer
        with open(self.file_path, 'a', encoding='utf-8') as f:
            for entry in self.buffer:
                f.write(entry)
        
        self.buffer = [] # Limpa buffer para economizar memória (já está no disco)

    def log(self, level: str, message: str, data: dict = None):
        """Adiciona uma entrada no log (buffer ou arquivo)"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        elapsed = (datetime.now() - self.original_start_time).total_seconds()
        
        entry = f"[{timestamp}] [{elapsed:>8.2f}s] [{level:>5}] {message}\n"
        
        if data:
            for key, value in data.items():
                str_value = str(value)
                if len(str_value) > 2000: # Aumentei limite para inputs grandes
                    str_value = str_value[:2000] + "... [TRUNCADO]"
                entry += f"    └─ {key}: {str_value}\n"
        
        if self.file_path:
            with open(self.file_path, 'a', encoding='utf-8') as f:
                f.write(entry)
        else:
            self.buffer.append(entry)
        
        # Também imprime no console (opcional, pode poluir)
        # print(f"[{level}] {message}") 

    def log_input(self, inputs: dict):
        """Log formatado para inputs do usuário"""
        self.info("INPUTS DO USUÁRIO RECEBIDOS", inputs)

    def log_api_request(self, endpoint: str, prompt_preview: str):
        """Registra envio de requisição"""
        self.api_stats["calls"] += 1
        # Truncar prompt para 30 caracteres conforme solicitado
        short_prompt = prompt_preview[:30] + "..." if len(prompt_preview) > 30 else prompt_preview
        
        self.info(f"REQ -> API ({endpoint})", {
            "sent_at": datetime.now().strftime('%H:%M:%S.%f'),
            "prompt_preview": short_prompt
        })

    def log_api_response(self, endpoint: str, duration: float, metadata: dict = None):
        """Registra retorno de requisição"""
        data = {
            "received_at": datetime.now().strftime('%H:%M:%S.%f'),
            "duration": f"{duration:.2f}s"
        }
        if metadata:
            data.update(metadata)
            if "total_tokens" in metadata:
                 # Exemplo de processamento simples de tokens se disponível
                 pass
                 
        self.info(f"RES <- API ({endpoint})", data)

    def info(self, message: str, data: dict = None):
        self.log("INFO", message, data)
    
    def warn(self, message: str, data: dict = None):
        self.log("WARN", message, data)
    
    def error(self, message: str, data: dict = None):
        self.api_stats["errors"] += 1
        self.log("ERROR", message, data)
    
    def success(self, message: str, data: dict = None):
        self.log("OK", message, data)
    
    def track_image_attempt(self, image_id, attempt, error=None):
        """Registra tentativa de imagem"""
        if image_id not in self.image_details:
            self.image_details[image_id] = {"status": "processing", "tentativas": 0, "erros": []}
        
        self.image_details[image_id]["tentativas"] = attempt
        if error:
            # Simplificar mensagem de erro
            error_str = str(error)
            if "RESOURCE_EXHAUSTED" in error_str:
                error_str = "Erro 429: Cota de API excedida (Resource Exhausted)"
            elif "NoneType" in error_str and "iterable" in error_str:
                error_str = "Erro Interno: Resposta inesperada da API (NoneType)"
            elif len(error_str) > 120:
                error_str = error_str[:117] + "..."
                
            self.image_details[image_id]["erros"].append(f"Tentativa {attempt}: {error_str}")
            
            # Se atingiu o máximo de retries e ainda tem erro, marca como falha
            if attempt >= MAX_RETRIES:
                self.image_details[image_id]["status"] = "failed"

    def track_image_success(self, image_id):
        """Registra sucesso de imagem"""
        if image_id not in self.image_details:
             self.image_details[image_id] = {"status": "processing", "tentativas": 0, "erros": []}
        self.image_details[image_id]["status"] = "success"

    def finalize(self, total_time: float, images_success: int, images_failed: int):
        """Finaliza o log com resumo detalhado"""
        
        # Determinar status final RIGOROSO
        expected_images = 6
        final_status = "FALHA"
        if images_success >= expected_images:
            final_status = "SUCESSO"
        elif images_success > 0:
            final_status = "PARCIAL"
            
        # Montar resumo por imagem
        details_str = ""
        sorted_keys = sorted(self.image_details.keys())
        for img_id in sorted_keys:
            info = self.image_details[img_id]
            status_icon = "✅" if info['status'] == 'success' else "❌"
            details_str += f"\n[{status_icon}] {img_id.upper()}\n"
            details_str += f"    Status: {info['status']}\n"
            details_str += f"    Tentativas: {info['tentativas']}\n"
            if info['erros']:
                details_str += f"    Erros ({len(info['erros'])}):\n"
                for err in info['erros']:
                    details_str += f"      - {err}\n"
        
        if not details_str:
            details_str = "\n    Nenhum detalhe de imagem registrado.\n"

        footer = f"""
================================================================================
                               RESUMO GERAL
================================================================================
Início do Processo: {self.original_start_time.strftime('%Y-%m-%d %H:%M:%S')}
Fim do Processo:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Tempo Total:        {total_time:.2f} segundos
Status Final:       {final_status}

--- ESTATÍSTICAS DE API ---
Chamadas Totais:   {self.api_stats['calls']}
Erros Registrados: {self.api_stats['errors']}

--- GERAÇÃO DE ASSETS (Esperado: {expected_images}) ---
Imagens Geradas:  {images_success}
Imagens Falharam: {images_failed}

--- DETALHAMENTO POR IMAGEM ---
{details_str}
================================================================================
"""
        if self.file_path:
            with open(self.file_path, 'a', encoding='utf-8') as f:
                f.write(footer)
        else:
            print(footer)

app = FastAPI(title="Super Histórias API", version="1.0.0")

# Pasta para salvar histórias
STORIES_DIR = os.path.join(os.path.dirname(__file__), "historias")
os.makedirs(STORIES_DIR, exist_ok=True)

# Configuração de CORS a partir de variável de ambiente
# Em produção, defina CORS_ORIGINS com as URLs permitidas
default_origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()] or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos das histórias
app.mount("/historias", StaticFiles(directory=STORIES_DIR), name="historias")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- MODELOS ---
class Story(BaseModel):
    title: str = Field(description="O título épico e chamativo da história.")
    cover_prompt: str = Field(description="Um prompt extremamente CRIATIVO, OUSADO e DRAMÁTICO para a imagem de capa. Deve capturar a essência da história com uma composição dinâmica, ângulos de câmera impactantes (ex: low angle, wide shot) e iluminação cinematográfica. Evite cenas estáticas.")
    visual_style: str = Field(description="Uma descrição visual CONSISTENTE para TODAS as imagens. Defina o estilo artístico, paleta de cores, iluminação e atmosfera. Use Tags em inglês para melhor precisão.")
    character_bible: str = Field(description="O GUIA DEFINITIVO DOS PERSONAGENS. Este texto deve conter TUDO o que é necessário para um artista desenhar os personagens corretamente e consistentemente ao longo de toda a história. Identifique e descreva quaisquer elementos visuais, emocionais ou físicos que sejam cruciais para a identidade deles NESTA trama específica (sejam roupas, expressões, itens, auras, companheiros, manchas, postura, ou qualquer detalhe narrativo relevante que deva aparecer nas imagens). Mantenha em inglês.")
    parts: List[List[str]] = Field(
        description="Uma lista de exatamente 5 elementos seguindo um ARCO NARRATIVO: 1. Introdução/Contexto, 2. Incidente Incitante/Chamado, 3. Desafios/Ação Crescente, 4. Clímax/Grande Confronto, 5. Resolução/Conclusão. Cada elemento é [texto_da_historia, prompt_de_imagem_em_ingles].",
        min_length=5,
        max_length=5
    )

class Character(BaseModel):
    id: str
    name: str
    images: List[str]  # Base64 encoded images

class Universe(BaseModel):
    id: str
    name: str
    style: str
    emoji: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None

class StoryRequest(BaseModel):
    characters: List[Character]
    universe: Universe
    description: Optional[str] = None

# --- FUNÇÕES AUXILIARES ---

# Configuração de retry
MAX_RETRIES = 5
BASE_DELAY = 1  # segundos
MAX_DELAY = 5   # segundos

async def retry_with_backoff(func, *args, operation_name="operação", logger: StoryLogger = None, on_attempt=None, **kwargs):
    """
    Executa uma função async com retry e backoff exponencial.
    Tenta até MAX_RETRIES vezes, esperando de 1 a 5 segundos entre tentativas.
    """
    last_exception = None
    
    for attempt in range(1, MAX_RETRIES + 1):
        if on_attempt:
            # Notifica qual tentativa está começando
            if asyncio.iscoroutinefunction(on_attempt):
                await on_attempt(attempt)
            else:
                on_attempt(attempt)
                
        try:
            res = await func(*args, **kwargs)
            # Se sucesso e for imagem, registrar
            if logger and "imagem" in operation_name.lower():
                logger.track_image_success(operation_name)
            return res
        except Exception as e:
            last_exception = e
            error_msg = str(e)
            
            # Log do erro específico
            if logger:
                # Tentar identificar se é uma operação de imagem pelo nome
                if "imagem" in operation_name.lower():
                     logger.track_image_attempt(operation_name, attempt, error_msg)
                
                logger.warn(f"Erro na tentativa {attempt}/{MAX_RETRIES} para {operation_name}", {
                    "erro": error_msg,
                    "tipo_erro": type(e).__name__
                })
            
            if attempt < MAX_RETRIES:
                # Backoff exponencial: 1s, 2s, 3s, 4s, 5s (limitado a MAX_DELAY)
                delay = min(BASE_DELAY * attempt, MAX_DELAY)
                print(f"⚠️ Tentativa {attempt}/{MAX_RETRIES} falhou para {operation_name}: {e}")
                
                if logger:
                     logger.info(f"Aguardando {delay}s antes de tentar novamente...")
                     
                await asyncio.sleep(delay)
            else:
                if logger:
                    logger.error(f"FALHA DEFINITIVA após {MAX_RETRIES} tentativas para {operation_name}", {
                        "ultimo_erro": error_msg
                    })
                print(f"❌ Falha definitiva após {MAX_RETRIES} tentativas para {operation_name}: {e}")
    
    raise last_exception

def send_event(event_type: str, data: dict) -> str:
    """Formata evento SSE"""
    payload = json.dumps({"type": event_type, **data}, ensure_ascii=False)
    return f"data: {payload}\n\n"

def decode_base64_images(base64_images: List[str], logger: StoryLogger = None) -> List[Image.Image]:
    """
    Decodifica imagens Base64 para objetos PIL.
    Valida tamanho máximo e redimensiona se necessário.
    """
    images = []
    
    for idx, b64 in enumerate(base64_images):
        # Remove o prefixo data:image/xxx;base64, se existir
        if ',' in b64:
            b64 = b64.split(',')[1]
        
        # Validação #3: Verificar tamanho ANTES de decodificar
        # Cada caractere Base64 representa 6 bits, então 4 chars = 3 bytes
        estimated_size_mb = (len(b64) * 3 / 4) / (1024 * 1024)
        
        if estimated_size_mb > MAX_IMAGE_SIZE_MB:
            error_msg = f"Imagem {idx + 1} muito grande: {estimated_size_mb:.2f}MB (máximo: {MAX_IMAGE_SIZE_MB}MB)"
            if logger:
                logger.error(error_msg)
            raise HTTPException(
                status_code=400, 
                detail=error_msg
            )
        
        try:
            image_data = base64.b64decode(b64)
            img = Image.open(BytesIO(image_data))
            
            # Log do tamanho original
            original_size = img.size
            
            # Redimensionar se muito grande para economizar memória/processamento
            if max(img.size) > MAX_IMAGE_DIMENSION:
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
                if logger:
                    logger.info(f"Imagem {idx + 1} redimensionada", {
                        "original": f"{original_size[0]}x{original_size[1]}",
                        "nova": f"{img.size[0]}x{img.size[1]}"
                    })
            
            # Converter para RGB se necessário (remove alpha channel)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            images.append(img)
            
            if logger:
                logger.info(f"Imagem {idx + 1} decodificada com sucesso", {
                    "tamanho_mb": f"{estimated_size_mb:.2f}MB",
                    "dimensoes": f"{img.size[0]}x{img.size[1]}",
                    "modo": img.mode
                })
                
        except Exception as e:
            error_msg = f"Erro ao processar imagem {idx + 1}: {str(e)}"
            if logger:
                logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
    
    return images

def sanitize_filename(name: str) -> str:
    """Remove caracteres inválidos de nomes de arquivo"""
    return re.sub(r'[<>:"/\\|?*]', '', name).replace(' ', '_')[:50]

def create_story_folder(title: str) -> tuple[str, str]:
    """Cria pasta para a história e retorna (caminho_absoluto, story_id)"""
    story_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    title_clean = sanitize_filename(title)
    folder_name = f"{story_id}_{title_clean}"
    folder_path = os.path.join(STORIES_DIR, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    return folder_path, story_id, folder_name

async def _gerar_json_historia_interno(characters: List[Character], universe: Universe, description: str, logger: StoryLogger = None):
    """Função interna que gera a estrutura da história."""
    nomes = ", ".join([c.name for c in characters])
    
    prompt_historia = f"""
    Você é um premiado autor de contos fantásticos e diretor de arte.
    
    TAREFA: Criar uma história curta e envolvente com EXATAMENTE 5 PARTES, seguindo um arco narrativo claro.
    
    INPUTS:
    - PROTAGONISTAS: {nomes}
    - TEMA/DESCRIÇÃO: {description}
    - UNIVERSO: {universe.name} - {universe.style}
    
    DIRETRIZES DE NARRATIVA (ARCO DE 5 PARTES):
    1. INTRODUÇÃO: Apresente os personagens e o cenário. (aprox 100-120 palavras)
    2. O CHAMADO: O incidente incitante. (aprox 100-120 palavras)
    3. A JORNADA: Desenvolvimento e desafios. (aprox 100-120 palavras)
    4. O CLÍMAX: O ponto alto da tensão. (aprox 100-120 palavras)
    5. RESOLUÇÃO: O desfecho e aprendizado. (aprox 100-120 palavras)
    
    ESTILO DE ESCRITA & FORMATAÇÃO:
    - ESTRUTURA VISUAL: OBRIGATÓRIO dividir o texto em 2 ou 3 parágrafos curtos. NUNCA gere um bloco único.
    - DIÁLOGOS: Devem começar em nova linha com travessão (—).
    - MARKDOWN:
      * Use **negrito** para destacar termos importantes, revelações ou momentos de grande impacto na narrativa.
      * Use *itálico* para TODAS as falas (diálogos) e pensamentos dos personagens.
    - O texto deve ser envolvente, legível e bem formatado.
    
    DIRETRIZES VISUAIS (PARA OS PROMPTS):
    - Crie um "visual_style" que defina a direção de arte e atmosfera geral da obra visual.
    - Crie um "character_bible" DETALHADO em inglês. 
    IMPORTANTE: Os personagens serão gerados baseados em FOTOS DE REFERÊNCIA fornecidas pelo usuário.
    O seu "character_bible" deve focar em ROUPAS, ACESSÓRIOS e ESTILO, e NÃO em traços faciais genéricos (como "nariz grande", "olhos azuis") que possam contradizer a foto real.
    
    Descreva para cada personagem:
      1. **Figurino (Costume Design):** Descreva cada peça de roupa, materiais, cores exatas, texturas e acessórios. (Ex: "Jaqueta de couro desgastada com patch nas costas").
      2. **Maquiagem e Cabelo (Hair & Makeup):** Estilo do cabelo e adornos. Evite descrever estrutura óssea facial.
      3. **Identidade Visual (Visual Identity):** O que torna eles inconfundíveis? Uma aura? Um item mágico? Postura?
    
    O OBJETIVO É CONSISTÊNCIA TOTAL DE FIGURINO E VIBE.
    - Os prompts das imagens devem incluir "high resolution, 2k, detailed".
    - Descreva CENÁRIOS consistentes.
    - Para a CAPA ("cover_prompt"): Crie uma cena de alto impacto visual, com composição dinâmica e ousada.
    
    SAÍDA JSON NECESSÁRIA:
    - title: Título criativo
    - visual_style: O guia de estilo visual mestre (em inglês)
    - character_bible: O guia definitivo e completo dos personagens (em inglês)
    - cover_prompt: Prompt OUSADO e DINÂMICO para a capa (em inglês)
    - parts: Lista de 5 listas [texto, prompt_imagem]
    
    IMPORTANTE: Os protagonistas nas imagens são SEMPRE {nomes}.
    """
    
    if logger:
        logger.info("Enviando requisição para geração de história", {
            "modelo": GEMINI_TEXT_MODEL,
            "personagens": nomes,
            "universo": universe.name,
            "descricao": description[:200] if description else "[nenhuma]"
        })
    
    start_req = time.time()
    response = await client.aio.models.generate_content(
        model=GEMINI_TEXT_MODEL,
        contents=prompt_historia,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": Story.model_json_schema(),
        },
    )
    duration = time.time() - start_req

    if logger:
        # Tentar extrair usage metadata se disponível
        metadata = {}
        # if hasattr(response, "usage_metadata"):
        #      metadata["usage"] = str(response.usage_metadata)
             
        logger.log_api_response("generate_story_text", duration, metadata)
    
    if not response or not response.text:
        raise ValueError("Resposta vazia da API")
    
    # Parse do JSON
    story_data = Story.model_validate_json(response.text)
    
    # === VALIDAÇÃO EXTRA #4: Verificar estrutura do output ===
    if len(story_data.parts) != 5:
        error_msg = f"Estrutura inválida: esperado 5 partes, recebido {len(story_data.parts)}"
        if logger:
            logger.error(error_msg, {"partes_recebidas": len(story_data.parts)})
        raise ValueError(error_msg)
    
    for i, part in enumerate(story_data.parts):
        if not isinstance(part, list) or len(part) != 2:
            error_msg = f"Parte {i + 1} malformada: esperado [texto, prompt], recebido {type(part)}"
            if logger:
                logger.error(error_msg)
            raise ValueError(error_msg)
        
        texto, prompt_img = part
        
        if not texto or len(texto.strip()) < 30:
            error_msg = f"Parte {i + 1}: texto muito curto ({len(texto)} chars, mínimo 30)"
            if logger:
                logger.warn(error_msg, {"texto": texto[:100] if texto else "[vazio]"})
            # Warning mas não falha - às vezes o modelo gera textos curtos válidos
        
        if not prompt_img or len(prompt_img.strip()) < 10:
            error_msg = f"Parte {i + 1}: prompt de imagem muito curto"
            if logger:
                logger.warn(error_msg)
    
    if not story_data.title or len(story_data.title.strip()) < 3:
        error_msg = "Título da história inválido ou muito curto"
        if logger:
            logger.error(error_msg)
        raise ValueError(error_msg)
    
    if not story_data.cover_prompt or len(story_data.cover_prompt.strip()) < 10:
        error_msg = "Prompt da capa inválido ou muito curto"
        if logger:
            logger.error(error_msg)
        raise ValueError(error_msg)
    
    if logger:
        logger.success("História gerada e validada com sucesso", {
            "titulo": story_data.title,
            "partes": 5,
            "tamanho_total_chars": sum(len(p[0]) for p in story_data.parts)
        })
    
    return story_data

async def gerar_json_historia(characters: List[Character], universe: Universe, description: str, logger: StoryLogger = None):
    """Gera a estrutura da história usando Gemini com retry."""
    return await retry_with_backoff(
        _gerar_json_historia_interno,
        characters, universe, description, logger,
        operation_name="geração de história",
        logger=logger
    )

async def _gerar_imagem_interno(
    id_imagem: str, 
    prompt: str, 
    fotos_personagens: List[Image.Image], 
    nomes: str, 
    universo: str,
    pasta_destino: str,
    ratio: str = "2:3",
    logger: StoryLogger = None,
    visual_style: str = "",
    character_bible: str = "" # Alterado de designs para bible
) -> str:
    """Função interna que gera uma imagem. Levanta exceção se falhar."""
    
    if logger:
        logger.info(f"Iniciando geração de imagem: {id_imagem}", {
            "modelo": GEMINI_IMAGE_MODEL,
            "ratio": ratio,
            "style_guide": visual_style,
            "char_bible": character_bible,
            "prompt_original": prompt[:100] + "..."
        })
    
    # Construção do Prompt Reforçado para Consistência
    # 1. Prompt Específico da cena
    # 2. Guia de Estilo (Visual Style) da história inteira
    # 3. Instrução de Personagem (Face consistency)
    
    user_prompt = f"""
    You are a specialized continuity artist for a movie production.
    
    --- TASK ---
    Generate a high-fidelity scene based on the description below, ensuring PERFECT facial identity match with the provided reference images.
    
    --- SCENE ACTION ---
    {prompt}
    
    --- VISUAL STYLE ---
    {visual_style}
    
    --- CHARACTER WARDROBE & STYLE (From Bible) ---
    {character_bible}
    
    --- PRIORITY INSTRUCTIONS ---
    1. **FACE & IDENTITY (TOP PRIORITY):** You MUST use the attached reference images ({nomes}) as the STRICT GROUND TRUTH for facial features, bone structure, and likeness. Do not deviate from the reference faces.
    2. **WARDROBE & BODY:** Use the "CHARACTER WARDROBE" section for clothing, accessories, and body type.
    3. **CONFLICT RESOLUTION:** If the text description of the face conflicts with the reference image, THE REFERENCE IMAGE WINS.
    4. **SCENE INTEGRATION:** Adapt lighting and expression to match the scene action, but keep the core facial identity intact.
    5. **UNIVERSE:** {universo}.
    6. **QUALITY:** Masterpiece, 8k, cinematic lighting, highly detailed, photorealistic texture.
    """
    
    if logger:
        logger.log_api_request(f"generate_image_{id_imagem}", user_prompt)

    start_req = time.time()
    response = await client.aio.models.generate_content(
        model=GEMINI_IMAGE_MODEL,
        contents=[user_prompt] + fotos_personagens,
        config=types.GenerateContentConfig(
            response_modalities=['IMAGE'],
            image_config=types.ImageConfig(
                aspect_ratio=ratio,
                image_size="2K"  # Ativação Real de 2K (Ponto 1 da avaliação)
            ),
        )
    )
    duration = time.time() - start_req

    if logger:
        logger.log_api_response(f"generate_image_{id_imagem}", duration)

    if not response:
        raise ValueError("Resposta nula da API")

    # Validação robusta de partes/candidatos para evitar erro NoneType
    parts_to_process = []
    try:
        # Verifica se tem candidatos e se parts é iterável
        if getattr(response, 'parts', None):
            parts_to_process = response.parts
        elif getattr(response, 'candidates', None) and response.candidates[0].content.parts:
            parts_to_process = response.candidates[0].content.parts
        else:
            # Tentar extrair motivo do bloqueio
            reason = "Desconhecido"
            try:
                if response.candidates:
                    reason = str(response.candidates[0].finish_reason)
                elif response.prompt_feedback:
                    reason = f"Bloqueio de Prompt: {response.prompt_feedback}"
            except:
                pass
            raise ValueError(f"Nenhuma imagem gerada. Motivo provável: {reason}")
            
    except Exception as e:
        if "NoneType" in str(e):
             raise ValueError(f"Falha estrutural na resposta da API: {e}")
        raise e

    for part in parts_to_process:
        if image := part.as_image():
            # Salvar imagem em disco
            filename = f"{id_imagem}.png"
            filepath = os.path.join(pasta_destino, filename)
            image.save(filepath)
            
            # Também criar versão WebP otimizada
            webp_filename = f"{id_imagem}.webp"
            webp_filepath = os.path.join(pasta_destino, webp_filename)
            
            # Otimizar para web
            with Image.open(filepath) as img:
                original_size = img.size
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                img.save(webp_filepath, "WEBP", quality=85, optimize=True)
                webp_size = os.path.getsize(webp_filepath)
            
            png_size = os.path.getsize(filepath)
            
            if logger:
                logger.success(f"Imagem gerada: {id_imagem}", {
                    "arquivo_png": filename,
                    "arquivo_webp": webp_filename,
                    "dimensoes": f"{original_size[0]}x{original_size[1]}",
                    "tamanho_png": f"{png_size / 1024:.1f}KB",
                    "tamanho_webp": f"{webp_size / 1024:.1f}KB"
                })
            
            return filename
    
    error_msg = f"A resposta não continha uma imagem válida para {id_imagem}."
    if logger:
        logger.error(error_msg)
    raise ValueError(error_msg)

async def gerar_imagem_async(
    id_imagem: str, 
    prompt: str, 
    fotos_personagens: List[Image.Image], 
    nomes: str, 
    universo: str,
    pasta_destino: str,
    ratio: str = "2:3",
    logger: StoryLogger = None,
    visual_style: str = "",
    character_bible: str = "",
    on_attempt: callable = None
) -> Optional[str]:
    """Gera uma imagem com retry e backoff. Retorna None se falhar após todas as tentativas."""
    try:
        return await retry_with_backoff(
            _gerar_imagem_interno,
            id_imagem, prompt, fotos_personagens, nomes, universo, pasta_destino, ratio, logger, visual_style, character_bible,
            operation_name=f"imagem {id_imagem}",
            logger=logger,
            on_attempt=on_attempt
        )
    except Exception as e:
        if logger:
            logger.error(f"Falha definitiva na imagem {id_imagem} capturada no handler externo", {
                "erro": str(e)
            })
        return None

# --- ENDPOINTS ---

@app.post("/api/create-story")
async def create_story(request: StoryRequest):
    """
    Cria uma história completa com imagens.
    Retorna eventos SSE em tempo real para o frontend acompanhar o progresso.
    """
    async def event_generator():
        start_time = time.time()
        pasta_historia = None
        folder_name = None
        
        # INICIALIZA LOGGER IMEDIATAMENTE (Buffer)
        logger = StoryLogger()
        
        images_done = 0
        images_failed = 0
        
        try:
            # ========== ETAPA 1: INICIALIZAÇÃO ==========
            yield send_event("stage", {
                "stage": 1,
                "title": "🚀 Iniciando",
                "message": "Preparando os ingredientes mágicos...",
                "progress": 5
            })
            await asyncio.sleep(0.5)
            
            # Preparar dados dos personagens (LIMITANDO A 5 PERSONAGENS)
            request.characters = request.characters[:5]
            nomes = ", ".join([c.name for c in request.characters])
            description = request.description or f"Uma aventura épica com {nomes}"
            
            # LOG INPUTS
            logger.log_input({
                "personagens": [c.name for c in request.characters],
                "universo": {
                    "nome": request.universe.name,
                    "estilo": request.universe.style
                },
                "descricao_usuario": request.description
            })
            
            # Coletar todas as fotos (LIMITANDO A 2 FOTOS POR PERSONAGEM)
            todas_fotos = []
            for char in request.characters:
                fotos_limitadas = char.images[:2]
                fotos = decode_base64_images(fotos_limitadas, logger)
                todas_fotos.extend(fotos)
            
            yield send_event("stage", {
                "stage": 1,
                "title": "🚀 Iniciando",
                "message": f"Personagens carregados: {nomes}",
                "progress": 10
            })
            
            # ========== ETAPA 2: GERANDO HISTÓRIA ==========
            yield send_event("stage", {
                "stage": 2,
                "title": "📜 Escrevendo a História",
                "message": "A IA está criando uma narrativa épica...",
                "progress": 15
            })
            
            stage2_start = time.time()
            
            # Gerar história (Agora passamos o logger!)
            # Usar task para permitir pings enquanto gera
            story_task = asyncio.create_task(gerar_json_historia(
                request.characters, 
                request.universe, 
                description,
                logger=logger
            ))
            
            # Loop de espera com ping
            while not story_task.done():
                await asyncio.sleep(2) # Ping a cada 2s para garantir conexão viva
                yield send_event("ping", {"message": "Escrevendo..."})
            
            # Recuperar resultado ou erro
            story_data = await story_task
            
            stage2_time = time.time() - stage2_start
            
            # Criar pasta para esta história
            pasta_historia, story_id, folder_name = create_story_folder(story_data.title)
            
            # ========== ATIVAR LOG EM ARQUIVO ==========
            # Agora que temos a pasta, despejamos o log
            logger.start_file_logging(pasta_historia, story_data.title)
            
            logger.info("Geração de história iniciada", {
                "personagens": nomes,
                "universo": request.universe.name,
                "descricao": description[:200]
            })
            logger.success(f"História gerada em {stage2_time:.1f}s", {
                "titulo": story_data.title,
                "partes": len(story_data.parts)
            })
            
            # Log das fotos recebidas
            logger.info(f"Imagens de personagens carregadas", {
                "total_fotos": len(todas_fotos),
                "personagens": [c.name for c in request.characters]
            })
            
            yield send_event("story_created", {
                "stage": 2,
                "title": "📜 História Criada!",
                "message": f"Título: {story_data.title}",
                "progress": 25,
                "elapsed": round(stage2_time, 1),
                "data": {
                    "title": story_data.title,
                    "parts": story_data.parts,
                    "storyId": story_id,
                    "folder": folder_name
                }
            })
            
            # ========== ETAPA 3: GERANDO IMAGENS EM PARALELO ==========
            total_images = 6  # 1 capa + 5 partes
            generated_images = {}
            
            yield send_event("stage", {
                "stage": 3,
                "title": "🎨 Gerando Imagens",
                "message": f"Criando {total_images} ilustrações em paralelo...",
                "progress": 30
            })
            
            # Enviar eventos de início para TODAS as imagens
            yield send_event("image_start", {
                "stage": 3,
                "imageId": "capa",
                "message": "Iniciando geração da capa...",
                "currentImage": 1,
                "totalImages": total_images
            })
            
            for i in range(1, 6):
                yield send_event("image_start", {
                    "stage": 3,
                    "imageId": f"parte_{i}",
                    "message": f"Iniciando capítulo {i}...",
                    "currentImage": i + 1,
                    "totalImages": total_images
                })
            
            # Usar Queue para receber resultados em tempo real
            result_queue = asyncio.Queue()
            img_start = time.time()
            
            async def gerar_e_notificar(id_img, prompt, ratio):
                """Gera imagem e coloca resultado na queue"""
                start = time.time()
                try:
                    async def notify_attempt(attempt):
                        await result_queue.put({
                            "type": "retry",
                            "id": id_img,
                            "attempt": attempt
                        })

                    filename = await gerar_imagem_async(
                        id_img, prompt, todas_fotos, nomes,
                        request.universe.style, pasta_historia, ratio=ratio,
                        logger=logger,
                        visual_style=story_data.visual_style,
                        character_bible=story_data.character_bible,
                        on_attempt=notify_attempt
                    )
                    elapsed = time.time() - start
                    await result_queue.put({
                        "type": "result",
                        "id": id_img, 
                        "filename": filename, 
                        "elapsed": round(elapsed, 1),
                        "error": None
                    })
                except Exception as e:
                    elapsed = time.time() - start
                    await result_queue.put({
                        "id": id_img, 
                        "filename": None, 
                        "elapsed": round(elapsed, 1),
                        "error": str(e)
                    })
            
            # Iniciar todas as tasks em paralelo (sem await)
            tasks = []
            tasks.append(asyncio.create_task(
                gerar_e_notificar("capa", story_data.cover_prompt, "3:2")
            ))
            for i, (texto, prompt) in enumerate(story_data.parts, 1):
                tasks.append(asyncio.create_task(
                    gerar_e_notificar(f"parte_{i}", prompt, "4:5")
                ))
            
            # Processar resultados conforme vão chegando (tempo real)
            images_done = 0
            images_failed = 0
            
            for _ in range(total_images):
                # Aguarda resultados ou retries com timeout para enviar pings
                while True:
                    try:
                        # Tenta pegar objeto da fila
                        queue_item = await asyncio.wait_for(result_queue.get(), timeout=2.0)
                        
                        # Se for um evento de retry, envia SSE e continua esperando o resultado final
                        if queue_item.get("type") == "retry":
                            yield send_event("image_retry", {
                                "stage": 3,
                                "imageId": queue_item["id"],
                                "attempt": queue_item["attempt"]
                            })
                            continue
                        
                        # Se chegamos aqui, é um resultado final (sucesso ou erro definitivo)
                        result = queue_item
                        break 
                    except asyncio.TimeoutError:
                        # Caso demore, envia ping para manter o SSE vivo
                        yield send_event("ping", {"message": "Gerando ilustrações..."})
                        continue
                
                if result.get("error"):
                    images_failed += 1
                    if logger:
                        logger.error(f"Falha na imagem {result['id']}", {
                            "tempo": f"{result['elapsed']}s",
                            "erro": result["error"]
                        })
                    # Enviar evento de erro para essa imagem específica
                    yield send_event("image_error", {
                        "stage": 3,
                        "imageId": result["id"],
                        "message": f"Falha ao gerar {result['id']}",
                        "error": result["error"]
                    })
                    continue
                    
                if result["filename"]:
                    images_done += 1
                    image_url = f"/historias/{folder_name}/{result['filename']}"
                    generated_images[result["id"]] = image_url
                    
                    # Determinar número do capítulo para mensagem
                    if result["id"] == "capa":
                        msg = "Capa criada!"
                        current_num = 1
                    else:
                        cap_num = int(result["id"].split("_")[1])
                        msg = f"Capítulo {cap_num} ilustrado!"
                        current_num = cap_num + 1
                    
                    # ENVIAR EVENTO IMEDIATAMENTE (tempo real!)
                    yield send_event("image_done", {
                        "stage": 3,
                        "imageId": result["id"],
                        "message": msg,
                        "elapsed": result["elapsed"],
                        "imageUrl": image_url,
                        "currentImage": current_num,
                        "totalImages": total_images,
                        "progress": 30 + ((images_done + images_failed) / total_images * 60)
                    })
            
            # Garantir que todas as tasks terminaram
            await asyncio.gather(*tasks, return_exceptions=True)
            
            total_img_time = time.time() - img_start
            if logger:
                logger.info(f"Geração de imagens concluída", {
                    "sucesso": images_done,
                    "falha": images_failed,
                    "tempo_total": f"{total_img_time:.1f}s"
                })
            
            # Verificar se houve falhas (NECESSÁRIO 6 IMAGENS PARA SUCESSO)
            if images_failed > 0:
                error_msg = f"Geração incompleta. {images_done} imagens geradas, {images_failed} falharam."
                if logger:
                    logger.error(error_msg, {"sucesso": images_done, "falha": images_failed})
                    logger.finalize(time.time() - start_time, images_done, images_failed)
                
                yield send_event("error", {
                    "stage": 3,
                    "title": "❌ Geração Incompleta",
                    "message": f"Não foi possível gerar todas as 6 imagens da história. Tente novamente mais tarde.",
                    "progress": 0
                })
                # Não salva o JSON se estiver incompleto (ou poderia salvar com status failed/incomplete)
                # O usuário pediu para não aparecer na galeria se não tiver todas.
                # Então, vamos evitar criar o story.json final ou marcar como hidden.
                # Opção: Não criar story.json final.
                return

            # ========== ETAPA 4: SALVAR E FINALIZAR ==========
            total_time = time.time() - start_time
            
            # Montar objeto final da história
            final_story = {
                "id": story_id,
                "folder": folder_name,
                "createdAt": datetime.now().isoformat(),
                "status": "completed", # Status explícito
                "title": story_data.title,
                "visual_style": story_data.visual_style,
                "character_bible": story_data.character_bible, # Salvando
                "cover_prompt": story_data.cover_prompt,
                "parts": story_data.parts,
                "images": generated_images,
                "universe": {
                    "id": request.universe.id,
                    "name": request.universe.name,
                    "style": request.universe.style
                },
                "characters": [{"id": c.id, "name": c.name} for c in request.characters],
                "totalTime": round(total_time, 1)
            }
            
            # Salvar JSON da história
            json_path = os.path.join(pasta_historia, "story.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(final_story, f, indent=2, ensure_ascii=False)
            
            if logger:
                logger.success("JSON da história salvo", {"arquivo": json_path})
                logger.finalize(total_time, images_done, images_failed)
            
            yield send_event("complete", {
                "stage": 4,
                "title": "✨ História Completa!",
                "message": f"Sua história foi criada em {round(total_time, 1)} segundos!",
                "progress": 100,
                "totalTime": round(total_time, 1),
                "data": final_story
            })
            
        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"❌ Erro na geração: {e}")
            print(error_trace)
            
            if logger:
                logger.error("Erro fatal na geração", {
                    "erro": str(e),
                    "traceback": error_trace[:1000]  # Limita para não ficar muito grande
                })
                logger.finalize(time.time() - start_time, images_done, images_failed)
            
            yield send_event("error", {
                "stage": -1,
                "title": "❌ Erro",
                "message": str(e),
                "progress": 0
            })
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/stories")
async def list_stories():
    """Lista todas as histórias salvas"""
    stories = []
    
    if os.path.exists(STORIES_DIR):
        for folder_name in os.listdir(STORIES_DIR):
            folder_path = os.path.join(STORIES_DIR, folder_name)
            json_path = os.path.join(folder_path, "story.json")
            
            if os.path.isdir(folder_path) and os.path.exists(json_path):
                try:
                    with open(json_path, "r", encoding="utf-8") as f:
                        story = json.load(f)
                        images = story.get("images", {})
                        required_keys = ["capa", "parte_1", "parte_2", "parte_3", "parte_4", "parte_5"]
                        has_all_images = all(img_key in images for img_key in required_keys)
                        
                        is_complete = False
                        if story.get("status") == "completed" and has_all_images:
                             is_complete = True
                        elif has_all_images:
                             is_complete = True
                              
                        story["is_complete"] = is_complete
                        stories.append(story)
                except Exception as e:
                    print(f"Erro ao ler {json_path}: {e}")
    
    # Ordenar por completude (True primeiro) e depois por data de criação (mais recente primeiro)
    stories.sort(key=lambda x: (x.get("is_complete", False), x.get("createdAt", "")), reverse=True)
    
    return {"stories": stories}

@app.get("/api/stories/{story_id}")
async def get_story(story_id: str):
    """Busca uma história específica pelo ID"""
    if os.path.exists(STORIES_DIR):
        for folder_name in os.listdir(STORIES_DIR):
            if folder_name.startswith(story_id):
                json_path = os.path.join(STORIES_DIR, folder_name, "story.json")
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        return json.load(f)
    
    raise HTTPException(status_code=404, detail="História não encontrada")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

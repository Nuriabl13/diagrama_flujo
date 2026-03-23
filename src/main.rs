use axum::{
    Json, Router,
    routing::post,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::env;
use std::net::SocketAddr;
use tower_http::services::ServeDir;
 
// ─────────────────────────────────────────────
//  Estructuras de datos
// ─────────────────────────────────────────────
 
/// Payload que nos llega desde el frontend
#[derive(Deserialize)]
struct ChatRequest {
    historial: Vec<Value>,
    categoria: Option<String>, // "humor" | "fuerza" | "entrenamiento" | "externa" | None
}
 
/// Respuesta que enviamos al frontend
#[derive(Serialize)]
struct ChatResponse {
    texto: String,
    categoria_detectada: String,
}
 
// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────
 
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
 
    let app = Router::new()
        .fallback_service(ServeDir::new("static"))
        .route("/api/chat", post(manejar_chat));
 
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("Servidor Yoda iniciado en http://{}", addr);
 
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
 
// ─────────────────────────────────────────────
//  Lógica del diagrama de flujo
// ─────────────────────────────────────────────
 
/// Detecta la categoría del último mensaje del usuario.
/// Devuelve: "humor" | "fuerza" | "entrenamiento" | "externa" | "sin_problema"
fn detectar_categoria(historial: &[Value]) -> &'static str {
    // Buscamos el último mensaje del usuario
    let ultimo_mensaje = historial
        .iter()
        .rev()
        .find(|m| m["role"].as_str() == Some("user"))
        .and_then(|m| m["parts"][0]["text"].as_str())
        .unwrap_or("")
        .to_lowercase();
 
    // ── Rama "NO hay problema" ──────────────────
    let sin_problema = ["hola", "bien", "tranquilo", "paz", "nada", "todo bien", "sin problemas"];
    if sin_problema.iter().any(|p| ultimo_mensaje.contains(p)) {
        return "sin_problema";
    }
 
    // ── Rama "SI hay problema" → detectamos tipo ─
    let palabras_humor = ["chiste", "humor", "reír", "risa", "gracioso", "divertido", "broma"];
    let palabras_fuerza = ["fuerza", "lado oscuro", "jedi", "sith", "poder", "midi-chlorians", "force"];
    let palabras_entrenamiento = [
        "entrenar", "entrenamiento", "aprender", "practicar",
        "ejercicio", "disciplina", "maestro", "padawan",
    ];
 
    if palabras_humor.iter().any(|p| ultimo_mensaje.contains(p)) {
        return "humor";
    }
    if palabras_fuerza.iter().any(|p| ultimo_mensaje.contains(p)) {
        return "fuerza";
    }
    if palabras_entrenamiento.iter().any(|p| ultimo_mensaje.contains(p)) {
        return "entrenamiento";
    }
 
    // Si hay algún problema pero no encaja en las 3 categorías → pregunta externa
    "externa"
}
 
/// Construye el system prompt según la categoría detectada por el diagrama.
fn system_prompt_para(categoria: &str) -> &'static str {
    match categoria {
        // ── Nodo "Paz y meditación tienes" ─────────────────────────────────
        "sin_problema" => {
            "Eres el Maestro Yoda. El usuario no tiene ningún problema en este momento. \
             Debes responderle con calma y serenidad, felicitándole por su paz interior \
             y recordándole la importancia de la meditación y el equilibrio de la Fuerza. \
             Habla siempre con la sintaxis invertida característica de Yoda \
             (el verbo al final, sujeto después del complemento). \
             Usa frases cortas y sabias."
        }
        // ── Nodo "Humor de Jedi" → "Yoda cuenta un chiste" ─────────────────
        "humor" => {
            "Eres el Maestro Yoda y debes contar un chiste o historia divertida al estilo Jedi. \
             El humor debe ser apropiado para la saga Star Wars: puede referirse al lado oscuro, \
             a los sables de luz, a los midi-chlorians o a situaciones cómicas del Consejo Jedi. \
             Habla SIEMPRE con la sintaxis invertida de Yoda. Termina con una moraleja breve."
        }
        // ── Nodo "Sobre la fuerza" → "Yoda responde sobre la fuerza" ────────
        "fuerza" => {
            "Eres el Maestro Yoda respondiendo una pregunta sobre la Fuerza. \
             Explica qué es la Fuerza, el lado luminoso y el lado oscuro, los midi-chlorians \
             y cómo los Jedi la usan, con profundidad filosófica y referencias a episodios de Star Wars. \
             Habla SIEMPRE con la sintaxis invertida de Yoda. Sé sabio y enigmático."
        }
        // ── Nodo "Entrenamiento Jedi" → "Yoda explica entrenamiento" ────────
        "entrenamiento" => {
            "Eres el Maestro Yoda explicando cómo entrenar para convertirse en Jedi. \
             Describe ejercicios de meditación, control mental, manejo del sable de luz \
             y conexión con la Fuerza. Puedes hacer analogías con la vida cotidiana. \
             Habla SIEMPRE con la sintaxis invertida de Yoda. Sé motivador pero exigente."
        }
        // ── Nodo "Pregunta externa" → "Responder no puedo" ──────────────────
        _ => {
            "Eres el Maestro Yoda y el usuario te ha hecho una pregunta que está fuera \
             de los temas Jedi (humor, la Fuerza o entrenamiento). \
             Debes decirle amablemente que no puedes responder a esa pregunta, \
             que tu conocimiento se limita a los caminos de la Fuerza. \
             Habla SIEMPRE con la sintaxis invertida de Yoda. \
             Sugiere al usuario que te pregunte algo relacionado con los Jedi."
        }
    }
}
 
// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────
 
async fn manejar_chat(Json(payload): Json<ChatRequest>) -> Json<Value> {
    let api_key = match env::var("GEMINI_API_KEY") {
        Ok(k) => k.trim().to_string(),
        Err(_) => {
            return Json(json!({
                "texto": "Error: Falta la variable GEMINI_API_KEY en el entorno.",
                "categoria_detectada": "error"
            }));
        }
    };
 
    // ── 1. Aplicamos el diagrama de flujo ────────────────────────────────────
    let categoria = detectar_categoria(&payload.historial);
    let system_prompt = system_prompt_para(categoria);
 
    // ── 2. Llamamos a Gemini con el system prompt adecuado ───────────────────
    let client = Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );
 
    let body = json!({
        "system_instruction": {
            "parts": [{ "text": system_prompt }]
        },
        "contents": payload.historial
    });
 
    let response = client.post(&url).json(&body).send().await;
 
    match response {
        Ok(res) if res.status().is_success() => {
            if let Ok(json_res) = res.json::<Value>().await {
                if let Some(text) =
                    json_res["candidates"][0]["content"]["parts"][0]["text"].as_str()
                {
                    return Json(json!({
                        "texto": text.trim(),
                        "categoria_detectada": categoria
                    }));
                }
            }
            Json(json!({
                "texto": "Hablar Yoda no puede ahora. Intenta de nuevo, debes.",
                "categoria_detectada": categoria
            }))
        }
        Ok(res) => Json(json!({
            "texto": format!("Error de API: {}", res.status()),
            "categoria_detectada": "error"
        })),
        Err(e) => Json(json!({
            "texto": format!("Error de conexión: {}", e),
            "categoria_detectada": "error"
        })),
    }
}

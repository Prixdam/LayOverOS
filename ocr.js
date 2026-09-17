// Función serverless (Vercel)
// Endpoint: /api/ocr
// La API key de Anthropic debe estar configurada como variable
// de entorno ANTHROPIC_API_KEY en Vercel.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Falta la imagen" });
  }

  const prompt = `
Analiza cuidadosamente esta imagen de un voucher de aerolínea utilizado para servicios hoteleros.

Extrae únicamente información que aparezca realmente en el documento.
NO inventes datos.
Si un dato no aparece o no puede leerse con suficiente seguridad, devuelve null.

Responde ÚNICAMENTE con un JSON válido.
No uses markdown.
No escribas explicaciones antes ni después del JSON.

Usa exactamente estas claves:

{
  "numero_voucher": string o null,
  "aerolinea": string o null,
  "huesped": string o null,
  "vuelo": string o null,
  "fecha_vuelo": string en formato YYYY-MM-DD o null,
  "fecha_emision": string en formato YYYY-MM-DD o null,
  "habitacion": string o null,
  "servicio": string o null,
  "dias": number o null,
  "noches": number o null,
  "pax": number o null,
  "operado_por": string o null,
  "cabina": string o null,
  "fare_level": string o null,
  "observaciones": string o null
}

REGLAS:

1. "numero_voucher" corresponde al VOUCHER ID.
2. "aerolinea" corresponde a la aerolínea que emitió el voucher.
3. "huesped" corresponde al nombre del pasajero.
4. "vuelo" corresponde al número de vuelo, por ejemplo AV8580.
5. Convierte las fechas al formato YYYY-MM-DD.
6. "fecha_vuelo" es la fecha asociada al vuelo/servicio.
7. "fecha_emision" es la fecha en que fue emitido el voucher.
8. "habitacion" corresponde al número o identificación de habitación si aparece.
9. "servicio" debe contener los servicios incluidos, por ejemplo alojamiento, desayuno y WiFi.
10. "dias" corresponde a la duración indicada en días.
11. "noches" corresponde a la duración indicada en noches.
12. "pax" corresponde al número de pasajeros/personas indicado.
13. "operado_por" corresponde a la aerolínea u operador indicado en el documento.
14. "cabina" corresponde a la clase/cabina del vuelo.
15. "fare_level" corresponde al nivel de tarifa si aparece.
16. No confundas el número de vuelo con el VOUCHER ID.
17. No confundas la fecha de emisión con la fecha del vuelo.
18. Conserva correctamente letras y números de códigos.
19. Si el texto está parcialmente borroso, devuelve null antes que inventar.

Presta especial atención a etiquetas como:

VOUCHER ID
NAME/NAME
FLIGHT
FLIGHT DATE
ISSUED
PAX
SERVICE/SERVICE
OPERATED BY
CABIN/CABIN
FARE LEVEL
DAY IN
DAY OUT
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: image
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error Anthropic:", data);
      return res.status(500).json({
        error: "Error comunicándose con el servicio de IA"
      });
    }

    const textBlock =
      data?.content?.find(c => c.type === "text")?.text || "{}";

    const clean = textBlock
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Error OCR:", err);

    return res.status(500).json({
      error: "Error procesando el voucher"
    });
  }
}
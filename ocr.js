// Función serverless (Vercel). Se despliega automáticamente en /api/ocr
// Necesita la variable de entorno ANTHROPIC_API_KEY configurada en Vercel
// (Project Settings > Environment Variables) — nunca se expone al navegador.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { image, mediaType } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Falta la imagen" });
  }

  const prompt = `Extrae los datos de este voucher hotelero y responde SOLO con un JSON, sin texto adicional, sin markdown, con exactamente estas claves:
{
  "numero_voucher": string o null,
  "fecha_voucher": string en formato YYYY-MM-DD o null,
  "huesped": string o null,
  "habitacion": string o null,
  "proveedor": string (agencia, OTA o empresa que emite el voucher) o null,
  "monto": number o null,
  "moneda": string (ej: COP, USD) o null,
  "observaciones": string o null
}
Si un campo no aparece en el voucher, usa null. No inventes datos.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const textBlock = data?.content?.find(c => c.type === "text")?.text || "{}";
    const clean = textBlock.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error procesando el voucher" });
  }
}
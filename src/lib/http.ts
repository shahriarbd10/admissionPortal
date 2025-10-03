export async function safeJson(r: Response) {
  const text = await r.text();            // never throws
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { _raw: text };                // HTML or plain text fallback
  }
}

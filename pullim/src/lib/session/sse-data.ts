/** Read this app's one-JSON-data-line SSE format across arbitrary byte chunks. */
export async function* readSseData(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) yield line.slice(6).replace(/\r$/, "");
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

import { createWorker } from "tesseract.js";

export async function runReceiptOCR(file, lang = "eng") {
  const worker = await createWorker(lang);
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data?.text || "";
}

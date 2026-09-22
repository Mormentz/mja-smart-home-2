/** Client-side compression to keep chat uploads small. */

export async function compressImageFile(file: File, maxEdge = 1280, quality = 0.72): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}

/** Downsample audio by re-encoding via Web Audio when possible; otherwise trim by rejecting huge files upstream. */
export async function compressAudioFile(file: File): Promise<File> {
  if (!file.type.startsWith("audio/")) return file;
  if (file.size <= 800_000) return file;

  try {
    const ctx = new AudioContext();
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
    const offline = new OfflineAudioContext(
      1,
      Math.min(buffer.length, Math.floor(buffer.sampleRate * 90)),
      Math.min(22050, buffer.sampleRate),
    );
    const source = offline.createBufferSource();
    // Downmix / resample by playing into offline context
    const mono = offline.createBuffer(1, offline.length, offline.sampleRate);
    const input = buffer.getChannelData(0);
    const output = mono.getChannelData(0);
    const ratio = input.length / output.length;
    for (let i = 0; i < output.length; i++) {
      output[i] = input[Math.floor(i * ratio)] ?? 0;
    }
    source.buffer = mono;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    await ctx.close();

    const wav = audioBufferToWav(rendered);
    return new File([wav], file.name.replace(/\.\w+$/, "") + ".wav", {
      type: "audio/wav",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

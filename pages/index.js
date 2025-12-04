import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = (e) => rej(e);
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [mode, setMode] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photoreal");
  const [size, setSize] = useState("1024");
  const [editType, setEditType] = useState("inpaint");
  const [imageFile, setImageFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectivePrompt = () => {
    if (mode === "generate") {
      return `${prompt}, style: ${style}`;
    }
    return prompt;
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt(),
          width: Number(size),
          height: Number(size),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const url = `data:image/png;base64,${data.image}`;
      setResultImage(url);
      setHistory((prev) => [url, ...prev].slice(0, 3));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!imageFile) {
      setError("Please upload an image to edit.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const imageBase64 = await toBase64(imageFile);

      const res = await fetch(`${API_BASE}/api/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: effectivePrompt(),
          imageBase64,
          editType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Edit failed");
      const url = `data:image/png;base64,${data.image}`;
      setResultImage(url);
      setHistory((prev) => [url, ...prev].slice(0, 3));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = "ai-image.png";
    a.click();
  };

  return (
    <main className="min-h-screen flex justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-center">
            AI Image Studio
          </h1>
          <p className="text-slate-300 text-center max-w-2xl mx-auto">
            Generate images from text or edit existing images using natural-language prompts.
            Powered by AI.
          </p>
        </header>

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => setMode("generate")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "generate"
                ? "bg-sky-600 text-white shadow-lg"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setMode("edit")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "edit"
                ? "bg-sky-600 text-white shadow-lg"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Edit
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-200">
                Prompt
              </label>
              <textarea
                className="w-full h-32 rounded-lg bg-slate-900 border border-slate-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === "generate"
                    ? "A futuristic cityscape at sunset with flying cars, high detail, cinematic lighting"
                    : editType === "remove-background"
                    ? "No prompt needed for background removal"
                    : "Change the shirt color to blue, add mountains in the background"
                }
              />
            </div>

            {mode === "generate" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-slate-200">
                    Size
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    <option value="768">768 × 768</option>
                    <option value="1024">1024 × 1024</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-slate-200">
                    Style
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    <option value="photoreal">Photoreal</option>
                    <option value="artistic">Artistic</option>
                    <option value="cinematic">Cinematic</option>
                  </select>
                </div>
              </div>
            )}

            {mode === "edit" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-200">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-200">
                    Edit Type
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="inpaint">Modify / Inpaint</option>
                    <option value="remove-background">Remove Background</option>
                    <option value="transform">Transform Image</option>
                  </select>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-300">
                    <strong>Examples:</strong> "Change shirt to red", "Remove background", "Add sunset sky"
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={mode === "generate" ? handleGenerate : handleEdit}
              disabled={loading || (!prompt && editType !== "remove-background")}
              className="w-full px-5 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold transition-colors"
            >
              {loading ? "Processing..." : mode === "generate" ? "Generate Image" : "Apply Edit"}
            </button>
          </section>

          <section className="space-y-4">
            <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60 min-h-[300px] flex items-center justify-center">
              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Result"
                  className="max-h-80 max-w-full rounded-lg border border-slate-700 shadow-lg"
                />
              ) : (
                <p className="text-sm text-slate-400 text-center px-4">
                  Your AI-generated or edited image will appear here.
                </p>
              )}
            </div>

            {resultImage && (
              <button
                onClick={handleDownload}
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm text-white font-medium transition-colors"
              >
                Download Image
              </button>
            )}

            {history.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">Recent Results</p>
                <div className="flex gap-2">
                  {history.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`History ${idx + 1}`}
                      className="h-20 w-20 object-cover rounded-md border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setResultImage(img)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

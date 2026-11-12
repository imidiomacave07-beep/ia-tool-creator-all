import { useEffect, useMemo, useState } from "react";
import {
  Aperture, Clapperboard, ImagePlus, WandSparkles, Music2, Captions,
  Download, LoaderCircle, Sparkles, Film, CircleHelp, CheckCircle2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [mode, setMode] = useState("images-to-video");
  const [prompt, setPrompt] = useState("");
  const [captionText, setCaptionText] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("12");
  const [images, setImages] = useState([]);
  const [music, setMusic] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => setApiStatus("online"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const imageNames = useMemo(() => images.map((f) => f.name), [images]);

  function handleImages(event) {
    setImages(Array.from(event.target.files || []).slice(0, 5));
    setResult(null);
    setError("");
  }

  async function generate(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!prompt.trim()) {
      setError("Escreva uma descrição para o seu vídeo.");
      return;
    }
    if (mode === "images-to-video" && (images.length < 3 || images.length > 5)) {
      setError("Para este primeiro MVP, selecione entre 3 e 5 fotografias.");
      return;
    }

    const data = new FormData();
    data.append("mode", mode);
    data.append("prompt", prompt.trim());
    data.append("captionText", captionText.trim());
    data.append("aspectRatio", aspectRatio);
    data.append("durationSeconds", duration);
    images.forEach((file) => data.append("images", file));
    if (music) data.append("music", music);

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        body: data
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível gerar o vídeo.");
      setResult(payload);
    } catch (err) {
      setError(err.message || "Falha de ligação ao servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Global View AI Creator">
          <span className="brand-mark"><Aperture size={22} /></span>
          <span><strong>GLOBAL VIEW</strong><small>AI CREATOR</small></span>
        </a>
        <div className={`status ${apiStatus}`}>
          <span className="status-dot" />
          {apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "A verificar"}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><Sparkles size={14} /> A SUA IDEIA, EM MOVIMENTO</div>
          <h1>Crie vídeos com o poder da <span>inteligência artificial.</span></h1>
          <p>Transforme descrições e fotografias em conteúdo pronto para partilhar. Comece com uma ideia.</p>
        </section>

        <section className="workspace">
          <div className="workspace-heading">
            <div>
              <div className="section-kicker">NOVO PROJECTO</div>
              <h2>O que vamos criar hoje?</h2>
            </div>
            <span className="beta-tag">MVP · BETA</span>
          </div>

          <div className="mode-switch" role="tablist" aria-label="Modo de criação">
            <button className={mode === "images-to-video" ? "mode active" : "mode"} onClick={() => setMode("images-to-video")} type="button">
              <ImagePlus size={18} /> Fotos → vídeo
            </button>
            <button className={mode === "text-to-video" ? "mode active" : "mode"} onClick={() => setMode("text-to-video")} type="button">
              <WandSparkles size={18} /> Texto → vídeo
            </button>
          </div>

          <form onSubmit={generate}>
            <label className="field-label" htmlFor="prompt">Descreva o vídeo</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex.: Uma praia em Maputo ao pôr do sol, com cores quentes, ambiente cinematográfico e sensação de tranquilidade..."
              rows={4}
              maxLength={1200}
            />
            <div className="field-foot"><span>Seja específico sobre o ambiente, estilo e mensagem.</span><span>{prompt.length}/1200</span></div>

            {mode === "images-to-video" && (
              <div className="upload-panel">
                <div className="upload-title">
                  <div className="upload-icon"><ImagePlus size={20} /></div>
                  <div><strong>Adicionar fotografias</strong><small>Escolha 3 a 5 imagens JPG, PNG ou WEBP.</small></div>
                </div>
                <label className="dropzone">
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImages} />
                  <ImagePlus size={24} />
                  <strong>Toque para escolher fotografias</strong>
                  <span>Até 5 imagens · Máximo 15 MB por imagem</span>
                </label>
                {imageNames.length > 0 && (
                  <div className="file-list">
                    {imageNames.map((name) => <span key={name}><CheckCircle2 size={14} />{name}</span>)}
                  </div>
                )}
              </div>
            )}

            <div className="field-grid">
              <div>
                <label className="field-label" htmlFor="ratio">Formato do vídeo</label>
                <select id="ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                  <option value="16:9">16:9 · YouTube / horizontal</option>
                  <option value="9:16">9:16 · TikTok / Reels</option>
                  <option value="1:1">1:1 · Quadrado</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="duration">Duração</label>
                <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="12">12 segundos</option>
                  <option value="15">15 segundos</option>
                  <option value="20">20 segundos</option>
                  <option value="30">30 segundos</option>
                </select>
              </div>
            </div>

            <div className="optional-fields">
              <label className="field-label" htmlFor="captions"><Captions size={15} /> Texto para legenda (opcional)</label>
              <textarea id="captions" rows={2} value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Escreva a frase que pretende incluir no ficheiro de legendas..." />
              <label className="field-label music-label" htmlFor="music"><Music2 size={15} /> Música de fundo (opcional)</label>
              <input id="music" className="music-input" type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/aac,audio/x-m4a" onChange={(e) => setMusic(e.target.files?.[0] || null)} />
              {music && <span className="selected-music">{music.name}</span>}
            </div>

            {error && <div className="error-box" role="alert">{error}</div>}

            <button className="generate-button" type="submit" disabled={busy || apiStatus === "offline"}>
              {busy ? <><LoaderCircle className="spin" size={19} /> A criar o seu vídeo...</> : <><WandSparkles size={19} /> Gerar vídeo</>}
            </button>
            <p className="privacy-note"><CircleHelp size={14} /> As imagens são processadas pelo servidor deste projecto. Use apenas ficheiros que tem direito de utilizar.</p>
          </form>
        </section>

        {result && (
          <section className="result-panel">
            <div className="result-heading"><CheckCircle2 size={20} /><div><strong>O seu vídeo está pronto!</strong><span>{result.message}</span></div></div>
            <video controls playsInline src={`${API_BASE}${result.videoUrl}`} />
            <div className="result-actions">
              <a className="download-button" href={`${API_BASE}${result.videoUrl}`} download><Download size={17} /> Baixar vídeo MP4</a>
              {result.captionsUrl && <a className="secondary-link" href={`${API_BASE}${result.captionsUrl}`} download>Baixar legendas SRT</a>}
            </div>
          </section>
        )}

        <section className="feature-strip">
          <div><Clapperboard size={19} /><strong>Edição de vídeo</strong><span>Montagem e efeitos básicos</span></div>
          <div><Music2 size={19} /><strong>Áudio</strong><span>Música fornecida por si</span></div>
          <div><Captions size={19} /><strong>Legendas</strong><span>Exportação de ficheiro SRT</span></div>
          <div><Film size={19} /><strong>Exportação</strong><span>Vídeo MP4 em HD</span></div>
        </section>
      </main>

      <footer><span>GLOBAL VIEW AI CREATOR</span><span>Construído para transformar ideias em histórias.</span></footer>
    </div>
  );
}

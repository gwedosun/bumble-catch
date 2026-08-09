import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, FileJson, ListPlus, Users, Ruler, MapPin, Target, Copy, Check, AlertCircle, Radar as RadarIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Ponto de extensão: é aqui que, mais pra frente, você vai plugar o seu
// programa de análise / gravação no banco de dados. Por enquanto os perfis
// ficam guardados em memória (estado do React) só pra você montar a tela.
//
// Sugestão: troque o corpo dessa função por uma chamada real, por exemplo:
//   await fetch("/api/perfis", { method: "POST", body: JSON.stringify(perfil) })
// ---------------------------------------------------------------------------
async function salvarPerfilNoBanco(perfil) {
  try {
    const res = await fetch("/api/perfis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfil),
    });
    if (!res.ok) {
      const errData = await res.json();
      console.error("Erro ao salvar no banco:", errData);
    }
  } catch (err) {
    console.error("Falha de rede ao salvar perfil:", err);
  }
}
const OBJETIVOS_SUGERIDOS = [
  "Relacionamento sério",
  "Ver o que pode rolar",
  "Casamento",
  "Algo casual",
  "Não monogamia ética",
  "Encontrar alguém para a vida",
];

let nextId = 1;

function validarPerfil(obj) {
  const erros = [];
  const idade = Number(obj.idade);
  const altura = Number(obj.altura);
  const beleza = Number(obj.beleza);
  const localizacao = obj.localizacao ?? obj.localização;
  const profissao = obj.profissao ?? obj.profissão;
  const superswipe = Boolean(obj.superswipe);

  // Tratamento dos objetivos (aceita string única ou array)
  let objetivos = obj.objetivos ?? obj.objetivo ?? [];
  if (typeof objetivos === "string") {
    objetivos = [objetivos];
  }

  if (!Number.isInteger(idade) || idade <= 0 || idade > 120) {
    erros.push("Idade precisa ser um número inteiro válido.");
  }
  if (typeof altura !== "number" || Number.isNaN(altura) || altura <= 0 || altura > 3) {
    erros.push("Altura precisa ser um número em metros (ex: 1.75).");
  }
  if (!Number.isInteger(beleza) || beleza < 1 || beleza > 5) {
    erros.push("Beleza precisa ser um inteiro de 1 a 5.");
  }
  if (typeof localizacao !== "string" || localizacao.trim() === "") {
    erros.push("Localização é obrigatória.");
  }
  if (typeof profissao !== "string" || profissao.trim() === "") {
    erros.push("Profissão é obrigatória.");
  }
  if (!Array.isArray(objetivos) || objetivos.length === 0) {
    erros.push("Selecione pelo menos 1 objetivo.");
  }

  if (erros.length > 0) return { ok: false, erros };

  return {
    ok: true,
    perfil: {
      idade: Math.trunc(idade),
      altura: Number(altura.toFixed(2)),
      beleza: Math.trunc(beleza),
      localizacao: localizacao.trim(),
      profissao: profissao.trim(),
      superswipe,
      objetivos: objetivos.slice(0, 2).map((o) => o.trim()), // Garante no máximo 2
    },
  };
}

export default function App() {
  const [perfis, setPerfis] = useState([]);
  const [modo, setModo] = useState("manual"); // "manual" | "json"

  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [erroForm, setErroForm] = useState(null);

  const [jsonTexto, setJsonTexto] = useState("");
  const [erroJson, setErroJson] = useState(null);

  const [copiado, setCopiado] = useState(false);
  const sweepRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const stats = useMemo(() => {
    const total = perfis.length;
    if (total === 0) {
      return { total: 0, mediaIdade: null, mediaAltura: null, objetivos: [], localizacoes: [] };
    }
    const mediaIdade = perfis.reduce((s, p) => s + p.idade, 0) / total;
    const mediaAltura = perfis.reduce((s, p) => s + p.altura, 0) / total;

    const contarPor = (chave) => {
      const mapa = new Map();
      perfis.forEach((p) => mapa.set(p[chave], (mapa.get(p[chave]) || 0) + 1));
      return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      total,
      mediaIdade: mediaIdade.toFixed(1),
      mediaAltura: mediaAltura.toFixed(2),
      objetivos: contarPor("objetivo"),
      localizacoes: contarPor("localizacao"),
    };
  }, [perfis]);

  function adicionarPerfil(perfil) {
    const novo = { id: nextId++, ...perfil };
    setPerfis((prev) => [novo, ...prev]);
    salvarPerfilNoBanco(perfil);
  }

  function handleSubmitManual(e) {
    e.preventDefault();
    const resultado = validarPerfil({ idade, altura, localizacao, objetivo });
    if (!resultado.ok) {
      setErroForm(resultado.erros[0]);
      return;
    }
    setErroForm(null);
    adicionarPerfil(resultado.perfil);
    setIdade("");
    setAltura("");
    setLocalizacao("");
    setObjetivo("");
  }

  function handleSubmitJson(e) {
    e.preventDefault();
    let dados;
    try {
      dados = JSON.parse(jsonTexto);
    } catch {
      setErroJson("JSON inválido — confira vírgulas e chaves.");
      return;
    }
    const lista = Array.isArray(dados) ? dados : [dados];
    const validos = [];
    const erros = [];

    lista.forEach((item, i) => {
      const r = validarPerfil(item);
      if (r.ok) validos.push(r.perfil);
      else erros.push(`item ${i + 1}: ${r.erros.join(", ")}`);
    });

    if (validos.length === 0) {
      setErroJson(erros[0] || "Nenhum perfil válido encontrado.");
      return;
    }

    validos.forEach(adicionarPerfil);
    setErroJson(erros.length > 0 ? `${validos.length} perfil(is) adicionados. Ignorados — ${erros.join(" | ")}` : null);
    setJsonTexto("");
  }

  function removerPerfil(id) {
    setPerfis((prev) => prev.filter((p) => p.id !== id));
  }

  function copiarJson() {
    const texto = JSON.stringify(
      perfis.map(({ id, ...resto }) => resto),
      null,
      2
    );
    navigator.clipboard?.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="rc-root">
      <style>{`
        .rc-root {
          --bg: #0B0E1A;
          --surface: #141827;
          --surface-alt: #1B2036;
          --border: #262C48;
          --text: #F0F1F8;
          --text-muted: #8890B0;
          --accent: #FFB454;
          --accent-soft: rgba(255, 180, 84, 0.14);
          --data: #5EEAD4;
          --data-soft: rgba(94, 234, 212, 0.12);
          --danger: #FF6B6B;

          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100%;
          padding: 40px 24px 64px;
          box-sizing: border-box;
        }
        .rc-root * { box-sizing: border-box; }
        .rc-mono { font-family: 'JetBrains Mono', monospace; }
        .rc-display { font-family: 'Space Grotesk', sans-serif; }

        .rc-shell { max-width: 1080px; margin: 0 auto; }

        /* ---------- Header / signature radar ---------- */
        .rc-header {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-bottom: 40px;
        }
        .rc-radar-wrap {
          position: relative;
          width: 92px;
          height: 92px;
          flex-shrink: 0;
        }
        .rc-radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid var(--border);
        }
        .rc-radar-ring.r2 { inset: 14px; }
        .rc-radar-ring.r3 { inset: 28px; }
        .rc-radar-core {
          position: absolute;
          inset: 40px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 18px 4px var(--accent-soft);
        }
        .rc-radar-sweep {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, var(--accent-soft), transparent 35%);
          animation: rc-spin 3.2s linear infinite;
        }
        @keyframes rc-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .rc-radar-sweep { animation: none; }
        }
        .rc-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          color: var(--data);
          margin: 0 0 6px;
        }
        .rc-title {
          font-size: 30px;
          font-weight: 600;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .rc-subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin: 0;
          max-width: 46ch;
          line-height: 1.5;
        }

        /* ---------- Layout ---------- */
        .rc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .rc-grid { grid-template-columns: 1fr; }
        }

        .rc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px;
        }
        .rc-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin: 0 0 16px;
        }

        /* ---------- Tabs ---------- */
        .rc-tabs {
          display: flex;
          gap: 6px;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 18px;
        }
        .rc-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .rc-tab.active {
          background: var(--accent-soft);
          color: var(--accent);
        }

        /* ---------- Form ---------- */
        .rc-field { margin-bottom: 14px; }
        .rc-label {
          display: block;
          font-size: 12.5px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .rc-input, .rc-textarea {
          width: 100%;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .rc-input:focus, .rc-textarea:focus {
          border-color: var(--accent);
        }
        .rc-textarea {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          min-height: 160px;
          resize: vertical;
          line-height: 1.5;
        }
        .rc-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: var(--accent);
          color: #1A1200;
          border: none;
          border-radius: 8px;
          padding: 11px 14px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: filter 0.15s;
        }
        .rc-btn:hover { filter: brightness(1.08); }

        .rc-error {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.35);
          color: var(--danger);
          font-size: 12.5px;
          padding: 9px 11px;
          border-radius: 8px;
          margin-top: 12px;
          line-height: 1.4;
        }

        /* ---------- Lista de perfis ---------- */
        .rc-empty {
          color: var(--text-muted);
          font-size: 13.5px;
          text-align: center;
          padding: 32px 10px;
          border: 1px dashed var(--border);
          border-radius: 10px;
        }
        .rc-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 340px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .rc-profile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 10px 12px;
        }
        .rc-profile-info {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 14px;
          font-size: 12.5px;
          color: var(--text-muted);
        }
        .rc-profile-info b { color: var(--text); font-weight: 600; }
        .rc-del {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          flex-shrink: 0;
          transition: color 0.15s, background 0.15s;
        }
        .rc-del:hover { color: var(--danger); background: rgba(255,107,107,0.1); }

        /* ---------- Stats ---------- */
        .rc-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        .rc-stat {
          background: var(--data-soft);
          border: 1px solid rgba(94, 234, 212, 0.25);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .rc-stat-value {
          font-size: 22px;
          font-weight: 600;
          color: var(--data);
        }
        .rc-stat-label {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .rc-dist-title {
          font-size: 12px;
          color: var(--text-muted);
          margin: 14px 0 8px;
        }
        .rc-dist-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          margin-bottom: 6px;
        }
        .rc-dist-name { width: 40%; color: var(--text); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rc-dist-bar-track { flex: 1; height: 6px; background: var(--surface-alt); border-radius: 3px; overflow: hidden; }
        .rc-dist-bar-fill { height: 100%; background: var(--data); }
        .rc-dist-count { color: var(--text-muted); width: 24px; text-align: right; flex-shrink: 0; }

        /* ---------- Export ---------- */
        .rc-export-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rc-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: 7px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
        }
        .rc-copy-btn:hover { color: var(--text); border-color: var(--accent); }
        .rc-pre {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          color: var(--text-muted);
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          max-height: 160px;
          overflow: auto;
          margin: 12px 0 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .rc-footnote {
          text-align: center;
          color: var(--text-muted);
          font-size: 11.5px;
          margin-top: 28px;
          line-height: 1.6;
        }
        .rc-footnote code {
          font-family: 'JetBrains Mono', monospace;
          background: var(--surface-alt);
          padding: 1px 5px;
          border-radius: 4px;
          color: var(--data);
        }
      `}</style>

      <div className="rc-shell">
        <div className="rc-header">
          <div className="rc-radar-wrap" ref={sweepRef}>
            <div className="rc-radar-sweep" />
            <div className="rc-radar-ring" />
            <div className="rc-radar-ring r2" />
            <div className="rc-radar-ring r3" />
            <div className="rc-radar-core" />
          </div>
          <div>
            <p className="rc-eyebrow rc-mono">sinal ativo · {stats.total} perfil(is)</p>
            <h1 className="rc-title rc-display">Radar de Curtidas</h1>
            <p className="rc-subtitle">
              Cadastre os perfis que curtiram você para começar a análise. Cada
              perfil vira um ponto de dado: idade, altura, localização e objetivo.
            </p>
          </div>
        </div>

        <div className="rc-grid">
          {/* -------- Coluna esquerda: entrada de dados -------- */}
          <div className="rc-card">
            <p className="rc-card-title">
              <ListPlus size={15} /> Adicionar perfil
            </p>

            <div className="rc-tabs">
              <button
                className={`rc-tab ${modo === "manual" ? "active" : ""}`}
                onClick={() => setModo("manual")}
              >
                <Plus size={14} /> Manual
              </button>
              <button
                className={`rc-tab ${modo === "json" ? "active" : ""}`}
                onClick={() => setModo("json")}
              >
                <FileJson size={14} /> Colar JSON
              </button>
            </div>

            {modo === "manual" ? (
              <form onSubmit={handleSubmitManual}>
                <div className="rc-row2">
                  <div className="rc-field">
                    <label className="rc-label">Idade</label>
                    <input
                      className="rc-input"
                      type="number"
                      inputMode="numeric"
                      placeholder="27"
                      value={idade}
                      onChange={(e) => setIdade(e.target.value)}
                    />
                  </div>
                  <div className="rc-field">
                    <label className="rc-label">Altura (m)</label>
                    <input
                      className="rc-input"
                      type="number"
                      step="0.01"
                      placeholder="1.72"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rc-field">
                  <label className="rc-label">Localização</label>
                  <input
                    className="rc-input"
                    type="text"
                    placeholder="Brasília, DF"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                  />
                </div>
                <div className="rc-field">
                  <label className="rc-label">Objetivo</label>
                  <input
                    className="rc-input"
                    type="text"
                    list="objetivos-sugeridos"
                    placeholder="Relacionamento sério"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                  />
                  <datalist id="objetivos-sugeridos">
                    {OBJETIVOS_SUGERIDOS.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
                <button className="rc-btn" type="submit">
                  <Plus size={16} /> Adicionar ao radar
                </button>
                {erroForm && (
                  <div className="rc-error">
                    <AlertCircle size={14} style={{ marginTop: 1 }} />
                    <span>{erroForm}</span>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleSubmitJson}>
                <div className="rc-field">
                  <label className="rc-label">
                    Cole um objeto ou uma lista de objetos JSON
                  </label>
                  <textarea
                    className="rc-textarea"
                    placeholder={`{\n  "idade": 27,\n  "altura": 1.72,\n  "localizacao": "Brasília, DF",\n  "objetivo": "Relacionamento sério"\n}`}
                    value={jsonTexto}
                    onChange={(e) => setJsonTexto(e.target.value)}
                  />
                </div>
                <button className="rc-btn" type="submit">
                  <FileJson size={16} /> Importar JSON
                </button>
                {erroJson && (
                  <div className="rc-error">
                    <AlertCircle size={14} style={{ marginTop: 1 }} />
                    <span>{erroJson}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* -------- Coluna direita: perfis + estatísticas -------- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="rc-card">
              <p className="rc-card-title">
                <Users size={15} /> Perfis cadastrados
              </p>
              {perfis.length === 0 ? (
                <div className="rc-empty">
                  Nenhum perfil ainda. Adicione o primeiro ao lado.
                </div>
              ) : (
                <div className="rc-list">
                  {perfis.map((p) => (
                    <div className="rc-profile" key={p.id}>
                      <div className="rc-profile-info">
                        <span><b>{p.idade}</b> anos</span>
                        <span><b>{p.altura.toFixed(2)}</b> m</span>
                        <span><MapPin size={11} style={{ verticalAlign: -1 }} /> {p.localizacao}</span>
                        <span><Target size={11} style={{ verticalAlign: -1 }} /> {p.objetivo}</span>
                      </div>
                      <button className="rc-del" onClick={() => removerPerfil(p.id)} aria-label="Remover perfil">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rc-card">
              <p className="rc-card-title">
                <Ruler size={15} /> Panorama rápido
              </p>
              <div className="rc-stat-grid">
                <div className="rc-stat">
                  <div className="rc-stat-value rc-mono">{stats.mediaIdade ?? "—"}</div>
                  <div className="rc-stat-label">idade média</div>
                </div>
                <div className="rc-stat">
                  <div className="rc-stat-value rc-mono">{stats.mediaAltura ?? "—"}</div>
                  <div className="rc-stat-label">altura média (m)</div>
                </div>
              </div>

              {stats.objetivos.length > 0 && (
                <>
                  <p className="rc-dist-title">Objetivo</p>
                  {stats.objetivos.slice(0, 4).map(([nome, count]) => (
                    <div className="rc-dist-row" key={nome}>
                      <span className="rc-dist-name">{nome}</span>
                      <div className="rc-dist-bar-track">
                        <div
                          className="rc-dist-bar-fill"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="rc-dist-count rc-mono">{count}</span>
                    </div>
                  ))}
                </>
              )}

              {stats.localizacoes.length > 0 && (
                <>
                  <p className="rc-dist-title">Localização</p>
                  {stats.localizacoes.slice(0, 4).map(([nome, count]) => (
                    <div className="rc-dist-row" key={nome}>
                      <span className="rc-dist-name">{nome}</span>
                      <div className="rc-dist-bar-track">
                        <div
                          className="rc-dist-bar-fill"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="rc-dist-count rc-mono">{count}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="rc-card">
              <div className="rc-export-head">
                <p className="rc-card-title" style={{ margin: 0 }}>
                  <FileJson size={15} /> JSON atual
                </p>
                <button className="rc-copy-btn" onClick={copiarJson} disabled={perfis.length === 0}>
                  {copiado ? <Check size={13} /> : <Copy size={13} />}
                  {copiado ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre className="rc-pre rc-mono">
                {perfis.length === 0
                  ? "[]"
                  : JSON.stringify(perfis.map(({ id, ...resto }) => resto), null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <p className="rc-footnote">
          Ponto de extensão para o seu programa: função <code>salvarPerfilNoBanco()</code> no
          topo do arquivo — é chamada a cada perfil adicionado (manual ou via JSON).
        </p>
      </div>
    </div>
  );
}

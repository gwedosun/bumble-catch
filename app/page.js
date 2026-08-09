'use client';

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, FileJson, ListPlus, Users, Ruler, MapPin, Target, Copy, Check, AlertCircle, Heart, Star, Briefcase } from "lucide-react";

async function salvarPerfilNoBanco(perfil) {
  try {
    const res = await fetch("/api/perfis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfil),
    });
    return await res.json();
  } catch (err) {
    console.error("Erro ao salvar no banco:", err);
  }
}

const OBJETIVOS_OPCOES = [
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
  const objetivos = Array.isArray(obj.objetivos) ? obj.objetivos : [];
  const superswipe = Boolean(obj.superswipe);

  if (!Number.isInteger(idade) || idade <= 0 || idade > 120) {
    erros.push("Idade precisa ser um número inteiro válido.");
  }
  if (typeof altura !== "number" || Number.isNaN(altura) || altura <= 0 || altura > 3) {
    erros.push("Altura precisa ser em metros (ex: 1.75).");
  }
  if (typeof localizacao !== "string" || localizacao.trim() === "") {
    erros.push("Localização é obrigatória.");
  }
  if (typeof profissao !== "string" || profissao.trim() === "") {
    erros.push("Profissão é obrigatória.");
  }
  if (!Number.isInteger(beleza) || beleza < 1 || beleza > 5) {
    erros.push("Beleza deve ser um número inteiro de 1 a 5.");
  }
  if (objetivos.length === 0 || objetivos.length > 2) {
    erros.push("Selecione entre 1 e 2 objetivos.");
  }

  if (erros.length > 0) return { ok: false, erros };

  return {
    ok: true,
    perfil: {
      idade: Math.trunc(idade),
      altura: Number(altura.toFixed(2)),
      localizacao: localizacao.trim(),
      profissao: profissao.trim(),
      beleza,
      superswipe,
      objetivos,
    },
  };
}

export default function App() {
  const [perfis, setPerfis] = useState([]);
  const [modo, setModo] = useState("manual");

  // Form states
  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [profissao, setProfissao] = useState("");
  const [beleza, setBeleza] = useState("3");
  const [superswipe, setSuperswipe] = useState(false);
  const [objetivosSel, setObjetivosSel] = useState([]);
  
  const [erroForm, setErroForm] = useState(null);
  const [jsonTexto, setJsonTexto] = useState("");
  const [erroJson, setErroJson] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    // Buscar dados do banco na inicialização
    fetch("/api/perfis")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPerfis(data);
      })
      .catch((err) => console.log("Erro ao carregar do banco local", err));
  }, []);

  const stats = useMemo(() => {
    const total = perfis.length;
    if (total === 0) {
      return { total: 0, mediaIdade: null, mediaAltura: null, mediaBeleza: null, localizacoes: [] };
    }
    const mediaIdade = perfis.reduce((s, p) => s + p.idade, 0) / total;
    const mediaAltura = perfis.reduce((s, p) => s + p.altura, 0) / total;
    const mediaBeleza = perfis.reduce((s, p) => s + p.beleza, 0) / total;

    const contarPor = (chave) => {
      const mapa = new Map();
      perfis.forEach((p) => mapa.set(p[chave], (mapa.get(p[chave]) || 0) + 1));
      return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      total,
      mediaIdade: mediaIdade.toFixed(1),
      mediaAltura: mediaAltura.toFixed(2),
      mediaBeleza: mediaBeleza.toFixed(1),
      localizacoes: contarPor("localizacao"),
    };
  }, [perfis]);

  async function adicionarPerfil(perfil) {
    const novo = { id: nextId++, ...perfil };
    setPerfis((prev) => [novo, ...prev]);
    await salvarPerfilNoBanco(perfil);
  }

  function handleObjetivoToggle(opcao) {
    if (objetivosSel.includes(opcao)) {
      setObjetivosSel(objetivosSel.filter((o) => o !== opcao));
    } else {
      if (objetivosSel.length < 2) {
        setObjetivosSel([...objetivosSel, opcao]);
      }
    }
  }

  function handleSubmitManual(e) {
    e.preventDefault();
    const resultado = validarPerfil({
      idade,
      altura,
      localizacao,
      profissao,
      beleza,
      superswipe,
      objetivos: objetivosSel,
    });

    if (!resultado.ok) {
      setErroForm(resultado.erros[0]);
      return;
    }

    setErroForm(null);
    adicionarPerfil(resultado.perfil);
    setIdade("");
    setAltura("");
    setLocalizacao("");
    setProfissao("");
    setBeleza("3");
    setSuperswipe(false);
    setObjetivosSel([]);
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
    setErroJson(erros.length > 0 ? `${validos.length} adicionados. Ignorados: ${erros.join(" | ")}` : null);
    setJsonTexto("");
  }

  function removerPerfil(id) {
    setPerfis((prev) => prev.filter((p) => p.id !== id));
  }

  function copiarJson() {
    const texto = JSON.stringify(perfis.map(({ id, ...resto }) => resto), null, 2);
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
          min-height: 100vh;
          padding: 40px 24px;
        }
        .rc-shell { max-width: 1080px; margin: 0 auto; }
        .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 860px) { .rc-grid { grid-template-columns: 1fr; } }
        .rc-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
        .rc-card-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; }
        .rc-field { margin-bottom: 14px; }
        .rc-label { display: block; font-size: 12.5px; color: var(--text-muted); margin-bottom: 6px; }
        .rc-input, .rc-select, .rc-textarea { width: 100%; background: var(--surface-alt); border: 1px solid var(--border); border-radius: 8px; padding: 10px; color: var(--text); font-size: 14px; }
        .rc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: var(--accent); color: #1A1200; border: none; border-radius: 8px; padding: 11px; font-weight: 600; cursor: pointer; }
        .rc-checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .rc-chip { padding: 6px 12px; font-size: 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--surface-alt); cursor: pointer; color: var(--text-muted); }
        .rc-chip.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); }
        .rc-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .rc-stat { background: var(--data-soft); border: 1px solid rgba(94, 234, 212, 0.25); border-radius: 10px; padding: 10px; text-align: center; }
        .rc-stat-value { font-size: 18px; font-weight: 600; color: var(--data); }
        .rc-stat-label { font-size: 11px; color: var(--text-muted); }
        .rc-profile { background: var(--surface-alt); border: 1px solid var(--border); border-radius: 9px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .rc-profile-info { font-size: 12.5px; display: flex; flex-direction: column; gap: 4px; }
        .rc-badge { display: inline-block; font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #FFB45433; color: var(--accent); font-weight: bold; margin-left: 6px; }
      `}</style>

      <div className="rc-shell">
        <h1 style={{ marginBottom: "20px" }}>Radar de Curtidas</h1>

        <div className="rc-grid">
          {/* Cadastro */}
          <div className="rc-card">
            <p className="rc-card-title"><ListPlus size={15} /> Cadastrar Perfil</p>
            
            <form onSubmit={handleSubmitManual}>
              <div className="rc-row2">
                <div className="rc-field">
                  <label className="rc-label">Idade</label>
                  <input className="rc-input" type="number" placeholder="25" value={idade} onChange={(e) => setIdade(e.target.value)} />
                </div>
                <div className="rc-field">
                  <label className="rc-label">Altura (m)</label>
                  <input className="rc-input" type="number" step="0.01" placeholder="1.75" value={altura} onChange={(e) => setAltura(e.target.value)} />
                </div>
              </div>

              <div className="rc-row2">
                <div className="rc-field">
                  <label className="rc-label">Localização</label>
                  <input className="rc-input" type="text" placeholder="Brasília, DF" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
                </div>
                <div className="rc-field">
                  <label className="rc-label">Profissão</label>
                  <input className="rc-input" type="text" placeholder="Engenheira" value={profissao} onChange={(e) => setProfissao(e.target.value)} />
                </div>
              </div>

              <div className="rc-row2">
                <div className="rc-field">
                  <label className="rc-label">Beleza (1 a 5)</label>
                  <select className="rc-select" value={beleza} onChange={(e) => setBeleza(e.target.value)}>
                    {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n} ★</option>))}
                  </select>
                </div>
                <div className="rc-field" style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
                  <label style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
                    <input type="checkbox" checked={superswipe} onChange={(e) => setSuperswipe(e.target.checked)} />
                    SuperSwipe? ⭐
                  </label>
                </div>
              </div>

              <div className="rc-field">
                <label className="rc-label">Objetivos (Escolha até 2)</label>
                <div className="rc-checkbox-group">
                  {OBJETIVOS_OPCOES.map((op) => (
                    <span
                      key={op}
                      className={`rc-chip ${objetivosSel.includes(op) ? "active" : ""}`}
                      onClick={() => handleObjetivoToggle(op)}
                    >
                      {op}
                    </span>
                  ))}
                </div>
              </div>

              <button className="rc-btn" type="submit"><Plus size={16} /> Salvar Perfil</button>
              {erroForm && <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{erroForm}</p>}
            </form>
          </div>

          {/* Estatísticas e Listagem */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="rc-card">
              <p className="rc-card-title"><Ruler size={15} /> Médias Gerais</p>
              <div className="rc-stat-grid">
                <div className="rc-stat">
                  <div className="rc-stat-value">{stats.mediaIdade ?? "—"}</div>
                  <div className="rc-stat-label">Idade</div>
                </div>
                <div className="rc-stat">
                  <div className="rc-stat-value">{stats.mediaAltura ?? "—"}m</div>
                  <div className="rc-stat-label">Altura</div>
                </div>
                <div className="rc-stat">
                  <div className="rc-stat-value">{stats.mediaBeleza ?? "—"}★</div>
                  <div className="rc-stat-label">Beleza</div>
                </div>
              </div>
            </div>

            <div className="rc-card">
              <p className="rc-card-title"><Users size={15} /> Registros ({perfis.length})</p>
              <div>
                {perfis.map((p) => (
                  <div className="rc-profile" key={p.id}>
                    <div className="rc-profile-info">
                      <div>
                        <strong>{p.idade} anos</strong>, {p.altura}m 
                        {p.superswipe && <span className="rc-badge">SUPERSWIPE</span>}
                      </div>
                      <div><Briefcase size={11} /> {p.profissao} | <MapPin size={11} /> {p.localizacao}</div>
                      <div><Star size={11} /> Beleza: {p.beleza}/5 | <Target size={11} /> {p.objetivos?.join(", ")}</div>
                    </div>
                    <button style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }} onClick={() => removerPerfil(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
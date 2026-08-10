'use client';

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, ListPlus, Users, Ruler, MapPin, Target, Star, Briefcase, Heart } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Conexão unificada com fallback direto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eagniasqrzrnambrhhev.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_hSh92slvspBgjsgmxUPECQ_7eJN5D5E";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function salvarPerfilNoBanco(perfil) {
  // 1. Backup local no navegador
  try {
    const salvosLocais = JSON.parse(localStorage.getItem('perfis_backup') || '[]');
    localStorage.setItem('perfis_backup', JSON.stringify([perfil, ...salvosLocais]));
    console.log("💾 Salvo no backup local (localStorage)!");
  } catch (errLocal) {
    console.error("Erro no backup local:", errLocal);
  }

  // 2. Envio para o Supabase
  try {
    const dadosParaEnviar = {
      idade: Number(perfil.idade),
      altura: Number(perfil.altura),
      localizacao: perfil.localizacao,
      profissao: perfil.profissao,
      beleza: Number(perfil.beleza),
      superswipe: Boolean(perfil.superswipe),
      conhecido: Boolean(perfil.conhecido),
      objetivos: perfil.objetivos,
    };

    const { data, error } = await supabase
      .from('perfis')
      .insert([dadosParaEnviar])
      .select();

    if (error) {
      console.error("❌ ERRO DO SUPABASE:", error.message);
    } else {
      console.log("✅ SALVO NO SUPABASE:", data);
    }
  } catch (err) {
    console.error("💥 Erro ao conectar com o Supabase:", err);
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
  const conhecido = Boolean(obj.conhecido);

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
    erros.push("Beleza deve ser de 1 a 5.");
  }
  if (objetivos.length === 0 || objetivos.length > 2) {
    erros.push("Selecione de 1 a 2 objetivos.");
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
      conhecido,
      objetivos,
    },
  };
}

export default function App() {
  const [perfis, setPerfis] = useState([]);
  const [idade, setIdade] = useState("");
  const [altura, setAltura] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [profissao, setProfissao] = useState("");
  const [beleza, setBeleza] = useState("3");
  const [superswipe, setSuperswipe] = useState(false);
  const [conhecido, setConhecido] = useState(false);
  const [objetivosSel, setObjetivosSel] = useState([]);
  const [erroForm, setErroForm] = useState(null);

  useEffect(() => {
    async function carregarPerfis() {
      let perfisEncontrados = [];

      try {
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .order('id', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          perfisEncontrados = data;
        }
      } catch (e) {
        console.error("Erro ao carregar do Supabase:", e);
      }

      if (perfisEncontrados.length === 0) {
        const locais = JSON.parse(localStorage.getItem('perfis_backup') || '[]');
        if (locais.length > 0) {
          perfisEncontrados = locais.map((p, index) => ({ id: p.id || index + 1000, ...p }));
        }
      }

      setPerfis(perfisEncontrados);
    }

    carregarPerfis();
  }, []);

  const stats = useMemo(() => {
    const total = perfis.length;
    if (total === 0) {
      return { total: 0, mediaIdade: null, mediaAltura: null, mediaBeleza: null };
    }
    const mediaIdade = perfis.reduce((s, p) => s + Number(p.idade), 0) / total;
    const mediaAltura = perfis.reduce((s, p) => s + Number(p.altura), 0) / total;
    const mediaBeleza = perfis.reduce((s, p) => s + Number(p.beleza), 0) / total;

    return {
      total,
      mediaIdade: mediaIdade.toFixed(1),
      mediaAltura: mediaAltura.toFixed(2),
      mediaBeleza: mediaBeleza.toFixed(1),
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
      conhecido,
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
    setConhecido(false);
    setObjetivosSel([]);
  }

  async function removerPerfil(id) {
    setPerfis((prev) => prev.filter((p) => p.id !== id));
    
    const salvosLocais = JSON.parse(localStorage.getItem('perfis_backup') || '[]');
    const atualizadosLocais = salvosLocais.filter((p) => p.id !== id);
    localStorage.setItem('perfis_backup', JSON.stringify(atualizadosLocais));

    try {
      await supabase.from('perfis').delete().eq('id', id);
    } catch (err) {
      console.error("Erro ao remover no Supabase:", err);
    }
  }

  return (
    <div className="rc-root">
      <style>{`
        .rc-root {
          --bg: #FFF5F7;
          --surface: #FFFFFF;
          --surface-alt: #FFF0F5;
          --border: #FAD2E1;
          --text: #5A3E49;
          --text-muted: #A37989;
          
          --pink-main: #FFB7C5;
          --pink-soft: #FFE5EC;
          --yellow-pastel: #FFF1C5;
          --yellow-soft: #FFFBEA;
          --green-pastel: #D8F3DC;
          --green-soft: #F0FDF4;
          --danger: #FF8296;

          font-family: 'Nunito', 'Segoe UI', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .rc-shell { max-width: 980px; margin: 0 auto; }
        .rc-header { text-align: center; margin-bottom: 28px; }
        .rc-header h1 { font-size: 28px; color: #7A4B5C; display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 0 6px 0; }
        .rc-header p { color: var(--text-muted); font-size: 14px; margin: 0; }
        .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 860px) { .rc-grid { grid-template-columns: 1fr; } }
        
        .rc-card {
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 20px rgba(250, 210, 225, 0.3);
        }
        .rc-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #8C5B6C;
          margin-bottom: 18px;
        }
        .rc-field { margin-bottom: 14px; }
        .rc-label { display: block; font-size: 13px; font-weight: 600; color: #7A4B5C; margin-bottom: 6px; }
        .rc-input, .rc-select {
          width: 100%;
          background: var(--surface-alt);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 10px 14px;
          color: var(--text);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }
        .rc-input:focus, .rc-select:focus {
          border-color: var(--pink-main);
          box-shadow: 0 0 0 3px rgba(255, 183, 197, 0.4);
        }
        .rc-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: var(--pink-main);
          color: #5A2A38;
          border: none;
          border-radius: 14px;
          padding: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(255, 183, 197, 0.5);
        }
        .rc-btn:hover { transform: translateY(-1px); background: #FFA8B8; }
        .rc-checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .rc-chip {
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 20px;
          border: 1.5px solid var(--border);
          background: var(--surface-alt);
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .rc-chip.active {
          background: var(--yellow-pastel);
          color: #6C5200;
          border-color: #F7D070;
        }
        .rc-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .rc-stat {
          background: var(--green-soft);
          border: 1.5px solid #B7E4C7;
          border-radius: 14px;
          padding: 12px 8px;
          text-align: center;
        }
        .rc-stat-value { font-size: 20px; font-weight: 800; color: #2D6A4F; }
        .rc-stat-label { font-size: 11px; font-weight: 600; color: #52B788; }
        
        .rc-profile {
          background: var(--surface-alt);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .rc-profile-info { font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
        .rc-badge {
          display: inline-block;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 12px;
          background: var(--yellow-pastel);
          color: #7A5C00;
          font-weight: 800;
          margin-left: 6px;
          border: 1px solid #F7D070;
        }
        .rc-badge-green {
          background: var(--green-pastel);
          color: #1B4332;
          border-color: #B7E4C7;
        }
      `}</style>

      <div className="rc-shell">
        <div className="rc-header">
          <h1><Heart size={26} color="#FF8296" fill="#FFB7C5" /> Bumble Catch 🐝</h1>
          <p>Uma análise pouco detalhada. 💕</p>
        </div>

        <div className="rc-grid">
          {/* Cadastro */}
          <div className="rc-card">
            <p className="rc-card-title"><ListPlus size={16} /> Cadastrar Perfil</p>
            
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
                <div className="rc-field" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px" }}>
                  <label style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", fontWeight: "600", color: "#7A4B5C" }}>
                    <input type="checkbox" checked={superswipe} onChange={(e) => setSuperswipe(e.target.checked)} />
                    SuperSwipe ⭐
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", fontWeight: "600", color: "#7A4B5C" }}>
                    <input type="checkbox" checked={conhecido} onChange={(e) => setConhecido(e.target.checked)} />
                    Conhecido 👀
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
              {erroForm && <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px", fontWeight: "600" }}>{erroForm}</p>}
            </form>
          </div>

          {/* Estatísticas e Listagem */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="rc-card">
              <p className="rc-card-title"><Ruler size={16} /> Médias Gerais</p>
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
              <p className="rc-card-title"><Users size={16} /> Perfis Salvos ({perfis.length})</p>
              <div>
                {perfis.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", margin: "20px 0" }}>Nenhum perfil cadastrado ainda ✨</p>
                ) : (
                  perfis.map((p) => (
                    <div className="rc-profile" key={p.id}>
                      <div className="rc-profile-info">
                        <div>
                          <strong>{p.idade} anos</strong>, {p.altura}m 
                          {p.superswipe && <span className="rc-badge">SUPERSWIPE</span>}
                          {p.conhecido && <span className="rc-badge rc-badge-green">CONHECIDO</span>}
                        </div>
                        <div><Briefcase size={11} /> {p.profissao} | <MapPin size={11} /> {p.localizacao}</div>
                        <div><Star size={11} /> Beleza: {p.beleza}/5 | <Target size={11} /> {p.objetivos?.join(", ")}</div>
                      </div>
                      <button style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }} onClick={() => removerPerfil(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
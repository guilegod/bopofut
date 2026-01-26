import { useEffect, useMemo, useState } from "react";
import {
  getPublicProfile,
  getSocialStats,
  upsertPublicProfile,
  syncSocialProfile,
} from "../../services/publicCourtsMock.js";
import EditPublicProfile from "./EditPublicProfile.jsx";
import ProfileFriendsLite from "./ProfileFriendsLite.jsx";

function cardStyle() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "var(--shadow-sm)",
  };
}

function miniCard() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface)",
    borderRadius: 16,
    padding: 12,
  };
}

function btn(kind = "ghost") {
  const base = {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 1000,
    border: "1px solid var(--border)",
    cursor: "pointer",
  };
  if (kind === "primary") {
    return {
      ...base,
      background: "var(--primary)",
      borderColor: "transparent",
      color: "white",
    };
  }
  if (kind === "danger") {
    return {
      ...base,
      background: "var(--danger)",
      borderColor: "transparent",
      color: "white",
    };
  }
  if (kind === "disabled") {
    return {
      ...base,
      background: "var(--surface)",
      color: "var(--text)",
      opacity: 0.55,
      cursor: "not-allowed",
    };
  }
  return { ...base, background: "var(--surface)", color: "var(--text)" };
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "10px 12px",
        fontWeight: 1000,
        border: "1px solid var(--border)",
        cursor: "pointer",
        background: active ? "var(--primary)" : "var(--surface)",
        color: active ? "white" : "var(--text)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Pill({ children }) {
  return (
    <span
      style={{
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {children}
    </span>
  );
}

function RowItem({ title, subtitle, right }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 14,
        padding: "10px 12px",
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 1000,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {right != null ? <div style={{ fontWeight: 1000 }}>{right}</div> : null}
    </div>
  );
}

export default function PublicProfile({ user, onLogout }) {
  const userId = user?.id;

  const [tab, setTab] = useState("overview"); // overview | social | official | friends
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);

  const BOPOFUT_LINK = "https://bopo-puf.vercel.com";

  const merged = useMemo(() => {
    const p = profile || {};
    return {
      id: user?.id,
      name: p.name || user?.name || "Jogador",
      email: user?.email || "",
      role: user?.role || "user",
      avatar: p.avatar || user?.avatar || "https://picsum.photos/seed/user/200",
      username: p.username || "",
      city: p.city || "Curitiba",
      bairro: p.bairro || "",
      position: p.position || user?.position || "Meia",
      level: p.level || user?.level || "Médio",
      foot: p.foot || "Destro",
      bio: p.bio || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
    };
  }, [profile, user]);

  useEffect(() => {
    if (!userId) return;
    setProfile(getPublicProfile(userId));
    setStats(getSocialStats(userId));
  }, [userId]);

  function refresh() {
    if (!userId) return;
    setProfile(getPublicProfile(userId));
    setStats(getSocialStats(userId));
  }

  function toastCopy(text, okMsg = "Copiado ✅") {
    try {
      navigator.clipboard?.writeText(String(text || ""));
      alert(okMsg);
    } catch {
      alert("Não consegui copiar automaticamente 😬 (selecione e copie manualmente)");
    }
  }

  function handleSave(patch) {
    if (!userId) return;

    try {
      const updated = upsertPublicProfile(userId, patch);
      syncSocialProfile(userId, updated);

      setEditOpen(false);
      refresh();
      alert("Perfil atualizado ✅");
    } catch (err) {
      alert(err?.message || "Erro ao salvar perfil 😬");
    }
  }

  const socialLevel = stats?.level || 1;
  const socialXp = stats?.xp || 0;
  const totalCheckins = stats?.totalCheckins || 0;

  const shareText = merged.username ? `@${merged.username}` : `ID: ${userId}`;

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {/* ===== Top Header ===== */}
      <div style={cardStyle()}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 999,
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--bg-3)",
              flexShrink: 0,
            }}
          >
            <img
              src={merged.avatar}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 1000, fontSize: 16, lineHeight: 1.1 }}>
                {merged.name}
              </div>
              {merged.role === "admin" ? <Pill>⚙️ Admin</Pill> : null}
              {merged.username ? <Pill>@{merged.username}</Pill> : <Pill>Sem @username</Pill>}
              <Pill>🔥 Lv {socialLevel}</Pill>
              <Pill>⚡ {socialXp} XP</Pill>
            </div>

            <div style={{ opacity: 0.85, marginTop: 8, fontSize: 13 }}>
              {merged.position} • {merged.level} • {merged.foot}
            </div>

            <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
              {merged.bairro ? `${merged.bairro} • ` : ""}
              {merged.city}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <button type="button" style={btn("primary")} onClick={() => setEditOpen(true)}>
              ✏️ Editar
            </button>

            <button type="button" style={btn("ghost")} onClick={() => toastCopy(userId, "ID copiado ✅")}>
              🆔 Copiar ID
            </button>

            <button type="button" style={btn("ghost")} onClick={() => toastCopy(shareText, "Copiado ✅")}>
              📤 Copiar @/ID
            </button>
          </div>
        </div>

        {merged.bio ? (
          <div style={{ marginTop: 12, opacity: 0.9, lineHeight: 1.35 }}>{merged.bio}</div>
        ) : (
          <div style={{ marginTop: 12, opacity: 0.7 }}>
            Sem bio ainda. Clica em <b>Editar</b> e coloca sua descrição 😉
          </div>
        )}

        {merged.tags?.length ? (
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {merged.tags.map((t) => (
              <Pill key={t}>{t}</Pill>
            ))}
          </div>
        ) : null}

        {/* Tabs */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
            🧾 Visão Geral
          </TabButton>
          <TabButton active={tab === "social"} onClick={() => setTab("social")}>
            🔥 Social (Praças)
          </TabButton>
          <TabButton active={tab === "official"} onClick={() => setTab("official")}>
            🏆 Oficial (BopôFut)
          </TabButton>

          {/* ✅ Friends como estava (funcionando) */}
          <TabButton active={tab === "friends"} onClick={() => setTab("friends")}>
            👥 Friends
          </TabButton>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={btn("ghost")} onClick={() => window.open(BOPOFUT_LINK, "_blank")}>
              📲 Abrir BopôFut
            </button>
            <button type="button" style={btn("ghost")} onClick={() => toastCopy(BOPOFUT_LINK, "Link do BopôFut copiado ✅")}>
              🔗 Copiar link
            </button>
          </div>
        </div>
      </div>

      {/* ===== TAB: Overview ===== */}
      {tab === "overview" ? (
        <>
          <div style={cardStyle()}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>⚡ Resumo</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={miniCard()}>
                <div style={{ opacity: 0.75, fontSize: 12 }}>Level (Social)</div>
                <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>{socialLevel}</div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>{socialXp} XP</div>
              </div>

              <div style={miniCard()}>
                <div style={{ opacity: 0.75, fontSize: 12 }}>Check-ins</div>
                <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>{totalCheckins}</div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>Praças (social)</div>
              </div>

              <div style={miniCard()}>
                <div style={{ opacity: 0.75, fontSize: 12 }}>Favorita #1</div>
                <div style={{ fontWeight: 1000, fontSize: 14, marginTop: 6 }}>
                  {stats?.favorites?.[0]?.name || "—"}
                </div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>
                  {stats?.favorites?.[0]?.count ? `${stats.favorites[0].count}x` : ""}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={btn("primary")} onClick={() => window.open(BOPOFUT_LINK, "_blank")}>
                📲 Ir para o BopôFut (Oficial)
              </button>
              <button type="button" style={btn("ghost")} onClick={() => toastCopy(BOPOFUT_LINK, "Link do BopôFut copiado ✅")}>
                🔗 Copiar link BopôFut
              </button>

              {!merged.username ? (
                <button type="button" style={btn("ghost")} onClick={() => setEditOpen(true)}>
                  ✨ Criar @username
                </button>
              ) : null}
            </div>

            <div style={{ marginTop: 10, opacity: 0.72, fontSize: 12 }}>
              No Praças é <b>social</b>. No BopôFut é <b>oficial</b> (organizador confirma).
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>🕒 Últimos check-ins</div>
            {stats?.last?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {stats.last.slice(0, 5).map((x, idx) => (
                  <RowItem
                    key={`${x.courtId}-${idx}`}
                    title={x.name}
                    subtitle={new Date(x.at).toLocaleString("pt-BR")}
                    right=""
                  />
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.75 }}>
                Ainda sem check-in no histórico. Vai numa praça e faz check-in pra começar seu Social 🔥
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* ===== TAB: Social ===== */}
      {tab === "social" ? (
        <div style={cardStyle()}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>🔥 Social — Praças</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={miniCard()}>
              <div style={{ opacity: 0.75, fontSize: 12 }}>Level</div>
              <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>{socialLevel}</div>
              <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>{socialXp} XP</div>
            </div>

            <div style={miniCard()}>
              <div style={{ opacity: 0.75, fontSize: 12 }}>Check-ins</div>
              <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>{totalCheckins}</div>
              <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>últimos 200</div>
            </div>
          </div>

          <div style={{ marginTop: 12, fontWeight: 1000, marginBottom: 8 }}>📌 Praças favoritas</div>
          {stats?.favorites?.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {stats.favorites.slice(0, 5).map((f) => (
                <RowItem key={f.courtId} title={f.name} subtitle={f.address} right={`${f.count}x`} />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>Sem favoritos ainda. Faça check-in em algumas praças 🙂</div>
          )}

          <div style={{ marginTop: 12, fontWeight: 1000, marginBottom: 8 }}>🕒 Últimos check-ins</div>
          {stats?.last?.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {stats.last.map((x, idx) => (
                <RowItem
                  key={`${x.courtId}-${idx}`}
                  title={x.name}
                  subtitle={new Date(x.at).toLocaleString("pt-BR")}
                />
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>Ainda sem check-in no histórico.</div>
          )}
        </div>
      ) : null}

      {/* ===== TAB: Official ===== */}
      {tab === "official" ? (
        <div style={cardStyle()}>
          <div style={{ fontWeight: 1000, marginBottom: 8 }}>🏆 Oficial — BopôFut</div>
          <div style={{ opacity: 0.88, lineHeight: 1.35 }}>
            Gols e histórico <b>oficiais</b> entram quando a partida é criada no BopôFut e confirmada pelo organizador.
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={miniCard()}>
              <div style={{ opacity: 0.65, fontSize: 12 }}>Partidas oficiais</div>
              <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>—</div>
              <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>em breve</div>
            </div>
            <div style={miniCard()}>
              <div style={{ opacity: 0.65, fontSize: 12 }}>Gols oficiais</div>
              <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>—</div>
              <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>em breve</div>
            </div>
            <div style={miniCard()}>
              <div style={{ opacity: 0.65, fontSize: 12 }}>Ranking</div>
              <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>—</div>
              <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>em breve</div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={btn("primary")} onClick={() => window.open(BOPOFUT_LINK, "_blank")}>
              📲 Abrir BopôFut
            </button>
            <button type="button" style={btn("ghost")} onClick={() => toastCopy(BOPOFUT_LINK, "Link copiado ✅")}>
              🔗 Copiar link
            </button>
          </div>

          <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
            Quando a gente ligar o backend, essa aba vai puxar stats oficiais direto do seu banco.
          </div>
        </div>
      ) : null}

      {/* ✅ TAB: Friends (como estava funcionando) */}
      {tab === "friends" ? (
        <ProfileFriendsLite user={user} />
      ) : null}

      {/* Logout */}
      <button type="button" onClick={onLogout} style={btn("danger")}>
        Sair
      </button>

      {/* Modal Edit */}
      <EditPublicProfile
        open={editOpen}
        initial={merged}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  acceptFriendRequest,
  areFriends,
  followUser,
  getFollowers,
  getFollowing,
  getSocialProfiles,
  hasPendingRequest,
  isFollowing,
  listFriendRequests,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchPlayers,
  sendFriendRequest,
  unfollowUser,
} from "../../services/publicCourtsMock.js";

function cardStyle() {
  return {
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    borderRadius: 18,
    padding: 14,
    boxShadow: "var(--shadow-sm)",
  };
}

function inputStyle() {
  return {
    width: "100%",
    borderRadius: 14,
    padding: "12px 12px",
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    outline: "none",
  };
}

function btn(kind = "ghost") {
  const base = {
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 1000,
    border: "1px solid var(--border)",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  if (kind === "primary") {
    return { ...base, background: "var(--primary)", borderColor: "transparent", color: "white" };
  }
  if (kind === "danger") {
    return { ...base, background: "var(--danger)", borderColor: "transparent", color: "white" };
  }
  return { ...base, background: "var(--surface)", color: "var(--text)" };
}

function Avatar({ src, name }) {
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--bg-3)",
        display: "grid",
        placeItems: "center",
        fontWeight: 1000,
        flexShrink: 0,
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        (name || "?").slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function Row({ p, children }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 14,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar src={p.avatar} name={p.name} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 1000, overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.name}
          </div>
          <div
            style={{
              opacity: 0.75,
              fontSize: 12,
              marginTop: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.username ? `@${p.username} • ` : ""}
            {p.city || ""}
            {p.bairro ? ` • ${p.bairro}` : ""}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}

export default function ProfileFriendsLite({ user }) {
  const userId = user?.id;

  const [q, setQ] = useState("");
  const [bump, setBump] = useState(0);

  function refresh() {
    setBump((x) => x + 1);
  }

  const followingIds = getFollowing(userId);
  const followerIds = getFollowers(userId);
  const friendIds = listFriends(userId);
  const requests = listFriendRequests(userId);

  const following = getSocialProfiles(followingIds);
  const followers = getSocialProfiles(followerIds);
  const friends = getSocialProfiles(friendIds);

  const results = useMemo(() => {
    return searchPlayers(q, { excludeUserId: userId, limit: 30 });
  }, [q, userId, bump]);

  return (
    <div style={cardStyle()}>
      <div style={{ fontWeight: 1000, marginBottom: 10 }}>👥 Amigos</div>

      <input
        style={inputStyle()}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por @username, nome, cidade..."
      />

      {/* Requests */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>📩 Pedidos de amizade</div>

        {requests.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Sem pedidos por enquanto.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {requests.map((r) => {
              const p = getSocialProfiles([r.fromId])[0];
              if (!p) return null;

              return (
                <Row key={r.fromId} p={p}>
                  <button
                    type="button"
                    style={btn("primary")}
                    onClick={() => {
                      acceptFriendRequest(userId, r.fromId);
                      refresh();
                    }}
                  >
                    ✅ Aceitar
                  </button>
                  <button
                    type="button"
                    style={btn("ghost")}
                    onClick={() => {
                      rejectFriendRequest(userId, r.fromId);
                      refresh();
                    }}
                  >
                    ❌ Recusar
                  </button>
                </Row>
              );
            })}
          </div>
        )}
      </div>

      {/* Friends */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>🤝 Amigos ({friends.length})</div>

        {friends.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Você ainda não tem amigos. Busque alguém e envie pedido 🙂</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {friends.map((p) => (
              <Row key={p.userId} p={p}>
                <button
                  type="button"
                  style={btn("danger")}
                  onClick={() => {
                    removeFriend(userId, p.userId);
                    refresh();
                  }}
                >
                  🗑️ Remover
                </button>
              </Row>
            ))}
          </div>
        )}
      </div>

      {/* Followers */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>👀 Seguidores ({followers.length})</div>

        {followers.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Ninguém te segue ainda.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {followers.map((p) => {
              const tid = p.userId;
              const followingThis = isFollowing(userId, tid);
              const friendsNow = areFriends(userId, tid);
              const pending = hasPendingRequest(userId, tid);

              return (
                <Row key={p.userId} p={p}>
                  {!followingThis ? (
                    <button
                      type="button"
                      style={btn("ghost")}
                      onClick={() => {
                        followUser(userId, tid);
                        refresh();
                      }}
                    >
                      ➕ Seguir de volta
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={btn("ghost")}
                      onClick={() => {
                        unfollowUser(userId, tid);
                        refresh();
                      }}
                    >
                      ➖ Deixar de seguir
                    </button>
                  )}

                  {friendsNow ? (
                    <button type="button" style={btn("primary")} disabled>
                      🤝 Amigos
                    </button>
                  ) : pending ? (
                    <button type="button" style={btn("primary")} disabled>
                      ⏳ Pedido enviado
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={btn("primary")}
                      onClick={() => {
                        sendFriendRequest(userId, tid);
                        refresh();
                      }}
                    >
                      🤝 Pedir amizade
                    </button>
                  )}
                </Row>
              );
            })}
          </div>
        )}
      </div>

      {/* Following */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>➕ Seguindo ({following.length})</div>

        {following.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Você não segue ninguém ainda.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {following.map((p) => (
              <Row key={p.userId} p={p}>
                <button
                  type="button"
                  style={btn("ghost")}
                  onClick={() => {
                    unfollowUser(userId, p.userId);
                    refresh();
                  }}
                >
                  ➖ Deixar de seguir
                </button>
              </Row>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>🔎 Resultados</div>

        {results.length === 0 ? (
          <div style={{ opacity: 0.75 }}>
            Nada encontrado. (Dica: o outro usuário precisa ter perfil salvo para aparecer na busca.)
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {results.map((p) => {
              const tid = p.userId;
              const followingThis = isFollowing(userId, tid);
              const friendsNow = areFriends(userId, tid);
              const pending = hasPendingRequest(userId, tid);

              return (
                <Row key={p.userId} p={p}>
                  <button
                    type="button"
                    style={btn("ghost")}
                    onClick={() => {
                      const txt = p.username ? `@${p.username}` : String(p.userId);
                      navigator.clipboard?.writeText(txt);
                      alert("Copiado ✅");
                    }}
                  >
                    🔗 Copiar
                  </button>

                  {!followingThis ? (
                    <button
                      type="button"
                      style={btn("ghost")}
                      onClick={() => {
                        followUser(userId, tid);
                        refresh();
                      }}
                    >
                      ➕ Seguir
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={btn("ghost")}
                      onClick={() => {
                        unfollowUser(userId, tid);
                        refresh();
                      }}
                    >
                      ➖ Seguindo
                    </button>
                  )}

                  {friendsNow ? (
                    <button type="button" style={btn("primary")} disabled>
                      🤝 Amigos
                    </button>
                  ) : pending ? (
                    <button type="button" style={btn("primary")} disabled>
                      ⏳ Pedido enviado
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={btn("primary")}
                      onClick={() => {
                        sendFriendRequest(userId, tid);
                        refresh();
                      }}
                    >
                      🤝 Pedir amizade
                    </button>
                  )}
                </Row>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
        MVP local: funciona com localStorage. Depois a gente liga no backend e vira global.
      </div>
    </div>
  );
}

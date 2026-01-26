import { useMemo, useState } from "react";
import styles from "../SquarePage.module.css";
import { btnClass, badgeClass } from "../utils/ui";

export default function SectionPhotos({
  photos,
  user,
  onAdd,
  onRemove,
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const canPost = !!user?.id;

  const sorted = useMemo(() => photos || [], [photos]);

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>📸 Fotos da praça</div>
        <span className={badgeClass("muted")}>{sorted.length} fotos</span>
      </div>

      {!canPost ? (
        <div className={styles.softCard}>
          <div className={styles.title}>🔒 Login necessário</div>
          <div className={styles.hint}>Entre para postar fotos e ajudar a comunidade.</div>
        </div>
      ) : (
        <div className={styles.softCard}>
          <div className={styles.title}>Adicionar foto</div>
          <div className={styles.hint}>Cole um link de imagem (por enquanto). Depois a gente faz upload real.</div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="URL da imagem (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              className={btnClass("primary")}
              onClick={() => {
                const u = String(url || "").trim();
                if (!u) return;
                onAdd({ url: u, caption });
                setUrl("");
                setCaption("");
              }}
            >
              Publicar
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              className={styles.input}
              placeholder="Legenda (opcional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className={styles.softCard} style={{ marginTop: 12 }}>
          <div className={styles.title}>Ainda não tem fotos</div>
          <div className={styles.hint}>Seja o primeiro a postar uma foto dessa praça 😄</div>
        </div>
      ) : (
        <div className={styles.gallery}>
          {sorted.map((p) => {
            const isMine = user?.id && p?.by?.id === user.id;

            return (
              <div key={p.id} className={styles.photoCard}>
                <img className={styles.photoImg} src={p.url} alt="" />

                <div className={styles.photoBody}>
                  <div className={styles.rowBetween}>
                    <div className={styles.title} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.caption || "Sem legenda"}
                    </div>

                    {isMine ? (
                      <button
                        type="button"
                        className={btnClass("ghost")}
                        onClick={() => onRemove(p.id)}
                        title="Remover minha foto"
                      >
                        🗑️
                      </button>
                    ) : null}
                  </div>

                  <div className={styles.muted}>
                    por <b>{p?.by?.name || "Anônimo"}</b> •{" "}
                    {new Date(p.at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

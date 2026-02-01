// src/views/Profile/components/FeedComposerLite.jsx
import { useMemo, useRef, useState } from "react";
import styles from "../ProfileHybrid.module.css";

function uid() {
  return `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`${styles.feedChip} ${active ? styles.feedChipActive : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Pill({ children }) {
  return <span className={styles.pill}>{children}</span>;
}

export default function FeedComposerLite({
  userId,
  userName = "Você",
  userAvatar = "/icons/icon-192.png",
  defaultCity = "Curitiba",
  onCreate,
}) {
  const fileRef = useRef(null);

  // ✅ compacto por padrão
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("game"); // game | moment | checkin
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState("");

  // game
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");

  // moment
  const [momentKind, setMomentKind] = useState("Gol de qualidade");

  // checkin
  const [city, setCity] = useState(defaultCity || "Curitiba");

  const title = useMemo(() => {
    if (type === "game") return "📸 Foto do jogo";
    if (type === "moment") return "⭐ Momento";
    return "📍 Check-in";
  }, [type]);

  async function handlePickFile() {
    fileRef.current?.click?.();
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await toDataUrl(f);
      setImage(dataUrl);
    } catch {
      // ignore
    }
  }

  function reset() {
    setType("game");
    setCaption("");
    setImage("");
    setTeamA("");
    setTeamB("");
    setScoreA(0);
    setScoreB(0);
    setWhen("");
    setPlace("");
    setMomentKind("Gol de qualidade");
    setCity(defaultCity || "Curitiba");
    if (fileRef.current) fileRef.current.value = "";
  }

  function buildPost(withPhoto) {
    const base = {
      id: uid(),
      type,
      userId: userId || "anon",
      userName,
      userAvatar,
      createdAt: new Date().toISOString(),
      likes: 0,
      caption: (caption || "").trim(),
      image: withPhoto ? image : "",
    };

    if (type === "game") {
      return {
        ...base,
        teamA: teamA || "",
        teamB: teamB || "",
        scoreA: Number(scoreA || 0),
        scoreB: Number(scoreB || 0),
        when: when || "",
        place: place || "",
      };
    }

    if (type === "moment") {
      return { ...base, momentKind: momentKind || "Momento", place: place || "" };
    }

    // checkin
    return { ...base, city: city || defaultCity || "", place: place || "" };
  }

  function submit(withPhoto) {
    const post = buildPost(withPhoto);
    onCreate?.(post);

    // ✅ depois de publicar, limpa e fecha pra não poluir
    reset();
    setOpen(false);
  }

  function cancel() {
    reset();
    setOpen(false);
  }

  // =========================
  // Compact mode
  // =========================
  if (!open) {
    return (
      <div className={styles.feedComposerCompact}>
        <div className={styles.feedComposerCompactLeft}>
          <div className={styles.feedComposerCompactTitle}>➕ Publicar</div>
          <div className={styles.feedComposerCompactHint}>
            Toque para criar um post (jogo, momento ou check-in)
          </div>
        </div>

        <button type="button" className={styles.primaryBtnSm} onClick={() => setOpen(true)}>
          Abrir
        </button>
      </div>
    );
  }

  // =========================
  // Expanded composer
  // =========================
  return (
    <div className={styles.feedComposerBox}>
      <div className={styles.feedComposerTop}>
        <div className={styles.feedComposerTitle}>{title}</div>

        <div className={styles.feedChips}>
          <Chip active={type === "game"} onClick={() => setType("game")}>
            ⚽ Jogo
          </Chip>
          <Chip active={type === "moment"} onClick={() => setType("moment")}>
            ⭐ Momento
          </Chip>
          <Chip active={type === "checkin"} onClick={() => setType("checkin")}>
            📍 Check-in
          </Chip>
        </div>
      </div>

      <div className={styles.feedGrid}>
        <div className={styles.feedField} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.feedLabel}>Legenda (opcional)</div>
          <textarea
            className={styles.input}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escreve uma legenda..."
          />
        </div>

        {type === "game" ? (
          <>
            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Time A</div>
              <input
                className={styles.input}
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                placeholder="ex: Boca Juniors"
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Time B</div>
              <input
                className={styles.input}
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                placeholder="ex: Real Madrid"
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Placar A</div>
              <input
                className={styles.input}
                type="number"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Placar B</div>
              <input
                className={styles.input}
                type="number"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Horário</div>
              <input
                className={styles.input}
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Local</div>
              <input
                className={styles.input}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Quadra X / Praça Y"
              />
            </div>
          </>
        ) : null}

        {type === "moment" ? (
          <>
            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Tipo de momento</div>
              <input
                className={styles.input}
                value={momentKind}
                onChange={(e) => setMomentKind(e.target.value)}
                placeholder="ex: Gol de qualidade"
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Local (opcional)</div>
              <input
                className={styles.input}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Quadra X / Praça Y"
              />
            </div>
          </>
        ) : null}

        {type === "checkin" ? (
          <>
            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Cidade</div>
              <input
                className={styles.input}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Curitiba"
              />
            </div>

            <div className={styles.feedField}>
              <div className={styles.feedLabel}>Local</div>
              <input
                className={styles.input}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Quadra X / Praça Y"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.feedFooter}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
          <button type="button" className={styles.fileBtn} onClick={handlePickFile}>
            🖼️ Escolher foto (opcional)
          </button>

          {image ? <Pill>foto ok ✅</Pill> : <Pill>sem foto</Pill>}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className={styles.ghostBtnSm} onClick={cancel}>
            ✖ Cancelar
          </button>

          <button type="button" className={styles.primaryBtnSm} onClick={() => submit(false)}>
            ➕ Publicar
          </button>

          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => submit(true)}
            disabled={!image}
            title={!image ? "Escolha uma foto primeiro" : ""}
          >
            ✅ Publicar com foto
          </button>
        </div>
      </div>
    </div>
  );
}

import styles from "./MatchForm.module.css";

export default function MatchForm({
  formData,
  onChange,
  arenaAddress,
  mapsUrl,
  courtType,
  selectedCourt,
}) {
  const cleanText = (v) => String(v ?? "").replace(/\r?\n/g, "").trim();

  function set(patch) {
    onChange?.(patch);
  }

  // ✅ nome premium da arena (não mostra \n, nem "(Futsal)")
  const arenaNameRaw =
    selectedCourt?.displayName ||
    selectedCourt?.uiName ||
    selectedCourt?.name ||
    "Arena";

  const arenaLabel = cleanText(arenaNameRaw)
    .replace(/\((.*?)\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const typeLabel = courtType === "fut7" ? "Fut7 (Sintético)" : "Futsal";

  const matchAddr = cleanText(formData.matchAddress || "");
  const arenaAddr = cleanText(arenaAddress || "");
  const mapsSource = matchAddr ? "PARTIDA" : arenaAddr ? "ARENA" : "—";

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>Detalhes</div>
          <h2 className={styles.title}>Informações da partida</h2>
        </div>

        <span className={styles.typeChip}>{typeLabel}</span>
      </header>

      <div className={styles.body}>
        <div className={styles.row2}>
          <label className={styles.label}>
            Nome da partida
            <input
              className={styles.input}
              value={formData.title || ""}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Ex: Pelada dos Campeões"
              inputMode="text"
              autoComplete="off"
            />
          </label>

          <label className={styles.label}>
            Horário
            <input
              className={styles.input}
              type="time"
              value={formData.time || "19:00"}
              onChange={(e) => set({ time: e.target.value })}
            />
          </label>
        </div>

        <div className={styles.row3}>
          <label className={styles.label}>
            Máx. jogadores
            <input
              className={styles.input}
              type="number"
              min={2}
              max={30}
              value={formData.maxPlayers ?? 14}
              onChange={(e) => set({ maxPlayers: e.target.value })}
              inputMode="numeric"
            />
          </label>

          <label className={styles.label}>
            Preço por jogador (R$)
            <input
              className={styles.input}
              type="number"
              min={0}
              step="1"
              value={formData.pricePerPlayer ?? 0}
              onChange={(e) => set({ pricePerPlayer: e.target.value })}
              inputMode="numeric"
            />
          </label>

          <label className={styles.label}>
            Visibilidade
            <select
              className={styles.select}
              value={formData.visibility || "public"}
              onChange={(e) => set({ visibility: e.target.value })}
            >
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Local</div>

          {/* ✅ endereço REAL da partida (manual). NÃO depende da arena */}
          <label className={styles.label}>
            Endereço da partida (real)
            <input
              className={styles.input}
              value={formData.matchAddress || ""}
              onChange={(e) => set({ matchAddress: e.target.value })}
              placeholder="Rua, número, bairro, cidade (ex: Av. X, 123 - Centro, Curitiba/PR)"
              inputMode="text"
              autoComplete="street-address"
            />
            <span className={styles.hint}>
              Esse é o endereço que os jogadores verão e que gera o link do Maps. Trocar a arena não altera isso.
            </span>
          </label>

          {/* ✅ arena informativa (sem confundir com endereço real) */}
          <div className={styles.arenaBox}>
            <div className={styles.arenaTop}>
              <span className={styles.arenaPill}>Arena selecionada</span>
              <span className={styles.arenaName}>{arenaLabel}</span>
            </div>

            {!!arenaAddr ? (
              <div className={styles.arenaSub}>
                <span className={styles.arenaMuted}>Localidade da arena:</span>{" "}
                {arenaAddr}
              </div>
            ) : (
              <div className={styles.arenaSub}>
                <span className={styles.arenaMuted}>Localidade da arena:</span>{" "}
                —
              </div>
            )}
          </div>

          <div className={styles.mapsRow}>
            <a
              className={`${styles.mapsBtn} ${mapsUrl ? "" : styles.disabled}`}
              href={mapsUrl || undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!mapsUrl}
              onClick={(e) => {
                if (!mapsUrl) e.preventDefault();
              }}
              title={
                mapsUrl
                  ? `Maps gerado a partir do endereço: ${mapsSource}`
                  : "Preencha o endereço da partida ou selecione uma arena com endereço."
              }
            >
              Abrir no Google Maps ↗
            </a>

            <div className={styles.mapsNote}>
              {mapsUrl
                ? `Link gerado a partir do endereço: ${mapsSource}`
                : "Preencha o endereço da partida (recomendado) ou use a localidade da arena."}
            </div>
          </div>
        </div>

        <label className={styles.label}>
          Observações (opcional)
          <textarea
            className={styles.textarea}
            value={formData.notes || ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Regras, quem leva colete, como será o pagamento, etc."
            rows={3}
          />
        </label>
      </div>
    </section>
  );
}

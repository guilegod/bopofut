import styles from "./MatchForm.module.css";

export default function MatchForm({
  formData,
  onChange,
  arenaAddress,
  mapsUrl,
  courtType,
  selectedCourt,

  // ✅ novo
  useArenaAddress = true,
  onToggleUseArenaAddress,
}) {
  const cleanText = (v) => String(v ?? "").replace(/\r?\n/g, "").trim();

  function set(patch) {
    onChange?.(patch);
  }

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

  const arenaAddr = cleanText(arenaAddress || "");
  const matchAddr = cleanText(formData.matchAddress || "");

  const effectiveAddr = useArenaAddress ? arenaAddr : matchAddr;
  const mapsSource = useArenaAddress ? "ARENA (automático)" : matchAddr ? "MANUAL" : arenaAddr ? "ARENA (fallback)" : "—";

  // extras opcionais (se existirem no objeto)
  const capacity = selectedCourt?.capacity;
  const pixKey = selectedCourt?.pixKey || selectedCourt?.arenaPixKey;
  const hasParking = selectedCourt?.hasParking ?? selectedCourt?.arenaHasParking;
  const hasLockerRoom = selectedCourt?.hasLockerRoom ?? selectedCourt?.arenaHasLockerRoom;
  const hasLighting = selectedCourt?.hasLighting ?? selectedCourt?.arenaHasLighting;
  const ratingAvg = selectedCourt?.ratingAvg ?? selectedCourt?.arenaRatingAvg;
  const ratingCount = selectedCourt?.ratingCount ?? selectedCourt?.arenaRatingCount;

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

          {/* ✅ Agora o padrão é: usar endereço da ARENA automaticamente */}
          <label className={styles.label}>
            Endereço (para os jogadores)
            <input
              className={styles.input}
              value={useArenaAddress ? arenaAddr : (formData.matchAddress || "")}
              disabled={useArenaAddress}
              onChange={(e) => set({ matchAddress: e.target.value })}
              placeholder={useArenaAddress ? "Endereço automático da arena" : "Rua, número, bairro, cidade..."}
              inputMode="text"
              autoComplete="street-address"
            />

            <span className={styles.hint}>
              {useArenaAddress
                ? "Usando automaticamente o endereço da arena. Se precisar mudar, clique em “Editar endereço (opcional)”."
                : "Você está editando manualmente. Para voltar ao padrão, clique em “Usar endereço da arena”."}
            </span>
          </label>

          <div className={styles.mapsRow}>
            <button
              type="button"
              className={styles.mapsBtn}
              onClick={() => onToggleUseArenaAddress?.(useArenaAddress ? false : true)}
              title={useArenaAddress ? "Liberar edição manual" : "Voltar a usar o endereço da arena"}
            >
              {useArenaAddress ? "Editar endereço (opcional)" : "Usar endereço da arena"}
            </button>

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
                  : "Sem endereço suficiente para gerar o link"
              }
            >
              Abrir no Google Maps ↗
            </a>
          </div>

          {/* ✅ Arena informativa */}
          <div className={styles.arenaBox}>
            <div className={styles.arenaTop}>
              <span className={styles.arenaPill}>Arena selecionada</span>
              <span className={styles.arenaName}>{arenaLabel}</span>
            </div>

            <div className={styles.arenaSub}>
              <span className={styles.arenaMuted}>Localidade:</span>{" "}
              {arenaAddr || "—"}
            </div>

            {/* ✅ Extras (só aparecem se existirem) */}
            {(capacity || pixKey || hasParking !== undefined || hasLockerRoom !== undefined || hasLighting !== undefined || ratingAvg) && (
              <div className={styles.arenaSub}>
                <span className={styles.arenaMuted}>Detalhes:</span>{" "}
                {capacity ? `👥 cap ${capacity}` : ""}
                {hasLighting === true ? " • 💡 iluminação" : hasLighting === false ? " • 💡 sem iluminação" : ""}
                {hasLockerRoom === true ? " • 🚿 vestiário" : hasLockerRoom === false ? " • 🚿 sem vestiário" : ""}
                {hasParking === true ? " • 🚗 estacionamento" : hasParking === false ? " • 🚗 sem estacionamento" : ""}
                {pixKey ? " • 💳 Pix" : ""}
                {ratingAvg ? ` • ⭐ ${Number(ratingAvg).toFixed(1)}${ratingCount ? ` (${ratingCount})` : ""}` : ""}
              </div>
            )}
          </div>

          <div className={styles.mapsNote}>
            {mapsUrl
              ? `Link gerado a partir do endereço: ${mapsSource}`
              : "Sem endereço suficiente para gerar o link."}
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

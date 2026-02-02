import { useMemo, useState } from "react";
import styles from "./OwnerCreateArena.module.css";
import { createArena } from "../../services/arenasService.js";

const SPORTS = [
  { value: "futsal", label: "Futsal" },
  { value: "society", label: "Society" },
  { value: "campo", label: "Campo" },
  { value: "volei", label: "Vôlei" },
  { value: "basquete", label: "Basquete" },
  { value: "outro", label: "Outro" },
];

export default function OwnerCreateArena({ onDone, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    sport: "futsal",
    city: "",
    address: "",
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const isValid = useMemo(() => {
    return !!form.name.trim() && !!form.city.trim();
  }, [form.name, form.city]);

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (!isValid) {
      setMsg("Preencha pelo menos Nome da arena e Cidade.");
      return;
    }

    try {
      setLoading(true);

      // payload padrão “MVP”
      const payload = {
        name: form.name.trim(),
        sport: form.sport,
        city: form.city.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      };

      const created = await createArena(payload);

      setMsg("Arena criada! Indo para o painel…");
      setTimeout(() => onDone?.(created), 400);
    } catch (err) {
      setMsg(err?.message || "Erro ao criar arena. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Criar Arena</h1>
            <p className={styles.sub}>
              Cadastre sua quadra para liberar o painel e começar a gerenciar horários.
            </p>
          </div>

          <div className={styles.headerActions}>
            {onCancel ? (
              <button type="button" className={styles.btnGhost} onClick={onCancel}>
                Voltar
              </button>
            ) : null}

            <button
              type="button"
              className={styles.btnSoft}
              onClick={() => {
                setForm({
                  name: "",
                  sport: "futsal",
                  city: "",
                  address: "",
                  phone: "",
                  notes: "",
                });
                setMsg("");
              }}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </div>

        <form className={styles.card} onSubmit={submit}>
          <div className={styles.grid2}>
            <label className={styles.label}>
              Nome da Arena *
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex: Arena Bom de Bola"
                autoComplete="organization"
              />
            </label>

            <label className={styles.label}>
              Esporte
              <select
                className={styles.input}
                value={form.sport}
                onChange={(e) => setField("sport", e.target.value)}
              >
                {SPORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.grid2}>
            <label className={styles.label}>
              Cidade *
              <input
                className={styles.input}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Ex: Curitiba"
                autoComplete="address-level2"
              />
            </label>

            <label className={styles.label}>
              WhatsApp / Telefone (opcional)
              <input
                className={styles.input}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="(41) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
          </div>

          <label className={styles.label}>
            Endereço (opcional)
            <input
              className={styles.input}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Rua / bairro / número"
              autoComplete="street-address"
            />
          </label>

          <label className={styles.label}>
            Observações (opcional)
            <textarea
              className={styles.textarea}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Regras, horários, informações extras..."
              rows={4}
            />
          </label>

          {msg ? <div className={styles.msg}>{msg}</div> : null}

          <div className={styles.footer}>
            <div className={styles.hint}>
              * Campos obrigatórios: <b>Nome</b> e <b>Cidade</b>
            </div>

            <button className={styles.btnPrimary} disabled={loading || !isValid} type="submit">
              {loading ? "Criando..." : "Criar Arena"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

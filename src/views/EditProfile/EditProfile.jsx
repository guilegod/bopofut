import { useMemo, useState } from "react";
import styles from "./EditProfile.module.css";

import Header from "./components/Header.jsx";
import AvatarEditor from "./components/AvatarEditor.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import ContactInfo from "./components/ContactInfo.jsx";

function clean(v) {
  return String(v ?? "").trim();
}

export default function EditProfile({ user, onSave, onBack }) {
  const safeUser = user || {};
  const role = String(safeUser.role || "user").toLowerCase();
  const isArenaOwner = role === "arena_owner";

  // ✅ “fonte” do modo arena: use campos específicos se existirem,
  // senão reaproveita user.name / user.phone etc.
  const initial = useMemo(() => {
    if (isArenaOwner) {
      return {
        arenaName: clean(safeUser.arenaName || safeUser.name || ""),
        avatar: safeUser.avatar || "",
        phone: clean(safeUser.phone || ""),
        city: clean(safeUser.city || ""),
        address: clean(safeUser.address || ""),
        is24h: Boolean(safeUser.is24h),
        openTime: clean(safeUser.openTime || "09:00"),
        closeTime: clean(safeUser.closeTime || "23:00"),
      };
    }

    return {
      name: clean(safeUser.name || ""),
      avatar: safeUser.avatar || "",
      position: clean(safeUser.position || ""),
      phone: clean(safeUser.phone || ""),
    };
  }, [safeUser, isArenaOwner]);

  const [formData, setFormData] = useState(initial);

  function handleSubmit(e) {
    e.preventDefault();

    if (isArenaOwner) {
      const payload = {
        ...safeUser,
        // ✅ salva campos de arena (loja)
        arenaName: clean(formData.arenaName),
        name: clean(formData.arenaName) || safeUser.name, // opcional: sincroniza name
        phone: clean(formData.phone),
        city: clean(formData.city),
        address: clean(formData.address),
        is24h: Boolean(formData.is24h),
        openTime: formData.is24h ? "00:00" : clean(formData.openTime || "09:00"),
        closeTime: formData.is24h ? "23:59" : clean(formData.closeTime || "23:00"),
        avatar: formData.avatar || safeUser.avatar,
      };

      onSave?.(payload);
      return;
    }

    // player/organizer
    const payload = {
      ...safeUser,
      name: clean(formData.name),
      position: clean(formData.position),
      phone: clean(formData.phone),
      avatar: formData.avatar || safeUser.avatar,
    };

    onSave?.(payload);
  }

  return (
    <div className={styles.page}>
      <Header
        onBack={onBack}
        title={isArenaOwner ? "Configurações da Arena" : "Editar Perfil"}
        subtitle={isArenaOwner ? "Dados da sua loja (aparece pros jogadores)" : "Seu perfil de jogador"}
      />

      <AvatarEditor
        avatar={formData.avatar}
        onChange={(avatar) => setFormData((prev) => ({ ...prev, avatar }))}
      />

      <form onSubmit={handleSubmit} className={styles.form}>
        <ProfileForm mode={isArenaOwner ? "arena" : "player"} data={formData} onChange={setFormData} />

        <ContactInfo
          mode={isArenaOwner ? "arena" : "player"}
          email={safeUser.email}
          phone={isArenaOwner ? formData.phone : formData.phone}
        />

        <button type="submit" className={styles.saveBtn}>
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";
import styles from "./editProfile.module.css";

import Header from "./components/Header.jsx";
import AvatarEditor from "./components/AvatarEditor.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import ContactInfo from "./components/ContactInfo.jsx";

export default function EditProfile({ user, onSave, onBack }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    avatar: user.avatar || "",
    position: user.position || "",
  });

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...user, ...formData });
  }

  return (
    <div className={styles.page}>
      <Header onBack={onBack} />

      <AvatarEditor
        avatar={formData.avatar}
        onChange={(avatar) => setFormData({ ...formData, avatar })}
      />

      <form onSubmit={handleSubmit} className={styles.form}>
        <ProfileForm data={formData} onChange={setFormData} />

        <ContactInfo email={user.email} phone={user.phone} />

        <button type="submit" className={styles.saveBtn}>
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}

import styles from "../editProfile.module.css";

export default function AvatarEditor({ avatar, onChange }) {
  return (
    <div className={styles.avatarWrap}>
      <div className={styles.avatarBox}>
        <img src={avatar} alt="Avatar" />
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => alert("Upload de avatar (stub)")}
        >
          📷
        </button>
      </div>
    </div>
  );
}

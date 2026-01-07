import styles from "./friends.module.css";

import Header from "./components/Header.jsx";
import SearchBar from "./components/SearchBar.jsx";
import FriendCard from "./components/FriendCard.jsx";
import InviteButton from "./components/InviteButton.jsx";

// mock temporário (depois vira API)
const mockFriends = [
  { id: "f1", name: "Zico", status: "Em campo", position: "Meia", avatar: "https://picsum.photos/seed/zico/200" },
  { id: "f2", name: "Ronaldo", status: "Offline", position: "Pivô", avatar: "https://picsum.photos/seed/ronaldo/200" },
  { id: "f3", name: "Dida", status: "No Jogo", position: "Goleiro", avatar: "https://picsum.photos/seed/dida/200" },
  { id: "f4", name: "Marta", status: "Em campo", position: "Ala", avatar: "https://picsum.photos/seed/marta/200" },
];

export default function Friends({ onBack }) {
  return (
    <div className={styles.page}>
      <Header onBack={onBack} />

      <SearchBar />

      <div className={styles.list}>
        {mockFriends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </div>

      <InviteButton />
    </div>
  );
}

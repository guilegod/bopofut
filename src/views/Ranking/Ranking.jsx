import { useMemo, useState } from "react";
import styles from "./ranking.module.css";

import Header from "./components/Header.jsx";
import Tabs from "./components/Tabs.jsx";
import Podium from "./components/Podium.jsx";
import RankingTable from "./components/RankingTable.jsx";
import Legend from "./components/Legend.jsx";

function buildRanking(users, matches) {
  const map = {};

  // inicializa jogadores
  users.forEach((u) => {
    if (u.role !== "player") return;
    map[u.id] = {
      ...u,
      stats: {
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
      },
    };
  });

  // percorre partidas FINALIZADAS
  matches.forEach((m) => {
    if (m?.admin?.status !== "FINISHED") return;

    const stats = m.playerStats || {};
    const playersInMatch = Object.keys(stats);

    playersInMatch.forEach((playerId) => {
      const p = map[playerId];
      if (!p) return;

      p.stats.gamesPlayed += 1;
      p.stats.goals += Number(stats[playerId]?.goals || 0);
      p.stats.assists += Number(stats[playerId]?.assists || 0);
    });
  });

  return Object.values(map);
}

export default function Ranking({ users = [], matches = [], onBack }) {
  const [activeTab, setActiveTab] = useState("geral");

  const rankedUsers = useMemo(() => {
    let list = buildRanking(users, matches);

    if (activeTab === "amigos") {
      // ⚠️ depois você liga isso ao sistema real de amigos
      const myFriends = ["u1", "u3", "u4", "u5"];
      list = list.filter((u) => myFriends.includes(u.id));
    }

    return list.sort((a, b) => {
      if (b.stats.goals !== a.stats.goals)
        return b.stats.goals - a.stats.goals;
      if (b.stats.assists !== a.stats.assists)
        return b.stats.assists - a.stats.assists;
      return b.stats.gamesPlayed - a.stats.gamesPlayed;
    });
  }, [users, matches, activeTab]);

  return (
    <div className={styles.page}>
      <Header onBack={onBack} />

      <Tabs value={activeTab} onChange={setActiveTab} />

      <Podium users={rankedUsers.slice(0, 3)} />

      <RankingTable users={rankedUsers} />

      <Legend />
    </div>
  );
}

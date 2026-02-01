import styles from "./Landing.module.css";

export default function Landing({ onEnterApp, onEnterPanel }) {
  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.logo}>BP</div>
          <div>
            <div className={styles.brandName}>BoraPô</div>
            <div className={styles.brandTag}>Sistema de quadras • agenda • jogos</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.linkBtn} onClick={() => document.getElementById("como")?.scrollIntoView({ behavior: "smooth" })}>
            Como funciona
          </button>
          <button className={styles.linkBtn} onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
            Planos
          </button>
          <button className={styles.linkBtn} onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}>
            Contato
          </button>
        </nav>

        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={onEnterPanel}>
            Entrar (Dono)
          </button>
          <button className={styles.btnPrimary} onClick={onEnterApp}>
            Abrir App
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.h1}>
            Sua quadra organizada em 1 lugar: reservas, agenda e gestão.
          </h1>
          <p className={styles.p}>
            A landing é pra vender. O sistema é pra rodar. Aqui você apresenta com prints e
            mostra o valor — e deixa botões claros pra acessar o app e o painel.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.btnPrimaryBig} onClick={onEnterPanel}>
              Sou dono de quadra (painel)
            </button>
            <button className={styles.btnSoftBig} onClick={onEnterApp}>
              Quero usar como jogador (app)
            </button>
          </div>

          <div className={styles.badges}>
            <span className={styles.badge}>✅ Web + APK</span>
            <span className={styles.badge}>✅ Painel no PC</span>
            <span className={styles.badge}>✅ Link pelo domínio</span>
          </div>
        </div>

        {/* Mock/prints (você troca depois) */}
        <div className={styles.heroMock}>
          <div className={styles.mockCard}>
            <div className={styles.mockTitle}>Prévia do Painel (PC)</div>
            <div className={styles.mockBody}>Coloque aqui um print do painel</div>
          </div>
          <div className={styles.mockCard}>
            <div className={styles.mockTitle}>Prévia do App (mobile)</div>
            <div className={styles.mockBody}>Coloque aqui um print do app</div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className={styles.section}>
        <h2 className={styles.h2}>Como funciona</h2>
        <div className={styles.grid3}>
          <div className={styles.card}>
            <div className={styles.cardT}>1) Cadastre a quadra</div>
            <div className={styles.cardP}>Nome, horários, regras e preços (quando você ativar).</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardT}>2) Organize agenda</div>
            <div className={styles.cardP}>Reservas e horários em um lugar só, sem bagunça no Whats.</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardT}>3) Receba pedidos</div>
            <div className={styles.cardP}>Usuários acessam o app e você controla tudo no painel.</div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className={styles.section}>
        <h2 className={styles.h2}>Planos</h2>
        <div className={styles.grid3}>
          <div className={styles.priceCard}>
            <div className={styles.priceName}>Starter</div>
            <div className={styles.priceValue}>R$ 0</div>
            <div className={styles.priceDesc}>Para testar e validar.</div>
            <button className={styles.btnSoft} onClick={onEnterPanel}>Testar no painel</button>
          </div>

          <div className={`${styles.priceCard} ${styles.priceFeatured}`}>
            <div className={styles.priceName}>Pro</div>
            <div className={styles.priceValue}>R$ 49</div>
            <div className={styles.priceDesc}>Agenda + recursos premium.</div>
            <button className={styles.btnPrimary} onClick={onEnterPanel}>Quero o Pro</button>
          </div>

          <div className={styles.priceCard}>
            <div className={styles.priceName}>Premium</div>
            <div className={styles.priceValue}>R$ 99</div>
            <div className={styles.priceDesc}>Para quadras cheias e com mais gestão.</div>
            <button className={styles.btnSoft} onClick={onEnterPanel}>Falar com vendas</button>
          </div>
        </div>
        <p className={styles.miniNote}>
          *Você pode deixar preços como “em breve” se ainda estiver ajustando. O importante é ter a página e os links.
        </p>
      </section>

      {/* Contato */}
      <section id="contato" className={styles.section}>
        <h2 className={styles.h2}>Contato</h2>
        <div className={styles.contactRow}>
          <div className={styles.card}>
            <div className={styles.cardT}>Quer colocar sua quadra no BoraPô?</div>
            <div className={styles.cardP}>Me chama e eu configuro o painel com você.</div>
            <div className={styles.ctaRow}>
              <button className={styles.btnPrimary} onClick={onEnterPanel}>Abrir painel</button>
              <button className={styles.btnGhost} onClick={onEnterApp}>Abrir app</button>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>© {new Date().getFullYear()} BoraPô • borapo.com</div>
      </footer>
    </div>
  );
}

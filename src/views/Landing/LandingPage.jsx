// src/views/Landing/LandingPage.jsx
import styles from "./LandingPage.module.css";

export default function LandingPage({
  onEnterApp,
  appUrl = "/app",
  whatsappNumber = "5541999999999", // TROQUE pelo seu número (DDD + número)
}) {
  const waText = encodeURIComponent(
    "Oi! Vi o BÓPÔ FUT e quero testar na minha quadra. Quantas quadras vocês suportam e como funciona a agenda/partidas?"
  );

  const waLink = `https://wa.me/${whatsappNumber}?text=${waText}`;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>B</div>
          <div className={styles.brandText}>
            <div className={styles.name}>BÓPÔ FUT</div>
            <div className={styles.tag}>Arenas • Organizadores • Jogadores</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#produto" className={styles.link}>Produto</a>
          <a href="#para-arenas" className={styles.link}>Para Arenas</a>
          <a href="#precos" className={styles.link}>Preços</a>
          <a href="#faq" className={styles.link}>FAQ</a>
        </nav>

        <div className={styles.headerCtas}>
          <a className={styles.btnGhost} href={appUrl} onClick={(e) => { e.preventDefault(); onEnterApp?.(); }}>
            Entrar no App
          </a>
          <a className={styles.btnPrimary} href={waLink} target="_blank" rel="noreferrer">
            Falar no WhatsApp
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.kicker}>SaaS esportivo com social + gestão</div>

          <h1 className={styles.h1}>
            Transforme peladas em <span className={styles.highlight}>comunidade</span> — e arenas em{" "}
            <span className={styles.highlight}>negócio</span>.
          </h1>

          <p className={styles.sub}>
            O BÓPÔ FUT organiza <b>agenda da arena</b>, <b>criação de partidas</b>, <b>presença/check-in</b>,{" "}
            <b>ranking</b> e <b>perfil social estilo app gamer</b>. Tudo pronto para escalar.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary} onClick={() => onEnterApp?.()}>
              Ver demo (App)
            </button>
            <a className={styles.btnGhost} href={waLink} target="_blank" rel="noreferrer">
              Quero usar na minha quadra
            </a>
          </div>

          <div className={styles.trustRow}>
            <span className={styles.pill}>✅ Presença real (MatchPresence)</span>
            <span className={styles.pill}>✅ Perfil + ranking + amigos</span>
            <span className={styles.pill}>✅ Painel de Arena / Organizador</span>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.mockCard}>
            <div className={styles.mockTop}>
              <div className={styles.mockDot} />
              <div className={styles.mockDot} />
              <div className={styles.mockDot} />
            </div>
            <div className={styles.mockTitle}>Preview do Produto</div>
            <div className={styles.mockGrid}>
              <div className={styles.mockMini}>
                <div className={styles.mockMiniTitle}>Agenda</div>
                <div className={styles.mockMiniSub}>Horários + quadras</div>
              </div>
              <div className={styles.mockMini}>
                <div className={styles.mockMiniTitle}>Partidas</div>
                <div className={styles.mockMiniSub}>Criar + convidar</div>
              </div>
              <div className={styles.mockMini}>
                <div className={styles.mockMiniTitle}>Perfil</div>
                <div className={styles.mockMiniSub}>Rating + badges</div>
              </div>
              <div className={styles.mockMini}>
                <div className={styles.mockMiniTitle}>Social</div>
                <div className={styles.mockMiniSub}>Amigos + presença</div>
              </div>
            </div>

            <div className={styles.mockFoot}>
              <button className={styles.btnPrimary} onClick={() => onEnterApp?.()}>
                Abrir App
              </button>
              <a className={styles.btnGhost} href={waLink} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Produto */}
      <section id="produto" className={styles.section}>
        <div className={styles.sectionTitle}>O que o BÓPÔ FUT faz</div>
        <div className={styles.sectionSub}>
          Chega de WhatsApp/planilha/prints. Aqui é fluxo de produto: criar → convidar → confirmar presença → histórico.
        </div>

        <div className={styles.cards3}>
          <FeatureCard
            title="Arenas"
            desc="Agenda, painéis, controle de quadras e organização do estabelecimento. (Roadmap: financeiro e promoções)"
            bullets={["Agenda por quadra", "Gestão de horários", "Visão de movimentação", "Integração futura com pagamentos"]}
          />
          <FeatureCard
            title="Organizadores"
            desc="Cria partidas, define regras e controla presença. Tudo preparado para liga/temporada."
            bullets={["Criador de partida", "Gestão de jogadores", "Admin da pelada", "Destaques/MVP (roadmap)"]}
          />
          <FeatureCard
            title="Jogadores"
            desc="Perfil público estilo Steam/FUT: posição, rating, histórico, badges e social."
            bullets={["Perfil público", "Amigos e convites", "Estatísticas", "Ranking e comparação"]}
          />
        </div>
      </section>

      {/* Para Arenas */}
      <section id="para-arenas" className={styles.sectionAlt}>
        <div className={styles.sectionTitle}>Para Arenas e Centros Esportivos</div>
        <div className={styles.sectionSub}>
          O app vira um canal oficial: agenda, organização e comunidade de jogadores girando a sua arena.
        </div>

        <div className={styles.split}>
          <div className={styles.splitLeft}>
            <div className={styles.check}>✅ Reduz bagunça e desistências</div>
            <div className={styles.check}>✅ Aumenta recorrência com ranking/perfil</div>
            <div className={styles.check}>✅ Padroniza presença e histórico</div>
            <div className={styles.check}>✅ Base pronta para “marketplace” (futuro)</div>

            <div className={styles.ctaBox}>
              <div className={styles.ctaTitle}>Quer testar na sua quadra?</div>
              <div className={styles.ctaSub}>Eu configuro com você e você testa com seu grupo.</div>
              <div className={styles.ctaRow}>
                <a className={styles.btnPrimary} href={waLink} target="_blank" rel="noreferrer">
                  Falar no WhatsApp
                </a>
                <button className={styles.btnGhost} onClick={() => onEnterApp?.()}>
                  Ver demo
                </button>
              </div>
            </div>
          </div>

          <div className={styles.splitRight}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>+Organização</div>
              <div className={styles.statLabel}>Agenda + Partidas + Presença</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>+Comunidade</div>
              <div className={styles.statLabel}>Perfil, social, ranking e comparação</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>+Retenção</div>
              <div className={styles.statLabel}>Jogador volta porque evolui no app</div>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className={styles.section}>
        <div className={styles.sectionTitle}>Preços</div>
        <div className={styles.sectionSub}>
          Comece simples. Você pode oferecer teste grátis e subir o plano quando a arena pedir mais.
        </div>

        <div className={styles.pricing}>
          <PriceCard
            title="Starter"
            price="R$ 49/mês"
            tag="Para começar"
            items={["Até 2 quadras", "Agenda + Partidas", "Presença / Check-in", "Suporte básico"]}
            cta="Quero testar"
            onCta={() => window.open(waLink, "_blank")}
          />
          <PriceCard
            title="Pro"
            price="R$ 99/mês"
            tag="Mais vendido"
            highlight
            items={["Até 8 quadras", "Tudo do Starter", "Ranking + Perfil social", "Relatórios (roadmap)"]}
            cta="Falar comigo"
            onCta={() => window.open(waLink, "_blank")}
          />
          <PriceCard
            title="Arena+"
            price="R$ 199/mês"
            tag="Escala"
            items={["Quadras ilimitadas", "Multi-unidade (futuro)", "Promoções (roadmap)", "Suporte prioritário"]}
            cta="Quero esse"
            onCta={() => window.open(waLink, "_blank")}
          />
        </div>

        <div className={styles.note}>
          Dica: para vender mais rápido, você pode lançar com <b>um único plano</b> (ex: R$79/mês até 8 quadras) e depois
          separar em tiers.
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.sectionAlt}>
        <div className={styles.sectionTitle}>Perguntas frequentes</div>

        <div className={styles.faq}>
          <FaqItem q="Precisa instalar?" a="Não. É web app. Funciona no celular e no PC." />
          <FaqItem q="Meus jogadores usam como?" a="Entram no app, confirmam presença, veem ranking e perfil." />
          <FaqItem q="Dá para ter perfil público e social?" a="Sim. O projeto já está preparado para amigos, convites e comparação." />
          <FaqItem q="Tem teste grátis?" a="Sim. Você pode oferecer teste grátis e depois ativar o plano." />
        </div>

        <div className={styles.finalCta}>
          <div className={styles.finalTitle}>Vamos colocar sua arena no BÓPÔ FUT?</div>
          <div className={styles.finalSub}>
            Me chama no WhatsApp com quantas quadras você tem e como faz hoje (WhatsApp/planilha/sistema).
          </div>
          <div className={styles.finalRow}>
            <a className={styles.btnPrimary} href={waLink} target="_blank" rel="noreferrer">
              Chamar no WhatsApp
            </a>
            <button className={styles.btnGhost} onClick={() => onEnterApp?.()}>
              Abrir demo
            </button>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerBrand}>BÓPÔ FUT</div>
          <div className={styles.footerText}>Plataforma de peladas, arenas e comunidade.</div>
        </div>

        <div className={styles.footerRight}>
          <a className={styles.footerLink} href={waLink} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className={styles.footerLink} href={appUrl} onClick={(e) => { e.preventDefault(); onEnterApp?.(); }}>
            Entrar
          </a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, bullets = [] }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardDesc}>{desc}</div>
      <div className={styles.cardBullets}>
        {bullets.map((b, i) => (
          <div key={i} className={styles.bullet}>
            <span className={styles.bulletDot} /> {b}
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceCard({ title, price, tag, items = [], cta, onCta, highlight }) {
  return (
    <div className={`${styles.priceCard} ${highlight ? styles.priceCardHighlight : ""}`}>
      <div className={styles.priceTop}>
        <div className={styles.priceTitle}>{title}</div>
        <div className={styles.priceTag}>{tag}</div>
      </div>
      <div className={styles.priceValue}>{price}</div>
      <div className={styles.priceList}>
        {items.map((t, i) => (
          <div key={i} className={styles.priceItem}>
            <span className={styles.checkDot} /> {t}
          </div>
        ))}
      </div>
      <button className={styles.btnPrimary} onClick={onCta}>
        {cta}
      </button>
    </div>
  );
}

function FaqItem({ q, a }) {
  return (
    <div className={styles.faqItem}>
      <div className={styles.faqQ}>{q}</div>
      <div className={styles.faqA}>{a}</div>
    </div>
  );
}

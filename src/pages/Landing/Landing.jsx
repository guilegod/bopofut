import { useMemo } from "react";
import styles from "./Landing.module.css";

export default function Landing({ onEnterApp, onEnterPanel }) {
  const year = useMemo(() => new Date().getFullYear(), []);

  const features = [
    {
      k: "agenda",
      title: "Agenda inteligente",
      desc: "Grade por dia, horários bloqueados, reservas confirmadas e visão clara do que está livre.",
      icon: "🗓️",
    },
    {
      k: "painel",
      title: "Painel do dono no PC",
      desc: "Controle quadras, preços, horários e pedidos num painel bonito e rápido (sem planilha/Whats).",
      icon: "🖥️",
    },
    {
      k: "app",
      title: "App do jogador",
      desc: "O jogador vê horários, cria pelada, entra em partidas e faz reservas — tudo pelo celular.",
      icon: "📱",
    },
    {
      k: "pwa",
      title: "Web + APK",
      desc: "Roda no navegador, instala como app (PWA) e pode virar APK para Android.",
      icon: "⚡",
    },
    {
      k: "pagamentos",
      title: "Pronto pra monetizar",
      desc: "Planos, recursos premium e evolução contínua — você começa simples e cresce com a arena.",
      icon: "💳",
    },
    {
      k: "marca",
      title: "Sua marca em destaque",
      desc: "Logo, fotos, regras e identidade — sua arena com cara profissional pra vender mais horário.",
      icon: "🏟️",
    },
  ];

  const steps = [
    { t: "Cadastre a arena", p: "Nome, horários, quadras e regras. Em minutos já está pronta pra usar." },
    { t: "Organize a agenda", p: "Centralize reservas e bloqueios. Acabou a confusão de mensagens." },
    { t: "Venda mais horários", p: "O jogador encontra e reserva fácil. Você confirma e acompanha no painel." },
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 0",
      desc: "Pra testar e validar com a sua primeira arena.",
      perks: ["Cadastro básico", "Agenda simples", "Acesso ao app"],
      cta: "Testar no painel",
      onClick: onEnterPanel,
      variant: "soft",
    },
    {
      name: "Pro",
      price: "R$ 49",
      desc: "O melhor custo-benefício pra arenas que querem lotar horários.",
      perks: ["Agenda completa", "Recursos premium", "Prioridade em melhorias"],
      cta: "Quero o Pro",
      onClick: onEnterPanel,
      variant: "primary",
      featured: true,
    },
    {
      name: "Premium",
      price: "R$ 99",
      desc: "Pra arenas cheias e operação mais profissional.",
      perks: ["Gestão avançada", "Suporte e ajustes", "Evolução contínua"],
      cta: "Falar com vendas",
      onClick: onEnterPanel,
      variant: "ghost",
    },
  ];

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brand} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} role="button" tabIndex={0}>
          <div className={styles.logo}>BP</div>
          <div className={styles.brandText}>
            <div className={styles.brandName}>BoraPô</div>
            <div className={styles.brandTag}>Agenda • Reservas • Peladas • Painel do dono</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={styles.navLink}
            type="button"
            onClick={() => document.getElementById("como")?.scrollIntoView({ behavior: "smooth" })}
          >
            Como funciona
          </button>
          <button
            className={styles.navLink}
            type="button"
            onClick={() => document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" })}
          >
            Recursos
          </button>
          <button
            className={styles.navLink}
            type="button"
            onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
          >
            Planos
          </button>
          <button
            className={styles.navLink}
            type="button"
            onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
          >
            FAQ
          </button>
        </nav>

        <div className={styles.actions}>
          <button className={styles.btnGhost} type="button" onClick={onEnterPanel}>
            Entrar (Dono)
          </button>
          <button className={styles.btnPrimary} type="button" onClick={onEnterApp}>
            Abrir App
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.kicker}>🏟️ Gestão de quadras, do jeito certo</div>

          <h1 className={styles.h1}>
            Pare de perder tempo no WhatsApp.
            <span className={styles.h1Accent}> Lotar horários fica fácil.</span>
          </h1>

          <p className={styles.lead}>
            BoraPô centraliza <b>agenda</b>, <b>reservas</b> e <b>peladas</b> num sistema com cara de produto grande —
            pra dono de arena vender mais e pra jogador reservar sem dor de cabeça.
          </p>

          <div className={styles.heroBullets}>
            <div className={styles.bullet}>✅ Agenda clara (livre/ocupado) em 1 clique</div>
            <div className={styles.bullet}>✅ Painel do dono no PC + App do jogador</div>
            <div className={styles.bullet}>✅ Web + PWA + APK Android</div>
          </div>

          <div className={styles.heroCtas}>
            <button className={styles.btnPrimaryBig} type="button" onClick={onEnterPanel}>
              Quero no meu complexo (painel)
            </button>
            <button className={styles.btnSoftBig} type="button" onClick={onEnterApp}>
              Quero usar como jogador (app)
            </button>
          </div>

          <div className={styles.trustRow}>
            <span className={styles.trustPill}>⚡ Setup rápido</span>
            <span className={styles.trustPill}>🔒 Conta & acesso</span>
            <span className={styles.trustPill}>📈 Feito pra crescer</span>
          </div>
        </div>

        <div className={styles.heroShowcase}>
          {/* Device frames (troque imagens depois) */}
          <div className={styles.deviceStack}>
            <div className={styles.devicePhone}>
              <div className={styles.deviceTopBar} />
              <div className={styles.deviceScreen}>
                <div className={styles.shotTitle}>Prévia do App</div>
                <div className={styles.shotSub}>Reserva • Peladas • Perfil</div>
                <div className={styles.shotGrid}>
                  <div className={styles.shotCard} />
                  <div className={styles.shotCard} />
                  <div className={styles.shotCardWide} />
                </div>
              </div>
            </div>

            <div className={styles.deviceDesk}>
              <div className={styles.deviceDeskBar}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
              <div className={styles.deviceDeskScreen}>
                <div className={styles.shotTitle}>Prévia do Painel</div>
                <div className={styles.shotSub}>Agenda • Quadras • Gestão</div>
                <div className={styles.panelGrid}>
                  <div className={styles.panelTile} />
                  <div className={styles.panelTile} />
                  <div className={styles.panelTile} />
                  <div className={styles.panelTileWide} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.heroGlow} aria-hidden="true" />
        </div>
      </section>

      {/* Social proof strip */}
      <section className={styles.proofStrip}>
        <div className={styles.proofInner}>
          <div className={styles.proofItem}>
            <div className={styles.proofN}>+ organização</div>
            <div className={styles.proofP}>Agenda em um lugar só</div>
          </div>
          <div className={styles.proofItem}>
            <div className={styles.proofN}>+ conversão</div>
            <div className={styles.proofP}>Botões claros pra reservar</div>
          </div>
          <div className={styles.proofItem}>
            <div className={styles.proofN}>+ credibilidade</div>
            <div className={styles.proofP}>Sua arena com cara premium</div>
          </div>
          <div className={styles.proofItem}>
            <div className={styles.proofN}>+ tempo</div>
            <div className={styles.proofP}>Menos caos no Whats</div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Como funciona</h2>
          <p className={styles.sectionLead}>3 passos simples pra organizar sua arena e começar a vender mais horários.</p>
        </div>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.t} className={styles.stepCard}>
              <div className={styles.stepN}>{i + 1}</div>
              <div className={styles.stepT}>{s.t}</div>
              <div className={styles.stepP}>{s.p}</div>
            </div>
          ))}
        </div>

        <div className={styles.bigCtaRow}>
          <button className={styles.btnPrimary} type="button" onClick={onEnterPanel}>
            Abrir painel agora
          </button>
          <button className={styles.btnGhost} type="button" onClick={onEnterApp}>
            Ver no app
          </button>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Recursos que fazem sua arena vender mais</h2>
          <p className={styles.sectionLead}>
            Não é só “bonito”. É feito pra funcionar rápido, reduzir atrito e deixar a operação profissional.
          </p>
        </div>

        <div className={styles.bento}>
          {features.map((f) => (
            <article key={f.k} className={styles.bentoCard}>
              <div className={styles.bentoIcon}>{f.icon}</div>
              <div className={styles.bentoT}>{f.title}</div>
              <div className={styles.bentoP}>{f.desc}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.section}>
        <div className={styles.statsCard}>
          <div className={styles.statsLeft}>
            <div className={styles.statsKicker}>Resultado que dá pra sentir</div>
            <div className={styles.statsTitle}>Menos mensagens. Mais reservas. Mais horário vendido.</div>
            <div className={styles.statsText}>
              Seu cliente não quer “conversar”. Ele quer <b>achar horário</b> e <b>reservar</b>. E você quer uma agenda limpa.
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <div className={styles.statN}>1</div>
              <div className={styles.statP}>Agenda central</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>2</div>
              <div className={styles.statP}>App + Painel</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>3</div>
              <div className={styles.statP}>Setup rápido</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statN}>∞</div>
              <div className={styles.statP}>Evolução contínua</div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>Planos</h2>
          <p className={styles.sectionLead}>
            Comece no Starter e evolua quando fizer sentido. O importante é colocar a arena no ar.
          </p>
        </div>

        <div className={styles.pricing}>
          {plans.map((p) => (
            <div key={p.name} className={`${styles.priceCard} ${p.featured ? styles.priceFeatured : ""}`}>
              <div className={styles.priceTop}>
                <div className={styles.priceName}>{p.name}</div>
                {p.featured ? <div className={styles.tagBest}>Mais escolhido</div> : null}
              </div>

              <div className={styles.priceValue}>{p.price}</div>
              <div className={styles.priceDesc}>{p.desc}</div>

              <ul className={styles.perks}>
                {p.perks.map((x) => (
                  <li key={x} className={styles.perk}>✅ {x}</li>
                ))}
              </ul>

              <button
                type="button"
                className={
                  p.variant === "primary"
                    ? styles.btnPrimary
                    : p.variant === "ghost"
                      ? styles.btnGhost
                      : styles.btnSoft
                }
                onClick={p.onClick}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.miniNote}>
          *Se você ainda está ajustando preços, pode deixar “em breve”. O mais importante é a página existir e ter links claros.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>FAQ</h2>
          <p className={styles.sectionLead}>As dúvidas que mais travam a decisão (e as respostas diretas).</p>
        </div>

        <div className={styles.faq}>
          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>Funciona no celular e no PC?</summary>
            <div className={styles.faqA}>Sim. O jogador usa o app (web/PWA/APK) e o dono usa o painel no PC.</div>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>Preciso instalar algo?</summary>
            <div className={styles.faqA}>No celular você pode instalar como PWA. E também dá pra gerar APK pro Android.</div>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>Dá pra colocar a minha logo e identidade?</summary>
            <div className={styles.faqA}>Sim. A arena aparece com logo, infos e visual premium pra passar confiança.</div>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>E o WhatsApp? Some?</summary>
            <div className={styles.faqA}>
              Ele vira “apoio”, não “sistema”. A agenda fica centralizada. Menos mensagens e menos erro.
            </div>
          </details>
        </div>

        <div className={styles.finalCta}>
          <div className={styles.finalCtaText}>
            <div className={styles.finalTitle}>Pronto pra lotar horários com uma agenda profissional?</div>
            <div className={styles.finalSub}>Abra o painel e coloque sua arena no ar.</div>
          </div>
          <div className={styles.finalCtas}>
            <button className={styles.btnPrimaryBig} type="button" onClick={onEnterPanel}>
              Começar agora (painel)
            </button>
            <button className={styles.btnGhost} type="button" onClick={onEnterApp}>
              Ver no app
            </button>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>© {year} BoraPô • borapo.com</div>
      </footer>
    </div>
  );
}

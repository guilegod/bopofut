import { useEffect, useMemo, useState } from "react";
import styles from "./Landing.module.css";

const LOCALES = [
  { key: "pt", label: "PT" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
];

const DICT = {
  pt: {
    brandName: "BoraPô",
    navHow: "Como funciona",
    navBenefits: "Benefícios",
    navProduct: "O app",
    navFaq: "FAQ",
    navContact: "Contato",

    heroKicker: "🏟️ Jogador + Dono de Quadra no mesmo lugar",
    heroTitle: "Reserve quadras e gerencie horários sem complicação.",
    heroSub:
      "O BoraPô conecta jogadores e donos de quadra com uma experiência rápida, organizada e pronta pra crescer na sua cidade.",

    ctaPlayer: "Sou jogador",
    ctaOwner: "Sou dono de quadra",
    ctaDownload: "Baixar o app",
    ctaTalk: "Quero cadastrar minha quadra",

    trustA: "✅ Rápido e fácil",
    trustB: "📅 Agenda organizada",
    trustC: "🔒 Pagamento seguro (pronto pra integrar)",

    howTitle: "Como funciona",
    howLead:
      "Entenda em poucos segundos. Um fluxo simples para quem joga e para quem administra.",

    howPlayerTitle: "Para Jogadores",
    howPlayerSteps: [
      { title: "Encontre quadras", text: "Veja locais, horários e detalhes perto de você." },
      { title: "Escolha data e hora", text: "Disponibilidade clara, sem confusão." },
      { title: "Reserve e jogue", text: "Confirmação rápida e pronto: é só chegar." },
    ],

    howOwnerTitle: "Para Donos de Quadra",
    howOwnerSteps: [
      { title: "Cadastre sua quadra", text: "Crie sua página e horários em minutos." },
      { title: "Receba reservas", text: "Menos WhatsApp, menos erro, mais organização." },
      { title: "Controle tudo", text: "Agenda, clientes e histórico em um só lugar." },
    ],

    benefitsTitle: "Benefícios que fazem sentido (sem enrolação)",
    benefitsLead:
      "O BoraPô é feito pra resolver o dia a dia. Simples no uso, forte no resultado.",

    benefitsPlayerTitle: "Jogadores",
    benefitsPlayer: [
      "Reserva em poucos cliques",
      "Sem ligações e sem ‘fura-fila’",
      "Histórico de reservas",
      "Mais facilidade pra organizar jogos",
    ],

    benefitsOwnerTitle: "Donos de quadra",
    benefitsOwner: [
      "Agenda automática e organizada",
      "Menos conflitos de horário",
      "Mais visibilidade pra sua quadra",
      "Controle simples do negócio",
    ],

    productTitle: "O app por dentro",
    productLead:
      "Visual limpo, foco no que importa e pronto pra evoluir com novos módulos (eventos, campeonatos e mais).",

    productCardA: "Agenda em tempo real",
    productCardAText: "Horários claros, disponibilidade confiável.",
    productCardB: "Página da quadra",
    productCardBText: "Fotos, regras, localização e detalhes do local.",
    productCardC: "Reservas e histórico",
    productCardCText: "Tudo registrado pra jogador e dono.",

    proofTitle: "Criado para facilitar o esporte no dia a dia",
    proofText:
      "Menos bagunça na agenda. Mais jogo acontecendo. BoraPô é organização e praticidade para todos.",

    faqTitle: "Perguntas frequentes",
    faq: [
      {
        q: "Isso serve só pra futebol?",
        a: "Não. Dá pra expandir para vários esportes (futsal, vôlei, beach, etc.).",
      },
      {
        q: "Como o dono recebe o dinheiro?",
        a: "Pode ser com pagamento no app (ex.: Pix/Cartão) ou confirmação manual no começo. Você escolhe o nível.",
      },
      {
        q: "Dá pra cadastrar várias quadras?",
        a: "Sim. Uma arena pode ter várias quadras e horários diferentes.",
      },
      {
        q: "Isso funciona no celular como app?",
        a: "Sim. Pode ser PWA e também APK (Play Store) com Capacitor.",
      },
    ],

    contactTitle: "Fale com a gente",
    contactText:
      "Quer colocar sua quadra no BoraPô e começar a receber reservas? Entre em contato e a gente configura com você.",

    footerCopy: "© " + new Date().getFullYear() + " BoraPô. Todos os direitos reservados.",
  },

  en: {
    brandName: "BoraPô",
    navHow: "How it works",
    navBenefits: "Benefits",
    navProduct: "Inside the app",
    navFaq: "FAQ",
    navContact: "Contact",

    heroKicker: "🏟️ Players + Venue owners together",
    heroTitle: "Book courts and manage schedules with ease.",
    heroSub:
      "BoraPô connects players and court owners with a fast, organized experience built to scale in your city.",

    ctaPlayer: "I’m a player",
    ctaOwner: "I’m a court owner",
    ctaDownload: "Download the app",
    ctaTalk: "List my court",

    trustA: "✅ Fast & simple",
    trustB: "📅 Organized calendar",
    trustC: "🔒 Secure payments (ready to integrate)",

    howTitle: "How it works",
    howLead: "A simple flow for players and owners.",

    howPlayerTitle: "For Players",
    howPlayerSteps: [
      { title: "Find courts", text: "See places, times and details nearby." },
      { title: "Pick date & time", text: "Clear availability, no confusion." },
      { title: "Book & play", text: "Quick confirmation and you’re set." },
    ],

    howOwnerTitle: "For Court Owners",
    howOwnerSteps: [
      { title: "List your court", text: "Create your page and schedules in minutes." },
      { title: "Receive bookings", text: "Less WhatsApp chaos, more organization." },
      { title: "Manage everything", text: "Calendar, customers and history in one place." },
    ],

    benefitsTitle: "Real benefits (no fluff)",
    benefitsLead: "Built for everyday use. Simple, but powerful.",

    benefitsPlayerTitle: "Players",
    benefitsPlayer: ["Book in seconds", "No calls or back-and-forth", "Booking history", "Easier game planning"],

    benefitsOwnerTitle: "Owners",
    benefitsOwner: ["Automatic schedule", "Fewer conflicts", "More visibility", "Simple business control"],

    productTitle: "Inside the app",
    productLead: "Clean UI focused on what matters — ready for future modules (events, tournaments, and more).",

    productCardA: "Real-time calendar",
    productCardAText: "Clear time slots and reliable availability.",
    productCardB: "Court page",
    productCardBText: "Photos, rules, location and venue details.",
    productCardC: "Bookings & history",
    productCardCText: "Everything recorded for players and owners.",

    proofTitle: "Made to simplify sports routines",
    proofText: "Less schedule mess. More games happening. BoraPô is organization for everyone.",

    faqTitle: "FAQ",
    faq: [
      { q: "Only for soccer?", a: "No. You can expand to multiple sports." },
      { q: "How does the owner get paid?", a: "In-app payments or manual confirmation at first — your choice." },
      { q: "Can I add multiple courts?", a: "Yes. One venue can have multiple courts and schedules." },
      { q: "Does it work as a mobile app?", a: "Yes — PWA and APK (Play Store) with Capacitor." },
    ],

    contactTitle: "Contact",
    contactText: "Want to list your court and start receiving bookings? Reach out and we’ll set it up together.",

    footerCopy: "© " + new Date().getFullYear() + " BoraPô. All rights reserved.",
  },

  es: {
    brandName: "BoraPô",
    navHow: "Cómo funciona",
    navBenefits: "Beneficios",
    navProduct: "El app",
    navFaq: "FAQ",
    navContact: "Contacto",

    heroKicker: "🏟️ Jugadores + Dueños de canchas",
    heroTitle: "Reserva canchas y gestiona horarios sin complicación.",
    heroSub:
      "BoraPô conecta jugadores y dueños con una experiencia rápida y organizada, lista para crecer en tu ciudad.",

    ctaPlayer: "Soy jugador",
    ctaOwner: "Soy dueño",
    ctaDownload: "Descargar",
    ctaTalk: "Quiero registrar mi cancha",

    trustA: "✅ Rápido y simple",
    trustB: "📅 Agenda organizada",
    trustC: "🔒 Pagos seguros (listo para integrar)",

    howTitle: "Cómo funciona",
    howLead: "Un flujo simple para jugadores y dueños.",

    howPlayerTitle: "Para jugadores",
    howPlayerSteps: [
      { title: "Encuentra canchas", text: "Mira lugares, horarios y detalles cercanos." },
      { title: "Elige día y hora", text: "Disponibilidad clara y sin confusión." },
      { title: "Reserva y juega", text: "Confirmación rápida y listo." },
    ],

    howOwnerTitle: "Para dueños",
    howOwnerSteps: [
      { title: "Registra tu cancha", text: "Crea tu página y horarios en minutos." },
      { title: "Recibe reservas", text: "Menos caos de WhatsApp, más organización." },
      { title: "Controla todo", text: "Agenda, clientes e historial en un solo lugar." },
    ],

    benefitsTitle: "Beneficios reales (sin relleno)",
    benefitsLead: "Hecho para el día a día. Simple y poderoso.",

    benefitsPlayerTitle: "Jugadores",
    benefitsPlayer: ["Reserva en segundos", "Sin llamadas", "Historial", "Mejor organización de partidos"],

    benefitsOwnerTitle: "Dueños",
    benefitsOwner: ["Agenda automática", "Menos conflictos", "Más visibilidad", "Control simple"],

    productTitle: "El app por dentro",
    productLead: "Diseño limpio, foco en lo importante y listo para crecer con nuevos módulos.",

    productCardA: "Agenda en tiempo real",
    productCardAText: "Horarios claros y disponibilidad confiable.",
    productCardB: "Página de la cancha",
    productCardBText: "Fotos, reglas, ubicación y detalles.",
    productCardC: "Reservas e historial",
    productCardCText: "Todo registrado para jugadores y dueños.",

    proofTitle: "Creado para facilitar el deporte",
    proofText: "Menos desorden. Más partidos. BoraPô es organización para todos.",

    faqTitle: "FAQ",
    faq: [
      { q: "¿Solo fútbol?", a: "No. Se puede expandir a varios deportes." },
      { q: "¿Cómo cobra el dueño?", a: "Pagos en el app o confirmación manual al inicio — tú eliges." },
      { q: "¿Puedo registrar varias canchas?", a: "Sí. Un lugar puede tener varias canchas y horarios." },
      { q: "¿Funciona como app móvil?", a: "Sí — PWA y APK (Play Store) con Capacitor." },
    ],

    contactTitle: "Contacto",
    contactText: "¿Quieres registrar tu cancha y recibir reservas? Escríbenos y lo configuramos contigo.",

    footerCopy: "© " + new Date().getFullYear() + " BoraPô. Todos los derechos reservados.",
  },
};

export default function Landing({ onEnterApp, onEnterPanel }) {
  const [locale, setLocale] = useState("pt");
  const t = useMemo(() => DICT[locale] || DICT.pt, [locale]);

  useEffect(() => {
    // scroll suave (boa sensação premium)
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden="true" />

      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <div className={styles.logoMark} aria-hidden="true" />
            <div className={styles.brandText}>
              <div className={styles.brandName}>{t.brandName}</div>
              <div className={styles.brandTag}>Agenda • Reservas • Quadras</div>
            </div>
          </div>

          <nav className={styles.nav}>
            <a className={styles.navLink} href="#como">
              {t.navHow}
            </a>
            <a className={styles.navLink} href="#beneficios">
              {t.navBenefits}
            </a>
            <a className={styles.navLink} href="#app">
              {t.navProduct}
            </a>
            <a className={styles.navLink} href="#faq">
              {t.navFaq}
            </a>
            <a className={styles.navLink} href="#contato">
              {t.navContact}
            </a>
          </nav>

          <div className={styles.topActions}>
            <div className={styles.locale}>
              {LOCALES.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className={`${styles.localeBtn} ${locale === l.key ? styles.localeActive : ""}`}
                  onClick={() => setLocale(l.key)}
                  aria-label={`Idioma ${l.label}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button type="button" className={styles.btnSoft} onClick={onEnterPanel}>
              {t.ctaOwner}
            </button>
            <button type="button" className={styles.btnPrimary} onClick={onEnterApp}>
              {t.ctaPlayer}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.kicker}>{t.heroKicker}</div>
            <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
            <p className={styles.heroSub}>{t.heroSub}</p>

            <div className={styles.heroCtas}>
              <button type="button" className={styles.btnPrimaryLg} onClick={onEnterApp}>
                {t.ctaDownload}
              </button>
              <button type="button" className={styles.btnGhostLg} onClick={onEnterPanel}>
                {t.ctaTalk}
              </button>
            </div>

            <div className={styles.trustRow}>
              <div className={styles.trustPill}>{t.trustA}</div>
              <div className={styles.trustPill}>{t.trustB}</div>
              <div className={styles.trustPill}>{t.trustC}</div>
            </div>
          </div>

          <div className={styles.heroRight} aria-hidden="true">
            <div className={styles.deviceCard}>
              <div className={styles.deviceTop}>
                <div className={styles.dot} />
                <div className={styles.dot} />
                <div className={styles.dot} />
              </div>
              <div className={styles.deviceBody}>
                <div className={styles.mockHeader}>
                  <div className={styles.mockTitle}>BoraPô</div>
                  <div className={styles.mockChip}>Reserva</div>
                </div>

                <div className={styles.mockGrid}>
                  <div className={styles.mockTile}>
                    <div className={styles.mockIcon}>📅</div>
                    <div className={styles.mockText}>
                      <div className={styles.mockStrong}>Agenda</div>
                      <div className={styles.mockMuted}>Horários</div>
                    </div>
                  </div>
                  <div className={styles.mockTile}>
                    <div className={styles.mockIcon}>🏟️</div>
                    <div className={styles.mockText}>
                      <div className={styles.mockStrong}>Quadras</div>
                      <div className={styles.mockMuted}>Locais</div>
                    </div>
                  </div>
                  <div className={styles.mockTile}>
                    <div className={styles.mockIcon}>✅</div>
                    <div className={styles.mockText}>
                      <div className={styles.mockStrong}>Reserva</div>
                      <div className={styles.mockMuted}>Confirmada</div>
                    </div>
                  </div>
                  <div className={styles.mockTile}>
                    <div className={styles.mockIcon}>💳</div>
                    <div className={styles.mockText}>
                      <div className={styles.mockStrong}>Pagamento</div>
                      <div className={styles.mockMuted}>Seguro</div>
                    </div>
                  </div>
                </div>

                <div className={styles.mockBar} />
                <div className={styles.mockBarSm} />
              </div>
            </div>

            <div className={styles.floatCardA}>
              <div className={styles.floatTitle}>🔥 Horários populares</div>
              <div className={styles.floatText}>Sáb 18:00 • Dom 10:00</div>
            </div>
            <div className={styles.floatCardB}>
              <div className={styles.floatTitle}>🏟️ Sua quadra online</div>
              <div className={styles.floatText}>Página + Agenda + Reservas</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>{t.howTitle}</h2>
            <p className={styles.lead}>{t.howLead}</p>
          </div>

          <div className={styles.howGrid}>
            <div className={styles.howCol}>
              <div className={styles.howTitle}>{t.howPlayerTitle}</div>
              <div className={styles.steps}>
                {t.howPlayerSteps.map((s, idx) => (
                  <div key={idx} className={styles.stepCard}>
                    <div className={styles.stepNum}>{idx + 1}</div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitle}>{s.title}</div>
                      <div className={styles.stepText}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnPrimary} onClick={onEnterApp}>
                {t.ctaPlayer}
              </button>
            </div>

            <div className={styles.howCol}>
              <div className={styles.howTitle}>{t.howOwnerTitle}</div>
              <div className={styles.steps}>
                {t.howOwnerSteps.map((s, idx) => (
                  <div key={idx} className={styles.stepCard}>
                    <div className={styles.stepNum}>{idx + 1}</div>
                    <div className={styles.stepContent}>
                      <div className={styles.stepTitle}>{s.title}</div>
                      <div className={styles.stepText}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnSoft} onClick={onEnterPanel}>
                {t.ctaOwner}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>{t.benefitsTitle}</h2>
            <p className={styles.lead}>{t.benefitsLead}</p>
          </div>

          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitTitle}>🎮 {t.benefitsPlayerTitle}</div>
              <ul className={styles.list}>
                {t.benefitsPlayer.map((item, i) => (
                  <li key={i} className={styles.li}>
                    <span className={styles.tick}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className={styles.cardCtas}>
                <button type="button" className={styles.btnPrimary} onClick={onEnterApp}>
                  {t.ctaDownload}
                </button>
              </div>
            </div>

            <div className={styles.benefitCard}>
              <div className={styles.benefitTitle}>🏟️ {t.benefitsOwnerTitle}</div>
              <ul className={styles.list}>
                {t.benefitsOwner.map((item, i) => (
                  <li key={i} className={styles.li}>
                    <span className={styles.tick}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className={styles.cardCtas}>
                <button type="button" className={styles.btnSoft} onClick={onEnterPanel}>
                  {t.ctaTalk}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.proof}>
            <div className={styles.proofInner}>
              <div className={styles.proofTitle}>{t.proofTitle}</div>
              <div className={styles.proofText}>{t.proofText}</div>
            </div>
          </div>
        </div>
      </section>

      {/* O APP */}
      <section id="app" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>{t.productTitle}</h2>
            <p className={styles.lead}>{t.productLead}</p>
          </div>

          <div className={styles.productGrid}>
            <div className={styles.productCard}>
              <div className={styles.productIcon}>📅</div>
              <div className={styles.productTitle}>{t.productCardA}</div>
              <div className={styles.productText}>{t.productCardAText}</div>
            </div>

            <div className={styles.productCard}>
              <div className={styles.productIcon}>🏟️</div>
              <div className={styles.productTitle}>{t.productCardB}</div>
              <div className={styles.productText}>{t.productCardBText}</div>
            </div>

            <div className={styles.productCard}>
              <div className={styles.productIcon}>✅</div>
              <div className={styles.productTitle}>{t.productCardC}</div>
              <div className={styles.productText}>{t.productCardCText}</div>
            </div>
          </div>

          <div className={styles.bigCta}>
            <div className={styles.bigCtaInner}>
              <div className={styles.bigCtaTitle}>Bora reservar ou cadastrar sua quadra?</div>
              <div className={styles.bigCtaActions}>
                <button type="button" className={styles.btnPrimaryLg} onClick={onEnterApp}>
                  {t.ctaDownload}
                </button>
                <button type="button" className={styles.btnGhostLg} onClick={onEnterPanel}>
                  {t.ctaTalk}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>{t.faqTitle}</h2>
            <p className={styles.lead}>Respostas rápidas para dúvidas comuns.</p>
          </div>

          <div className={styles.faqGrid}>
            {t.faq.map((item, idx) => (
              <details key={idx} className={styles.faqItem}>
                <summary className={styles.faqQ}>{item.q}</summary>
                <div className={styles.faqA}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.contact}>
            <div className={styles.contactLeft}>
              <h2 className={styles.h2}>{t.contactTitle}</h2>
              <p className={styles.lead}>{t.contactText}</p>
              <div className={styles.contactActions}>
                <button type="button" className={styles.btnPrimaryLg} onClick={onEnterPanel}>
                  {t.ctaTalk}
                </button>
                <button type="button" className={styles.btnGhostLg} onClick={onEnterApp}>
                  {t.ctaDownload}
                </button>
              </div>
            </div>

            <div className={styles.contactRight} aria-hidden="true">
              <div className={styles.contactCard}>
                <div className={styles.contactCardTitle}>✨ Setup rápido</div>
                <div className={styles.contactCardText}>
                  Página da quadra • Agenda • Reservas • Futuro: pagamento e eventos
                </div>
                <div className={styles.contactCardBadge}>Curitiba → Brasil → Mundo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoMarkSm} aria-hidden="true" />
            <div>
              <div className={styles.footerName}>{t.brandName}</div>
              <div className={styles.footerCopy}>{t.footerCopy}</div>
            </div>
          </div>

          <div className={styles.footerLinks}>
            <a className={styles.footerLink} href="#como">
              {t.navHow}
            </a>
            <a className={styles.footerLink} href="#beneficios">
              {t.navBenefits}
            </a>
            <a className={styles.footerLink} href="#app">
              {t.navProduct}
            </a>
            <a className={styles.footerLink} href="#faq">
              {t.navFaq}
            </a>
            <a className={styles.footerLink} href="#contato">
              {t.navContact}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

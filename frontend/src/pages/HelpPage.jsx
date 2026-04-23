import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Page d'aide / FAQ. Questions-réponses repliables avec la logique
 * native <details>/<summary> — pas de dépendance accordion, accessible
 * clavier par défaut, fonctionne sans JS.
 */

const CATEGORIES = [
  {
    title: 'Compte et connexion',
    faqs: [
      {
        q: "J'ai oublié mon mot de passe, comment le récupérer ?",
        a: (
          <p>
            Depuis l'écran de connexion, cliquez sur{' '}
            <Link to="/mot-de-passe-oublie">Mot de passe oublié</Link>. Saisissez
            votre adresse, on vous envoie immédiatement un email avec un lien de
            réinitialisation valable <strong>1 heure</strong>. Pour des raisons
            de sécurité, on ne précise pas si l'adresse est connue ou non.
          </p>
        ),
      },
      {
        q: 'Comment modifier mes informations personnelles ?',
        a: (
          <p>
            Depuis votre espace <Link to="/compte">Mon compte</Link>, onglet
            Paramètres. Vous pouvez y modifier votre nom, téléphone et adresse
            de livraison. L'adresse email ne peut pas être changée elle-même —
            écrivez à <a href="mailto:contact@hookcook.fr">contact@hookcook.fr</a>{' '}
            si vous devez la mettre à jour.
          </p>
        ),
      },
      {
        q: 'Puis-je supprimer mon compte ?',
        a: (
          <p>
            Oui, et c'est immédiat. Depuis <Link to="/compte">Mon compte</Link>{' '}
            → Paramètres, vous pouvez télécharger l'export RGPD de toutes vos
            données (JSON) puis supprimer votre compte. Conformément à la
            réglementation, les commandes passées sont conservées 10 ans à des
            fins de facturation mais sont anonymisées et ne sont plus rattachées
            à votre identité (nom, email, adresse). Permis et inscriptions
            concours sont anonymisés ou supprimés.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Commandes et livraison',
    faqs: [
      {
        q: 'Quels sont les modes de livraison disponibles ?',
        a: (
          <ul>
            <li>
              <strong>Standard Colissimo</strong> — 48-72h, 5,90 € (offert dès
              120 € d'achat)
            </li>
            <li>
              <strong>Chronopost 24h</strong> — lendemain avant 13h, 12,90 €
            </li>
            <li>
              <strong>Point relais</strong> — 3-5 jours, 3,90 €
            </li>
          </ul>
        ),
      },
      {
        q: 'Je n\'ai pas reçu ma confirmation de commande, que faire ?',
        a: (
          <p>
            Vérifiez d'abord vos spams. Si rien, consultez votre historique de
            commandes dans <Link to="/compte">Mon compte</Link>. Si la commande
            apparaît mais sans email reçu, contactez-nous — on vous renvoie la
            confirmation manuellement.
          </p>
        ),
      },
      {
        q: 'Comment télécharger ma facture ?',
        a: (
          <p>
            Depuis <Link to="/compte">Mon compte</Link> → onglet Commandes,
            bouton « Télécharger la facture » sur chaque ligne. Également
            disponible sur la page de confirmation juste après achat.
          </p>
        ),
      },
      {
        q: 'Je souhaite annuler ou modifier ma commande',
        a: (
          <p>
            Tant que la commande est au statut <span className="mono">Payée</span>
            {' '}(pas encore expédiée), contactez-nous rapidement, on peut
            l'annuler. Une fois au statut <span className="mono">Expédiée</span>,
            il faudra passer par le droit de rétractation une fois le colis
            reçu (30 jours).
          </p>
        ),
      },
    ],
  },
  {
    title: 'Retours et remboursements',
    faqs: [
      {
        q: 'Quel est le délai de rétractation ?',
        a: (
          <p>
            <strong>30 jours</strong> à compter de la réception — plus large que
            le minimum légal de 14 jours. Le produit doit être non-utilisé,
            dans son emballage d'origine. Les frais de retour sont à votre
            charge.
          </p>
        ),
      },
      {
        q: 'Comment initier un retour ?',
        a: (
          <p>
            Contactez-nous par email avec votre numéro de commande, on vous
            envoie une étiquette de retour prépayée (déduite du remboursement).
            Remboursement sous 14 jours après réception du produit retourné.
          </p>
        ),
      },
      {
        q: 'Le produit est défectueux à réception',
        a: (
          <p>
            Envoyez-nous une photo par email dans les 48h. On prend en charge
            l'échange et les frais de retour à 100 %. Garantie légale de
            conformité 2 ans.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Permis de pêche',
    faqs: [
      {
        q: 'Quels types de permis puis-je commander ?',
        a: (
          <>
            <p>Trois types sont actuellement disponibles :</p>
            <ul>
              <li>
                <strong>Annuel</strong> (92 €) — valide du 1er janvier au 31
                décembre, toutes eaux 1re et 2e catégorie, CPMA incluse
              </li>
              <li>
                <strong>Semaine</strong> (28 €) — 7 jours consécutifs, carte
                interfédérale
              </li>
              <li>
                <strong>Découverte</strong> (6 €) — mineurs jusqu'à 12 ans,
                toute l'année
              </li>
            </ul>
          </>
        ),
      },
      {
        q: 'Comment se déroule la demande, étape par étape ?',
        a: (
          <ol>
            <li>Choix du type de permis et du département.</li>
            <li>Identité (prénom, nom, date de naissance).</li>
            <li>Téléversement des pièces (pièce d'identité + photo, JPG/PNG/WebP, 8 Mo max).</li>
            <li>
              Paiement par carte bancaire via Stripe — la demande passe en
              instruction dès la confirmation du paiement.
            </li>
            <li>Décision de la Fédération sous quelques jours ouvrés.</li>
          </ol>
        ),
      },
      {
        q: 'Combien de temps pour obtenir mon permis ?',
        a: (
          <p>
            Généralement <strong>sous 2 jours ouvrés</strong> après instruction
            par la Fédération départementale. Vous suivez l'historique en
            temps réel depuis l'onglet <em>Permis</em> de votre compte.
          </p>
        ),
      },
      {
        q: 'Ma demande a été rejetée, pourquoi ?',
        a: (
          <p>
            Les pièces justificatives n'étaient probablement pas lisibles, ou
            l'identité ne correspondait pas. Vous recevez un email explicatif.
            Vous pouvez soumettre une nouvelle demande depuis{' '}
            <Link to="/permis">la page Permis</Link>.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Concours et challenges',
    faqs: [
      {
        q: 'Comment m\'inscrire à un concours ?',
        a: (
          <p>
            Depuis la page <Link to="/concours">Concours</Link>, cliquez sur le
            concours voulu puis sur « S'inscrire ». Il faut être connecté et
            choisir une catégorie (hommes amateurs, femmes, jeunes…). Les
            places sont limitées : l'inscription n'est validée qu'à la
            confirmation du paiement (ou immédiatement pour les concours
            gratuits).
          </p>
        ),
      },
      {
        q: 'Les concours sont-ils payants ? Comment payer ?',
        a: (
          <p>
            Ça dépend du concours. L'Ouverture truite — Vallée du Tech est
            gratuite ; les autres (Open de la Têt, Carpe 24h à Vinça, Nocturne
            silures Agly) ont un droit d'inscription entre 25 et 45 €. Le
            paiement se fait par carte bancaire via Stripe directement après
            l'inscription. Vos inscrits ne sont décomptés et le mail de
            confirmation envoyé qu'une fois le paiement validé.
          </p>
        ),
      },
      {
        q: 'Comment fonctionnent les Challenges ?',
        a: (
          <p>
            Les <Link to="/challenges">Challenges mensuels</Link> classent
            automatiquement les prises que vous avez consignées dans votre
            carnet, par taille décroissante. Les trois premiers chaque mois
            reçoivent un bon d'achat Hook &amp; Cook.
          </p>
        ),
      },
    ],
  },
  {
    title: 'Paiement et sécurité',
    faqs: [
      {
        q: 'Mes données bancaires sont-elles en sécurité ?',
        a: (
          <p>
            Oui. Les paiements (boutique, permis, concours) passent
            exclusivement par <strong>Stripe</strong>, conforme PCI-DSS. Vos
            numéros de carte ne transitent ni ne sont stockés sur nos serveurs :
            seul un identifiant de transaction est conservé pour la facturation.
          </p>
        ),
      },
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: (
          <p>
            Carte bancaire (Visa, Mastercard, American Express) via Stripe,
            sans frais supplémentaires. Le site est aujourd'hui en mode
            démonstration : utilisez une carte de test Stripe (
            <span className="mono">4242 4242 4242 4242</span>, date future
            quelconque, CVC 3 chiffres).
          </p>
        ),
      },
    ],
  },
];

function Accordion({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{
        borderBottom: '1px solid var(--hairline)',
        padding: 'var(--sp-4) 0',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 'var(--fs-16)',
          fontWeight: 500,
          listStyle: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--sp-3)',
        }}
      >
        <span>{title}</span>
        <span
          style={{
            color: 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-18)',
            transition: 'transform var(--dur-fast)',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div
        className="legal-content"
        style={{ marginTop: 'var(--sp-3)', color: 'var(--ink-soft)' }}
      >
        {children}
      </div>
    </details>
  );
}

export function HelpPage() {
  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 760 }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Centre d'aide
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-44)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            margin: '0 0 var(--sp-5)',
          }}
        >
          Comment on peut vous aider ?
        </h1>
        <p className="lede" style={{ marginBottom: 'var(--sp-8)' }}>
          Les réponses aux questions les plus courantes. Si vous ne trouvez pas,
          écrivez-nous à{' '}
          <a
            href="mailto:contact@hookcook.fr"
            style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
          >
            contact@hookcook.fr
          </a>
          {' '}— on répond sous 24h ouvrées.
        </p>

        {CATEGORIES.map((cat) => (
          <section
            key={cat.title}
            style={{ marginBottom: 'var(--sp-10)' }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-24)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                margin: '0 0 var(--sp-4)',
                paddingBottom: 'var(--sp-2)',
                borderBottom: '2px solid var(--ink)',
              }}
            >
              {cat.title}
            </h2>
            {cat.faqs.map((f) => (
              <Accordion key={f.q} title={f.q} defaultOpen={false}>
                {f.a}
              </Accordion>
            ))}
          </section>
        ))}

        <div
          style={{
            marginTop: 'var(--sp-10)',
            padding: 'var(--sp-6)',
            background: 'var(--bg-sunk)',
            borderRadius: 'var(--r-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-24)',
              fontWeight: 500,
              marginBottom: 'var(--sp-3)',
            }}
          >
            Vous n'avez pas trouvé ?
          </div>
          <p className="soft" style={{ margin: '0 0 var(--sp-4)' }}>
            Écrivez-nous directement — on répond en personne, pas un bot.
          </p>
          <a
            href="mailto:contact@hookcook.fr"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-14)',
              borderBottom: '1px solid currentColor',
            }}
          >
            contact@hookcook.fr
          </a>
        </div>
      </div>
    </div>
  );
}

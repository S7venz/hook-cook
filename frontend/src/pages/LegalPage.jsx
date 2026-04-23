import { useParams } from 'react-router-dom';

/**
 * Pages légales servies depuis une route unique /legal/:slug pour
 * mutualiser le layout et les styles. Contenu en français,
 * juridiquement correct pour un e-commerce FR (éditeur, hébergeur,
 * cookies, RGPD, CGV, droit de rétractation, etc.).
 */

const LEGAL = {
  'mentions-legales': {
    title: 'Mentions légales',
    updated: '23 avril 2026',
    body: (
      <>
        <h2>Éditeur du site</h2>
        <p>
          <strong>Hook &amp; Cook SAS</strong> — projet pédagogique présenté
          comme un site fictif.
          <br />
          Siège social : 1, place de la Loge, 66000 Perpignan, France.
          <br />
          SIREN&nbsp;: <span className="mono">FAKE-123456789</span> (fictif).
          <br />
          Capital social&nbsp;: 10&nbsp;000&nbsp;€.
        </p>
        <p>
          Directeur de la publication : Cengizhan Özbek.
          <br />
          Contact&nbsp;: <a href="mailto:contact@hookcook.fr">contact@hookcook.fr</a>
        </p>

        <h2>Hébergement</h2>
        <p>
          Application conteneurisée via Docker. Les conteneurs peuvent être
          déployés indifféremment sur AWS, OVH, Scaleway, ou tout
          fournisseur compatible. Pour la version de démonstration,
          hébergement local (réseau Docker) uniquement.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus du site (textes, visuels, photos de produits, charte
          graphique) sont la propriété de Hook &amp; Cook sauf mention contraire.
          Les fonds de carte proviennent d'OpenStreetMap France (ODbL) ; les
          données météo affichées sur la page d'accueil sont fournies par
          Open-Meteo (données libres).
        </p>

        <h2>Crédit typographique</h2>
        <p>
          Fraunces, Inter, JetBrains Mono — chargées depuis Google Fonts.
        </p>
      </>
    ),
  },

  cgv: {
    title: 'Conditions générales de vente',
    updated: '23 avril 2026',
    body: (
      <>
        <h2>1. Objet</h2>
        <p>
          Les présentes CGV régissent les ventes d'articles de pêche
          effectuées via le site Hook &amp; Cook. Toute commande implique
          l'acceptation sans réserve de ces conditions.
        </p>

        <h2>2. Commandes</h2>
        <p>
          Les commandes sont passées exclusivement en ligne depuis un compte
          client. La validation du panier puis du paiement déclenche la
          préparation et la confirmation par email.
        </p>

        <h2>3. Prix</h2>
        <p>
          Les prix sont indiqués en euros, TTC, hors frais de livraison.
          Hook &amp; Cook se réserve le droit d'ajuster les prix à tout
          moment&nbsp;; le prix appliqué est celui affiché au moment de la
          validation du panier.
        </p>
        <p>
          La TVA n'est pas applicable (art. 293 B du CGI) dans le cadre de
          cette version de démonstration.
        </p>

        <h2>4. Livraison</h2>
        <p>
          Livraison en France métropolitaine uniquement, sous 48 à 72 heures
          ouvrées pour Standard Colissimo, 24 heures pour Chronopost.
          Livraison offerte dès 120&nbsp;€ d'achat. Les risques sont
          transférés au client à la réception.
        </p>

        <h2>5. Droit de rétractation</h2>
        <p>
          Conformément au Code de la consommation, le client dispose de
          <strong> 30 jours</strong> à compter de la réception pour retourner
          un article non utilisé dans son emballage d'origine, frais de
          retour à la charge du client. Remboursement sous 14 jours.
        </p>

        <h2>6. Garantie</h2>
        <p>
          Les produits bénéficient de la garantie légale de conformité
          (2 ans, art. L.217-4 et suivants du Code de la consommation) et
          de la garantie contre les vices cachés (art. 1641 du Code civil).
        </p>

        <h2>7. Paiement</h2>
        <p>
          Paiement par carte bancaire (Visa, Mastercard, American Express)
          via <strong>Stripe</strong>, prestataire conforme PCI-DSS. Les
          données bancaires ne transitent pas par Hook &amp; Cook&nbsp;: la
          saisie se fait dans un champ Stripe sécurisé et seul un identifiant
          de transaction est conservé pour la facturation. La même passerelle
          est utilisée pour les commandes boutique, les permis et les
          inscriptions concours payantes.
        </p>

        <h2>8. Litiges</h2>
        <p>
          En cas de litige, compétence exclusive des tribunaux du ressort
          du siège social (Perpignan). Médiation préalable possible sur la
          plateforme européenne <a href="https://ec.europa.eu/consumers/odr">
            ec.europa.eu/consumers/odr</a>.
        </p>
      </>
    ),
  },

  'politique-confidentialite': {
    title: 'Politique de confidentialité',
    updated: '23 avril 2026',
    body: (
      <>
        <h2>Données collectées</h2>
        <p>
          Hook &amp; Cook collecte uniquement les données nécessaires à
          l'exécution du service&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Compte&nbsp;:</strong> email, nom, prénom, mot de passe
            (hashé BCrypt 12 rounds, jamais en clair).
          </li>
          <li>
            <strong>Livraison&nbsp;:</strong> adresse, téléphone, code
            postal, ville.
          </li>
          <li>
            <strong>Demandes de permis&nbsp;:</strong> date de naissance,
            département, pièces d'identité téléversées (accès restreint au
            demandeur + administration).
          </li>
          <li>
            <strong>Carnet de prise&nbsp;:</strong> espèce, taille, lieu,
            appât — visibles uniquement par l'utilisateur, sauf participation
            volontaire aux classements.
          </li>
        </ul>

        <h2>Finalités</h2>
        <p>
          Gestion de compte, traitement des commandes, instruction des
          demandes de permis, inscription aux concours, statistiques
          internes agrégées (anonymisées).
        </p>

        <h2>Conservation</h2>
        <p>
          Données de compte : conservées tant que le compte est actif, puis
          3 ans après la dernière connexion. Données de facturation : 10 ans
          (obligation légale). Pièces d'identité&nbsp;: supprimées dès la
          décision de la fédération.
        </p>

        <h2>Vos droits (RGPD)</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de
          rectification, d'effacement, de portabilité et d'opposition sur
          vos données.
        </p>
        <ul>
          <li>
            <strong>Accès et portabilité&nbsp;:</strong> téléchargez l'export
            JSON complet de vos données (profil, commandes, permis,
            inscriptions, carnet, favoris, avis) depuis{' '}
            <em>Mon compte → Paramètres → Exporter mes données</em>.
          </li>
          <li>
            <strong>Effacement&nbsp;:</strong> la suppression est immédiate
            depuis <em>Mon compte → Paramètres → Supprimer mon compte</em>.
            Vos favoris, alertes stock, carnet et avis sont supprimés ;
            permis et commandes sont anonymisés (tenue 10 ans des données de
            facturation par obligation légale).
          </li>
          <li>
            <strong>Rectification&nbsp;:</strong> nom, téléphone, adresse,
            modifiables depuis l'onglet Paramètres. Pour le changement
            d'adresse email, écrivez à{' '}
            <a href="mailto:contact@hookcook.fr">contact@hookcook.fr</a>.
          </li>
          <li>
            <strong>Question ou réclamation&nbsp;:</strong>{' '}
            <a href="mailto:contact@hookcook.fr">contact@hookcook.fr</a>,
            réponse sous 30 jours maximum.
          </li>
        </ul>

        <h2>Destinataires</h2>
        <p>
          Les données ne sont jamais vendues ni partagées avec des tiers,
          à l'exception&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> (Stripe Payments Europe Ltd.) pour le
            traitement des paiements&nbsp;: numéro de carte, détails de
            transaction. Hook &amp; Cook ne stocke qu'un identifiant de
            transaction.
          </li>
          <li>
            Notre fournisseur SMTP (envoi des emails transactionnels&nbsp;:
            confirmation de commande, décision de permis, réinitialisation
            de mot de passe…).
          </li>
          <li>
            De la Fédération départementale de pêche (Pyrénées-Orientales)
            pour les demandes de permis, et uniquement les informations
            requises par la réglementation.
          </li>
        </ul>

        <h2>Sécurité</h2>
        <p>
          Les mots de passe sont hashés avec BCrypt (12 rounds) et ne sont
          jamais stockés en clair. La session est portée par un jeton JWT
          côté navigateur. Les liens de réinitialisation de mot de passe
          envoyés par email sont à usage unique et expirent au bout d'une
          heure. Les webhooks Stripe sont vérifiés par signature HMAC.
        </p>

        <h2>Cookies</h2>
        <p>
          Voir la <a href="/legal/cookies">politique cookies</a>.
        </p>
      </>
    ),
  },

  cookies: {
    title: 'Politique cookies',
    updated: '23 avril 2026',
    body: (
      <>
        <h2>Qu'est-ce qu'un cookie&nbsp;?</h2>
        <p>
          Un cookie est un petit fichier stocké sur votre appareil lors de
          la visite d'un site web. Il permet notamment de se souvenir de
          vos préférences ou de vous identifier lors de visites suivantes.
        </p>

        <h2>Cookies utilisés par Hook &amp; Cook</h2>
        <p>
          Hook &amp; Cook <strong>ne pose aucun cookie de suivi</strong> ni
          de traceur tiers (pas de Google Analytics, Meta Pixel, etc.).
        </p>
        <p>Les seuls stockages utilisés sont techniques et nécessaires&nbsp;:</p>
        <ul>
          <li>
            <strong>localStorage&nbsp;:</strong> panier en cours, token de
            session, thème choisi (clair/sombre). Supprimable à tout moment
            en vidant les données du site dans votre navigateur.
          </li>
        </ul>
        <p>
          Aucun consentement explicite n'est requis puisque nous n'utilisons
          pas de cookies non essentiels. Cette politique sera mise à jour
          si le site venait à en utiliser.
        </p>
      </>
    ),
  },
};

export function LegalPage() {
  const { slug } = useParams();
  const entry = LEGAL[slug];

  if (!entry) {
    return (
      <div className="page">
        <div className="page-container" style={{ textAlign: 'center', padding: 'var(--sp-16) 0' }}>
          <h1>Page introuvable.</h1>
          <p className="soft">Aucune page légale ne correspond à ce lien.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 760 }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Informations légales · mis à jour le {entry.updated}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-44)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            margin: '0 0 var(--sp-6)',
          }}
        >
          {entry.title}
        </h1>
        <article className="legal-content">{entry.body}</article>
      </div>
    </div>
  );
}

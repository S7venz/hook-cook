import { useState } from 'react';
import { Badge } from './Badge.jsx';
import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';
import { useProductReviews } from '../../lib/reviews.js';

const REASON_LABELS = {
  not_logged_in: 'Connectez-vous pour laisser un avis.',
  not_purchased: 'Seuls les clients ayant acheté ce produit peuvent laisser un avis.',
  already_reviewed: 'Vous avez déjà laissé un avis sur ce produit.',
  unknown: 'Impossible de vérifier votre éligibilité.',
};

function Stars({ value, onChange, readOnly = false, size = 18 }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }} role={readOnly ? 'img' : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={readOnly ? undefined : () => onChange?.(n)}
          disabled={readOnly}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          style={{
            background: 'transparent',
            padding: 2,
            cursor: readOnly ? 'default' : 'pointer',
            border: 'none',
            color: n <= value ? 'var(--accent)' : 'var(--ink-mute)',
          }}
        >
          <Icon name="star" size={size} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ onSubmit, submitting }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!comment.trim() || comment.trim().length < 10) {
      setError('Commentaire trop court (10 caractères minimum).');
      return;
    }
    try {
      await onSubmit({ rating, title: title.trim() || null, comment: comment.trim() });
      setRating(5);
      setTitle('');
      setComment('');
    } catch (err) {
      setError(err?.message ?? 'Erreur lors de l\'envoi de l\'avis.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}
    >
      <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
        Votre avis
      </div>
      <div className="field" style={{ marginBottom: 'var(--sp-3)' }}>
        <label>Note</label>
        <Stars value={rating} onChange={setRating} size={24} />
      </div>
      <div className="field" style={{ marginBottom: 'var(--sp-3)' }}>
        <label>Titre (facultatif)</label>
        <input
          className="input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Un résumé en une phrase"
        />
      </div>
      <div className="field" style={{ marginBottom: 'var(--sp-3)' }}>
        <label>
          Commentaire<span className="req">*</span>
        </label>
        <textarea
          className="textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Qu'avez-vous pensé du produit en conditions réelles ?"
        />
        <div className="hint">{comment.length}/2000 caractères · 10 minimum</div>
      </div>
      {error && <div className="error" style={{ marginBottom: 'var(--sp-3)' }}>{error}</div>}
      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? 'Envoi…' : 'Publier mon avis'}
      </Button>
    </form>
  );
}

function ReviewCard({ review }) {
  const date = review.createdAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(review.createdAt))
    : '';
  const authorLabel = review.author
    ? `${review.author.firstName ?? ''} ${review.author.lastName ?? ''}`.trim()
    : 'Anonyme';
  return (
    <article
      className="card"
      style={{ padding: 'var(--sp-4) var(--sp-5)', marginBottom: 'var(--sp-3)' }}
    >
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}
      >
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <Stars value={review.rating} readOnly size={14} />
          {review.verifiedPurchase && <Badge status="approved">Achat vérifié</Badge>}
        </div>
        <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
          {date}
        </div>
      </div>
      {review.title && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-18)',
            marginBottom: 'var(--sp-2)',
          }}
        >
          {review.title}
        </div>
      )}
      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{review.comment}</p>
      <div
        className="mono soft"
        style={{ fontSize: 'var(--fs-12)', marginTop: 'var(--sp-2)' }}
      >
        — {authorLabel}
      </div>
    </article>
  );
}

export function ReviewsPanel({ productId }) {
  const { reviews, eligibility, loading, submit } = useProductReviews(productId);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await submit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div>
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
          alignItems: 'baseline',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-24)',
              fontWeight: 500,
            }}
          >
            {avg ? `${avg}/5` : 'Aucun avis pour l\'instant'}
          </div>
          {reviews.length > 0 && (
            <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
              {reviews.length} avis · achat vérifié
            </div>
          )}
        </div>
        {avg && <Stars value={Math.round(Number(avg))} readOnly size={20} />}
      </div>

      {eligibility.eligible ? (
        <ReviewForm onSubmit={handleSubmit} submitting={submitting} />
      ) : (
        <div
          className="card"
          style={{
            padding: 'var(--sp-4)',
            marginBottom: 'var(--sp-5)',
            fontSize: 'var(--fs-13)',
            color: 'var(--ink-soft)',
          }}
        >
          {REASON_LABELS[eligibility.reason] ?? REASON_LABELS.unknown}
        </div>
      )}

      {loading ? (
        <p className="soft">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="soft">
          Pas encore d'avis publié. Soyez le premier à partager votre retour après achat.
        </p>
      ) : (
        reviews.map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}

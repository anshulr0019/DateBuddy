'use client';

import { SafeImage } from '../../components/shared';
import { Ic } from '../../components/icons';
import type { FeedProfile } from '../../lib/feedCache';
import styles from '../discover.module.css';

interface Props {
  profile: FeedProfile;
  photoIndex: number;
  onPhotoChange: (index: number) => void;
  onSafety: () => void;
  likedPrompts: Record<string, boolean>;
  onPromptLike: (key: string) => void;
  disabled: boolean;
  /* Opens the full profile; omitted for the decorative under-card. */
  onOpenDetail?: () => void;
  /* True while this card's photo should morph into the detail hero. */
  sharedPhoto?: boolean;
}

export default function DiscoverProfileCard({ profile, photoIndex, onPhotoChange, onSafety, likedPrompts, onPromptLike, disabled, onOpenDetail, sharedPhoto = false }: Props) {
  const firstPromptIndex = profile.prompts.findIndex(p => p.a.trim());
  const prompt = profile.prompts[firstPromptIndex];
  const excerpt = prompt?.a || profile.bio?.trim();
  // Background refreshes can replace a profile with fewer photos.
  const visiblePhotoIndex = Math.min(photoIndex, Math.max(0, profile.photos.length - 1));
  const changePhoto = (delta: number) => {
    if (!disabled && profile.photos.length > 1) onPhotoChange((visiblePhotoIndex + delta + profile.photos.length) % profile.photos.length);
  };
  return <article className={styles.profileCard} aria-label={`${profile.name}'s profile`}>
    <div className={styles.portrait}>
      <SafeImage key={`${profile.id}-${visiblePhotoIndex}`} eager src={profile.photos[visiblePhotoIndex]} name={profile.name}
        alt={`${profile.name}, photo ${visiblePhotoIndex + 1} of ${profile.photos.length}`} className={styles.photo}
        style={sharedPhoto ? { viewTransitionName: 'discover-photo' } as React.CSSProperties : undefined}
        onClick={profile.photos.length > 1 ? e => { const r = e.currentTarget.getBoundingClientRect(); changePhoto(e.clientX - r.left > r.width / 2 ? 1 : -1); } : undefined} />
      {profile.photos.length > 1 && <>
        <div className={styles.photoProgress} aria-hidden="true">{profile.photos.map((_, i) => <span key={i} data-active={i === visiblePhotoIndex} />)}</div>
        {/* Touch users tap the photo halves; these stay for keyboard and screen readers. */}
        <button className={`${styles.photoArrow} ${styles.previous}`} disabled={disabled} onClick={() => changePhoto(-1)} aria-label="Previous photo"><Ic.ChevUp /></button>
        <button className={`${styles.photoArrow} ${styles.next}`} disabled={disabled} onClick={() => changePhoto(1)} aria-label="Next photo"><Ic.ChevUp /></button>
      </>}
      {profile.online && <span className={styles.online}><span />Active now</span>}
      <button className={styles.safety} disabled={disabled} onClick={onSafety} aria-label={`Report or block ${profile.name}`}><Ic.Dots /></button>
      <div className={styles.identity}>
        <div className={styles.nameRow}><h2 aria-label={`${profile.name}${profile.age ? `, ${profile.age}` : ''}`}><span className={styles.profileName}>{profile.name}</span>{profile.age ? <span className={styles.age}>, {profile.age}</span> : null}</h2>{profile.verified && <span className={styles.verified} role="img" aria-label="Verified profile"><Ic.Check /></span>}</div>
        {(profile.distance || profile.city) && <p><Ic.MapPin /><span>{[profile.distance, profile.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}</span></p>}
      </div>
    </div>
    <div className={styles.preview}>
      {excerpt ? <>
        <div className={styles.excerptLabel}><span>{prompt?.q || 'A little about me'}</span>{prompt && <button disabled={disabled} aria-label={`Like ${profile.name}'s answer to "${prompt.q}"`} aria-pressed={Boolean(likedPrompts[`${profile.id}-${firstPromptIndex}`])} onClick={() => onPromptLike(`${profile.id}-${firstPromptIndex}`)}><Ic.Heart filled={Boolean(likedPrompts[`${profile.id}-${firstPromptIndex}`])} /></button>}</div>
        <p className={styles.excerpt}>{excerpt}</p>
      </> : profile.tags.length ? <><span className={styles.eyebrow}>A few things I love</span><p className={styles.excerpt}>{profile.tags.slice(0, 3).join(' · ')}</p></> : <p className={styles.excerpt}>There’s more to someone than a first impression.</p>}
      {onOpenDetail && <button className={styles.viewProfile} onClick={onOpenDetail} disabled={disabled} aria-haspopup="dialog">View full profile <Ic.ChevUp /></button>}
    </div>
  </article>;
}

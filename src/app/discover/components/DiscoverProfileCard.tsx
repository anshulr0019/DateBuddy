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
}

export default function DiscoverProfileCard({ profile, photoIndex, onPhotoChange, onSafety, likedPrompts, onPromptLike, disabled }: Props) {
  const firstPromptIndex = profile.prompts.findIndex(p => p.a.trim());
  const prompt = profile.prompts[firstPromptIndex];
  const excerpt = prompt?.a || profile.bio?.trim();
  // Whatever is shown under the photo isn't repeated further down.
  const bioInExcerpt = !prompt && Boolean(profile.bio?.trim());
  const morePrompts = profile.prompts.map((p, i) => ({ ...p, i })).filter(p => p.a.trim() && p.i !== firstPromptIndex);

  // Background refreshes can replace a profile with fewer photos.
  const visiblePhotoIndex = Math.min(photoIndex, Math.max(0, profile.photos.length - 1));
  const changePhoto = (delta: number) => {
    if (!disabled && profile.photos.length > 1) onPhotoChange((visiblePhotoIndex + delta + profile.photos.length) % profile.photos.length);
  };
  return <article className={styles.profileCard} aria-label={`${profile.name}'s profile`}>
    <div className={styles.portrait}>
      <SafeImage key={`${profile.id}-${visiblePhotoIndex}`} eager src={profile.photos[visiblePhotoIndex]} name={profile.name}
        alt={`${profile.name}, photo ${visiblePhotoIndex + 1} of ${profile.photos.length}`} className={styles.photo}
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
    </div>
    <div className={styles.details}>
      {profile.bio?.trim() && !bioInExcerpt && <section><h3>About {profile.name}</h3><p>{profile.bio}</p></section>}
      {profile.tags.length > 0 && <section><h3>Things we could talk about</h3><div className={styles.tags}>{profile.tags.map(tag => <span key={tag}>{tag}</span>)}</div></section>}
      {morePrompts.length > 0 && <section><h3>A little more personality</h3><div className={styles.prompts}>{morePrompts.map(p => <div key={p.i} className={styles.prompt}>
        <div><span>{p.q}</span><p>{p.a}</p></div><button disabled={disabled} aria-label={`Like ${profile.name}'s answer to "${p.q}"`} aria-pressed={Boolean(likedPrompts[`${profile.id}-${p.i}`])} onClick={() => onPromptLike(`${profile.id}-${p.i}`)}><Ic.Heart filled={Boolean(likedPrompts[`${profile.id}-${p.i}`])} /></button>
      </div>)}</div></section>}
      <div className={styles.safetyFooter}><span>{profile.verified ? 'Verified profile' : 'Take your time. Trust your instincts.'}</span><button disabled={disabled} onClick={onSafety}>Report or block</button></div>
    </div>
  </article>;
}

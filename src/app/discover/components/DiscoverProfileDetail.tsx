'use client';

import { useEffect, useRef } from 'react';
import { SafeImage } from '../../components/shared';
import { Ic } from '../../components/icons';
import type { FeedProfile } from '../../lib/feedCache';
import styles from '../discover.module.css';

interface Props {
  profile: FeedProfile;
  photoIndex: number;
  onPhotoChange: (index: number) => void;
  onClose: () => void;
  onPass: () => void;
  onLike: () => void;
  onSafety: () => void;
  likedPrompts: Record<string, boolean>;
  onPromptLike: (key: string) => void;
}

/*
  Full profile, opened from a Discover card. The hero photo shares a
  view-transition-name with the card's photo so the browser morphs one
  into the other (see openDetail in page.tsx).
*/
export default function DiscoverProfileDetail({ profile, photoIndex, onPhotoChange, onClose, onPass, onLike, onSafety, likedPrompts, onPromptLike }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const visibleIndex = Math.min(photoIndex, Math.max(0, profile.photos.length - 1));
  const multiple = profile.photos.length > 1;
  const changePhoto = (delta: number) => {
    if (multiple) onPhotoChange((visibleIndex + delta + profile.photos.length) % profile.photos.length);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, []);

  const prompts = profile.prompts.map((p, i) => ({ ...p, i })).filter((p) => p.a.trim());
  const place = [profile.distance, profile.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ');

  return (
    <div className={styles.detailRoot} role="dialog" aria-modal="true" aria-label={`${profile.name}'s full profile`}>
      <div className={styles.detailScroll}>
        <div className={styles.detailHero}>
          <div className={styles.detailPhoto}>
            <SafeImage key={`${profile.id}-${visibleIndex}`} eager src={profile.photos[visibleIndex]} name={profile.name}
              alt={`${profile.name}, photo ${visibleIndex + 1} of ${profile.photos.length}`} className={styles.photo}
              style={{ viewTransitionName: 'discover-photo' } as React.CSSProperties}
              onClick={multiple ? (e) => { const r = e.currentTarget.getBoundingClientRect(); changePhoto(e.clientX - r.left > r.width / 2 ? 1 : -1); } : undefined} />
          </div>
          {multiple && <div className={styles.photoProgress} aria-hidden="true">{profile.photos.map((_, i) => <span key={i} data-active={i === visibleIndex} />)}</div>}
          {multiple && <>
            <button className={`${styles.photoArrow} ${styles.previous}`} onClick={() => changePhoto(-1)} aria-label="Previous photo"><Ic.ChevUp /></button>
            <button className={`${styles.photoArrow} ${styles.next}`} onClick={() => changePhoto(1)} aria-label="Next photo"><Ic.ChevUp /></button>
          </>}
          <button ref={closeRef} className={styles.detailClose} onClick={onClose} aria-label="Close full profile">
            <Ic.ChevDown className={styles.actionIcon} />
          </button>
          <button className={styles.detailSafety} onClick={onSafety} aria-label={`Report or block ${profile.name}`}>
            <Ic.Dots />
          </button>
        </div>

        <div className={styles.detailBody}>
          <div className={styles.detailName}>
            <h2>
              <span>{profile.name}</span>{profile.age ? <span className={styles.age}>, {profile.age}</span> : null}
              {profile.verified && <span className={`${styles.verified} ${styles.detailVerified}`} role="img" aria-label="Verified profile"><Ic.Check /></span>}
            </h2>
          </div>
          {place && <p className={styles.detailPlace}><Ic.MapPin /><span>{place}</span></p>}
          {profile.online && <p className={styles.detailOnline}><span aria-hidden="true" />Active now</p>}

          <div className={styles.details}>
            {profile.bio?.trim() && <section><h3>About {profile.name}</h3><p>{profile.bio}</p></section>}
            {profile.tags.length > 0 && <section><h3>Things we could talk about</h3><div className={styles.tags}>{profile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></section>}
            {prompts.length > 0 && <section><h3>A little more personality</h3><div className={styles.prompts}>{prompts.map((p) => (
              <div key={p.i} className={styles.prompt}>
                <div><span>{p.q}</span><p>{p.a}</p></div>
                <button aria-label={`Like ${profile.name}'s answer to "${p.q}"`} aria-pressed={Boolean(likedPrompts[`${profile.id}-${p.i}`])}
                  onClick={() => onPromptLike(`${profile.id}-${p.i}`)}><Ic.Heart filled={Boolean(likedPrompts[`${profile.id}-${p.i}`])} /></button>
              </div>
            ))}</div></section>}
            <div className={styles.safetyFooter}>
              <span>{profile.verified ? 'Verified profile' : 'Take your time. Trust your instincts.'}</span>
              <button onClick={onSafety}>Report or block</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.detailActions} role="group" aria-label={`Decide on ${profile.name}`}>
        <button className={styles.roundAction} onClick={onPass} aria-label={`Pass on ${profile.name}`}>
          <Ic.X className={styles.actionIconLarge} />
        </button>
        <button className={styles.like} onClick={onLike}>
          <Ic.Heart filled /> <span>Like {profile.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  );
}

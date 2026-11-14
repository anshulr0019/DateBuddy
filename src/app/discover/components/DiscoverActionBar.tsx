'use client';

import { Ic } from '../../components/icons';
import styles from '../discover.module.css';

interface Props {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
  undoBusy: boolean;
  disabled: boolean;
}
export default function DiscoverActionBar({ onPass, onLike, onSuperLike, onUndo, canUndo, undoBusy, disabled }: Props) {
  return <div className={styles.actionBar} role="group" aria-label="Profile actions">
    <button className={`${styles.roundAction} ${styles.roundSmall}`} onClick={onUndo} disabled={!canUndo || disabled || undoBusy}
      aria-label={undoBusy ? 'Undoing last decision' : 'Undo last decision'} title="Undo">
      <Ic.Undo className={styles.actionIcon} />
    </button>
    <button className={styles.roundAction} onClick={onPass} disabled={disabled} aria-label="Pass" title="Pass">
      <Ic.X className={styles.actionIconLarge} />
    </button>
    <button className={styles.like} onClick={onLike} disabled={disabled}>
      <Ic.Heart filled /> <span>Like</span>
    </button>
    <button className={`${styles.roundAction} ${styles.roundSmall} ${styles.superAction}`} onClick={onSuperLike} disabled={disabled}
      aria-label="Super Like" title="Super Like">
      <Ic.Star className={styles.actionIcon} />
    </button>
  </div>;
}

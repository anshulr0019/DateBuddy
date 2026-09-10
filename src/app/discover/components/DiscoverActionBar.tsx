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
  return <div className={styles.actionBar} aria-label="Profile actions">
    <button className={styles.secondaryAction} onClick={onUndo} disabled={!canUndo || disabled || undoBusy} aria-label="Undo last decision"><span aria-hidden="true">↶</span><span>{undoBusy ? 'Undoing…' : 'Undo'}</span></button>
    <button className={styles.pass} onClick={onPass} disabled={disabled}><span aria-hidden="true">×</span> Pass</button>
    <button className={styles.like} onClick={onLike} disabled={disabled}><Ic.Heart filled /> Like</button>
    <button className={styles.secondaryAction} onClick={onSuperLike} disabled={disabled} aria-label="Super Like"><span aria-hidden="true">☆</span><span>Super Like</span></button>
  </div>;
}

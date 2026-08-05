import Image from 'next/image';
import logoMark from '../../../public/brand/logo-mark.png';

export const BRAND_NAME = 'DateBuddy';

/** Mark aspect ratio from the source asset (1024 x 784). */
const MARK_RATIO = 784 / 1024;

type BrandLogoProps = {
  /** Rendered mark width in px. */
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  /** Set on above-the-fold usages (splash) to preload the mark. */
  priority?: boolean;
};

/**
 * Single source of truth for app branding. Renders the transparent heart
 * mark (public/brand/logo-mark.png) with an optional live-text wordmark —
 * never a baked-in image wordmark, so it works on light and dark surfaces.
 * Regenerate the underlying assets with: node scripts/process-logo.mjs
 */
export default function BrandLogo({
  size = 32,
  withWordmark = false,
  className = '',
  wordmarkClassName = 'text-[15px] font-semibold tracking-tight',
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={logoMark}
        alt={withWordmark ? '' : BRAND_NAME}
        width={size}
        height={Math.round(size * MARK_RATIO)}
        priority={priority}
        style={{ width: size, height: 'auto' }}
      />
      {withWordmark && <span className={wordmarkClassName}>{BRAND_NAME}</span>}
    </span>
  );
}

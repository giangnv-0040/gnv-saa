import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LoginButton } from './LoginButton';

interface LoginHeroProps {
  redirectTo: string;
}

/**
 * Hero block on the Login screen: brand key visual + welcome copy + CTA.
 *
 * Layout matches Figma frame `GzbNeVGJHz` (1440×1024):
 * - Hero artwork (`mms_B.1_Key Visual` — "ROOT FURTHER" letterforms) anchored
 *   in the upper-left of the content area, scaled to ~580–680px wide on
 *   desktop, fluid on smaller viewports.
 * - Welcome copy (Montserrat 700 / 20px / 40px line-height) sits beneath the
 *   key visual, left-aligned at desktop, centered on mobile.
 * - CTA sits below the copy with a 40px gap (--gap-login-cta).
 *
 * NOTE: The decorative organic background shape (`mms_C_Keyvisual` → `image 1`
 * at node `662:14389`) is an embedded vector inside Figma — it is NOT exported
 * as a MM_MEDIA_* asset. The page background is currently a solid color from
 * `--color-hero-background`. Once the design team exports that image, drop it
 * into `public/assets/login/key-visual-bg.png` and add it as a CSS
 * `background-image` on the page wrapper.
 */
export function LoginHero({ redirectTo }: LoginHeroProps) {
  const t = useTranslations('login');
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center px-6 py-12 sm:px-12 lg:px-20">
      <div className="flex w-full max-w-[680px] flex-col items-start gap-10">
        <Image
          src="/assets/login/key-visual.png"
          alt=""
          width={451}
          height={200}
          priority
          sizes="(max-width: 640px) 90vw, 580px"
          className="h-auto w-full max-w-[580px] select-none"
        />

        <p
          className="max-w-[520px] select-none text-xl font-bold leading-[40px] tracking-[0.5px]"
          aria-label={`${t('welcome.line1')} ${t('welcome.line2')}`}
        >
          {t('welcome.line1')}
          <br />
          {t('welcome.line2')}
        </p>

        <LoginButton redirectTo={redirectTo} />
      </div>
    </section>
  );
}

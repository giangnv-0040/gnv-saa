import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PrelaunchBackground } from '@/components/atoms/PrelaunchBackground';

describe('<PrelaunchBackground>', () => {
  it('renders the hero artwork as a priority next/image with decorative alt=""', () => {
    const { container } = render(<PrelaunchBackground />);
    const img = container.querySelector('img[data-testid="prelaunch-bg"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden');
    // next/image rewrites src through its /_next/image proxy with the source
    // path URL-encoded inside `?url=...`.
    const src = img!.getAttribute('src') ?? img!.getAttribute('srcset') ?? '';
    expect(decodeURIComponent(src)).toContain('/assets/prelaunch/hero-bg.png');
  });

  it('renders the cover gradient overlay using the --bg-prelaunch-cover token', () => {
    const { container } = render(<PrelaunchBackground />);
    const overlay = container.querySelector('div[aria-hidden]');
    expect(overlay).toBeInTheDocument();
    expect((overlay as HTMLElement).style.background).toContain('var(--bg-prelaunch-cover)');
  });
});

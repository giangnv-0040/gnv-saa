import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeartButton } from '@/components/molecules/kudos-board/HeartButton';
import { wrapKudos } from '@/tests/helpers/render-kudos';

const KUDO_ID = '11111111-1111-4111-9111-111111111111';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/kudos',
}));

beforeEach(() => {
  pushMock.mockReset();
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ heartsCount: 1 }), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('<HeartButton>', () => {
  it('renders the count + initial pressed state', () => {
    render(wrapKudos(<HeartButton kudoId={KUDO_ID} count={42} liked />));
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent('42');
  });

  it('is disabled with aria-disabled when isOwn=true', () => {
    render(wrapKudos(<HeartButton kudoId={KUDO_ID} count={3} liked={false} isOwn />));
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('redirects to /login when the viewer is anonymous (FR-013)', async () => {
    render(
      wrapKudos(<HeartButton kudoId={KUDO_ID} count={1} liked={false} isAuthenticated={false} />),
    );
    await userEvent.click(screen.getByRole('button'));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0]![0]).toMatch(/\/login\?redirectTo=%2Fkudos$/);
  });

  it('fires POST when the viewer likes a kudo', async () => {
    render(wrapKudos(<HeartButton kudoId={KUDO_ID} count={0} liked={false} />));
    await userEvent.click(screen.getByRole('button'));
    expect(fetch).toHaveBeenCalledWith(
      `/api/kudos/${KUDO_ID}/like`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fires DELETE when the viewer un-likes a kudo', async () => {
    render(wrapKudos(<HeartButton kudoId={KUDO_ID} count={1} liked />));
    await userEvent.click(screen.getByRole('button'));
    expect(fetch).toHaveBeenCalledWith(
      `/api/kudos/${KUDO_ID}/like`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('debounces rapid double-clicks (FR-006)', async () => {
    render(wrapKudos(<HeartButton kudoId={KUDO_ID} count={0} liked={false} />));
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

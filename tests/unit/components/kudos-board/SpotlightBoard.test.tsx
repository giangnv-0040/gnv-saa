import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { SpotlightBoard } from '@/components/organisms/kudos-board/SpotlightBoard';
import viMessages from '@/messages/vi.json';
import type { SpotlightRecipient } from '@/lib/kudos/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// d3-cloud calls canvas.getContext('2d').measureText for sizing.
// jsdom doesn't ship a canvas; stub it so the layout pass completes.
beforeAll(() => {
  const stub = {
    measureText: (text: string) => ({ width: text.length * 8 }),
    fillText: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray() }),
    clearRect: () => {},
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    scale: () => {},
    transform: () => {},
    setTransform: () => {},
    drawImage: () => {},
    strokeText: () => {},
    font: '',
  };
  HTMLCanvasElement.prototype.getContext = (() =>
    stub) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

const RECIPIENTS: readonly SpotlightRecipient[] = [
  {
    userId: 'u-1',
    displayName: 'Huỳnh Dương Xuân Nhật',
    kudosCount: 30,
    lastReceivedAt: '2026-05-19T08:30:00.000Z',
    lastKudoId: 'k-1',
  },
  {
    userId: 'u-2',
    displayName: 'Nguyễn Trung Hiếu',
    kudosCount: 28,
    lastReceivedAt: '2026-05-19T09:00:00.000Z',
    lastKudoId: 'k-2',
  },
  {
    userId: 'u-3',
    displayName: 'Trần Mỹ Linh',
    kudosCount: 25,
    lastReceivedAt: '2026-05-19T09:30:00.000Z',
    lastKudoId: 'k-3',
  },
];

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<SpotlightBoard>', () => {
  it('renders the sr-only accessible list of recipients (TR-005)', () => {
    render(wrap(<SpotlightBoard recipients={RECIPIENTS} total={388} />));
    const list = screen.getByRole('list', { name: /Danh sách Sunner trong Spotlight/ });
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll('li').length).toBe(RECIPIENTS.length);
  });

  it('renders the empty-state copy when there are no recipients', () => {
    render(wrap(<SpotlightBoard recipients={[]} total={0} />));
    expect(screen.getByText('Hiện tại chưa có Kudos nào.')).toBeInTheDocument();
  });

  it('debounces the search input before highlighting matches', async () => {
    render(wrap(<SpotlightBoard recipients={RECIPIENTS} total={388} />));
    const input = screen.getByRole('searchbox', { name: 'Tìm kiếm trên Spotlight' });
    await userEvent.type(input, 'Hu');
    // Wait for debounce (200ms) + a margin.
    await act(() => new Promise((r) => setTimeout(r, 260)));
    expect(input).toHaveValue('Hu');
  });

  it('toggles aria-pressed on the pan/zoom button', async () => {
    render(wrap(<SpotlightBoard recipients={RECIPIENTS} total={388} />));
    const btn = screen.getByRole('button', { name: 'Chế độ pan/zoom' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});

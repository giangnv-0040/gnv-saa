import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { RecipientCombobox } from '@/components/molecules/write-kudo/RecipientCombobox';
import { MOCK_RECIPIENTS } from '@/lib/kudos/mock';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<RecipientCombobox>', () => {
  it('renders the localized label and combobox with placeholder', () => {
    render(
      wrap(<RecipientCombobox recipients={MOCK_RECIPIENTS} value={null} onChange={() => {}} />),
    );
    expect(screen.getByText('Người nhận')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Tìm kiếm');
  });

  it('filters suggestions as the user types', async () => {
    render(
      wrap(<RecipientCombobox recipients={MOCK_RECIPIENTS} value={null} onChange={() => {}} />),
    );
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'Nhật');
    expect(await screen.findByText(/Huỳnh Dương Xuân Nhật/)).toBeInTheDocument();
    // A teammate with a different name must NOT match a name-specific query.
    expect(screen.queryByText(/Trần Mỹ Linh/)).not.toBeInTheDocument();
  });

  it('calls onChange with the recipient id when an option is selected', async () => {
    const onChange = vi.fn();
    render(
      wrap(<RecipientCombobox recipients={MOCK_RECIPIENTS} value={null} onChange={onChange} />),
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByText(/Huỳnh Dương Xuân Nhật/));
    expect(onChange).toHaveBeenCalledWith('u-nhat');
  });

  it('marks the input as invalid when an error is passed', () => {
    render(
      wrap(
        <RecipientCombobox
          recipients={MOCK_RECIPIENTS}
          value={null}
          onChange={() => {}}
          error="Vui lòng chọn người nhận."
        />,
      ),
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng chọn người nhận.');
  });
});

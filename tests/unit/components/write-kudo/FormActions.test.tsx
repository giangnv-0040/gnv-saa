import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { FormActions } from '@/components/molecules/write-kudo/FormActions';
import viMessages from '@/messages/vi.json';

function wrap(ui: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('<FormActions>', () => {
  it('renders Hủy and Gửi buttons with localized labels', () => {
    render(wrap(<FormActions onCancel={() => {}} onSubmit={() => {}} />));
    expect(screen.getByRole('button', { name: /Hủy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gửi$/ })).toBeInTheDocument();
  });

  it('calls onCancel when Hủy is clicked', async () => {
    const onCancel = vi.fn();
    render(wrap(<FormActions onCancel={onCancel} onSubmit={() => {}} />));
    await userEvent.click(screen.getByRole('button', { name: /Hủy/ }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onSubmit when Gửi is clicked', async () => {
    const onSubmit = vi.fn();
    render(wrap(<FormActions onCancel={() => {}} onSubmit={onSubmit} />));
    await userEvent.click(screen.getByRole('button', { name: /Gửi$/ }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('disables Gửi when submitDisabled is true', () => {
    render(wrap(<FormActions onCancel={() => {}} onSubmit={() => {}} submitDisabled />));
    expect(screen.getByRole('button', { name: /Gửi$/ })).toBeDisabled();
  });

  it('shows the submitting label and disables Gửi when submitting is true', () => {
    render(wrap(<FormActions onCancel={() => {}} onSubmit={() => {}} submitting />));
    expect(screen.getByRole('button', { name: /Đang gửi/ })).toBeDisabled();
  });
});

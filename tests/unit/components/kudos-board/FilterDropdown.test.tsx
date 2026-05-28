import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDropdown } from '@/components/molecules/kudos-board/FilterDropdown';

const OPTIONS = [
  { value: 'cevc1', label: 'CEVC1' },
  { value: 'design', label: 'Design' },
];

describe('<FilterDropdown>', () => {
  it('renders the label closed by default', () => {
    render(
      <FilterDropdown
        label="Phòng ban"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        clearLabel="Bỏ chọn"
      />,
    );
    const btn = screen.getByRole('button', { name: 'Phòng ban' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('opens the listbox on click and lists every option + the clear row', async () => {
    render(
      <FilterDropdown
        label="Phòng ban"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        clearLabel="Bỏ chọn"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Phòng ban' }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bỏ chọn' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CEVC1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Design' })).toBeInTheDocument();
  });

  it('emits the selected value and closes the popup', async () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="Phòng ban"
        options={OPTIONS}
        value={null}
        onChange={onChange}
        clearLabel="Bỏ chọn"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Phòng ban' }));
    await userEvent.click(screen.getByRole('option', { name: 'Design' }));
    expect(onChange).toHaveBeenCalledWith('design');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('emits null when the clear row is picked', async () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        label="Phòng ban"
        options={OPTIONS}
        value="design"
        onChange={onChange}
        clearLabel="Bỏ chọn"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /CEVC1|Design|Phòng ban/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Bỏ chọn' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('closes on Escape', async () => {
    render(
      <FilterDropdown
        label="Phòng ban"
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        clearLabel="Bỏ chọn"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Phòng ban' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

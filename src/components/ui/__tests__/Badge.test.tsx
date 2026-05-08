import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders with label', () => {
    render(<Badge label="Actif" />);
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge label="Default" />);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-emerald-100');
  });

  it('applies success variant', () => {
    render(<Badge label="Succès" variant="success" />);
    const badge = screen.getByText('Succès');
    expect(badge).toHaveClass('bg-emerald-100');
  });

  it('applies danger variant', () => {
    render(<Badge label="Danger" variant="danger" />);
    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-rose-100');
  });

  it('applies warning variant', () => {
    render(<Badge label="Warning" variant="warning" />);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-amber-100');
  });

  it('applies info variant', () => {
    render(<Badge label="Info" variant="info" />);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-cyan-100');
  });

  it('applies neutral variant', () => {
    render(<Badge label="Neutral" variant="neutral" />);
    const badge = screen.getByText('Neutral');
    expect(badge).toHaveClass('bg-gray-100');
  });

  it('applies small size', () => {
    render(<Badge label="Small" size="sm" />);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies medium size by default', () => {
    render(<Badge label="Medium" />);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5');
  });

  it('accepts custom className', () => {
    render(<Badge label="Custom" className="ml-4" />);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('ml-4');
  });
});

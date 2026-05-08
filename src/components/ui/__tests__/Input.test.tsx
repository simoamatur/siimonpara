import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" placeholder="test@email.com" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input placeholder="No label" />);
    expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-rose-300');
  });

  it('renders icon when provided', () => {
    render(<Input label="Search" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input label="Custom" className="w-full max-w-md" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('max-w-md');
  });

  it('forwards input props', () => {
    render(<Input label="Password" type="password" placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });
});

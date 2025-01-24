import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormValidationErrors } from '../../FormValidationErrors';

describe('FormValidationErrors', () => {
  it('renders nothing when there are no errors', () => {
    render(<FormValidationErrors errors={[]} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a single error message', () => {
    render(<FormValidationErrors errors={['Test error']} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders multiple error messages', () => {
    const errors = ['Error 1', 'Error 2', 'Error 3'];
    render(<FormValidationErrors errors={errors} />);
    errors.forEach(error => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  it('renders errors in a styled container', () => {
    render(<FormValidationErrors errors={['Test error']} />);
    const container = screen.getByRole('list').closest('div');
    expect(container).not.toBeNull();
    expect(container).toHaveClass('text-sm', 'text-red-600');
    expect(screen.getByRole('list')).toHaveClass('list-disc', 'pl-5', 'space-y-1');
  });
}); 
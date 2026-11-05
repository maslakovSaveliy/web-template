import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('uses the label as the accessible name', () => {
    render(<TextField label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email');
  });

  it('links hint and error through aria-describedby and marks invalid', () => {
    render(<TextField label="Email" hint="We never share it" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/We never share it/);
    expect(input).toHaveAccessibleDescription(/Enter a valid email/);
  });

  it('is not marked invalid without an error', () => {
    render(<TextField label="Name" />);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('renders a textarea when multiline', () => {
    render(<TextField label="Message" multiline />);
    expect(screen.getByLabelText('Message').tagName).toBe('TEXTAREA');
  });
});

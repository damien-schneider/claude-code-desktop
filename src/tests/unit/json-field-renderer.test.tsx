import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonFieldRenderer } from '@/renderer/components/Settings/json-field-renderer';

describe('JsonFieldRenderer', () => {
  it('should render string field with input', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="test_field"
        value="hello"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('hello');
  });

  it('should render boolean field with switch', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="enabled"
        value={true}
        onChange={handleChange}
      />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
  });

  it('should call onChange when string input changes', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="name"
        value="old"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new' } });

    expect(handleChange).toHaveBeenCalledWith('new');
  });

  it('should render secret field with password input', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="api_token"
        value="secret123"
        onChange={handleChange}
      />
    );

    const input = screen.getByDisplayValue('secret123');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render object field with nested fields', () => {
    const handleChange = vi.fn();
    render(
      <JsonFieldRenderer
        fieldKey="config"
        value={{ host: 'localhost', port: 8080 }}
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Port')).toBeInTheDocument();
  });
});

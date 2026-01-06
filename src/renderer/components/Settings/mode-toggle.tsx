import React from 'react';
import { Button } from '@/components/ui/button';
import { EditorMode } from './settings-types';

interface ModeToggleProps {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
}

/**
 * Toggle between Form and JSON editing modes
 */
export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-md inline-flex">
      <Button
        size="sm"
        variant={mode === 'form' ? 'default' : 'ghost'}
        onClick={() => onChange('form')}
        className="flex-1"
      >
        Form
      </Button>
      <Button
        size="sm"
        variant={mode === 'json' ? 'default' : 'ghost'}
        onClick={() => onChange('json')}
        className="flex-1"
      >
        JSON
      </Button>
    </div>
  );
};

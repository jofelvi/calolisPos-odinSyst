// SOLID: Single Responsibility - Reusable form field component
// DRY: Centralized form field logic to avoid repetition
// KISS: Simple, focused form field with clear interface

import React from 'react';
import { Input } from '@/shared/ui/input/input';
import { Label } from '@/shared/ui/label/label';
import { Textarea } from '@/shared/ui/textarea/textarea';
import { Button } from '@/shared/ui/button/Button';
import SelectCustom from '@/shared/ui/selectCustom/SelectCustom';
import FormFieldError from '@/shared/ui/formFieldError/FormFieldError';

// SOLID: Interface Segregation - Focused interfaces for different field types
export interface BaseFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface TextAreaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface FileFieldProps extends BaseFieldProps {
  type: 'file';
  onChange: (file: File | null) => void;
  accept?: string;
  multiple?: boolean;
}

type FormFieldProps =
  | InputFieldProps
  | TextAreaFieldProps
  | SelectFieldProps
  | FileFieldProps;

// KISS: Simple component factory pattern
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { id, label, error, required, disabled, className } = props;

  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows}
            maxLength={props.maxLength}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <SelectCustom
            id={id}
            value={props.value}
            onChange={props.onChange}
            options={props.options}
            placeholder={props.placeholder}
            disabled={disabled}
            error={error}
          />
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              id={id}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                props.onChange(file);
              }}
              accept={props.accept}
              multiple={props.multiple}
              disabled={disabled}
              className={error ? 'border-red-500' : ''}
            />
          </div>
        );

      default:
        return (
          <Input
            id={id}
            type={props.type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            maxLength={props.maxLength}
            min={props.min}
            max={props.max}
            step={props.step}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && <FormFieldError error={error} />}
    </div>
  );
};

// DRY: Reusable field group component
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => (
  <div className={`space-y-4 ${className || ''}`}>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

// SOLID: Single Responsibility - Form actions component
export interface FormActionsProps {
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  isSubmitting = false,
  submitDisabled = false,
  className,
}) => (
  <div className={`flex gap-4 pt-6 ${className || ''}`}>
    <Button
      type="button"
      onClick={onSubmit}
      disabled={isSubmitting || submitDisabled}
      className="flex-1"
    >
      {isSubmitting ? 'Guardando...' : submitText}
    </Button>
    {onCancel && (
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1"
      >
        {cancelText}
      </Button>
    )}
  </div>
);

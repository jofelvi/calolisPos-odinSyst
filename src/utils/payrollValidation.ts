import { PayrollStatusEnum } from '@/types/enumShared';
import { CreatePayrollData, PayrollCalculation } from '@/types/payroll';
import { Employee } from '@/types/employee';

export interface PayrollValidationError {
  field: string;
  message: string;
}

export interface PayrollValidationResult {
  isValid: boolean;
  errors: PayrollValidationError[];
  warnings: string[];
}

/**
 * Validates payroll data according to business rules
 */
export class PayrollValidator {
  private static readonly MIN_SALARY = 130; // Minimum wage in USD
  private static readonly MAX_OVERTIME_HOURS = 60; // Per month
  private static readonly MAX_TAX_RATE = 0.15; // 15%
  private static readonly MAX_DEDUCTION_RATE = 0.3; // 30% of gross pay

  /**
   * Validate payroll calculation
   */
  static validatePayroll(
    data: CreatePayrollData,
    employee: Employee,
  ): PayrollValidationResult {
    const errors: PayrollValidationError[] = [];
    const warnings: string[] = [];

    // Basic validations
    this.validateBasicFields(data, errors);

    // Salary validations
    this.validateSalary(data, employee, errors, warnings);

    // Period validations
    this.validatePeriod(data, errors, warnings);

    // Hours validations
    this.validateHours(data, errors, warnings);

    // Deductions validations
    this.validateDeductions(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payroll calculation results
   */
  static validatePayrollCalculation(
    calculation: PayrollCalculation,
  ): PayrollValidationResult {
    const errors: PayrollValidationError[] = [];
    const warnings: string[] = [];

    // Check if net pay is reasonable
    if (calculation.netPay <= 0) {
      errors.push({
        field: 'netPay',
        message: 'El salario neto no puede ser cero o negativo',
      });
    }

    // Check if deductions are too high
    const deductionRate = calculation.totalDeductions / calculation.grossPay;
    if (deductionRate > this.MAX_DEDUCTION_RATE) {
      warnings.push(
        `Las deducciones son muy altas: ${(deductionRate * 100).toFixed(1)}% del salario bruto`,
      );
    }

    // Check minimum wage compliance
    if (calculation.netPay < this.MIN_SALARY) {
      errors.push({
        field: 'netPay',
        message: `El salario neto está por debajo del salario mínimo (${this.MIN_SALARY} USD)`,
      });
    }

    // Check attendance rate
    if (calculation.attendanceSummary.attendanceRate < 50) {
      warnings.push(
        `Baja asistencia: ${calculation.attendanceSummary.attendanceRate.toFixed(1)}%`,
      );
    }

    // Check overtime hours
    if (calculation.overtimeHours > this.MAX_OVERTIME_HOURS) {
      warnings.push(
        `Exceso de horas extra: ${calculation.overtimeHours.toFixed(1)} horas`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for payroll conflicts
   */
  static validatePayrollConflicts(
    newPayroll: CreatePayrollData,
    existingPayrolls: any[],
  ): PayrollValidationResult {
    const errors: PayrollValidationError[] = [];
    const warnings: string[] = [];

    // Check for duplicate period
    const samePeriod = existingPayrolls.find(
      (existing) =>
        existing.employeeId === newPayroll.employeeId &&
        existing.period.month === newPayroll.period.month &&
        existing.period.year === newPayroll.period.year,
    );

    if (samePeriod) {
      errors.push({
        field: 'period',
        message: 'Ya existe una nómina para este empleado en este período',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateBasicFields(
    data: CreatePayrollData,
    errors: PayrollValidationError[],
  ): void {
    if (!data.employeeId) {
      errors.push({
        field: 'employeeId',
        message: 'ID de empleado es requerido',
      });
    }

    if (!data.period) {
      errors.push({
        field: 'period',
        message: 'Período es requerido',
      });
    }

    if (!data.salary) {
      errors.push({
        field: 'salary',
        message: 'Información salarial es requerida',
      });
    }
  }

  private static validateSalary(
    data: CreatePayrollData,
    employee: Employee,
    errors: PayrollValidationError[],
    warnings: string[],
  ): void {
    if (!data.salary) return;

    // Check base salary
    if (data.salary.baseSalary <= 0) {
      errors.push({
        field: 'salary.baseSalary',
        message: 'El salario base debe ser mayor a cero',
      });
    }

    if (data.salary.baseSalary < this.MIN_SALARY) {
      errors.push({
        field: 'salary.baseSalary',
        message: `El salario base está por debajo del mínimo (${this.MIN_SALARY} USD)`,
      });
    }

    // Check if salary matches employee's base salary
    const variationPercent =
      Math.abs(data.salary.baseSalary - employee.salary) / employee.salary;
    if (variationPercent > 0.1) {
      // 10% variation
      warnings.push(
        `El salario calculado difiere del salario base del empleado en ${(variationPercent * 100).toFixed(1)}%`,
      );
    }

    // Validate bonus and commissions
    if (data.salary.bonuses && data.salary.bonuses < 0) {
      errors.push({
        field: 'salary.bonuses',
        message: 'Las bonificaciones no pueden ser negativas',
      });
    }

    if (data.salary.commissions && data.salary.commissions < 0) {
      errors.push({
        field: 'salary.commissions',
        message: 'Las comisiones no pueden ser negativas',
      });
    }

    // Check for excessive bonuses
    const totalBonus =
      (data.salary.bonuses || 0) + (data.salary.commissions || 0);
    if (totalBonus > data.salary.baseSalary) {
      warnings.push('Las bonificaciones y comisiones exceden el salario base');
    }
  }

  private static validatePeriod(
    data: CreatePayrollData,
    errors: PayrollValidationError[],
    warnings: string[],
  ): void {
    if (!data.period) return;

    // Validate month
    if (data.period.month < 1 || data.period.month > 12) {
      errors.push({
        field: 'period.month',
        message: 'El mes debe estar entre 1 y 12',
      });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (data.period.year < currentYear - 2 || data.period.year > currentYear) {
      errors.push({
        field: 'period.year',
        message: 'El año debe estar en un rango válido',
      });
    }

    // Validate date range
    if (data.period.startDate && data.period.endDate) {
      if (data.period.endDate <= data.period.startDate) {
        errors.push({
          field: 'period.endDate',
          message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        });
      }

      // Check if period is in the future
      const today = new Date();
      if (data.period.startDate > today) {
        warnings.push('El período está en el futuro');
      }
    }
  }

  private static validateHours(
    data: CreatePayrollData,
    errors: PayrollValidationError[],
    warnings: string[],
  ): void {
    // Validate hours worked
    if (data.hoursWorked < 0) {
      errors.push({
        field: 'hoursWorked',
        message: 'Las horas trabajadas no pueden ser negativas',
      });
    }

    if (data.hoursWorked > 300) {
      // 300 hours per month is excessive
      warnings.push(`Horas trabajadas excesivas: ${data.hoursWorked} horas`);
    }

    // Validate overtime hours
    if (data.overtimeHours && data.overtimeHours < 0) {
      errors.push({
        field: 'overtimeHours',
        message: 'Las horas extra no pueden ser negativas',
      });
    }

    if (data.overtimeHours && data.overtimeHours > this.MAX_OVERTIME_HOURS) {
      warnings.push(
        `Exceso de horas extra: ${data.overtimeHours} horas (máximo recomendado: ${this.MAX_OVERTIME_HOURS})`,
      );
    }

    // Check if overtime hours exceed regular hours
    if (data.overtimeHours && data.overtimeHours > data.hoursWorked) {
      errors.push({
        field: 'overtimeHours',
        message:
          'Las horas extra no pueden exceder las horas totales trabajadas',
      });
    }
  }

  private static validateDeductions(
    data: CreatePayrollData,
    errors: PayrollValidationError[],
    warnings: string[],
  ): void {
    if (!data.deductions) return;

    // Validate individual deductions
    Object.entries(data.deductions).forEach(([key, value]) => {
      if (value && value < 0) {
        errors.push({
          field: `deductions.${key}`,
          message: `${key} no puede ser negativo`,
        });
      }
    });

    // Calculate total deductions percentage
    const grossPay =
      data.salary.baseSalary +
      (data.salary.overtime || 0) +
      (data.salary.bonuses || 0) +
      (data.salary.commissions || 0);

    const totalDeductions = Object.values(data.deductions).reduce(
      (sum, val) => sum + (val || 0),
      0,
    );
    const deductionRate = totalDeductions / grossPay;

    if (deductionRate > this.MAX_DEDUCTION_RATE) {
      warnings.push(
        `Las deducciones exceden el ${this.MAX_DEDUCTION_RATE * 100}% del salario bruto`,
      );
    }

    // Validate tax rates
    if (data.deductions.taxes) {
      const taxRate = data.deductions.taxes / grossPay;
      if (taxRate > this.MAX_TAX_RATE) {
        warnings.push(
          `La tasa de impuestos es alta: ${(taxRate * 100).toFixed(1)}%`,
        );
      }
    }
  }
}

/**
 * Business rules for payroll management
 */
export class PayrollBusinessRules {
  /**
   * Check if payroll can be approved
   */
  static canApprovePayroll(
    payroll: any,
    approverRole: string,
  ): {
    canApprove: boolean;
    reason?: string;
  } {
    // Only managers and admins can approve payroll
    if (!['manager', 'admin'].includes(approverRole.toLowerCase())) {
      return {
        canApprove: false,
        reason: 'No tienes permisos para aprobar nóminas',
      };
    }

    if (payroll.status !== PayrollStatusEnum.DRAFT) {
      return {
        canApprove: false,
        reason: 'Solo se pueden aprobar nóminas en estado borrador',
      };
    }

    return { canApprove: true };
  }

  /**
   * Check if payroll can be paid
   */
  static canPayPayroll(payroll: any): {
    canPay: boolean;
    reason?: string;
  } {
    if (payroll.status !== PayrollStatusEnum.APPROVED) {
      return {
        canPay: false,
        reason: 'La nómina debe estar aprobada antes de poder pagarla',
      };
    }

    if (payroll.paymentDate) {
      return {
        canPay: false,
        reason: 'Esta nómina ya ha sido pagada',
      };
    }

    return { canPay: true };
  }

  /**
   * Get payroll processing deadlines
   */
  static getPayrollDeadlines(
    month: number,
    year: number,
  ): {
    submissionDeadline: Date;
    approvalDeadline: Date;
    paymentDeadline: Date;
  } {
    // Last day of the month for submission
    const submissionDeadline = new Date(year, month, 0);

    // 5th of next month for approval
    const approvalDeadline = new Date(year, month, 5);

    // 15th of next month for payment
    const paymentDeadline = new Date(year, month, 15);

    return {
      submissionDeadline,
      approvalDeadline,
      paymentDeadline,
    };
  }

  /**
   * Calculate payroll taxes based on Venezuelan law
   */
  static calculateTaxes(
    grossPay: number,
    employeeType: string,
  ): {
    incomeTax: number;
    socialSecurity: number;
    unemploymentInsurance: number;
    totalTaxes: number;
  } {
    let incomeTax = 0;
    let socialSecurity = 0;
    let unemploymentInsurance = 0;

    // Progressive income tax (simplified)
    if (grossPay > 1000) {
      incomeTax = grossPay * 0.06; // 6% for higher earners
    } else if (grossPay > 500) {
      incomeTax = grossPay * 0.03; // 3% for middle earners
    }
    // No tax for low earners

    // Social security (SSO) - 4% of gross pay
    socialSecurity = grossPay * 0.04;

    // Unemployment insurance - 0.75% of gross pay
    unemploymentInsurance = grossPay * 0.0075;

    const totalTaxes = incomeTax + socialSecurity + unemploymentInsurance;

    return {
      incomeTax,
      socialSecurity,
      unemploymentInsurance,
      totalTaxes,
    };
  }

  /**
   * Check compliance with labor laws
   */
  static checkLaborCompliance(payroll: PayrollCalculation): {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check minimum wage compliance
    if (payroll.netPay < 130) {
      violations.push('Salario por debajo del mínimo legal');
    }

    // Check overtime compliance
    if (payroll.overtimeHours > 60) {
      violations.push('Exceso de horas extra (máximo 60 horas/mes)');
    }

    // Check attendance rate
    if (payroll.attendanceSummary.attendanceRate < 80) {
      recommendations.push('Baja asistencia - considerar medidas correctivas');
    }

    // Check deduction limits
    const deductionRate = payroll.totalDeductions / payroll.grossPay;
    if (deductionRate > 0.2) {
      recommendations.push('Deducciones altas - revisar compliance');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      recommendations,
    };
  }
}

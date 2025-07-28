en el componente  NewBranchPage

en la parte         <form
onSubmit={form.handleSubmit(handleFormSubmit)}
className="space-y-8"
> me da este error
TS2345: Argument of type (data: NewBranchFormData) => Promise<void> is not assignable to parameter of type SubmitHandler<TFieldValues>
Types of parameters data and data are incompatible.
Type 'TFieldValues' is not assignable to type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; }'.
Type FieldValues is missing the following properties from type
> 

 en el   el register me da ese error          <BranchForm
 register={form.register}
 errors={form.formState.errors}
 showDefaultOption={true}
 />

TS2322: Type
UseFormRegister<{
description?: string | undefined;
phone?: string | undefined;
email?: string | undefined;
isDefault?: boolean | undefined;
enableTips?: boolean | undefined;
defaultTipPercentage?: number | undefined;
... 7 more ...;
taxRate: number;
}>
is not assignable to type
UseFormRegister<{
description?: string | undefined;
phone?: string | undefined;
email?: string | undefined;
isDefault?: boolean | undefined;
name: string;
address: string;
city: string;
country: string;
} | { ...; }>
Type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; name: string; address: string; city: string; country: string; } | { ...; }' is not assignable to type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; }'.
Type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; name: string; address: string; city: string; country: string; }' is missing the following properties from type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; }': currency, language, timezone, taxRate
BranchForm.tsx(18, 3): The expected type comes from property register which is declared here on type IntrinsicAttributes & BranchFormProps


y aca el watch me da este erro 

          <GeneralSettingsForm
            register={form.register}
            errors={form.formState.errors}
            watch={form.watch}
          />

TS2322: Type
UseFormWatch<{
description?: string | undefined;
phone?: string | undefined;
email?: string | undefined;
isDefault?: boolean | undefined;
enableTips?: boolean | undefined;
defaultTipPercentage?: number | undefined;
... 7 more ...;
taxRate: number;
}>
is not assignable to type
UseFormWatch<{
description?: string | undefined;
phone?: string | undefined;
email?: string | undefined;
isDefault?: boolean | undefined;
enableTips?: boolean | undefined;
defaultTipPercentage?: number | undefined;
... 7 more ...;
taxRate: number;
} | { ...; }>
Type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; } | { ...; }' is not assignable to type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; }'.
Type '{ enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; currency: string; language: string; timezone: string; taxRate: number; dateFormat: string; }' is missing the following properties from type '{ description?: string | undefined; phone?: string | undefined; email?: string | undefined; isDefault?: boolean | undefined; enableTips?: boolean | undefined; defaultTipPercentage?: number | undefined; ... 7 more ...; taxRate: number; }': name, address, city, country
GeneralSettingsForm.tsx(24, 3): The expected type comes from property watch which is declared here 
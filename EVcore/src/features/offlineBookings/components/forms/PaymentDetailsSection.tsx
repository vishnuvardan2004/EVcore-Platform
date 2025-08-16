import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Control, FieldValues, Path } from 'react-hook-form';

interface PaymentDetailsSectionProps<T extends FieldValues> {
  control: Control<T>;
  paymentModeField: Path<T>;
  partPaymentCashField?: Path<T>;
  partPaymentUPIField?: Path<T>;
  watchPaymentMode: string;
  formPrefix?: string;
}

export const PaymentDetailsSection = <T extends FieldValues>({
  control,
  paymentModeField,
  partPaymentCashField,
  partPaymentUPIField,
  watchPaymentMode,
  formPrefix = 'airport',
}: PaymentDetailsSectionProps<T>) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={paymentModeField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Mode</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cash" id={`${formPrefix}-cash`} />
                  <Label htmlFor={`${formPrefix}-cash`}>Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UPI" id={`${formPrefix}-upi`} />
                  <Label htmlFor={`${formPrefix}-upi`}>UPI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Part Payment" id={`${formPrefix}-part`} />
                  <Label htmlFor={`${formPrefix}-part`}>Part Payment</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchPaymentMode === 'Part Payment' && partPaymentCashField && partPaymentUPIField && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <FormField
            control={control}
            name={partPaymentCashField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cash Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter cash amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={partPaymentUPIField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter UPI amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};



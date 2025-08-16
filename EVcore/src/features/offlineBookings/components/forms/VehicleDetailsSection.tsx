
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control, FieldValues, Path } from 'react-hook-form';

interface VehicleDetailsSectionProps<T extends FieldValues> {
  control: Control<T>;
  pilotNameField: Path<T>;
  vehicleNumberField: Path<T>;
  costField?: Path<T>;
}

export const VehicleDetailsSection = <T extends FieldValues>({
  control,
  pilotNameField,
  vehicleNumberField,
  costField,
}: VehicleDetailsSectionProps<T>) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name={pilotNameField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pilot Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter pilot name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={vehicleNumberField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vehicle Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter vehicle number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {costField && (
        <FormField
          control={control}
          name={costField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};


import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control, FieldValues, Path } from 'react-hook-form';

interface ScheduleDetailsSectionProps<T extends FieldValues> {
  control: Control<T>;
  dateField: Path<T>;
  timeField: Path<T>;
}

export const ScheduleDetailsSection = <T extends FieldValues>({
  control,
  dateField,
  timeField,
}: ScheduleDetailsSectionProps<T>) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name={dateField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={timeField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Time</FormLabel>
            <FormControl>
              <Input 
                type="time" 
                placeholder="HH:MM"
                pattern="[0-9]{2}:[0-9]{2}"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

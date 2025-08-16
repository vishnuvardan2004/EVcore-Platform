import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Control, FieldValues, Path } from 'react-hook-form';

interface BookingTypeSectionProps<T extends FieldValues> {
  control: Control<T>;
  bookingTypeField: Path<T>;
}

export const BookingTypeSection = <T extends FieldValues>({
  control,
  bookingTypeField,
}: BookingTypeSectionProps<T>) => {
  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          ✈️ Airport Booking Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name={bookingTypeField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup">Pickup from Airport</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="drop" id="drop" />
                    <Label htmlFor="drop">Drop at Airport</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};



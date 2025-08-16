import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Control, FieldValues, Path } from 'react-hook-form';

interface DropDetailsSectionProps<T extends FieldValues> {
  control: Control<T>;
  dropDateTimeField: Path<T>;
  dropCostField: Path<T>;
  dropPilotField: Path<T>;
  dropVehicleField: Path<T>;
  dropPaymentModeField: Path<T>;
  pilots: string[];
  vehicles: string[];
}

export const DropDetailsSection = <T extends FieldValues>({
  control,
  dropDateTimeField,
  dropCostField,
  dropPilotField,
  dropVehicleField,
  dropPaymentModeField,
  pilots,
  vehicles,
}: DropDetailsSectionProps<T>) => {
  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Drop Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={dropDateTimeField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={dropCostField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Cost (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={dropPilotField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Pilot</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pilot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pilots.map((pilot) => (
                      <SelectItem key={pilot} value={pilot}>
                        {pilot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={dropVehicleField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drop Vehicle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle} value={vehicle}>
                        {vehicle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name={dropPaymentModeField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Drop Payment Mode</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPI" id="drop-upi" />
                    <Label htmlFor="drop-upi">UPI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cash" id="drop-cash" />
                    <Label htmlFor="drop-cash">Cash</Label>
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



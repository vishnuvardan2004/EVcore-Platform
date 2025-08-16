
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Control, FieldValues, Path } from 'react-hook-form';

interface PickupDetailsSectionProps<T extends FieldValues> {
  control: Control<T>;
  pickupDateTimeField: Path<T>;
  pickupCostField: Path<T>;
  pickupPilotField: Path<T>;
  pickupVehicleField: Path<T>;
  pickupPaymentModeField: Path<T>;
  pilots: string[];
  vehicles: string[];
}

export const PickupDetailsSection = <T extends FieldValues>({
  control,
  pickupDateTimeField,
  pickupCostField,
  pickupPilotField,
  pickupVehicleField,
  pickupPaymentModeField,
  pilots,
  vehicles,
}: PickupDetailsSectionProps<T>) => {
  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📍 Pickup Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={pickupDateTimeField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={pickupCostField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Cost (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={pickupPilotField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Pilot</FormLabel>
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
            name={pickupVehicleField}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Vehicle</FormLabel>
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
          name={pickupPaymentModeField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup Payment Mode</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UPI" id="pickup-upi" />
                    <Label htmlFor="pickup-upi">UPI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Cash" id="pickup-cash" />
                    <Label htmlFor="pickup-cash">Cash</Label>
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

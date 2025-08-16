import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Loader2 } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

const subscriptionBookingSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  pickupLocation: z.string().min(2, 'Pickup location must be at least 2 characters'),
  dropTime: z.string().min(1, 'Drop time is required'),
  dropLocation: z.string().min(2, 'Drop location must be at least 2 characters'),
  pilotName: z.string().min(1, 'Pilot name is required'),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
});

type SubscriptionBookingFormData = z.infer<typeof subscriptionBookingSchema>;

interface SubscriptionBookingFormProps {
  onBack?: () => void;
}

export const SubscriptionBookingForm = ({ onBack }: SubscriptionBookingFormProps = {}) => {
  const { toast } = useToast();
  const { isOnline } = useOfflineSync();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SubscriptionBookingFormData>({
    resolver: zodResolver(subscriptionBookingSchema),
  });

  const onSubmit = async (data: SubscriptionBookingFormData) => {
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        bookingType: 'subscription' as const,
        subType: 'monthly' as const, // Default to monthly, can be enhanced with form field
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        scheduledDate: new Date().toISOString().split('T')[0], // Current date for subscription start
        scheduledTime: data.pickupTime,
        pilotName: data.pilotName,
        vehicleNumber: data.vehicleNumber,
        estimatedCost: 0, // Will be calculated based on subscription plan
        paymentMode: 'UPI' as const, // Default for subscriptions
        paymentStatus: 'pending' as const,
        specialRequirements: `Pickup: ${data.pickupTime}, Drop: ${data.dropTime}`,
      };

      const createdBooking = await bookingService.createBooking(bookingData);
      
      toast({
        title: "Subscription Booking Created Successfully",
        description: `Recurring booking for ${data.customerName} has been created. Booking ID: ${createdBooking.id?.slice(-8)}`,
      });

      form.reset();
      
    } catch (error) {
      console.error('Error creating subscription booking:', error);
      
      toast({
        title: "Booking Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-orange-200">
      <CardHeader className="pb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-orange-900">Subscription Booking</CardTitle>
            <CardDescription className="text-orange-700">
              Create recurring ride subscriptions for regular customers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 10-digit phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pickup Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pickupLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pickupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Drop Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dropLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drop Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter drop address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dropTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drop Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pilotName"
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
                control={form.control}
                name="vehicleNumber"
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
            </div>

            <div className="flex justify-between pt-4">
              {onBack && (
                <Button type="button" variant="outline" onClick={onBack}>
                  ← Back to Home
                </Button>
              )}
              <Button 
                type="submit" 
                size="lg" 
                className="min-w-32 ml-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Subscription'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SubscriptionBookingForm;

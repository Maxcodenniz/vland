import { z } from 'zod';

export const bookingFormSchema = z.object({
  serviceSlug: z.string().min(2, 'Please select a service.'),
  fullName: z.string().min(3, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  preferredDate: z.string().min(1, 'Select a date.'),
  preferredTime: z.string().min(1, 'Select a time.'),
  notes: z.string().max(500, 'Notes should not exceed 500 characters.').optional()
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

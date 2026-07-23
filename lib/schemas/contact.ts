import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(3, 'Enter your name.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  subject: z.string().min(3, 'Enter a subject.'),
  message: z
    .string()
    .min(10, 'Enter a short message.')
    .max(1200, 'Message is too long.')
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

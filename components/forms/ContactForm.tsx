'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  contactFormSchema,
  type ContactFormValues
} from '@/lib/schemas/contact';

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema)
  });

  const onSubmit = async (values: ContactFormValues) => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      throw new Error('Unable to send message.');
    }

    reset();
  };

  return (
    <form className="card content-panel form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-grid columns-2">
        <label>
          <span className="muted">Name</span>
          <input className="input" {...register('name')} />
          <small className="muted">{errors.name?.message}</small>
        </label>
        <label>
          <span className="muted">Email</span>
          <input className="input" type="email" {...register('email')} />
          <small className="muted">{errors.email?.message}</small>
        </label>
        <label>
          <span className="muted">Phone</span>
          <input className="input" {...register('phone')} />
          <small className="muted">{errors.phone?.message}</small>
        </label>
        <label>
          <span className="muted">Subject</span>
          <input className="input" {...register('subject')} />
          <small className="muted">{errors.subject?.message}</small>
        </label>
      </div>
      <label>
        <span className="muted">Message</span>
        <textarea className="textarea" {...register('message')} />
        <small className="muted">{errors.message?.message}</small>
      </label>
      <button className="button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}

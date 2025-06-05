
// src/components/jarvis/email-dialog.tsx
'use client';

import React, { useEffect, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { EmailFormData } from '@/lib/schemas'; // Updated import path
import { EmailFormSchema } from '@/lib/schemas'; // Updated import path

interface EmailDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onSubmit: (data: EmailFormData) => Promise<void>;
  initialIntention?: string;
}

export default function EmailDialog({ open, onOpenChange, onSubmit, initialIntention = '' }: EmailDialogProps) {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      recipient: '',
      subject: '',
      intention: initialIntention,
    },
  });

  // Update defaultValues if initialIntention changes after mount
  useEffect(() => {
    if (initialIntention !== form.getValues('intention')) {
      form.reset({
        recipient: form.getValues('recipient'),
        subject: form.getValues('subject'),
        intention: initialIntention,
      });
    }
  }, [initialIntention, form]);

  const handleSubmit = async (data: EmailFormData) => {
    await onSubmit(data);
    // form.reset(); // Resetting here might clear the dialog too soon if it's part of the submit handler.
                  // The parent (page.tsx) controls showing/hiding the dialog.
                  // If we want to clear the form for the *next* time it opens, this is fine.
                  // Or, reset only on successful submission, if onSubmit doesn't handle errors by keeping dialog open.
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) { // Reset form when dialog is closed
        form.reset({ recipient: '', subject: '', intention: '' });
      }
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Fill in the details below. The AI will help draft the email content based on your intention.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input placeholder="recipient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Email Subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intention"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intention / Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the purpose of the email..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                onOpenChange(false);
                form.reset({ recipient: '', subject: '', intention: '' }); // Also reset on explicit cancel
              }}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Generating...' : 'Generate Draft'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

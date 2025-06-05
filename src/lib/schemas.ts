
import { z } from 'zod';

export const EmailFormSchema = z.object({
  recipient: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  intention: z.string().min(1, { message: "Intention/prompt is required." }),
});
export type EmailFormData = z.infer<typeof EmailFormSchema>;

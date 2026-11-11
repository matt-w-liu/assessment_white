import { z } from 'zod';
import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from './limits';

export const titleSchema = z
  .string({ invalid_type_error: 'Title must be text' })
  .trim()
  .min(1, 'Title cannot be empty')
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`);

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: z
      .string({ invalid_type_error: 'Content must be an HTML string' })
      .max(MAX_CONTENT_LENGTH, 'Document is too large to save')
      .optional(),
  })
  .refine((d) => d.title !== undefined || d.content !== undefined, {
    message: 'Nothing to update',
  });

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address');

export const shareSchema = z.object({
  email: emailSchema,
  role: z
    .enum(['viewer', 'editor'], { errorMap: () => ({ message: 'Role must be "viewer" or "editor"' }) })
    .default('editor'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ShareInput = z.infer<typeof shareSchema>;

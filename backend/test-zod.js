import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3)
});

const res = schema.safeParse({});
console.log(res);
if (!res.success) {
  console.log(res.error.errors);
  console.log(res.error.issues);
}

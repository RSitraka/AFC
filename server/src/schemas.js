import { z } from 'zod';

export const POSITIONS = ['DB', 'DC', 'DG', 'DD', 'MD', 'MG', 'MOC', 'MR', 'AC', 'AIG', 'AID', 'MLG', 'MLD'];
export const MAIN_POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
export const STRONG_FEET = ['LEFT', 'RIGHT', 'BOTH'];
export const STAT_FIELDS = [
  'vitesse', 'tir', 'passe', 'arret', 'reactivite', 'saut',
  'endurance', 'risqueCrampe', 'balleAuPied', 'defense', 'drible',
];

const note = z.coerce.number().int().min(0).max(10);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const completeProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  photoUrl: z.string().url().or(z.literal('')).nullish(),
  number: z.coerce.number().int().min(0).max(99).nullish(),
  mainPosition: z.enum(MAIN_POSITIONS).optional(),
  positions: z.array(z.enum(POSITIONS)).default([]),
  secondaryPositions: z.array(z.string()).default([]),
  strongFoot: z.enum(STRONG_FEET).optional(),
  birthDate: z.coerce.date().nullish(),
  stats: z.object(Object.fromEntries(STAT_FIELDS.map((f) => [f, note.optional()]))).partial().optional(),
});

export const updatePlayerSchema = completeProfileSchema.extend({
  number: z.coerce.number().int().min(0).max(99).nullish(),
});

export const statsSchema = z.object(
  Object.fromEntries(STAT_FIELDS.map((f) => [f, note])),
).partial();

export const staffSchema = z.object({
  fullName: z.string().min(1),
  role: z.string().min(1),
  photoUrl: z.string().url().or(z.literal('')).nullish(),
});

export const matchParticipantSchema = z.object({
  playerId: z.string().min(1),
  role: z.enum(['STARTER', 'SUBSTITUTE']).default('STARTER'),
  positionLabel: z.string().nullish(),
  x: z.coerce.number().nullish(),
  y: z.coerce.number().nullish(),
});

export const matchSchema = z.object({
  opponent: z.string().min(1),
  date: z.coerce.date(),
  location: z.string().nullish(),
  format: z.coerce.number().int().refine((v) => [5, 7, 9, 11].includes(v), 'Format invalide').default(11),
  formation: z.string().nullish(),
  scoreFor: z.coerce.number().int().min(0).nullish(),
  scoreAgainst: z.coerce.number().int().min(0).nullish(),
  scorerIds: z.array(z.string()).optional(),
  participants: z.array(matchParticipantSchema).optional(),
});

export const trainingSchema = z.object({
  title: z.string().min(1).default('Entraînement'),
  date: z.coerce.date(),
  location: z.string().nullish(),
});

export const attendanceSchema = z.object({
  playerId: z.string().min(1),
  eventType: z.enum(['MATCH', 'TRAINING']),
  eventId: z.string().min(1),
  present: z.boolean().default(true),
});

export const bulkAttendanceSchema = z.object({
  eventType: z.enum(['MATCH', 'TRAINING']),
  eventId: z.string().min(1),
  entries: z.array(z.object({ playerId: z.string(), present: z.boolean() })),
});

export const lineupPositionSchema = z.object({
  playerId: z.string().nullish(),
  role: z.enum(['STARTER', 'SUBSTITUTE']).default('STARTER'),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  positionLabel: z.string().nullish(),
});

export const lineupSchema = z.object({
  name: z.string().min(1),
  format: z.coerce.number().int().refine((v) => [5, 7, 9, 11].includes(v), 'Format invalide'),
  formation: z.string().min(1),
  positions: z.array(lineupPositionSchema).default([]),
});

export const transactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  description: z.string().min(1),
});

export const duesPaymentSchema = z.object({
  playerId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mois au format YYYY-MM'),
  amount: z.coerce.number().positive().optional(),
  description: z.string().nullish(),
});

export const teamSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().or(z.literal('')).nullish(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  monthlyDues: z.coerce.number().min(0).optional(),
  duesStartMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const idParam = z.object({ id: z.string().min(1) });

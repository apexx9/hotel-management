import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { hotels } from './hotels.schema';
import { users } from './users.schema';

/* =========================================================
   ENUMS
========================================================= */

export const roomStatusEnum = pgEnum('room_status', [
  'available',
  'occupied',
  'cleaning',
  'inspection',
  'maintenance',
  'out_of_service',
  'reserved',
]);

export const stayStatusEnum = pgEnum('stay_status', [
  'reserved',
  'pending_arrival',
  'checked_in',
  'checked_out',
  'cancelled',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'mobile_money',
  'card',
  'bank_transfer',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'paid',
  'partial',
  'pending',
  'overdue',
  'reversed',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'cancelled',
]);

export const serviceChargeStatusEnum = pgEnum(
  'service_charge_status',
  [
    'open',
    'posted',
    'voided',
  ],
);

export const housekeepingStatusEnum = pgEnum(
  'housekeeping_status',
  [
    'cleaning',
    'inspection',
    'ready',
    'maintenance',
  ],
);

export const notificationTypeEnum = pgEnum(
  'notification_type',
  [
    'checkout_overdue',
    'payment_outstanding',
    'room_ready',
    'room_unavailable',
    'maintenance_issue',
    'new_booking',
    'guest_arrival',
    'service_charge_added',
  ],
);

/* =========================================================
   ROOM TYPES
========================================================= */

export const roomTypes = pgTable(
  'room_types',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    description: text('description'),

    basePrice: numeric('base_price', {
      precision: 12,
      scale: 2,
    }).notNull(),

    capacity: integer('capacity')
      .notNull()
      .default(2),

    bedConfiguration: varchar(
      'bed_configuration',
      {
        length: 100,
      },
    ),

    amenities: text('amenities'),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    hotelNameUnique: uniqueIndex(
      'room_types_hotel_name_unique',
    ).on(
      table.hotelId,
      table.name,
    ),
  }),
);

/* =========================================================
   ROOMS
========================================================= */

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    number: varchar('number', {
      length: 20,
    }).notNull(),

    floor: varchar('floor', {
      length: 20,
    }).notNull(),

    roomTypeId: uuid('room_type_id')
      .notNull()
      .references(() => roomTypes.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    status: roomStatusEnum('status')
      .notNull()
      .default('available'),

    rate: numeric('rate', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    capacity: integer('capacity')
      .notNull()
      .default(2),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    hotelRoomNumberUnique: uniqueIndex(
      'rooms_hotel_number_unique',
    ).on(
      table.hotelId,
      table.number,
    ),
  }),
);

/* =========================================================
   GUESTS
========================================================= */

export const guests = pgTable('guests', {
  id: uuid('id')
    .primaryKey()
    .defaultRandom(),

  hotelId: uuid('hotel_id')
    .notNull()
    .references(() => hotels.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  firstName: varchar('first_name', {
    length: 120,
  }).notNull(),

  lastName: varchar('last_name', {
    length: 120,
  }).notNull(),

  phone: varchar('phone', {
    length: 32,
  }).notNull(),

  email: varchar('email', {
    length: 255,
  }),

  nationality: varchar('nationality', {
    length: 120,
  }),

  identificationType: varchar(
    'identification_type',
    {
      length: 80,
    },
  ),

  identificationNumber: varchar(
    'identification_number',
    {
      length: 120,
    },
  ),

  address: text('address'),

  emergencyContact: varchar(
    'emergency_contact',
    {
      length: 32,
    },
  ),

  notes: text('notes'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

/* =========================================================
   STAYS / BOOKINGS
========================================================= */

export const stays = pgTable(
  'stays',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    reference: varchar('reference', {
      length: 32,
    }).notNull(),

    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    roomTypeId: uuid('room_type_id')
      .notNull()
      .references(() => roomTypes.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    status: stayStatusEnum('status')
      .notNull()
      .default('reserved'),

    expectedCheckInAt: timestamp(
      'expected_check_in_at',
      {
        withTimezone: true,
      },
    ).notNull(),

    checkInAt: timestamp('check_in_at', {
      withTimezone: true,
    }),

    expectedCheckoutAt: timestamp(
      'expected_checkout_at',
      {
        withTimezone: true,
      },
    ).notNull(),

    actualCheckoutAt: timestamp(
      'actual_checkout_at',
      {
        withTimezone: true,
      },
    ),

    guestsCount: integer('guests_count')
      .notNull()
      .default(1),

    nights: integer('nights')
      .notNull()
      .default(1),

    rate: numeric('rate', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    discount: numeric('discount', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    taxes: numeric('taxes', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    serviceTotal: numeric('service_total', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    total: numeric('total', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    amountPaid: numeric('amount_paid', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    outstandingBalance: numeric(
      'outstanding_balance',
      {
        precision: 12,
        scale: 2,
      },
    )
      .notNull()
      .default('0'),

    specialRequests: text(
      'special_requests',
    ),

    notes: text('notes'),

    createdByUserId: uuid(
      'created_by_user_id',
    ).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    hotelReferenceUnique: uniqueIndex(
      'stays_hotel_reference_unique',
    ).on(
      table.hotelId,
      table.reference,
    ),
  }),
);

/* =========================================================
   INVOICES
========================================================= */

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    reference: varchar('reference', {
      length: 32,
    }).notNull(),

    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    stayId: uuid('stay_id')
      .notNull()
      .references(() => stays.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    status: invoiceStatusEnum('status')
      .notNull()
      .default('draft'),

    subtotal: numeric('subtotal', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    discount: numeric('discount', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    taxes: numeric('taxes', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    total: numeric('total', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    amountPaid: numeric('amount_paid', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    outstanding: numeric('outstanding', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    issuedAt: timestamp('issued_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    hotelReferenceUnique: uniqueIndex(
      'invoices_hotel_reference_unique',
    ).on(
      table.hotelId,
      table.reference,
    ),
  }),
);

/* =========================================================
   INVOICE ITEMS
========================================================= */

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    description: text('description')
      .notNull(),

    quantity: integer('quantity')
      .notNull()
      .default(1),

    unitPrice: numeric('unit_price', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    total: numeric('total', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),

    itemType: varchar('item_type', {
      length: 64,
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   SERVICES
========================================================= */

export const services = pgTable(
  'services',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    name: varchar('name', {
      length: 120,
    }).notNull(),

    category: varchar('category', {
      length: 120,
    }).notNull(),

    price: numeric('price', {
      precision: 12,
      scale: 2,
    }).notNull(),

    description: text('description'),

    isActive: boolean('is_active')
      .notNull()
      .default(true),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   SERVICE CHARGES
========================================================= */

export const serviceCharges = pgTable(
  'service_charges',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    stayId: uuid('stay_id')
      .notNull()
      .references(() => stays.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    quantity: integer('quantity')
      .notNull()
      .default(1),

    unitPrice: numeric('unit_price', {
      precision: 12,
      scale: 2,
    }).notNull(),

    total: numeric('total', {
      precision: 12,
      scale: 2,
    }).notNull(),

    staffId: uuid('staff_id').references(
      () => users.id,
      {
        onDelete: 'set null',
        onUpdate: 'cascade',
      },
    ),

    status: serviceChargeStatusEnum(
      'status',
    )
      .notNull()
      .default('open'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   PAYMENTS
========================================================= */

export const payments = pgTable(
  'payments',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    reference: varchar('reference', {
      length: 32,
    }).notNull(),

    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    stayId: uuid('stay_id')
      .notNull()
      .references(() => stays.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    staffId: uuid('staff_id').references(
      () => users.id,
      {
        onDelete: 'set null',
        onUpdate: 'cascade',
      },
    ),

    method: paymentMethodEnum('method')
      .notNull(),

    amount: numeric('amount', {
      precision: 12,
      scale: 2,
    }).notNull(),

    status: paymentStatusEnum('status')
      .notNull()
      .default('paid'),

    notes: text('notes'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    hotelReferenceUnique: uniqueIndex(
      'payments_hotel_reference_unique',
    ).on(
      table.hotelId,
      table.reference,
    ),
  }),
);

/* =========================================================
   HOUSEKEEPING TASKS
========================================================= */

export const housekeepingTasks = pgTable(
  'housekeeping_tasks',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),

    stayId: uuid('stay_id').references(
      () => stays.id,
      {
        onDelete: 'set null',
        onUpdate: 'cascade',
      },
    ),

    status: housekeepingStatusEnum(
      'status',
    )
      .notNull()
      .default('cleaning'),

    assignedToUserId: uuid(
      'assigned_to_user_id',
    ).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    note: text('note'),

    dueAt: timestamp('due_at', {
      withTimezone: true,
    }),

    completedAt: timestamp('completed_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   ACTIVITY LOGS
========================================================= */

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    actorUserId: uuid(
      'actor_user_id',
    ).references(() => users.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    actorName: varchar('actor_name', {
      length: 255,
    }),

    event: varchar('event', {
      length: 255,
    }).notNull(),

    description: text('description'),

    referenceType: varchar(
      'reference_type',
      {
        length: 64,
      },
    ),

    referenceId: varchar(
      'reference_id',
      {
        length: 64,
      },
    ),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id')
      .primaryKey()
      .defaultRandom(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    type: notificationTypeEnum('type')
      .notNull(),

    title: varchar('title', {
      length: 255,
    }).notNull(),

    message: text('message')
      .notNull(),

    referenceType: varchar(
      'reference_type',
      {
        length: 64,
      },
    ),

    referenceId: varchar(
      'reference_id',
      {
        length: 64,
      },
    ),

    isRead: boolean('is_read')
      .notNull()
      .default(false),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

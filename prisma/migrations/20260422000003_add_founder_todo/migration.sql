-- Founder Hub plain to-do list. See prisma/schema.prisma :: FounderTodo.

CREATE TABLE "FounderTodo" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FounderTodo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FounderTodo_done_pinned_createdAt_idx"
  ON "FounderTodo" ("done", "pinned", "createdAt");

import { pgTable, serial, integer, decimal, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const perfis = pgTable("perfis", {
  id: serial("id").primaryKey(),
  idade: integer("idade").notNull(),
  altura: decimal("altura", { precision: 3, scale: 2 }).notNull(),
  localizacao: text("localizacao").notNull(),
  objetivo: text("objetivo").notNull(),
  superswipe: boolean("superswipe").default(false),
  beleza: integer("beleza").notNull(),
  profissao: text("profissao").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const metricasCache = pgTable("metricas_cache", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").unique().notNull(),
  dados: jsonb("dados").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos para uso no código
export type Perfil = typeof perfis.$inferSelect;
export type NovoPerfil = typeof perfis.$inferInsert;
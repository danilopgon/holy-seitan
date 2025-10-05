import {sql} from "drizzle-orm";
import {boolean, integer, pgEnum, pgTable, text, timestamp, uuid, varchar} from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty_level", ["easy", "medium", "hard"]);

const recipes = pgTable("recipes", {
    id: uuid("id").defaultRandom().primaryKey(),

    slug: varchar("slug", {length: 160}).notNull().unique(),
    title: varchar("title", {length: 200}).notNull(),

    description: varchar("description", {length: 280}).notNull(),
    contentMd: text("content_md").notNull(),

    emoji: varchar("emoji", {length: 16}).notNull(),

    prepTime: integer("prep_time").notNull().default(0),
    cookTime: integer("cook_time").notNull().default(0),
    servings: integer("servings").notNull().default(1),

    difficulty: difficultyEnum("difficulty").notNull().default("easy"),

    tags: text("tags").array(),

    isPublished: boolean("is_published").notNull().default(true),

    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`now
    ()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now
    ()`),
});
export default recipes

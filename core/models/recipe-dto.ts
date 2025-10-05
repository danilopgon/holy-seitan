export type RecipeDTO = {
    id: string,
    title: string;
    slug: string;
    description: string;
    emoji: string;
    content_md: string;
    prep_time: number;
    cook_time: number;
    servings: number;
    difficulty: "easy" | "medium" | "hard";
    tags?: string[];
    is_published: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
};

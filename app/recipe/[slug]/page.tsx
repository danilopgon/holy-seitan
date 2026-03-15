import {notFound} from "next/navigation"
import {getRecipeBySlugServerAction} from "@/lib/actions/get-recibe-by-slug";
import {dtoToRecipe} from "@/lib/recipe-adapter"
import {RecipeView} from "./recipe-view"

type Props = { params: Promise<{ slug: string }> }

export default async function RecipePage({ params }: Props) {
    const { slug } = await params
    const dto = await getRecipeBySlugServerAction(slug)
    if (!dto) notFound()

    const recipe = dtoToRecipe(dto, "Holy Seitan")
    return <RecipeView recipe={recipe}/>
}

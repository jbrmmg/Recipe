package com.jbr.middletier.recipe.dto.mapper;

import com.jbr.middletier.recipe.dto.RecipeDetailDto;
import com.jbr.middletier.recipe.dto.RecipeIngredientDto;
import com.jbr.middletier.recipe.dto.RecipeSummaryDto;
import com.jbr.middletier.recipe.dto.RecipeStepDto;
import com.jbr.middletier.recipe.model.Recipe;
import com.jbr.middletier.recipe.model.RecipeIngredient;
import com.jbr.middletier.recipe.model.RecipeStep;
import com.jbr.middletier.recipe.model.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RecipeMapper {

    @Mapping(target = "tags", expression = "java(recipe.getTags().stream().map(Tag::getName).toList())")
    RecipeSummaryDto toSummaryDto(Recipe recipe);

    List<RecipeSummaryDto> toSummaryDtoList(List<Recipe> recipes);

    RecipeDetailDto toDetailDto(Recipe recipe);

    @Mapping(target = "ingredientId", source = "ingredient.id")
    @Mapping(target = "ingredientName", source = "ingredient.name")
    RecipeIngredientDto toIngredientDto(RecipeIngredient recipeIngredient);

    RecipeStepDto toStepDto(RecipeStep step);
}

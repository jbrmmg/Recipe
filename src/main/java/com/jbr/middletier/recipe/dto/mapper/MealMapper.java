package com.jbr.middletier.recipe.dto.mapper;

import com.jbr.middletier.recipe.dto.MealDetailDto;
import com.jbr.middletier.recipe.dto.MealRecipeDto;
import com.jbr.middletier.recipe.dto.MealSummaryDto;
import com.jbr.middletier.recipe.model.Meal;
import com.jbr.middletier.recipe.model.MealRecipe;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MealMapper {

    @Mapping(target = "recipeCount", expression = "java(meal.getMealRecipes().size())")
    MealSummaryDto toSummaryDto(Meal meal);

    List<MealSummaryDto> toSummaryDtoList(List<Meal> meals);

    @Mapping(target = "recipes", source = "mealRecipes")
    MealDetailDto toDetailDto(Meal meal);

    @Mapping(target = "recipeId",          source = "recipe.id")
    @Mapping(target = "recipeTitle",        source = "recipe.title")
    @Mapping(target = "recipePrepTime",     source = "recipe.prepTime")
    @Mapping(target = "recipeCookTime",     source = "recipe.cookTime")
    @Mapping(target = "recipeBaseServings", source = "recipe.baseServings")
    MealRecipeDto toMealRecipeDto(MealRecipe mealRecipe);
}

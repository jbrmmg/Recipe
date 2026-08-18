package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.MealDetailDto;
import com.jbr.middletier.recipe.dto.MealDto;
import com.jbr.middletier.recipe.dto.MealSummaryDto;
import com.jbr.middletier.recipe.dto.mapper.MealMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.Meal;
import com.jbr.middletier.recipe.model.MealRecipe;
import com.jbr.middletier.recipe.model.Recipe;
import com.jbr.middletier.recipe.repository.MealRepository;
import com.jbr.middletier.recipe.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MealService {

    private final MealRepository mealRepository;
    private final RecipeRepository recipeRepository;
    private final MealMapper mealMapper;

    public List<MealSummaryDto> findAll() {
        return mealMapper.toSummaryDtoList(mealRepository.findAll());
    }

    public MealDetailDto findById(Long id) {
        return mealMapper.toDetailDto(getOrThrow(id));
    }

    @Transactional
    public MealDetailDto create(MealDto dto) {
        return mealMapper.toDetailDto(mealRepository.save(buildMeal(new Meal(), dto)));
    }

    @Transactional
    public MealDetailDto update(Long id, MealDto dto) {
        Meal meal = getOrThrow(id);
        meal.getMealRecipes().clear();
        return mealMapper.toDetailDto(mealRepository.save(buildMeal(meal, dto)));
    }

    @Transactional
    public void delete(Long id) {
        mealRepository.delete(getOrThrow(id));
    }

    private Meal buildMeal(Meal meal, MealDto dto) {
        meal.setName(dto.getName());
        meal.setNotes(dto.getNotes());

        List<com.jbr.middletier.recipe.dto.MealRecipeDto> items = dto.getRecipes();
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                var item = items.get(i);
                Recipe recipe = recipeRepository.findById(item.getRecipeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + item.getRecipeId()));
                MealRecipe mr = MealRecipe.builder()
                        .meal(meal)
                        .recipe(recipe)
                        .servings(item.getServings() > 0 ? item.getServings() : recipe.getBaseServings())
                        .displayOrder(i + 1)
                        .build();
                meal.getMealRecipes().add(mr);
            }
        }
        return meal;
    }

    private Meal getOrThrow(Long id) {
        return mealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal not found: " + id));
    }
}

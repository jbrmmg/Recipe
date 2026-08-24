package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.RecipeDetailDto;
import com.jbr.middletier.recipe.dto.RecipeDto;
import com.jbr.middletier.recipe.dto.RecipeSummaryDto;
import com.jbr.middletier.recipe.dto.mapper.RecipeMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.*;
import com.jbr.middletier.recipe.repository.IngredientRepository;
import com.jbr.middletier.recipe.repository.RecipeRepository;
import com.jbr.middletier.recipe.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final TagRepository tagRepository;
    private final RecipeMapper recipeMapper;

    public List<RecipeSummaryDto> findAll(String search, Long tagId) {
        List<Recipe> recipes;
        if (tagId != null) {
            recipes = recipeRepository.findByTagId(tagId);
        } else if (search != null && !search.isBlank()) {
            recipes = recipeRepository.findByTitleContainingIgnoreCase(search);
        } else {
            recipes = recipeRepository.findAll();
        }
        return recipeMapper.toSummaryDtoList(recipes);
    }

    public RecipeDetailDto findById(Long id) {
        return recipeMapper.toDetailDto(getOrThrow(id));
    }

    public List<RecipeSummaryDto> findByIngredients(List<Long> ingredientIds) {
        return recipeMapper.toSummaryDtoList(
                recipeRepository.findByAllIngredients(ingredientIds, ingredientIds.size()));
    }

    @Transactional
    public RecipeDetailDto create(RecipeDto dto) {
        Recipe recipe = buildRecipe(new Recipe(), dto);
        return recipeMapper.toDetailDto(recipeRepository.save(recipe));
    }

    @Transactional
    public RecipeDetailDto update(Long id, RecipeDto dto) {
        Recipe recipe = getOrThrow(id);
        recipe.getIngredients().clear();
        recipe.getSteps().clear();
        recipe.getTags().clear();
        buildRecipe(recipe, dto);
        return recipeMapper.toDetailDto(recipeRepository.save(recipe));
    }

    @Transactional
    public void delete(Long id) {
        recipeRepository.delete(getOrThrow(id));
    }

    private Recipe buildRecipe(Recipe recipe, RecipeDto dto) {
        recipe.setTitle(dto.getTitle());
        recipe.setDescription(dto.getDescription());
        recipe.setBaseServings(dto.getBaseServings());
        recipe.setCookTime(calculateCookTimeMinutes(dto.getSteps()));
        recipe.setImagePath(dto.getImagePath());

        // Resolve tags
        List<Tag> tags = dto.getTagIds().stream()
                .map(tagId -> tagRepository.findById(tagId)
                        .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + tagId)))
                .toList();
        recipe.getTags().addAll(tags);

        // Build ingredients
        dto.getIngredients().forEach(ingredientDto -> {
            Ingredient ingredient = ingredientRepository.findById(ingredientDto.getIngredientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ingredient not found: " + ingredientDto.getIngredientId()));
            RecipeIngredient ri = RecipeIngredient.builder()
                    .recipe(recipe)
                    .ingredient(ingredient)
                    .quantity(ingredientDto.getQuantity())
                    .unit(MeasurementUnit.valueOf(ingredientDto.getUnit()))
                    .notes(ingredientDto.getNotes())
                    .build();
            recipe.getIngredients().add(ri);
        });

        // Build steps
        dto.getSteps().forEach(stepDto -> {
            RecipeStep step = RecipeStep.builder()
                    .recipe(recipe)
                    .phase(StepPhase.valueOf(stepDto.getPhase()))
                    .stepOrder(stepDto.getStepOrder())
                    .parallelGroup(stepDto.getParallelGroup())
                    .description(stepDto.getDescription())
                    .durationSeconds(stepDto.getDurationSeconds())
                    .timerRequired(stepDto.isTimerRequired())
                    .build();
            recipe.getSteps().add(step);
        });

        return recipe;
    }

    private int calculateCookTimeMinutes(List<com.jbr.middletier.recipe.dto.RecipeStepDto> steps) {
        Map<Integer, Integer> parallelMaxSeconds = new HashMap<>();
        int totalSeconds = 0;
        for (var step : steps) {
            if (!"COOK".equals(step.getPhase())) continue;
            if (step.getParallelGroup() == null) {
                totalSeconds += step.getDurationSeconds();
            } else {
                parallelMaxSeconds.merge(step.getParallelGroup(), step.getDurationSeconds(), Math::max);
            }
        }
        totalSeconds += parallelMaxSeconds.values().stream().mapToInt(Integer::intValue).sum();
        return (int) Math.ceil(totalSeconds / 60.0);
    }

    private Recipe getOrThrow(Long id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + id));
    }
}

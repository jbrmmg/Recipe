package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.MealPlanDetailDto;
import com.jbr.middletier.recipe.dto.MealPlanDto;
import com.jbr.middletier.recipe.dto.MealPlanEntryDto;
import com.jbr.middletier.recipe.dto.MealPlanSummaryDto;
import com.jbr.middletier.recipe.dto.ShoppingListDto;
import com.jbr.middletier.recipe.dto.ShoppingListItemDto;
import com.jbr.middletier.recipe.dto.mapper.MealPlanMapper;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.Meal;
import com.jbr.middletier.recipe.model.MealPlan;
import com.jbr.middletier.recipe.model.MealPlanEntry;
import com.jbr.middletier.recipe.model.MealRecipe;
import com.jbr.middletier.recipe.model.RecipeIngredient;
import com.jbr.middletier.recipe.repository.MealPlanRepository;
import com.jbr.middletier.recipe.repository.MealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final MealRepository mealRepository;
    private final MealPlanMapper mealPlanMapper;

    public List<MealPlanSummaryDto> findAll() {
        return mealPlanMapper.toSummaryDtoList(
                mealPlanRepository.findAll(Sort.by(Sort.Direction.ASC, "date")));
    }

    public MealPlanDetailDto findById(Long id) {
        return mealPlanMapper.toDetailDto(getOrThrow(id));
    }

    @Transactional
    public MealPlanDetailDto create(MealPlanDto dto) {
        return mealPlanMapper.toDetailDto(mealPlanRepository.save(buildPlan(new MealPlan(), dto)));
    }

    @Transactional
    public MealPlanDetailDto update(Long id, MealPlanDto dto) {
        MealPlan plan = getOrThrow(id);
        plan.getEntries().clear();
        return mealPlanMapper.toDetailDto(mealPlanRepository.save(buildPlan(plan, dto)));
    }

    @Transactional
    public void delete(Long id) {
        mealPlanRepository.delete(getOrThrow(id));
    }

    private MealPlan buildPlan(MealPlan plan, MealPlanDto dto) {
        plan.setName(dto.getName());
        plan.setDate(dto.getDate());
        List<MealPlanEntryDto> items = dto.getEntries();
        if (items != null) {
            for (int i = 0; i < items.size(); i++) {
                MealPlanEntryDto item = items.get(i);
                Meal meal = mealRepository.findById(item.getMealId())
                        .orElseThrow(() -> new ResourceNotFoundException("Meal not found: " + item.getMealId()));
                MealPlanEntry entry = MealPlanEntry.builder()
                        .mealPlan(plan)
                        .meal(meal)
                        .dayLabel(item.getDayLabel())
                        .displayOrder(i + 1)
                        .build();
                plan.getEntries().add(entry);
            }
        }
        return plan;
    }

    public ShoppingListDto getShoppingList(Long planId) {
        MealPlan plan = getOrThrow(planId);

        Map<String, double[]> totals = new LinkedHashMap<>();
        Map<String, RecipeIngredient> firstSeen = new LinkedHashMap<>();

        for (MealPlanEntry planEntry : plan.getEntries()) {
            Meal meal = planEntry.getMeal();
            for (MealRecipe mealRecipe : meal.getMealRecipes()) {
                double scaleFactor = (double) mealRecipe.getServings() / mealRecipe.getRecipe().getBaseServings();
                for (RecipeIngredient ri : mealRecipe.getRecipe().getIngredients()) {
                    String key = ri.getIngredient().getId() + ":" + ri.getUnit();
                    totals.merge(key, new double[]{ri.getQuantity() * scaleFactor},
                            (a, b) -> new double[]{a[0] + b[0]});
                    firstSeen.putIfAbsent(key, ri);
                }
            }
        }

        List<ShoppingListItemDto> items = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : totals.entrySet()) {
            RecipeIngredient ri = firstSeen.get(entry.getKey());
            items.add(new ShoppingListItemDto(
                    ri.getIngredient().getId(),
                    ri.getIngredient().getName(),
                    ri.getIngredient().getCategory().name(),
                    ri.getUnit().name(),
                    entry.getValue()[0]
            ));
        }
        items.sort(Comparator.comparing(ShoppingListItemDto::getCategory)
                .thenComparing(ShoppingListItemDto::getIngredientName));

        ShoppingListDto dto = new ShoppingListDto();
        dto.setPlanName(plan.getName());
        dto.setDate(plan.getDate());
        dto.setItems(items);
        return dto;
    }

    private MealPlan getOrThrow(Long id) {
        return mealPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal plan not found: " + id));
    }
}

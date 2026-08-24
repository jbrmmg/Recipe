package com.jbr.middletier.recipe.service;

import com.jbr.middletier.recipe.dto.ShoppingListDetailDto;
import com.jbr.middletier.recipe.dto.ShoppingListItemDto;
import com.jbr.middletier.recipe.dto.ShoppingListSummaryDto;
import com.jbr.middletier.recipe.exception.ResourceNotFoundException;
import com.jbr.middletier.recipe.model.*;
import com.jbr.middletier.recipe.repository.MealPlanRepository;
import com.jbr.middletier.recipe.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final MealPlanRepository mealPlanRepository;

    public List<ShoppingListSummaryDto> findAll() {
        return shoppingListRepository.findAllByOrderByCreatedDateDesc().stream()
                .map(this::toSummaryDto)
                .toList();
    }

    public ShoppingListDetailDto findById(Long id) {
        return toDetailDto(getOrThrow(id));
    }

    @Transactional
    public ShoppingListDetailDto createFromMealPlan(Long mealPlanId) {
        MealPlan plan = mealPlanRepository.findById(mealPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal plan not found: " + mealPlanId));

        shoppingListRepository.findByMealPlanId(mealPlanId)
                .ifPresent(shoppingListRepository::delete);

        ShoppingList shoppingList = new ShoppingList();
        shoppingList.setName(plan.getName());
        shoppingList.setMealPlanId(mealPlanId);
        shoppingList.setItems(buildItems(shoppingList, plan));

        return toDetailDto(shoppingListRepository.save(shoppingList));
    }

    @Transactional
    public void delete(Long id) {
        shoppingListRepository.delete(getOrThrow(id));
    }

    private List<ShoppingListItem> buildItems(ShoppingList shoppingList, MealPlan plan) {
        Map<String, double[]> totals = new LinkedHashMap<>();
        Map<String, RecipeIngredient> firstSeen = new LinkedHashMap<>();

        for (MealPlanEntry entry : plan.getEntries()) {
            for (MealRecipe mealRecipe : entry.getMeal().getMealRecipes()) {
                double scale = (double) mealRecipe.getServings() / mealRecipe.getRecipe().getBaseServings();
                for (RecipeIngredient ri : mealRecipe.getRecipe().getIngredients()) {
                    String key = ri.getIngredient().getId() + ":" + ri.getUnit();
                    totals.merge(key, new double[]{ri.getQuantity() * scale}, (a, b) -> new double[]{a[0] + b[0]});
                    firstSeen.putIfAbsent(key, ri);
                }
            }
        }

        List<ShoppingListItem> items = new ArrayList<>();
        for (Map.Entry<String, double[]> e : totals.entrySet()) {
            RecipeIngredient ri = firstSeen.get(e.getKey());
            ShoppingListItem item = new ShoppingListItem();
            item.setShoppingList(shoppingList);
            item.setIngredientId(ri.getIngredient().getId());
            item.setIngredientName(ri.getIngredient().getName());
            item.setCategory(ri.getIngredient().getCategory().name());
            item.setUnit(ri.getUnit().name());
            item.setQuantity(e.getValue()[0]);
            items.add(item);
        }
        items.sort(Comparator.comparing(ShoppingListItem::getCategory)
                .thenComparing(ShoppingListItem::getIngredientName));
        return items;
    }

    private ShoppingListSummaryDto toSummaryDto(ShoppingList sl) {
        ShoppingListSummaryDto dto = new ShoppingListSummaryDto();
        dto.setId(sl.getId());
        dto.setName(sl.getName());
        dto.setMealPlanId(sl.getMealPlanId());
        dto.setCreatedDate(sl.getCreatedDate());
        dto.setItemCount(sl.getItems().size());
        return dto;
    }

    private ShoppingListDetailDto toDetailDto(ShoppingList sl) {
        ShoppingListDetailDto dto = new ShoppingListDetailDto();
        dto.setId(sl.getId());
        dto.setName(sl.getName());
        dto.setMealPlanId(sl.getMealPlanId());
        dto.setCreatedDate(sl.getCreatedDate());
        dto.setItems(sl.getItems().stream()
                .map(i -> new ShoppingListItemDto(i.getIngredientId(), i.getIngredientName(),
                        i.getCategory(), i.getUnit(), i.getQuantity()))
                .toList());
        return dto;
    }

    private ShoppingList getOrThrow(Long id) {
        return shoppingListRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping list not found: " + id));
    }
}

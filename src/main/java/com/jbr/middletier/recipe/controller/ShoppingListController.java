package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.ShoppingListDetailDto;
import com.jbr.middletier.recipe.dto.ShoppingListSummaryDto;
import com.jbr.middletier.recipe.service.ShoppingListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shopping-list")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    @GetMapping
    public List<ShoppingListSummaryDto> getAll() {
        return shoppingListService.findAll();
    }

    @GetMapping("/{id}")
    public ShoppingListDetailDto getById(@PathVariable Long id) {
        return shoppingListService.findById(id);
    }

    @PostMapping("/meal-plan/{mealPlanId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingListDetailDto createFromMealPlan(@PathVariable Long mealPlanId) {
        return shoppingListService.createFromMealPlan(mealPlanId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        shoppingListService.delete(id);
    }
}

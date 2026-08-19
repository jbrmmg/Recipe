package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.MealPlanDetailDto;
import com.jbr.middletier.recipe.dto.MealPlanDto;
import com.jbr.middletier.recipe.dto.MealPlanSummaryDto;
import com.jbr.middletier.recipe.dto.ShoppingListDto;
import com.jbr.middletier.recipe.service.MealPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meal-plan")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @GetMapping
    public List<MealPlanSummaryDto> getAll() {
        return mealPlanService.findAll();
    }

    @GetMapping("/{id}")
    public MealPlanDetailDto getById(@PathVariable("id") Long id) {
        return mealPlanService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealPlanDetailDto create(@Valid @RequestBody MealPlanDto dto) {
        return mealPlanService.create(dto);
    }

    @PutMapping("/{id}")
    public MealPlanDetailDto update(@PathVariable("id") Long id, @Valid @RequestBody MealPlanDto dto) {
        return mealPlanService.update(id, dto);
    }

    @GetMapping("/shopping-list")
    public ShoppingListDto getShoppingList(@RequestParam(name = "ids") List<Long> ids) {
        return mealPlanService.getShoppingList(ids);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        mealPlanService.delete(id);
    }
}

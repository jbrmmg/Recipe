package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.RecipeDetailDto;
import com.jbr.middletier.recipe.dto.RecipeDto;
import com.jbr.middletier.recipe.dto.RecipeSummaryDto;
import com.jbr.middletier.recipe.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipe")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public List<RecipeSummaryDto> getAll(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "tagId", required = false) Long tagId) {
        return recipeService.findAll(search, tagId);
    }

    @GetMapping("/{id}")
    public RecipeDetailDto getById(@PathVariable("id") Long id) {
        return recipeService.findById(id);
    }

    @GetMapping("/by-ingredient")
    public List<RecipeSummaryDto> findByIngredients(@RequestParam(name = "ingredientIds") List<Long> ingredientIds) {
        return recipeService.findByIngredients(ingredientIds);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeDetailDto create(@Valid @RequestBody RecipeDto dto) {
        return recipeService.create(dto);
    }

    @PutMapping("/{id}")
    public RecipeDetailDto update(@PathVariable("id") Long id, @Valid @RequestBody RecipeDto dto) {
        return recipeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        recipeService.delete(id);
    }
}

package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.IngredientDto;
import com.jbr.middletier.recipe.service.IngredientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ingredient")
@RequiredArgsConstructor
public class IngredientController {

    private final IngredientService ingredientService;

    @GetMapping
    public List<IngredientDto> getAll(@RequestParam(required = false) String search) {
        return ingredientService.findAll(search);
    }

    @GetMapping("/{id}")
    public IngredientDto getById(@PathVariable Long id) {
        return ingredientService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientDto create(@Valid @RequestBody IngredientDto dto) {
        return ingredientService.create(dto);
    }

    @PutMapping("/{id}")
    public IngredientDto update(@PathVariable Long id, @Valid @RequestBody IngredientDto dto) {
        return ingredientService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        ingredientService.delete(id);
    }
}

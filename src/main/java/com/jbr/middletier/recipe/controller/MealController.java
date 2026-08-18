package com.jbr.middletier.recipe.controller;

import com.jbr.middletier.recipe.dto.MealDetailDto;
import com.jbr.middletier.recipe.dto.MealDto;
import com.jbr.middletier.recipe.dto.MealSummaryDto;
import com.jbr.middletier.recipe.service.MealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meal")
@RequiredArgsConstructor
public class MealController {

    private final MealService mealService;

    @GetMapping
    public List<MealSummaryDto> getAll() {
        return mealService.findAll();
    }

    @GetMapping("/{id}")
    public MealDetailDto getById(@PathVariable("id") Long id) {
        return mealService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealDetailDto create(@Valid @RequestBody MealDto dto) {
        return mealService.create(dto);
    }

    @PutMapping("/{id}")
    public MealDetailDto update(@PathVariable("id") Long id, @Valid @RequestBody MealDto dto) {
        return mealService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        mealService.delete(id);
    }
}

package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RecipeDetailDto {
    private Long id;
    private String title;
    private String description;
    private int baseServings;
    private Integer prepTime;
    private Integer cookTime;
    private String imagePath;
    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;
    private List<TagDto> tags;
    private List<RecipeIngredientDto> ingredients;
    private List<RecipeStepDto> steps;
}

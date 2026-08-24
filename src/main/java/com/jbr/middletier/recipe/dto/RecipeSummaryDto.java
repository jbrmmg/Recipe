package com.jbr.middletier.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class RecipeSummaryDto {
    private Long id;
    private String title;
    private String description;
    private int baseServings;
    private Integer cookTime;
    private String imagePath;
    private List<String> tags;
}

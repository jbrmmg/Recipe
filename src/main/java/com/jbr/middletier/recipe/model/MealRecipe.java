package com.jbr.middletier.recipe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meal_recipe")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id", nullable = false)
    private Meal meal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false)
    private int servings;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}

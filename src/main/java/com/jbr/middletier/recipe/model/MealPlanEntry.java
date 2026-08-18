package com.jbr.middletier.recipe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meal_plan_entry")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealPlanEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_id", nullable = false)
    private Meal meal;

    @Column(name = "day_label")
    private String dayLabel;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;
}

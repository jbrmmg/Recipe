package com.jbr.middletier.recipe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe_step")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StepPhase phase;

    @Column(name = "step_order", nullable = false)
    private int stepOrder;

    @Column(name = "parallel_group")
    private Integer parallelGroup;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "timer_required", nullable = false)
    private boolean timerRequired;
}

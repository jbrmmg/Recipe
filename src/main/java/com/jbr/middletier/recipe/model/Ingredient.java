package com.jbr.middletier.recipe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ingredient")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_unit", nullable = false)
    private MeasurementUnit defaultUnit;

    @Column(name = "purchase_quantity", nullable = false)
    private double purchaseQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_unit", nullable = false)
    private MeasurementUnit purchaseUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IngredientCategory category;
}

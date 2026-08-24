package com.jbr.middletier.recipe.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shopping_list_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingList shoppingList;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    @Column(name = "ingredient_name", nullable = false)
    private String ingredientName;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private double quantity;
}

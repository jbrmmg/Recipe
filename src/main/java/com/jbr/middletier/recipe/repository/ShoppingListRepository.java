package com.jbr.middletier.recipe.repository;

import com.jbr.middletier.recipe.model.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, Long> {
    Optional<ShoppingList> findByMealPlanId(Long mealPlanId);
    List<ShoppingList> findAllByOrderByCreatedDateDesc();
}

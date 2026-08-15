package com.jbr.middletier.recipe.repository;

import com.jbr.middletier.recipe.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    List<Ingredient> findByNameContainingIgnoreCase(String name);
}

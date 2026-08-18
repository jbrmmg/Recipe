package com.jbr.middletier.recipe.repository;

import com.jbr.middletier.recipe.model.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
}

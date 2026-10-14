
package com.saiiyer.spendwise.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saiiyer.spendwise.entity.CategoryBudget;

public interface CategoryBudgetRepository
        extends JpaRepository<CategoryBudget, Long> {

    Optional<CategoryBudget> findByBudgetMonthAndCategory(
        LocalDate budgetMonth,
        String category
    );

    List<CategoryBudget> findByBudgetMonthOrderByCategoryAsc(
        LocalDate budgetMonth
    );
}

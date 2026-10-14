
package com.saiiyer.spendwise.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.saiiyer.spendwise.entity.MonthlyBudget;

public interface MonthlyBudgetRepository
        extends JpaRepository<MonthlyBudget, Long> {

    Optional<MonthlyBudget> findByBudgetMonth(LocalDate budgetMonth);
}

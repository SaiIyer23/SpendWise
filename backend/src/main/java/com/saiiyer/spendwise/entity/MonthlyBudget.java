
package com.saiiyer.spendwise.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "monthly_budgets",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_monthly_budget_month",
        columnNames = "budget_month"
    )
)
public class MonthlyBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stored as the first day of the month, e.g. 2026-10-01.
    @Column(name = "budget_month", nullable = false)
    private LocalDate budgetMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    protected MonthlyBudget() {
        // Required by JPA/Hibernate.
    }

    public MonthlyBudget(LocalDate budgetMonth, BigDecimal amount) {
        this.budgetMonth = budgetMonth;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getBudgetMonth() {
        return budgetMonth;
    }

    public void setBudgetMonth(LocalDate budgetMonth) {
        this.budgetMonth = budgetMonth;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}

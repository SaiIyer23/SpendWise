
package com.saiiyer.spendwise.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.saiiyer.spendwise.dto.MonthlyBudgetResponse;
import com.saiiyer.spendwise.dto.SetMonthlyBudgetRequest;
import com.saiiyer.spendwise.entity.MonthlyBudget;
import com.saiiyer.spendwise.repository.MonthlyBudgetRepository;

@Service
@Transactional
public class MonthlyBudgetService {

    private static final BigDecimal DEFAULT_MONTHLY_BUDGET =
        new BigDecimal("20000.00");

    private final MonthlyBudgetRepository monthlyBudgetRepository;

    public MonthlyBudgetService(
            MonthlyBudgetRepository monthlyBudgetRepository) {
        this.monthlyBudgetRepository = monthlyBudgetRepository;
    }

    public MonthlyBudgetResponse getCurrentBudget() {
        LocalDate firstDayOfMonth = YearMonth.now().atDay(1);

        MonthlyBudget budget = monthlyBudgetRepository
            .findByBudgetMonth(firstDayOfMonth)
            .orElseGet(() ->
                monthlyBudgetRepository.save(
                    new MonthlyBudget(
                        firstDayOfMonth,
                        DEFAULT_MONTHLY_BUDGET
                    )
                )
            );

        return toResponse(budget);
    }

    /**
     * Retrieve a previously saved budget for a selected month.
     * Unlike getCurrentBudget(), this method does not create a
     * budget for a historical month that has none.
     */
    @Transactional(readOnly = true)
    public MonthlyBudgetResponse getBudgetForMonth(String monthValue) {
        YearMonth month = parseMonth(monthValue);
        LocalDate firstDayOfMonth = month.atDay(1);

        MonthlyBudget budget = monthlyBudgetRepository
            .findByBudgetMonth(firstDayOfMonth)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No overall budget has been saved for " + month
            ));

        return toResponse(budget);
    }

    public MonthlyBudgetResponse setCurrentBudget(
            SetMonthlyBudgetRequest request) {
        LocalDate firstDayOfMonth = YearMonth.now().atDay(1);

        MonthlyBudget budget = monthlyBudgetRepository
            .findByBudgetMonth(firstDayOfMonth)
            .orElseGet(() ->
                new MonthlyBudget(firstDayOfMonth, request.amount())
            );

        budget.setAmount(request.amount());

        MonthlyBudget saved =
            monthlyBudgetRepository.save(budget);

        return toResponse(saved);
    }

    private YearMonth parseMonth(String value) {
        try {
            return YearMonth.parse(value);
        } catch (DateTimeParseException | NullPointerException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Month must use YYYY-MM format."
            );
        }
    }

    private MonthlyBudgetResponse toResponse(MonthlyBudget budget) {
        String month = YearMonth
            .from(budget.getBudgetMonth())
            .toString();

        return new MonthlyBudgetResponse(month, budget.getAmount());
    }
}

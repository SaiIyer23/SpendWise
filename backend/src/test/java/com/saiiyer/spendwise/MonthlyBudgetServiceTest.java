
package com.saiiyer.spendwise;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.YearMonth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.saiiyer.spendwise.dto.MonthlyBudgetResponse;
import com.saiiyer.spendwise.dto.SetMonthlyBudgetRequest;
import com.saiiyer.spendwise.service.MonthlyBudgetService;

@SpringBootTest
@Transactional
class MonthlyBudgetServiceTest {

    @Autowired
    private MonthlyBudgetService monthlyBudgetService;

    @Test
    void missingCurrentBudgetUsesDefaultAmount() {
        MonthlyBudgetResponse response =
            monthlyBudgetService.getCurrentBudget();

        assertEquals(YearMonth.now().toString(), response.month());
        assertEquals(
            0,
            new BigDecimal("20000.00").compareTo(response.amount())
        );
    }

    @Test
    void settingCurrentBudgetPersistsUpdatedAmount() {
        MonthlyBudgetResponse saved =
            monthlyBudgetService.setCurrentBudget(
                new SetMonthlyBudgetRequest(
                    new BigDecimal("25000.00")
                )
            );

        assertEquals(YearMonth.now().toString(), saved.month());
        assertEquals(
            0,
            new BigDecimal("25000.00").compareTo(saved.amount())
        );

        MonthlyBudgetResponse retrieved =
            monthlyBudgetService.getCurrentBudget();

        assertEquals(
            0,
            new BigDecimal("25000.00").compareTo(retrieved.amount())
        );
    }

    @Test
    void missingHistoricalBudgetReturnsNotFound() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> monthlyBudgetService.getBudgetForMonth("2000-01")
        );

        assertEquals(404, exception.getStatusCode().value());
    }
}

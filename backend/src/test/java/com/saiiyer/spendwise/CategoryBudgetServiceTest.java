
package com.saiiyer.spendwise;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.saiiyer.spendwise.dto.CategoryBudgetResponse;
import com.saiiyer.spendwise.dto.SetCategoryBudgetRequest;
import com.saiiyer.spendwise.repository.CategoryBudgetRepository;
import com.saiiyer.spendwise.service.CategoryBudgetService;

@SpringBootTest
@Transactional
class CategoryBudgetServiceTest {

    @Autowired
    private CategoryBudgetService categoryBudgetService;

    @Autowired
    private CategoryBudgetRepository categoryBudgetRepository;

    @Test
    void saveAndUpdateCategoryBudgetDoesNotCreateDuplicates() {
        categoryBudgetService.setCurrentCategoryBudget(
            new SetCategoryBudgetRequest(
                "Food",
                new BigDecimal("5000.00")
            )
        );

        CategoryBudgetResponse updated =
            categoryBudgetService.setCurrentCategoryBudget(
                new SetCategoryBudgetRequest(
                    "Food",
                    new BigDecimal("6000.00")
                )
            );

        assertEquals("Food", updated.category());
        assertEquals(YearMonth.now().toString(), updated.month());
        assertEquals(
            0,
            new BigDecimal("6000.00").compareTo(updated.amount())
        );

        var budgets =
            categoryBudgetService.getCurrentCategoryBudgets();

        assertEquals(1, budgets.size());
        assertEquals("Food", budgets.get(0).category());
        assertEquals(
            0,
            new BigDecimal("6000.00").compareTo(budgets.get(0).amount())
        );
    }

    @Test
    void settingZeroRemovesCategoryBudget() {
        LocalDate firstDayOfMonth = YearMonth.now().atDay(1);

        categoryBudgetService.setCurrentCategoryBudget(
            new SetCategoryBudgetRequest(
                "Transport",
                new BigDecimal("3000.00")
            )
        );

        categoryBudgetService.setCurrentCategoryBudget(
            new SetCategoryBudgetRequest(
                "Transport",
                BigDecimal.ZERO
            )
        );

        categoryBudgetRepository.flush();

        assertTrue(
            categoryBudgetRepository
                .findByBudgetMonthAndCategory(
                    firstDayOfMonth,
                    "Transport"
                )
                .isEmpty()
        );
    }

    @Test
    void unsupportedCategoryReturnsBadRequest() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> categoryBudgetService.setCurrentCategoryBudget(
                new SetCategoryBudgetRequest(
                    "Travel",
                    new BigDecimal("1000.00")
                )
            )
        );

        assertEquals(400, exception.getStatusCode().value());
    }
}

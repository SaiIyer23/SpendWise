
package com.saiiyer.spendwise.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.saiiyer.spendwise.dto.CategoryBudgetResponse;
import com.saiiyer.spendwise.dto.SetCategoryBudgetRequest;
import com.saiiyer.spendwise.entity.CategoryBudget;
import com.saiiyer.spendwise.repository.CategoryBudgetRepository;

@Service
@Transactional
public class CategoryBudgetService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Health",
        "Other"
    );

    private final CategoryBudgetRepository categoryBudgetRepository;

    public CategoryBudgetService(
            CategoryBudgetRepository categoryBudgetRepository) {
        this.categoryBudgetRepository = categoryBudgetRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryBudgetResponse> getCurrentCategoryBudgets() {
        return getCategoryBudgetsForMonth(YearMonth.now().toString());
    }

    /**
     * Return only category limits actually saved for the requested month.
     */
    @Transactional(readOnly = true)
    public List<CategoryBudgetResponse> getCategoryBudgetsForMonth(
            String monthValue) {
        YearMonth month = parseMonth(monthValue);
        LocalDate firstDayOfMonth = month.atDay(1);

        return categoryBudgetRepository
            .findByBudgetMonthOrderByCategoryAsc(firstDayOfMonth)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public CategoryBudgetResponse setCurrentCategoryBudget(
            SetCategoryBudgetRequest request) {
        LocalDate firstDayOfMonth = YearMonth.now().atDay(1);
        String category = request.category().trim();

        if (!ALLOWED_CATEGORIES.contains(category)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unsupported category: " + category
            );
        }

        var existing = categoryBudgetRepository
            .findByBudgetMonthAndCategory(firstDayOfMonth, category);

        if (request.amount().compareTo(BigDecimal.ZERO) == 0) {
            existing.ifPresent(categoryBudgetRepository::delete);

            return new CategoryBudgetResponse(
                YearMonth.from(firstDayOfMonth).toString(),
                category,
                BigDecimal.ZERO.setScale(2)
            );
        }

        CategoryBudget budget = existing.orElseGet(
            () -> new CategoryBudget(
                firstDayOfMonth,
                category,
                request.amount()
            )
        );

        budget.setAmount(request.amount());

        return toResponse(categoryBudgetRepository.save(budget));
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

    private CategoryBudgetResponse toResponse(CategoryBudget budget) {
        String month = YearMonth
            .from(budget.getBudgetMonth())
            .toString();

        return new CategoryBudgetResponse(
            month,
            budget.getCategory(),
            budget.getAmount()
        );
    }
}

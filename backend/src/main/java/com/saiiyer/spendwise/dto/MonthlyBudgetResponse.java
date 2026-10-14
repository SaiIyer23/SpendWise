
package com.saiiyer.spendwise.dto;

import java.math.BigDecimal;

public record MonthlyBudgetResponse(
    String month,
    BigDecimal amount
) {
}

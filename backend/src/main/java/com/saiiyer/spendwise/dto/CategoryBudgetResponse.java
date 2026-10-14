
package com.saiiyer.spendwise.dto;

import java.math.BigDecimal;

public record CategoryBudgetResponse(
    String month,
    String category,
    BigDecimal amount
) {
}

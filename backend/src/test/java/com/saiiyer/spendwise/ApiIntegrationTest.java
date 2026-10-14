
package com.saiiyer.spendwise;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createTransactionReturns201AndSavedDetails() throws Exception {
        String request = """
            {
              "description": "Test lunch",
              "amount": 250.00,
              "category": "Food",
              "transactionDate": "2026-10-13",
              "notes": "API integration test"
            }
            """;

        mockMvc.perform(
                post("/api/transactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.description").value("Test lunch"))
            .andExpect(jsonPath("$.amount").value(250.00))
            .andExpect(jsonPath("$.category").value("Food"))
            .andExpect(
                jsonPath("$.transactionDate").value("2026-10-13")
            )
            .andExpect(
                jsonPath("$.notes").value("API integration test")
            );
    }

    @Test
    void createTransactionRejectsInvalidRequest() throws Exception {
        String request = """
            {
              "description": " ",
              "amount": 0,
              "category": "",
              "transactionDate": null,
              "notes": null
            }
            """;

        mockMvc.perform(
                post("/api/transactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void getTransactionsReturns200AndJsonArray() throws Exception {
        mockMvc.perform(get("/api/transactions"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void updateMissingTransactionReturns404() throws Exception {
        String request = """
            {
              "description": "Updated expense",
              "amount": 125.00,
              "category": "Food",
              "transactionDate": "2026-10-13",
              "notes": null
            }
            """;

        mockMvc.perform(
                put("/api/transactions/999999")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteMissingTransactionReturns404() throws Exception {
        mockMvc.perform(delete("/api/transactions/999999"))
            .andExpect(status().isNotFound());
    }

    @Test
    void categoryBudgetCanBeSavedAndRetrieved() throws Exception {
        String request = """
            {
              "category": "Food",
              "amount": 5000.00
            }
            """;

        mockMvc.perform(
                put("/api/budgets/categories/current")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.category").value("Food"))
            .andExpect(jsonPath("$.amount").value(5000.00));

        mockMvc.perform(get("/api/budgets/categories/current"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].category").value("Food"))
            .andExpect(jsonPath("$[0].amount").value(5000.00));
    }

    @Test
    void unsupportedCategoryReturns400() throws Exception {
        String request = """
            {
              "category": "Travel",
              "amount": 1000.00
            }
            """;

        mockMvc.perform(
                put("/api/budgets/categories/current")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(request)
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    void missingHistoricalOverallBudgetReturns404() throws Exception {
        mockMvc.perform(
                get("/api/budgets")
                    .param("month", "2000-01")
            )
            .andExpect(status().isNotFound());
    }

    @Test
    void invalidHistoricalMonthReturns400() throws Exception {
        mockMvc.perform(
                get("/api/budgets")
                    .param("month", "invalid-month")
            )
            .andExpect(status().isBadRequest());
    }
}

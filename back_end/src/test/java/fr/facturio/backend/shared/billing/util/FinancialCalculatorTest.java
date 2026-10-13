package fr.facturio.backend.shared.billing.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import fr.facturio.backend.shared.billing.dto.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;

class FinancialCalculatorTest {
  private final FinancialCalculator calculator = new FinancialCalculator();

  @Test
  void appliesDiscountsVatAndAdditionalTax() {
    BillingDocumentRequest request =
        new BillingDocumentRequest(
            UUID.randomUUID(),
            null,
            null,
            LocalDate.now(),
            null,
            null,
            BigDecimal.ZERO,
            null,
            List.of(
                new BillingLineRequest(
                    null,
                    "Prestation",
                    "SERVICE",
                    new BigDecimal("2"),
                    new BigDecimal("100"),
                    "PERCENT",
                    new BigDecimal("10"),
                    new BigDecimal("20"))),
            new DiscountRequest("PERCENT", new BigDecimal("10")),
            true,
            List.of(new BillingTaxRequest(null, "Contribution", new BigDecimal("2"))),
            true);

    FinancialCalculator.Totals totals = calculator.calculate(request);

    assertEquals(new BigDecimal("180.00"), totals.subtotal());
    assertEquals(new BigDecimal("18.00"), totals.discount());
    assertEquals(new BigDecimal("32.40"), totals.vat());
    assertEquals(new BigDecimal("3.24"), totals.extraTaxes());
    assertEquals(new BigDecimal("197.64"), totals.total());
  }
}

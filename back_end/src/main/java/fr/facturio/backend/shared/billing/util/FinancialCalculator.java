package fr.facturio.backend.shared.billing.util;

import static java.math.RoundingMode.HALF_UP;

import fr.facturio.backend.shared.billing.dto.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class FinancialCalculator {
  private static final BigDecimal HUNDRED = new BigDecimal("100");

  public record CalculatedLine(
      BillingLineRequest source, BigDecimal net, BigDecimal vat, BigDecimal total) {}

  public record CalculatedTax(BillingTaxRequest source, BigDecimal base, BigDecimal amount) {}

  public record Totals(
      List<CalculatedLine> lines,
      List<CalculatedTax> taxes,
      BigDecimal subtotal,
      BigDecimal discount,
      BigDecimal vat,
      BigDecimal extraTaxes,
      BigDecimal total) {}

  public Totals calculate(BillingDocumentRequest request) {
    List<BigDecimal> rawLines = new ArrayList<>();
    BigDecimal subtotal = BigDecimal.ZERO;
    for (BillingLineRequest line : request.lines()) {
      BigDecimal gross = line.quantity().multiply(line.unitPrice());
      BigDecimal net = discount(gross, line.discountType(), line.discountValue());
      rawLines.add(net);
      subtotal = subtotal.add(net);
    }
    BigDecimal discounted =
        discount(subtotal, request.globalDiscount().type(), request.globalDiscount().value());
    BigDecimal ratio =
        subtotal.signum() == 0 ? BigDecimal.ONE : discounted.divide(subtotal, 12, HALF_UP);
    List<CalculatedLine> lines = new ArrayList<>();
    BigDecimal vat = BigDecimal.ZERO;
    for (int index = 0; index < request.lines().size(); index++) {
      BillingLineRequest source = request.lines().get(index);
      BigDecimal net = money(rawLines.get(index).multiply(ratio));
      BigDecimal lineVat =
          request.vatApplicable()
              ? money(net.multiply(source.vatRate()).divide(HUNDRED, 12, HALF_UP))
              : BigDecimal.ZERO;
      vat = vat.add(lineVat);
      lines.add(new CalculatedLine(source, net, lineVat, money(net.add(lineVat))));
    }
    List<CalculatedTax> taxes = new ArrayList<>();
    BigDecimal extra = BigDecimal.ZERO;
    for (BillingTaxRequest tax : request.extraTaxes()) {
      BigDecimal amount = money(discounted.multiply(tax.rate()).divide(HUNDRED, 12, HALF_UP));
      extra = extra.add(amount);
      taxes.add(new CalculatedTax(tax, money(discounted), amount));
    }
    return new Totals(
        lines,
        taxes,
        money(subtotal),
        money(subtotal.subtract(discounted)),
        money(vat),
        money(extra),
        money(discounted.add(vat).add(extra)));
  }

  private BigDecimal discount(BigDecimal base, String type, BigDecimal value) {
    BigDecimal result =
        "PERCENT".equals(type)
            ? base.subtract(base.multiply(value).divide(HUNDRED, 12, HALF_UP))
            : base.subtract(value);
    return result.max(BigDecimal.ZERO);
  }

  public static BigDecimal money(BigDecimal value) {
    return value.setScale(2, HALF_UP);
  }
}

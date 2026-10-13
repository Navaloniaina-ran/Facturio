package fr.facturio.backend.shared.billing.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import fr.facturio.backend.shared.billing.dto.BillingDocumentResponse;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;

@Service
public class DocumentExportService {
  public byte[] pdf(BillingDocumentResponse document) {
    String html =
        """
        <html><head><style>
        @page { size: A4; margin: 24mm; }
        body { font-family: sans-serif; color: #1f2937; }
        h1 { font-size: 24px; } table { width: 100%%; border-collapse: collapse; }
        th, td { padding: 8px; border-bottom: 1px solid #d1d5db; text-align: left; }
        .amount { text-align: right; }
        </style></head><body>
        <h1>%s %s</h1><p>Client : %s</p><p>Date : %s</p>
        <table><thead><tr><th>Description</th><th>Quantite</th><th class="amount">Total</th></tr></thead>
        <tbody>%s</tbody></table><p class="amount"><strong>Total : %s</strong></p>
        </body></html>
        """
            .formatted(
                escape(document.kind()),
                escape(document.number()),
                escape(document.customerName()),
                document.issueDate(),
                document.lines().stream()
                    .map(
                        line ->
                            "<tr><td>%s</td><td>%s</td><td class='amount'>%s</td></tr>"
                                .formatted(
                                    escape(line.description()),
                                    line.quantity(),
                                    line.totalAmount()))
                    .reduce("", String::concat),
                document.total());
    try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      new PdfRendererBuilder().withHtmlContent(html, null).toStream(output).run();
      return output.toByteArray();
    } catch (Exception exception) {
      throw new IllegalStateException("Impossible de generer le PDF", exception);
    }
  }

  public byte[] xml(BillingDocumentResponse document) {
    String xml =
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <Invoice xmlns="urn:facturio:invoice:1">
          <Number>%s</Number><IssueDate>%s</IssueDate><Customer>%s</Customer>
          <Total>%s</Total><Paid>%s</Paid>
        </Invoice>
        """
            .formatted(
                escape(document.number()),
                document.issueDate(),
                escape(document.customerName()),
                document.total(),
                document.paidAmount());
    return xml.getBytes(StandardCharsets.UTF_8);
  }

  private static String escape(String value) {
    if (value == null) return "";
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }
}

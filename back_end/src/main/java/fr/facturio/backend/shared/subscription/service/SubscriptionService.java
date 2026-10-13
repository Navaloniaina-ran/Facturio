package fr.facturio.backend.shared.subscription.service;

import fr.facturio.backend.common.exception.ApiException;
import fr.facturio.backend.common.util.CurrentWorkspace;
import fr.facturio.backend.shared.subscription.dto.*;
import fr.facturio.backend.shared.subscription.entity.*;
import fr.facturio.backend.shared.subscription.repository.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SubscriptionService {
  private final SubscriptionRepository subscriptions;
  private final PlatformInvoiceRepository invoices;
  private final CurrentWorkspace current;

  public SubscriptionService(
      SubscriptionRepository subscriptions,
      PlatformInvoiceRepository invoices,
      CurrentWorkspace current) {
    this.subscriptions = subscriptions;
    this.invoices = invoices;
    this.current = current;
  }

  public SubscriptionResponse get() {
    return response(find());
  }

  @Transactional
  public SubscriptionResponse change(SubscriptionChangeRequest request) {
    Subscription subscription = find();
    subscription.setPlanCode(request.plan());
    subscription.setBillingCycle(request.cycle());
    subscription.setStatus("ACTIVE");
    subscription.setCancelAtPeriodEnd(false);
    subscription.setNextBillingDate(
        "ANNUAL".equals(request.cycle())
            ? LocalDate.now().plusYears(1)
            : LocalDate.now().plusMonths(1));
    return response(subscriptions.save(subscription));
  }

  @Transactional
  public SubscriptionResponse cancel() {
    Subscription subscription = find();
    subscription.setCancelAtPeriodEnd(true);
    return response(subscriptions.save(subscription));
  }

  public List<PlatformInvoiceResponse> invoices() {
    return invoices.findAllByOrganizationIdOrderByDateDesc(current.organizationId()).stream()
        .map(
            invoice ->
                new PlatformInvoiceResponse(
                    invoice.getId(),
                    invoice.getNumber(),
                    invoice.getDate(),
                    invoice.getPlan(),
                    invoice.getCycle(),
                    invoice.getAmount(),
                    invoice.getStatus()))
        .toList();
  }

  private Subscription find() {
    return subscriptions
        .findByOrganizationId(current.organizationId())
        .orElseThrow(() -> ApiException.notFound("Abonnement"));
  }

  private SubscriptionResponse response(Subscription subscription) {
    return new SubscriptionResponse(
        subscription.getPlanCode(),
        subscription.getStatus(),
        subscription.getBillingCycle(),
        subscription.getStartDate(),
        subscription.getTrialEndDate(),
        subscription.getNextBillingDate(),
        subscription.isCancelAtPeriodEnd());
  }
}

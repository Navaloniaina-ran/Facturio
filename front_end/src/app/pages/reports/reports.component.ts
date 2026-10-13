import { Component, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { AmountPipe } from '../../shared/amount.pipe';
import { ReportService } from './report.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

/** Analyse de l'activité (P11) : ce qui rentre, ce qui traîne, ce qui rapporte. */
@Component({
  selector: 'app-reports',
  imports: [PageHeaderComponent, AmountPipe],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly service = inject(ReportService);

  protected readonly message = signal<string | null>(null);

  protected selectYear(year: number): void {
    this.service.selectYear(year);
  }

  protected exportCsv(): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(
      new Blob([this.service.toCsv()], { type: 'text/csv;charset=utf-8' }),
    );
    link.download = 'activity-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.message.set(this.i18n.t('reports.flash.exported'));
  }
}

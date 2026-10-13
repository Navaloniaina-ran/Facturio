package fr.facturio.backend.business.supplier.dto;

import fr.facturio.backend.business.supplier.entity.Supplier;
import java.math.BigDecimal;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-13T15:28:22+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Oracle Corporation)"
)
@Component
public class SupplierMapperImpl implements SupplierMapper {

    @Override
    public SupplierResponse toResponse(Supplier supplier) {
        if ( supplier == null ) {
            return null;
        }

        UUID id = null;
        String kind = null;
        String name = null;
        String contact = null;
        String email = null;
        String phone = null;
        String countryCode = null;
        String addressLine1 = null;
        String addressLine2 = null;
        String postalCode = null;
        String city = null;
        String siren = null;
        String siret = null;
        String vatNumber = null;
        String legalForm = null;
        BigDecimal shareCapital = null;
        String activityCode = null;
        String registryCity = null;
        int paymentTermsDays = 0;
        String iban = null;
        String defaultOperationNature = null;
        String notes = null;
        boolean active = false;

        id = supplier.getId();
        kind = supplier.getKind();
        name = supplier.getName();
        contact = supplier.getContact();
        email = supplier.getEmail();
        phone = supplier.getPhone();
        countryCode = supplier.getCountryCode();
        addressLine1 = supplier.getAddressLine1();
        addressLine2 = supplier.getAddressLine2();
        postalCode = supplier.getPostalCode();
        city = supplier.getCity();
        siren = supplier.getSiren();
        siret = supplier.getSiret();
        vatNumber = supplier.getVatNumber();
        legalForm = supplier.getLegalForm();
        shareCapital = supplier.getShareCapital();
        activityCode = supplier.getActivityCode();
        registryCity = supplier.getRegistryCity();
        paymentTermsDays = supplier.getPaymentTermsDays();
        iban = supplier.getIban();
        defaultOperationNature = supplier.getDefaultOperationNature();
        notes = supplier.getNotes();
        active = supplier.isActive();

        SupplierResponse supplierResponse = new SupplierResponse( id, kind, name, contact, email, phone, countryCode, addressLine1, addressLine2, postalCode, city, siren, siret, vatNumber, legalForm, shareCapital, activityCode, registryCity, paymentTermsDays, iban, defaultOperationNature, notes, active );

        return supplierResponse;
    }

    @Override
    public void update(SupplierRequest request, Supplier supplier) {
        if ( request == null ) {
            return;
        }

        supplier.setKind( request.kind() );
        supplier.setName( request.name() );
        supplier.setContact( request.contact() );
        supplier.setEmail( request.email() );
        supplier.setPhone( request.phone() );
        supplier.setCountryCode( request.countryCode() );
        supplier.setAddressLine1( request.addressLine1() );
        supplier.setAddressLine2( request.addressLine2() );
        supplier.setPostalCode( request.postalCode() );
        supplier.setCity( request.city() );
        supplier.setSiren( request.siren() );
        supplier.setSiret( request.siret() );
        supplier.setVatNumber( request.vatNumber() );
        supplier.setLegalForm( request.legalForm() );
        supplier.setShareCapital( request.shareCapital() );
        supplier.setActivityCode( request.activityCode() );
        supplier.setRegistryCity( request.registryCity() );
        supplier.setPaymentTermsDays( request.paymentTermsDays() );
        supplier.setIban( request.iban() );
        supplier.setDefaultOperationNature( request.defaultOperationNature() );
        supplier.setNotes( request.notes() );
        supplier.setActive( request.active() );
    }
}

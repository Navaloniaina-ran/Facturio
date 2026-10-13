package fr.facturio.backend.business.customer.dto;

import fr.facturio.backend.business.customer.entity.Customer;
import java.math.BigDecimal;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-13T15:28:23+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Oracle Corporation)"
)
@Component
public class CustomerMapperImpl implements CustomerMapper {

    @Override
    public CustomerResponse toResponse(Customer customer) {
        if ( customer == null ) {
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
        String notes = null;
        boolean active = false;
        String deliveryAddressLine1 = null;
        String deliveryAddressLine2 = null;
        String deliveryPostalCode = null;
        String deliveryCity = null;
        String deliveryCountryCode = null;
        BigDecimal creditLimit = null;

        id = customer.getId();
        kind = customer.getKind();
        name = customer.getName();
        contact = customer.getContact();
        email = customer.getEmail();
        phone = customer.getPhone();
        countryCode = customer.getCountryCode();
        addressLine1 = customer.getAddressLine1();
        addressLine2 = customer.getAddressLine2();
        postalCode = customer.getPostalCode();
        city = customer.getCity();
        siren = customer.getSiren();
        siret = customer.getSiret();
        vatNumber = customer.getVatNumber();
        legalForm = customer.getLegalForm();
        shareCapital = customer.getShareCapital();
        activityCode = customer.getActivityCode();
        registryCity = customer.getRegistryCity();
        paymentTermsDays = customer.getPaymentTermsDays();
        notes = customer.getNotes();
        active = customer.isActive();
        deliveryAddressLine1 = customer.getDeliveryAddressLine1();
        deliveryAddressLine2 = customer.getDeliveryAddressLine2();
        deliveryPostalCode = customer.getDeliveryPostalCode();
        deliveryCity = customer.getDeliveryCity();
        deliveryCountryCode = customer.getDeliveryCountryCode();
        creditLimit = customer.getCreditLimit();

        CustomerResponse customerResponse = new CustomerResponse( id, kind, name, contact, email, phone, countryCode, addressLine1, addressLine2, postalCode, city, siren, siret, vatNumber, legalForm, shareCapital, activityCode, registryCity, paymentTermsDays, notes, active, deliveryAddressLine1, deliveryAddressLine2, deliveryPostalCode, deliveryCity, deliveryCountryCode, creditLimit );

        return customerResponse;
    }

    @Override
    public void update(CustomerRequest request, Customer customer) {
        if ( request == null ) {
            return;
        }

        customer.setName( request.name() );
        customer.setContact( request.contact() );
        customer.setEmail( request.email() );
        customer.setPhone( request.phone() );
        customer.setCountryCode( request.countryCode() );
        customer.setAddressLine1( request.addressLine1() );
        customer.setAddressLine2( request.addressLine2() );
        customer.setPostalCode( request.postalCode() );
        customer.setCity( request.city() );
        customer.setPaymentTermsDays( request.paymentTermsDays() );
        customer.setNotes( request.notes() );
        customer.setActive( request.active() );
        customer.setKind( request.kind() );
        customer.setSiren( request.siren() );
        customer.setSiret( request.siret() );
        customer.setVatNumber( request.vatNumber() );
        customer.setLegalForm( request.legalForm() );
        customer.setShareCapital( request.shareCapital() );
        customer.setActivityCode( request.activityCode() );
        customer.setRegistryCity( request.registryCity() );
        customer.setDeliveryAddressLine1( request.deliveryAddressLine1() );
        customer.setDeliveryAddressLine2( request.deliveryAddressLine2() );
        customer.setDeliveryPostalCode( request.deliveryPostalCode() );
        customer.setDeliveryCity( request.deliveryCity() );
        customer.setDeliveryCountryCode( request.deliveryCountryCode() );
        customer.setCreditLimit( request.creditLimit() );
    }
}

package fr.facturio.backend.creator.brand.dto;

import fr.facturio.backend.creator.brand.entity.Brand;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-13T15:28:23+0300",
    comments = "version: 1.6.3, compiler: javac, environment: Java 21.0.11 (Oracle Corporation)"
)
@Component
public class BrandMapperImpl implements BrandMapper {

    @Override
    public BrandResponse toResponse(Brand brand) {
        if ( brand == null ) {
            return null;
        }

        UUID id = null;
        String name = null;
        String contact = null;
        String email = null;
        String phone = null;
        String address = null;
        String countryCode = null;
        int paymentTermsDays = 0;
        String notes = null;
        boolean remindersPaused = false;

        id = brand.getId();
        name = brand.getName();
        contact = brand.getContact();
        email = brand.getEmail();
        phone = brand.getPhone();
        address = brand.getAddress();
        countryCode = brand.getCountryCode();
        paymentTermsDays = brand.getPaymentTermsDays();
        notes = brand.getNotes();
        remindersPaused = brand.isRemindersPaused();

        BrandResponse brandResponse = new BrandResponse( id, name, contact, email, phone, address, countryCode, paymentTermsDays, notes, remindersPaused );

        return brandResponse;
    }

    @Override
    public void update(BrandRequest request, Brand brand) {
        if ( request == null ) {
            return;
        }

        brand.setName( request.name() );
        brand.setContact( request.contact() );
        brand.setEmail( request.email() );
        brand.setPhone( request.phone() );
        brand.setCountryCode( request.countryCode() );
        brand.setAddress( request.address() );
        brand.setPaymentTermsDays( request.paymentTermsDays() );
        brand.setNotes( request.notes() );
    }
}

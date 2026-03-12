package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Cliente;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de clientes (search unificado o nombre, documento, email, activo).
 */
public final class ClienteSpecs {

    private ClienteSpecs() {
    }

    public static Specification<Cliente> withFilters(String search, String nombre, String documento, String email, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("nombreCompleto")), pattern),
                    cb.like(cb.lower(root.get("documentoIdentidad")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("telefono")), pattern),
                    cb.like(cb.lower(root.get("direccion")), pattern),
                    cb.like(cb.lower(root.get("provincia")), pattern),
                    cb.like(cb.lower(root.get("canton")), pattern),
                    cb.like(cb.lower(root.get("pais")), pattern)
                ));
            } else {
                if (nombre != null && !nombre.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("nombreCompleto")), "%" + nombre.trim().toLowerCase() + "%"));
                }
                if (documento != null && !documento.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("documentoIdentidad")), "%" + documento.trim().toLowerCase() + "%"));
                }
                if (email != null && !email.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("email")), "%" + email.trim().toLowerCase() + "%"));
                }
                if (activo != null) {
                    predicates.add(cb.equal(root.get("activo"), activo));
                }
            }
            return predicates.isEmpty() ? null : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

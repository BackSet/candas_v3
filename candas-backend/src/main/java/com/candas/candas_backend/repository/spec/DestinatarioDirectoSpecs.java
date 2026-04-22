package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.DestinatarioDirecto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de destinatarios directos.
 * Search cubre nombre, teléfono, dirección, cantón, código y nombre de empresa.
 */
public final class DestinatarioDirectoSpecs {

    private DestinatarioDirectoSpecs() {
    }

    public static Specification<DestinatarioDirecto> withFilters(String search, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("nombreDestinatario"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("telefonoDestinatario"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("direccionDestinatario"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("canton"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("codigo"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("nombreEmpresa"), "")), pattern)
                ));
            }
            if (activo != null) {
                predicates.add(cb.equal(root.get("activo"), activo));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

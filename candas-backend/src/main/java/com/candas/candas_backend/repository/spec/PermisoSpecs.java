package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Permiso;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de permisos (search por nombre/descripción/recurso/acción, recurso, accion).
 */
public final class PermisoSpecs {

    private PermisoSpecs() {
    }

    public static Specification<Permiso> withFilters(String search, String recurso, String accion) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("nombre"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("descripcion"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("recurso"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("accion"), "")), pattern)
                ));
            }
            if (recurso != null && !recurso.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("recurso")), recurso.trim().toLowerCase()));
            }
            if (accion != null && !accion.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("accion")), accion.trim().toLowerCase()));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

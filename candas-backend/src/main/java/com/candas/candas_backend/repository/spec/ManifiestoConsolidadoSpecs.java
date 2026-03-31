package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.ManifiestoConsolidado;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de manifiestos consolidados (search, numeroManifiesto, idAgencia, periodo).
 */
public final class ManifiestoConsolidadoSpecs {

    private ManifiestoConsolidadoSpecs() {
    }

    public static Specification<ManifiestoConsolidado> withFilters(
            String search,
            String numeroManifiesto,
            Long idAgencia,
            Integer mes,
            Integer anio) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("numeroManifiesto")), pattern),
                    cb.like(cb.lower(root.get("usuarioGenerador")), pattern)
                ));
            } else {
                if (numeroManifiesto != null && !numeroManifiesto.isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("numeroManifiesto")), "%" + numeroManifiesto.trim().toLowerCase() + "%"));
                }
            }
            if (idAgencia != null) {
                predicates.add(cb.equal(root.join("agenciaPropietaria", JoinType.LEFT).get("idAgencia"), idAgencia));
            }
            if (mes != null) {
                predicates.add(cb.equal(root.get("mes"), mes));
            }
            if (anio != null) {
                predicates.add(cb.equal(root.get("anio"), anio));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

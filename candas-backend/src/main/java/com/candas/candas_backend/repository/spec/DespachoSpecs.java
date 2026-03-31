package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Despacho;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de despachos (search, fechas, tipo destino, alcance por agencia propietaria).
 */
public final class DespachoSpecs {

    private DespachoSpecs() {
    }

    public static Specification<Despacho> withFilters(
            String search,
            LocalDateTime fechaDesde,
            LocalDateTime fechaHasta,
            String tipoDestino,
            Long idAgenciaRestringida) {
        return (Root<Despacho> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var usuarioJoin = root.join("usuarioRegistro", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroManifiesto")), pattern),
                        cb.like(cb.lower(usuarioJoin.get("username")), pattern),
                        cb.like(cb.lower(usuarioJoin.get("nombreCompleto")), pattern)
                ));
            }
            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaDespacho"), fechaDesde));
            }
            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaDespacho"), fechaHasta));
            }
            if (tipoDestino != null && !tipoDestino.isBlank()) {
                if ("AGENCIA".equalsIgnoreCase(tipoDestino.trim())) {
                    predicates.add(cb.isNotNull(root.get("agencia")));
                } else if ("DIRECTO".equalsIgnoreCase(tipoDestino.trim())) {
                    predicates.add(cb.isNotNull(root.get("destinatarioDirecto")));
                }
            }
            if (idAgenciaRestringida != null) {
                predicates.add(cb.equal(
                        root.join("agenciaPropietaria", JoinType.LEFT).get("idAgencia"),
                        idAgenciaRestringida
                ));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

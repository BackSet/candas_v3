package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Saca;
import com.candas.candas_backend.entity.enums.TamanoSaca;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Specifications de filtrado y alcance por agencia para el listado de sacas.
 */
public final class SacaSpecs {

    private SacaSpecs() {
    }

    public static Specification<Saca> despachoRegistradorEnAgencia(Long idAgenciaRestringida) {
        return (root, query, cb) -> {
            var despachoJoin = root.join("despacho", JoinType.INNER);
            var usuarioJoin = despachoJoin.join("usuarioRegistro", JoinType.LEFT);
            var agenciaJoin = usuarioJoin.join("agencia", JoinType.LEFT);
            return cb.equal(agenciaJoin.get("idAgencia"), idAgenciaRestringida);
        };
    }

    /**
     * Filtros opcionales: search (codigoQR o numeroManifiesto del despacho), idDespacho, tamano,
     * y alcance por agencia restringida (mismo criterio que {@link #despachoRegistradorEnAgencia}).
     */
    public static Specification<Saca> withFilters(
            String search,
            Long idDespacho,
            TamanoSaca tamano,
            Long idAgenciaRestringida) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var despachoJoin = root.join("despacho", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("codigoQr")), pattern),
                        cb.like(cb.lower(despachoJoin.get("numeroManifiesto")), pattern)
                ));
            }
            if (idDespacho != null) {
                var despachoJoin = root.join("despacho", JoinType.LEFT);
                predicates.add(cb.equal(despachoJoin.get("idDespacho"), idDespacho));
            }
            if (tamano != null) {
                predicates.add(cb.equal(root.get("tamano"), tamano));
            }
            if (idAgenciaRestringida != null) {
                var despachoJoin = root.join("despacho", JoinType.INNER);
                var usuarioJoin = despachoJoin.join("usuarioRegistro", JoinType.LEFT);
                var agenciaJoin = usuarioJoin.join("agencia", JoinType.LEFT);
                predicates.add(cb.equal(agenciaJoin.get("idAgencia"), idAgenciaRestringida));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

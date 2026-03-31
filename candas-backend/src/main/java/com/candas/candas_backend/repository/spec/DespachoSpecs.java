package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Agencia;
import com.candas.candas_backend.entity.Despacho;
import com.candas.candas_backend.entity.Usuario;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications para filtrado opcional del listado de despachos (search, fechas, tipo destino, alcance por agencia del registrador).
 */
public final class DespachoSpecs {

    private DespachoSpecs() {
    }

    /**
     * @param idAgenciaRestringida si no es null, solo despachos cuyo {@code usuarioRegistro} corresponde a un {@link Usuario}
     *                               con esa agencia asignada.
     */
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
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("numeroManifiesto")), pattern),
                        cb.like(cb.lower(root.get("usuarioRegistro")), pattern)
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
                predicates.add(cb.exists(subqueryRegistradorEnAgencia(root, query, cb, idAgenciaRestringida)));
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Subquery<Integer> subqueryRegistradorEnAgencia(
            Root<Despacho> despachoRoot,
            CriteriaQuery<?> query,
            CriteriaBuilder cb,
            Long idAgenciaRestringida) {
        Subquery<Integer> sq = query.subquery(Integer.class);
        Root<Usuario> u = sq.from(Usuario.class);
        sq.select(cb.literal(1));
        Join<Usuario, Agencia> ag = u.join("agencia", JoinType.INNER);
        sq.where(
                cb.equal(u.get("username"), despachoRoot.get("usuarioRegistro")),
                cb.equal(ag.get("idAgencia"), idAgenciaRestringida)
        );
        return sq;
    }
}

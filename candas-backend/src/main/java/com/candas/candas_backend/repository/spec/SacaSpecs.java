package com.candas.candas_backend.repository.spec;

import com.candas.candas_backend.entity.Saca;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

/**
 * Sacas cuyo despacho asociado fue registrado por un usuario de la agencia indicada.
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
}

package com.candas.candas_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.BatchSize;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "usuario",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_usuario_username", columnNames = "username"),
           @UniqueConstraint(name = "uk_usuario_email", columnNames = "email")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "username", unique = true, nullable = false, length = 100)
    private String username;

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "nombre_completo", nullable = false, length = 255)
    private String nombreCompleto;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "cuenta_no_expirada", nullable = false)
    private Boolean cuentaNoExpirada = true;

    @Column(name = "cuenta_no_bloqueada", nullable = false)
    private Boolean cuentaNoBloqueada = true;

    @Column(name = "credenciales_no_expiradas", nullable = false)
    private Boolean credencialesNoExpiradas = true;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agencia")
    private Agencia agencia;

    @BatchSize(size = 32)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "usuario_agencia",
            joinColumns = @JoinColumn(name = "id_usuario"),
            inverseJoinColumns = @JoinColumn(name = "id_agencia")
    )
    private Set<Agencia> agencias;

    @BatchSize(size = 32)
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UsuarioRol> usuarioRoles;

    // Implementación de UserDetails para Spring Security (solo roles directos por usuario_rol)
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        java.util.Set<String> authorities = new java.util.HashSet<>();
        if (usuarioRoles != null) {
            usuarioRoles.stream()
                .filter(UsuarioRol::getActivo)
                .map(UsuarioRol::getRol)
                .filter(Rol::getActivo)
                .forEach(rol -> authorities.add("ROLE_" + rol.getNombre()));
        }
        return authorities.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() {
        return cuentaNoExpirada;
    }

    @Override
    public boolean isAccountNonLocked() {
        return cuentaNoBloqueada;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return credencialesNoExpiradas;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }
}


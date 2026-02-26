package com.candas.candas_backend.security;

import com.candas.candas_backend.entity.Usuario;
import com.candas.candas_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        Set<String> roleNames = new HashSet<>(usuarioRepository.findActiveRoleNamesByUsername(username));
        Set<String> permissionNames = new HashSet<>(usuarioRepository.findActivePermissionNamesByUsername(username));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        // Roles -> ROLE_*
        for (String role : roleNames) {
            if (role == null || role.isBlank()) continue;
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        // Permisos -> nombre tal cual (ej: paquetes:ver)
        for (String perm : permissionNames) {
            if (perm == null || perm.isBlank()) continue;
            authorities.add(new SimpleGrantedAuthority(perm));
        }

        return new CustomUserDetails(
                usuario.getUsername(),
                usuario.getPassword(),
                Boolean.TRUE.equals(usuario.getActivo()),
                Boolean.TRUE.equals(usuario.getCuentaNoExpirada()),
                Boolean.TRUE.equals(usuario.getCuentaNoBloqueada()),
                Boolean.TRUE.equals(usuario.getCredencialesNoExpiradas()),
                authorities
        );
    }

    public List<String> getRolesForUsername(String username) {
        return usuarioRepository.findActiveRoleNamesByUsername(username).stream().sorted().toList();
    }

    public List<String> getPermisosForUsername(String username) {
        return usuarioRepository.findActivePermissionNamesByUsername(username).stream().sorted().toList();
    }
}


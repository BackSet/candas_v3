package com.candas.candas_backend.service;

import com.candas.candas_backend.dto.LoginRequest;
import com.candas.candas_backend.dto.LoginResponse;
import com.candas.candas_backend.entity.Usuario;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.repository.UsuarioRepository;
import com.candas.candas_backend.security.CustomUserDetailsService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final UserDetailsService userDetailsService;
    private final CustomUserDetailsService customUserDetailsService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            UserDetailsService userDetailsService,
            CustomUserDetailsService customUserDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.userDetailsService = userDetailsService;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
            String token = jwtService.generateToken(userDetails);

            Usuario usuario = usuarioRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new BadRequestException("Usuario no encontrado"));

            // Actualizar último acceso
            usuario.setUltimoAcceso(java.time.LocalDateTime.now());
            usuarioRepository.save(usuario);

            List<String> roles = customUserDetailsService.getRolesForUsername(usuario.getUsername());
            List<String> permisos = customUserDetailsService.getPermisosForUsername(usuario.getUsername());

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setIdUsuario(usuario.getIdUsuario());
            response.setUsername(usuario.getUsername());
            response.setEmail(usuario.getEmail());
            response.setNombreCompleto(usuario.getNombreCompleto());
            response.setRoles(roles);
            response.setPermisos(permisos);
            response.setIdAgencia(usuario.getAgencia() != null ? usuario.getAgencia().getIdAgencia() : null);

            return response;
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Credenciales inválidas");
        }
    }
}

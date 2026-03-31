package com.candas.candas_backend.controller;

import com.candas.candas_backend.dto.LoginRequest;
import com.candas.candas_backend.dto.LoginResponse;
import com.candas.candas_backend.dto.PerfilUsuarioUpdateDTO;
import com.candas.candas_backend.dto.UsuarioDTO;
import com.candas.candas_backend.entity.Rol;
import com.candas.candas_backend.entity.Usuario;
import com.candas.candas_backend.exception.BadRequestException;
import com.candas.candas_backend.repository.RolRepository;
import com.candas.candas_backend.repository.UsuarioRepository;
import com.candas.candas_backend.security.CustomUserDetailsService;
import com.candas.candas_backend.service.AuthService;
import com.candas.candas_backend.service.JwtService;
import com.candas.candas_backend.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints para autenticación de usuarios")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;
    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            UsuarioService usuarioService,
            RolRepository rolRepository,
            UsuarioRepository usuarioRepository,
            CustomUserDetailsService customUserDetailsService,
            JwtService jwtService) {
        this.authService = authService;
        this.usuarioService = usuarioService;
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.customUserDetailsService = customUserDetailsService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario y retorna un token JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Obtener usuario actual", description = "Retorna el usuario autenticado actual con roles y permisos")
    public ResponseEntity<LoginResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : null;

        if (username == null || username.isBlank()) {
            throw new BadRequestException("Usuario no autenticado");
        }

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("Usuario no encontrado"));

        return ResponseEntity.ok(construirLoginResponse(usuario, null));
    }

    @PutMapping("/me")
    @Operation(summary = "Actualizar perfil propio", description = "Actualiza datos básicos del usuario autenticado y devuelve token renovado")
    public ResponseEntity<LoginResponse> updateMe(@Valid @RequestBody PerfilUsuarioUpdateDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String usernameActual = authentication != null ? authentication.getName() : null;
        if (usernameActual == null || usernameActual.isBlank()) {
            throw new BadRequestException("Usuario no autenticado");
        }

        Usuario usuarioActualizado = usuarioService.actualizarPerfilPropio(usernameActual, dto);
        var userDetails = customUserDetailsService.loadUserByUsername(usuarioActualizado.getUsername());
        String nuevoToken = jwtService.generateToken(userDetails);
        return ResponseEntity.ok(construirLoginResponse(usuarioActualizado, nuevoToken));
    }

    @PostMapping("/register")
    @Operation(summary = "Registrar nuevo usuario", description = "Crea un nuevo usuario en el sistema. Por defecto se asigna el rol OPERARIO")
    public ResponseEntity<UsuarioDTO> register(@Valid @RequestBody UsuarioDTO dto) {
        // Asignar rol OPERARIO por defecto si no se especifica
        if (dto.getRoles() == null || dto.getRoles().isEmpty()) {
            Rol rolOperario = rolRepository.findByNombre("OPERARIO")
                .orElseThrow(() -> new BadRequestException("Rol OPERARIO no encontrado. Por favor, asegúrese de que la base de datos esté inicializada correctamente."));
            dto.setRoles(List.of(rolOperario.getIdRol()));
        }
        return new ResponseEntity<>(usuarioService.create(dto), HttpStatus.CREATED);
    }

    private LoginResponse construirLoginResponse(Usuario usuario, String token) {
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setType("Bearer");
        response.setIdUsuario(usuario.getIdUsuario());
        response.setUsername(usuario.getUsername());
        response.setEmail(usuario.getEmail());
        response.setNombreCompleto(usuario.getNombreCompleto());
        response.setRoles(customUserDetailsService.getRolesForUsername(usuario.getUsername()));
        response.setPermisos(customUserDetailsService.getPermisosForUsername(usuario.getUsername()));
        response.setIdAgencia(usuario.getAgencia() != null ? usuario.getAgencia().getIdAgencia() : null);
        response.setIdAgencias(usuario.getAgencias() != null
                ? usuario.getAgencias().stream().map(a -> a.getIdAgencia()).toList()
                : List.of());
        return response;
    }
}

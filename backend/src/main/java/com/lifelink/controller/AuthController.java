package com.lifelink.config;

import com.lifelink.model.User;
import com.lifelink.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UserRepository users;
    public AuthController(UserRepository users){this.users=users;}

    @PostMapping("/login")
public ResponseEntity<?> login(
        @RequestBody Map<String, String> body,
        HttpSession session) {

    String username = body.get("username");
    String password = body.get("password");
    String role = body.get("role");

    // Convert role to lowercase
    if (role != null) {
        role = role.toLowerCase();
    }

    User u = users.findByUsernameAndPasswordAndRole(
            username,
            password,
            role
    ).orElse(null);

    if (u == null) {
        return ResponseEntity
                .status(401)
                .body(Map.of("message", "Invalid credentials"));
    }

    session.setAttribute("userId", u.getId());
    session.setAttribute("username", u.getUsername());
    session.setAttribute("role", u.getRole());

    return ResponseEntity.ok(
            Map.of(
                    "username", u.getUsername(),
                    "role", u.getRole(),
                    "fullName", u.getFullName()
            )
    );
}

    @PostMapping("/logout")
    public Map<String,String> logout(HttpSession session){
        session.invalidate();
        return Map.of("message","Logged out");
    }
}

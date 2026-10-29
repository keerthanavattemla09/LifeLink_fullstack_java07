
package com.lifelink.controller;

import com.lifelink.model.User;
import com.lifelink.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository users;

    public AuthController(UserRepository users) {
        this.users = users;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");

        if (username == null || password == null || role == null
                || username.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Enter username, password and role."
                    ));
        }

        username = username.trim();
        role = role.trim().toLowerCase();

        User user = users.findByUsernameAndPasswordAndRole(
                username, password, role
        ).orElse(null);

        if (user == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid credentials."));
        }

        HttpSession session = request.getSession(true);

        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        session.setAttribute("role", user.getRole());

        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "fullName", user.getFullName(),
                "message", "Login successful"
        ));
    }

    @GetMapping("/session")
    public ResponseEntity<?> checkSession(HttpSession session) {

        Object userId = session.getAttribute("userId");
        Object username = session.getAttribute("username");
        Object role = session.getAttribute("role");

        if (userId == null || username == null || role == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Not logged in"));
        }

        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "username", username,
                "role", role
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully.")
        );
    }
}

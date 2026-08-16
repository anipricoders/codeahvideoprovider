package com.codeah.server_spring.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class WebController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        String originalUri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        if (originalUri != null && (originalUri.startsWith("/api") || originalUri.startsWith("/uploads") || originalUri.startsWith("/h2-console"))) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Resource not found");
        }
        return "forward:/index.html";
    }
}

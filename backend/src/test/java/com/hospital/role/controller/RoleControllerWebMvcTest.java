package com.hospital.role.controller;

import com.hospital.role.dto.RoleResponse;
import com.hospital.role.service.RoleService;
import com.hospital.security.HospitalUserDetailsService;
import com.hospital.testsupport.HospitalWebMvcSecurity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RoleController.class)
@HospitalWebMvcSecurity
class RoleControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoleService roleService;

    @MockBean
    private HospitalUserDetailsService hospitalUserDetailsService;

    @Test
    void listRolesReturnsOk() throws Exception {
        when(roleService.findAll(false)).thenReturn(List.of(new RoleResponse(1L, "ADMINISTRADOR", "Admin", true)));

        mockMvc.perform(get("/api/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("ADMINISTRADOR"));
    }
}

package com.hospital.security;

import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HospitalUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public HospitalUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameWithRoleFetched(username.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new HospitalUserDetails(user);
    }
}

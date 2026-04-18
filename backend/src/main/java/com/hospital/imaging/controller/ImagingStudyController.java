package com.hospital.imaging.controller;

import com.hospital.imaging.dto.ImagingStudyCreateRequest;
import com.hospital.imaging.dto.ImagingStudyResponse;
import com.hospital.imaging.dto.ImagingStudyUpdateRequest;
import com.hospital.imaging.service.ImagingStudyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/imaging")
public class ImagingStudyController {

    private final ImagingStudyService imagingStudyService;

    public ImagingStudyController(ImagingStudyService imagingStudyService) {
        this.imagingStudyService = imagingStudyService;
    }

    @GetMapping
    public List<ImagingStudyResponse> list(@RequestParam(required = false) Long medicalOrderId) {
        if (medicalOrderId != null) {
            return List.of(imagingStudyService.findByMedicalOrderId(medicalOrderId));
        }
        return imagingStudyService.findAll();
    }

    @GetMapping("/{id}")
    public ImagingStudyResponse get(@PathVariable Long id) {
        return imagingStudyService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImagingStudyResponse create(@Valid @RequestBody ImagingStudyCreateRequest request) {
        return imagingStudyService.create(request);
    }

    @PutMapping("/{id}")
    public ImagingStudyResponse update(@PathVariable Long id, @Valid @RequestBody ImagingStudyUpdateRequest request) {
        return imagingStudyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        imagingStudyService.delete(id);
    }
}

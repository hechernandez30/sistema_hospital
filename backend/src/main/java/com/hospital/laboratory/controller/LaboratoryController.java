package com.hospital.laboratory.controller;

import com.hospital.laboratory.attachment.LaboratoryAttachmentService;
import com.hospital.laboratory.dto.LaboratoryAttachmentMetadataResponse;
import com.hospital.laboratory.dto.LaboratoryCreateRequest;
import com.hospital.laboratory.dto.LaboratoryResponse;
import com.hospital.laboratory.dto.LaboratoryUpdateRequest;
import com.hospital.laboratory.service.LaboratoryService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/laboratory")
public class LaboratoryController {

    private final LaboratoryService laboratoryService;
    private final LaboratoryAttachmentService laboratoryAttachmentService;

    public LaboratoryController(
            LaboratoryService laboratoryService,
            LaboratoryAttachmentService laboratoryAttachmentService) {
        this.laboratoryService = laboratoryService;
        this.laboratoryAttachmentService = laboratoryAttachmentService;
    }

    @GetMapping
    public List<LaboratoryResponse> list(@RequestParam(required = false) Long medicalOrderId) {
        if (medicalOrderId != null) {
            return List.of(laboratoryService.findByMedicalOrderId(medicalOrderId));
        }
        return laboratoryService.findAll();
    }

    @GetMapping("/{id}")
    public LaboratoryResponse get(@PathVariable Long id) {
        return laboratoryService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LaboratoryResponse create(@Valid @RequestBody LaboratoryCreateRequest request) {
        return laboratoryService.create(request);
    }

    @PutMapping("/{id}")
    public LaboratoryResponse update(@PathVariable Long id, @Valid @RequestBody LaboratoryUpdateRequest request) {
        return laboratoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        laboratoryService.delete(id);
    }

    @PostMapping(value = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LaboratoryResponse uploadAttachment(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return laboratoryAttachmentService.upload(id, file);
    }

    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        return laboratoryAttachmentService.download(id);
    }

    @GetMapping("/{id}/attachment/metadata")
    public LaboratoryAttachmentMetadataResponse getAttachmentMetadata(@PathVariable Long id) {
        return laboratoryAttachmentService.getMetadata(id);
    }

    @DeleteMapping("/{id}/attachment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(@PathVariable Long id) {
        laboratoryAttachmentService.delete(id);
    }
}

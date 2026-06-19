package com.hospital.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /** {@code local} for development; {@code azure} for cloud (Azure Blob Storage). */
    private String type = "local";

    private long maxAttachmentBytes = 10_485_760L;

    private final Local local = new Local();
    private final Azure azure = new Azure();

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getMaxAttachmentBytes() {
        return maxAttachmentBytes;
    }

    public void setMaxAttachmentBytes(long maxAttachmentBytes) {
        this.maxAttachmentBytes = maxAttachmentBytes;
    }

    public Local getLocal() {
        return local;
    }

    public Azure getAzure() {
        return azure;
    }

    public static class Local {
        private String basePath = "./data/uploads";

        public String getBasePath() {
            return basePath;
        }

        public void setBasePath(String basePath) {
            this.basePath = basePath;
        }
    }

    public static class Azure {
        private String connectionString = "";
        private String containerName = "hospital-attachments";

        public String getConnectionString() {
            return connectionString;
        }

        public void setConnectionString(String connectionString) {
            this.connectionString = connectionString;
        }

        public String getContainerName() {
            return containerName;
        }

        public void setContainerName(String containerName) {
            this.containerName = containerName;
        }
    }
}

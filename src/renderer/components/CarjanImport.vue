<template>
  <div class="carjan-import">
    <div class="import-header">
      <h3>
        <i class="pi pi-folder-open"></i>
        File Manager
      </h3>
      <p class="subtitle">Import scenarios and maps</p>
    </div>

    <!-- File Upload -->
    <Card class="file-section glass">
      <template #title>Import Files</template>
      <template #content>
        <FileUpload
          mode="basic"
          :multiple="true"
          accept=".json,.xml,.rdf"
          :maxFileSize="10000000"
          choose-label="Select Files"
          @upload="onFileUpload"
          @select="onFileSelect"
        />
        <p class="file-hint">Supported formats: JSON, XML, RDF</p>
      </template>
    </Card>

    <!-- Recent Files -->
    <Card class="file-section glass">
      <template #title>Recent Files</template>
      <template #content>
        <div class="file-list">
          <div
            v-for="file in recentFiles"
            :key="file.id"
            class="file-item"
            @click="loadFile(file)"
          >
            <i :class="getFileIcon(file.type)"></i>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">{{ file.size }} • {{ file.date }}</div>
            </div>
            <Button
              icon="pi pi-download"
              text
              size="small"
              @click.stop="loadFile(file)"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Quick Start -->
    <Card class="file-section glass">
      <template #title>Quick Start</template>
      <template #content>
        <div class="quick-actions">
          <Button
            label="New Scenario"
            icon="pi pi-plus"
            @click="createNewScenario"
            severity="success"
            size="small"
          />
          <Button
            label="Load Sample"
            icon="pi pi-play"
            @click="loadSampleScenario"
            severity="info"
            size="small"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";

const toast = useToast();

defineEmits(["map-loaded", "scenario-loaded"]);

const recentFiles = ref([
  {
    id: "1",
    name: "sample_scenario.json",
    type: "scenario",
    size: "15 KB",
    date: "2 days ago",
  },
  {
    id: "2",
    name: "urban_map.xml",
    type: "map",
    size: "8 KB",
    date: "1 week ago",
  },
]);

const getFileIcon = (type) => {
  const icons = {
    scenario: "pi pi-file",
    map: "pi pi-map",
    config: "pi pi-cog",
  };
  return icons[type] || "pi pi-file";
};

const onFileSelect = (event) => {
  const files = event.files;
  if (files && files.length > 0) {
    toast.add({
      severity: "info",
      summary: "Files Selected",
      detail: `${files.length} file(s) ready to upload`,
      life: 2000,
    });
  }
};

const onFileUpload = (event) => {
  // Handle file upload
  toast.add({
    severity: "success",
    summary: "Upload Complete",
    detail: "Files uploaded successfully",
    life: 3000,
  });
};

const loadFile = (file) => {
  // Simulate file loading
  toast.add({
    severity: "info",
    summary: "Loading File",
    detail: `Loading ${file.name}...`,
    life: 2000,
  });
};

const createNewScenario = () => {
  toast.add({
    severity: "success",
    summary: "New Scenario",
    detail: "Created new empty scenario",
    life: 2000,
  });
};

const loadSampleScenario = () => {
  // Load sample data
  const sampleScenario = {
    scenarioName: "#SampleScenario",
    scenarioMap: "Town01",
    weather: "Clear",
    category: "Urban",
    entities: [],
    paths: [],
    waypoints: [],
    dboxes: [],
  };

  toast.add({
    severity: "success",
    summary: "Sample Loaded",
    detail: "Sample scenario has been loaded",
    life: 3000,
  });
};
</script>

<style scoped>
.carjan-import {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.import-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.1rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.file-hint {
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-item i {
  font-size: 1.5rem;
  color: #2196f3;
}

.file-info {
  flex: 1;
}

.file-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.file-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
}

:deep(.p-card-content) {
  color: white !important;
}
</style>

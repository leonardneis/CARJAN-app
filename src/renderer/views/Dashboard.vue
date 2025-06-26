<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ expanded: sidebarExpanded }">
      <div class="sidebar-content">
        <div
          v-for="item in menuItems"
          :key="item.name"
          class="sidebar-item"
          :class="{ active: activeItem === item.name }"
          @mouseenter="expandSidebar"
          @mouseleave="collapseSidebar"
          @click="selectItem(item.name)"
        >
          <i :class="item.icon" class="sidebar-icon"></i>
          <span class="sidebar-label" v-show="sidebarExpanded">{{
            item.label
          }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="content-header">
        <h1 class="page-title">{{ currentPageTitle }}</h1>
      </div>

      <div class="content-body">
        <!-- File Manager Component -->
        <Card v-if="activeItem === 'home'" class="glass file-manager-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-folder-open"></i>
              <span>Dateien</span>
            </div>
          </template>
          <template #content>
            <DataTable
              :value="files"
              class="glass-table"
              :paginator="true"
              :rows="10"
              :loading="loading"
              responsiveLayout="scroll"
            >
              <Column field="name" header="Name" sortable>
                <template #body="{ data }">
                  <div class="file-item">
                    <i :class="getFileIcon(data.type)" class="file-icon"></i>
                    <span>{{ data.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="type" header="Typ" sortable></Column>
              <Column field="size" header="Größe" sortable></Column>
              <Column field="modified" header="Geändert" sortable>
                <template #body="{ data }">
                  {{ formatDate(data.modified) }}
                </template>
              </Column>
              <Column header="Aktionen">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-text glass-button"
                    @click="editFile(data)"
                    v-tooltip="'Bearbeiten'"
                  />
                  <Button
                    icon="pi pi-download"
                    class="p-button-rounded p-button-text glass-button"
                    @click="downloadFile(data)"
                    v-tooltip="'Herunterladen'"
                  />
                </template>
              </Column>
            </DataTable>

            <Button
              label="Replay animation"
              icon="pi pi-replay"
              class="glass p-4"
              @click="splashreload()"
            />
          </template>
        </Card>
        <!-- CARJAN Editor -->
        <Card v-if="activeItem === 'editor'" class="glass editor-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-code"></i>
              <span>CARJAN Editor</span>
            </div>
          </template>
          <template #content>
            <div class="editor-content">
              <div class="editor-info">
                <h3>CARJAN Scenario Editor</h3>
                <p>
                  Create and edit CARLA simulation scenarios with an intuitive
                  grid-based interface.
                </p>

                <div class="editor-features">
                  <div class="feature">
                    <i class="pi pi-th-large"></i>
                    <span>Interactive Grid</span>
                  </div>
                  <div class="feature">
                    <i class="pi pi-users"></i>
                    <span>Entity Management</span>
                  </div>
                  <div class="feature">
                    <i class="pi pi-share-alt"></i>
                    <span>Path Planning</span>
                  </div>
                  <div class="feature">
                    <i class="pi pi-map"></i>
                    <span>Map Integration</span>
                  </div>
                </div>
              </div>

              <div class="editor-actions">
                <Button
                  label="Open CARJAN Editor"
                  icon="pi pi-external-link"
                  class="glass editor-launch-btn"
                  @click="openCarjanEditor"
                  size="large"
                />
                <Button
                  label="Load Sample Scenario"
                  icon="pi pi-play"
                  severity="info"
                  outlined
                  @click="loadSampleScenario"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Settings Placeholder -->
        <Card v-if="activeItem === 'settings'" class="glass settings-card">
          <template #title>
            <div class="card-header">
              <i class="pi pi-cog"></i>
              <span>Einstellungen</span>
            </div>
          </template>
          <template #content>
            <div class="settings-placeholder">
              <i class="pi pi-cog" style="font-size: 4rem; opacity: 0.3"></i>
              <h3>Einstellungen</h3>
              <p>Hier werden die App-Einstellungen konfiguriert.</p>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { motion } from "motion-v";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";

// Reactive state
const sidebarExpanded = ref(false);
const activeItem = ref("home");
const loading = ref(false);
const router = useRouter();

// Menu items
const menuItems = [
  { name: "home", label: "Home", icon: "pi pi-home" },
  { name: "editor", label: "Editor", icon: "pi pi-code" },
  { name: "settings", label: "Einstellungen", icon: "pi pi-cog" },
];

// Sample file data
const files = ref([
  {
    name: "projekt1.carjan",
    type: "CARJAN",
    size: "2.4 MB",
    modified: new Date("2024-12-10"),
  },
  {
    name: "agent_config.json",
    type: "JSON",
    size: "156 KB",
    modified: new Date("2024-12-09"),
  },
  {
    name: "dokumentation.md",
    type: "Markdown",
    size: "45 KB",
    modified: new Date("2024-12-08"),
  },
  {
    name: "beispiel.rdf",
    type: "RDF",
    size: "89 KB",
    modified: new Date("2024-12-07"),
  },
]);

// Computed properties
const currentPageTitle = computed(() => {
  const item = menuItems.find((item) => item.name === activeItem.value);
  return item ? item.label : "Dashboard";
});

// Methods
const expandSidebar = () => {
  sidebarExpanded.value = true;
  motion(".sidebar", {
    width: 250,
    transition: { duration: 0.3, easing: "ease-out" },
  });
};

const collapseSidebar = () => {
  sidebarExpanded.value = false;
  motion(".sidebar", {
    width: 80,
    transition: { duration: 0.3, easing: "ease-out" },
  });
};

const selectItem = (itemName) => {
  activeItem.value = itemName;
};

const getFileIcon = (type) => {
  const iconMap = {
    CARJAN: "pi pi-file",
    JSON: "pi pi-file-edit",
    Markdown: "pi pi-file-word",
    RDF: "pi pi-sitemap",
  };
  return iconMap[type] || "pi pi-file";
};

function splashreload() {
  console.log("[Dashboard] Reloading splash animation");
  const revealEl = document.querySelector(".reveal-mask");
  if (revealEl) {
    revealEl.style.width = "0px";
    setTimeout(() => {
      revealEl.style.width = "350px";
    }, 100);
  }
  router.push("/splash");
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const editFile = (file) => {
  console.log("Edit file:", file.name);
  // TODO: Implement file editing
};

const downloadFile = (file) => {
  console.log("Download file:", file.name);
  // TODO: Implement file download
};

const openCarjanEditor = () => {
  console.log("[Dashboard] Opening CARJAN Editor");
  router.push("/carjan");
};

const loadSampleScenario = () => {
  console.log("[Dashboard] Loading sample scenario");
  // Navigate to editor with sample data
  router.push({
    name: "CarjanEditor",
    query: { loadSample: "true" },
  });
};

// Lifecycle
onMounted(() => {
  // Initialize any required components
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
}

/* Sidebar Styles */
.sidebar {
  width: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: width 0.3s ease;
  overflow: hidden;
  position: fixed;
  height: 100vh;
  z-index: 1000;
}

.sidebar.expanded {
  width: 250px;
}

.sidebar-content {
  padding: 2rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  margin: 0.5rem 1rem;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-icon {
  font-size: 1.25rem;
  min-width: 24px;
}

.sidebar-label {
  margin-left: 1rem;
  white-space: nowrap;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.sidebar.expanded .sidebar-label {
  opacity: 1;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Main Content Styles */
.main-content {
  flex: 1;
  margin-left: 80px;
  padding: 2rem;
  transition: margin-left 0.3s ease;
}

.content-header {
  margin-bottom: 2rem;
}

.page-title {
  color: white;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0;
}

.content-body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Card Styles */
.file-manager-card,
.editor-card,
.settings-card {
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.25rem;
}

.card-header i {
  font-size: 1.5rem;
}

/* File Manager Styles */
.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
}

.glass-button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Placeholder Styles */
.editor-placeholder,
.settings-placeholder {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.7);
}

.editor-placeholder h3,
.settings-placeholder h3 {
  color: white;
  margin: 1rem 0;
}

/* DataTable Custom Styles */
:deep(.p-datatable) {
  background: transparent;
  border: none;
}

:deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.p-paginator) {
  background: transparent;
  border: none;
  color: white;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

:deep(.p-paginator .p-paginator-pages .p-paginator-page:hover) {
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }

  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.expanded {
    transform: translateX(0);
  }

  .page-title {
    font-size: 2rem;
  }
}
</style>

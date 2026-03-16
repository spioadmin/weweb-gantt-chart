<template>
  <div
    class="gantt-container"
    :style="containerStyles"
    role="application"
    aria-label="Gantt – Anstehende Punkte"
  >
    <!-- Row 1: View tabs + Time scale + Date navigation -->
    <div class="gantt-controls gantt-controls-row1" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
      <div class="view-controls">
        <span class="control-label" :style="{ color: content.corTexto }">Ansicht</span>
        <button
          v-for="v in visibleViewTypesList"
          :key="v.value"
          :class="['view-btn', { active: currentViewType === v.value }]"
          :style="getViewTypeButtonStyles(v.value)"
          @click="setViewType(v.value)"
        >
          {{ v.label }}
        </button>
      </div>
      <div class="time-scale-controls">
        <span class="control-label" :style="{ color: content.corTexto }">Zeitskala</span>
        <button
          v-for="modo in timeScaleOptions"
          :key="modo.value"
          :class="['scale-btn', { active: visualizacaoAtual === modo.value }]"
          :style="getButtonStyles(modo.value)"
          @click="alterarVisualizacao(modo.value)"
        >
          {{ modo.label }}
        </button>
      </div>
      <div class="navigation-controls">
        <button class="nav-btn" :style="navButtonStyles" @click="navegarMes(-1)" aria-label="Vorheriger Zeitraum">‹</button>
        <span class="current-period" :style="{ color: content.corTexto }">{{ periodoAtual }}</span>
        <button class="nav-btn" :style="navButtonStyles" @click="navegarMes(1)" aria-label="Nächster Zeitraum">›</button>
      </div>
    </div>

    <!-- Row 2: Filters (Projekt / Phase / Mitarbeiter / Gewerke) with clear labels -->
    <div v-if="currentViewType === 'projekte' || currentViewType === 'projektebene' || showGewerkeFilter || showMitarbeiterFilter" class="gantt-controls gantt-controls-row2" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
      <span class="filter-section-label" :style="{ color: content.corTexto }">Filter</span>
      <div v-if="currentViewType === 'projekte' || currentViewType === 'projektebene'" class="filter-group filter-group-dropdown" ref="projektDropdownRef">
        <label class="filter-label" :style="{ color: content.corTexto }">Projekt</label>
        <div class="dropdown-trigger-wrap">
          <button
            type="button"
            class="dropdown-trigger"
            :style="dropdownTriggerStyles"
            :aria-expanded="projektDropdownOpen"
            @click="projektDropdownOpen = !projektDropdownOpen; projektSearchQuery = ''"
          >
            <span class="dropdown-trigger-text">{{ projektDropdownLabel }}</span>
            <span class="dropdown-chevron" :class="{ open: projektDropdownOpen }">▼</span>
          </button>
          <div v-show="projektDropdownOpen" class="dropdown-panel" :style="dropdownPanelStyles">
            <div class="dropdown-search-wrap">
              <input
                v-model="projektSearchQuery"
                type="text"
                class="dropdown-search"
                :style="dropdownSearchStyles"
                placeholder="Suchen…"
                @click.stop
              />
            </div>
            <div class="dropdown-panel-inner">
              <template v-if="projectOptions.length === 0">
                <div class="dropdown-empty" :style="{ color: content.corTexto }">Keine Projekte</div>
              </template>
              <template v-else>
                <label
                  v-for="p in filteredProjectOptions"
                  :key="p.id"
                  class="dropdown-option checkbox-option"
                  :style="{ color: content.corTexto }"
                >
                  <input
                    type="checkbox"
                    :checked="effectiveSelectedProjektIds.includes(String(p.id))"
                    @change="toggleProjekt(p.id)"
                  />
                  <span>{{ p.name || p.id || '–' }}</span>
                </label>
              </template>
            </div>
            <div class="dropdown-panel-footer" :style="{ borderColor: content.corBorda, color: content.corTexto }">
              <button type="button" class="dropdown-close-btn" :style="dropdownTriggerStyles" @click="projektDropdownOpen = false">Schließen</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentViewType === 'projektebene'" class="filter-group filter-group-dropdown" ref="phaseDropdownRef">
        <label class="filter-label" :style="{ color: content.corTexto }">Phase</label>
        <div class="dropdown-trigger-wrap">
          <button
            type="button"
            class="dropdown-trigger"
            :style="dropdownTriggerStyles"
            :aria-expanded="phaseDropdownOpen"
            @click="phaseDropdownOpen = !phaseDropdownOpen; phaseSearchQuery = ''"
          >
            <span class="dropdown-trigger-text">{{ phaseDropdownLabel }}</span>
            <span class="dropdown-chevron" :class="{ open: phaseDropdownOpen }">▼</span>
          </button>
          <div v-show="phaseDropdownOpen" class="dropdown-panel" :style="dropdownPanelStyles">
            <div class="dropdown-search-wrap">
              <input
                v-model="phaseSearchQuery"
                type="text"
                class="dropdown-search"
                :style="dropdownSearchStyles"
                placeholder="Suchen…"
                @click.stop
              />
            </div>
            <div class="dropdown-panel-inner">
              <button type="button" class="dropdown-option single-option" :class="{ selected: effectivePhaseId === '' }" :style="{ color: content.corTexto }" @click="selectPhase('')">Alle Phasen</button>
              <button v-for="p in filteredPhaseOptions" :key="String(p.id)" type="button" class="dropdown-option single-option" :class="{ selected: effectivePhaseId === String(p.id) }" :style="{ color: content.corTexto }" @click="selectPhase(p.id)">{{ p.name }}</button>
              <div v-if="filteredPhaseOptions.length === 0 && phaseOptions.length > 0" class="dropdown-empty" :style="{ color: content.corTexto }">Keine Treffer</div>
              <div v-else-if="phaseOptions.length === 0" class="dropdown-empty" :style="{ color: content.corTexto }">Keine Phasen</div>
            </div>
            <div class="dropdown-panel-footer" :style="{ borderColor: content.corBorda, color: content.corTexto }">
              <button type="button" class="dropdown-close-btn" :style="dropdownTriggerStyles" @click="phaseDropdownOpen = false">Schließen</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showMitarbeiterFilter" class="filter-group filter-group-dropdown" ref="mitarbeiterDropdownRef">
        <label class="filter-label" :style="{ color: content.corTexto }">Mitarbeiter</label>
        <div class="dropdown-trigger-wrap">
          <button
            type="button"
            class="dropdown-trigger"
            :style="dropdownTriggerStyles"
            :aria-expanded="mitarbeiterDropdownOpen"
            @click="mitarbeiterDropdownOpen = !mitarbeiterDropdownOpen; mitarbeiterSearchQuery = ''"
          >
            <span class="dropdown-trigger-text">{{ mitarbeiterDropdownLabel }}</span>
            <span class="dropdown-chevron" :class="{ open: mitarbeiterDropdownOpen }">▼</span>
          </button>
          <div v-show="mitarbeiterDropdownOpen" class="dropdown-panel" :style="dropdownPanelStyles">
            <div class="dropdown-search-wrap">
              <input
                v-model="mitarbeiterSearchQuery"
                type="text"
                class="dropdown-search"
                :style="dropdownSearchStyles"
                placeholder="Suchen…"
                @click.stop
              />
            </div>
            <div class="dropdown-panel-inner">
              <button type="button" class="dropdown-option single-option" :class="{ selected: !effectiveSelectedMitarbeiterId }" :style="{ color: content.corTexto }" @click="selectMitarbeiter('')">– auswählen –</button>
              <button v-for="m in filteredMitarbeiterList" :key="m.id" type="button" class="dropdown-option single-option" :class="{ selected: String(effectiveSelectedMitarbeiterId) === String(m.id) }" :style="{ color: content.corTexto }" @click="selectMitarbeiter(m.id)">{{ mitarbeiterLabel(m) }}</button>
              <div v-if="filteredMitarbeiterList.length === 0 && mitarbeiterList.length > 0" class="dropdown-empty" :style="{ color: content.corTexto }">Keine Treffer</div>
              <div v-else-if="mitarbeiterList.length === 0" class="dropdown-empty" :style="{ color: content.corTexto }">Keine Mitarbeiter</div>
            </div>
            <div class="dropdown-panel-footer" :style="{ borderColor: content.corBorda, color: content.corTexto }">
              <button type="button" class="dropdown-close-btn" :style="dropdownTriggerStyles" @click="mitarbeiterDropdownOpen = false">Schließen</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showGewerkeFilter" class="filter-group filter-group-gewerke filter-group-dropdown" ref="gewerkeDropdownRef">
        <label class="filter-label" :style="{ color: content.corTexto }">Gewerke</label>
        <div class="dropdown-trigger-wrap">
          <button
            type="button"
            class="dropdown-trigger"
            :style="dropdownTriggerStyles"
            :aria-expanded="gewerkeDropdownOpen"
            aria-haspopup="listbox"
            @click="gewerkeDropdownOpen = !gewerkeDropdownOpen"
          >
            <span class="dropdown-trigger-text">{{ gewerkeDropdownLabel }}</span>
            <span class="dropdown-chevron" :class="{ open: gewerkeDropdownOpen }">▼</span>
          </button>
          <div v-show="gewerkeDropdownOpen" class="dropdown-panel" :style="dropdownPanelStyles">
            <div class="dropdown-search-wrap">
              <input
                v-model="gewerkeSearchQuery"
                type="text"
                class="dropdown-search"
                :style="dropdownSearchStyles"
                placeholder="Suchen…"
                @click.stop
              />
            </div>
            <div class="dropdown-panel-inner">
              <label
                v-if="showOhneGewerkInFilter"
                class="dropdown-option checkbox-option"
                :style="{ color: content.corTexto }"
              >
                <input
                  type="checkbox"
                  :checked="effectiveSelectedGewerkIds.includes('__null__')"
                  @change="toggleGewerk('__null__')"
                />
                <span>Ohne Gewerk</span>
              </label>
              <template v-if="gewerkeList.length === 0">
                <div class="dropdown-empty" :style="{ color: content.corTexto }">Keine Gewerke geladen</div>
              </template>
              <template v-else>
                <label
                  v-for="g in filteredGewerkeList"
                  :key="g.id"
                  class="dropdown-option checkbox-option"
                  :style="{ color: content.corTexto }"
                >
                  <input
                    type="checkbox"
                    :checked="effectiveSelectedGewerkIds.includes(String(g.id))"
                    @change="toggleGewerk(g.id)"
                  />
                  <span>{{ (g.name ?? g.label) || g.id || '–' }}</span>
                </label>
              </template>
            </div>
            <div class="dropdown-panel-footer" :style="{ borderColor: content.corBorda, color: content.corTexto }">
              <button type="button" class="dropdown-close-btn" :style="dropdownTriggerStyles" @click="gewerkeDropdownOpen = false">Schließen</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="gantt-header" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
      <div class="group-column" :style="{ color: content.corTexto, borderColor: content.corBorda }">{{ groupColumnLabel }}</div>
      <div class="timeline-header-wrapper">
        <div class="timeline-header" :style="{ backgroundColor: content.corFundo }" aria-label="Timeline" ref="timelineHeader">
          <div class="time-markers" :style="{ width: `${timelineWidth}px` }">
            <div
              v-for="marker in timeMarkers"
              :key="marker.date"
              class="time-marker"
              :class="{ today: marker.isToday, weekend: marker.isWeekend }"
              :style="{
                left: marker.position,
                color: marker.isToday ? (content.corDiaAtual || '#3B82F6') : content.corTexto,
                borderLeft: marker.showLine ? `1px solid ${content.corBorda}` : 'none',
              }"
              :aria-label="`Date: ${marker.label}`"
            >
              {{ marker.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="gantt-body" ref="ganttBody" @scroll="syncScroll">
      <div v-if="processedGroups.length === 0" class="empty-state" :style="{ color: content.corTexto }">
        <p>Keine Einträge</p>
        <small>Gantt-Daten binden oder Filter anpassen.</small>
      </div>
      <div v-else class="gantt-rows">
        <div
          class="gantt-group-section"
          v-for="group in processedGroups"
          :key="group.id"
          :style="{
            minHeight: `${Math.max(56, group.linhas.length * 36 + 12)}px`,
            borderColor: content.corBorda,
          }"
        >
          <div class="group-info" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
            <div class="group-label" :style="{ color: content.corTexto }">{{ group.label }}</div>
            <div class="task-count" :style="{ color: content.corTexto }">{{ group.items.length }} Punkt(e)</div>
          </div>
          <div
            class="group-timeline"
            :style="{
              minHeight: `${Math.max(56, group.linhas.length * 36 + 12)}px`,
              width: `${timelineWidth}px`,
              backgroundColor: content.corFundo,
            }"
          >
            <div class="day-lines">
              <div
                v-for="linha in dayLines"
                :key="linha.date"
                class="day-line"
                :class="{ 'today-line': linha.isToday, 'weekend-line': linha.isWeekend }"
                :style="{
                  left: linha.position,
                  borderColor: linha.isToday ? (content.corDiaAtual || '#3B82F6') : content.corBorda,
                  opacity: linha.isWeekend ? 0.3 : 0.1,
                }"
              ></div>
            </div>
            <div
              v-for="(linha, linhaIndex) in group.linhas"
              :key="`linha-${linhaIndex}`"
              class="timeline-row"
              :style="{ top: `${linhaIndex * 36 + 6}px` }"
            >
              <div
                v-for="task in linha"
                :key="task._rowKey"
                class="activity-bar"
                :class="{ 'sem-datas': calcularPosicao(task).semDatas }"
                :style="{
                  left: calcularPosicao(task).left,
                  width: calcularPosicao(task).width,
                  backgroundColor: barColor(task),
                  color: content.corTexto,
                }"
                :title="taskTooltip(task)"
                :aria-label="`${group.label}: ${barLabel(task)}`"
                role="button"
                tabindex="0"
                @click="onTaskClick(task, group)"
                @keydown.enter="onTaskClick(task, group)"
                @keydown.space.prevent="onTaskClick(task, group)"
              >
                <span class="project-name">{{ task.projekt_name || '–' }}</span>
                <span class="activity-name">{{ barLabel(task) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task detail popup -->
    <div v-if="taskPopupOpen" class="task-popup-overlay" @click="closeTaskPopup">
      <div class="task-popup" :style="popupStyles" @click.stop>
        <div class="task-popup-header" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
          <h3 class="task-popup-title" :style="{ color: content.corTexto }">{{ taskPopupTask && taskPopupTask._isProjectBar ? 'Projektdetails' : 'Aufgabendetails' }}</h3>
          <button type="button" class="task-popup-close" :style="{ color: content.corTexto }" aria-label="Schließen" @click="closeTaskPopup">×</button>
        </div>
        <div v-if="taskPopupTask" class="task-popup-body" :style="{ color: content.corTexto, borderColor: content.corBorda }">
          <dl v-if="taskPopupTask._isProjectBar" class="task-popup-dl">
            <dt>Projekt</dt>
            <dd>{{ taskPopupTask.projekt_name || '–' }}</dd>
            <dt>Erstellt am</dt>
            <dd>{{ taskPopupTask.startdatum ? formatPopupDate(taskPopupTask.startdatum) : '–' }}</dd>
            <dt>Deadline</dt>
            <dd>{{ taskPopupTask.deadline ? formatPopupDate(taskPopupTask.deadline) : '–' }}</dd>
          </dl>
          <dl v-else class="task-popup-dl">
            <dt>Projekt</dt>
            <dd>{{ taskPopupTask.projekt_name || '–' }}</dd>
            <dt>Phase</dt>
            <dd>{{ taskPopupTask.phase_name || '–' }}</dd>
            <dt>Gewerk</dt>
            <dd>{{ taskPopupTask.gewerk_name != null ? taskPopupTask.gewerk_name : 'Ohne Gewerk' }}</dd>
            <dt>Frage</dt>
            <dd>{{ popupFrage(taskPopupTask) }}</dd>
            <dt>Startdatum</dt>
            <dd>{{ taskPopupTask.startdatum ? formatPopupDate(taskPopupTask.startdatum) : '–' }}</dd>
            <dt>Deadline</dt>
            <dd>{{ taskPopupTask.deadline ? formatPopupDate(taskPopupTask.deadline) : '–' }}</dd>
            <dt v-if="popupUmsetzungsdauerNumber(taskPopupTask) != null">Umsetzungsdauer</dt>
            <dd v-if="popupUmsetzungsdauerNumber(taskPopupTask) != null">{{ popupUmsetzungsdauerNumber(taskPopupTask) }}</dd>
            <dt v-if="taskPopupTask.antwort_text">Antwort</dt>
            <dd v-if="taskPopupTask.antwort_text">{{ taskPopupTask.antwort_text }}</dd>
            <dt v-if="taskPopupTask.notizen">Notizen</dt>
            <dd v-if="taskPopupTask.notizen">{{ taskPopupTask.notizen }}</dd>
          </dl>
        </div>
        <div v-if="showZumProjektButtonInPopup && taskPopupTask && taskPopupTask.projekt_id != null" class="task-popup-footer" :style="{ borderColor: content.corBorda }">
          <button type="button" class="task-popup-zum-projekt" :style="zumProjektButtonStyles" @click="onZumProjektClick">
            Zum Projekt
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Normalize gantt row: add startDate/endDate for positioning; keep all original fields
function normalizeRow(row) {
  if (!row) return null;
  const startDate = row.startdatum ? new Date(row.startdatum) : null;
  const endDate = row.deadline ? new Date(row.deadline) : null;
  return {
    ...row,
    startDate,
    endDate,
  };
}

// Deduplicate by id, keep first occurrence
function dedupeById(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export default {
  props: {
    content: { type: Object, required: true },
  },
  emits: ['trigger-event', 'update:content'],
  data() {
    return {
      currentDate: new Date(),
      modoAtual: null,
      viewTypeLocal: null,
      phaseFilterLocal: null,
      gewerkeDropdownOpen: false,
      selectedGewerkIdsLocal: null,
      phaseDropdownOpen: false,
      mitarbeiterDropdownOpen: false,
      projektDropdownOpen: false,
      selectedMitarbeiterIdLocal: null,
      selectedProjektIdsLocal: null,
      phaseSearchQuery: '',
      projektSearchQuery: '',
      mitarbeiterSearchQuery: '',
      gewerkeSearchQuery: '',
      taskPopupOpen: false,
      taskPopupTask: null,
      taskPopupGroup: null,
      timeScaleOptions: [
        { value: 'dia', label: 'Tag' },
        { value: 'semana', label: 'Woche' },
        { value: 'mes', label: 'Monat' },
      ],
      viewTypes: [
        { value: 'projekte', label: 'Projekte' },
        { value: 'projektebene', label: 'Projektebene' },
        { value: 'gewerke', label: 'Gewerke' },
        { value: 'mitarbeiter_gewerke', label: 'Mitarbeiter-Gewerke' },
      ],
    };
  },
  watch: {
    'content.viewType'(val) {
      if (val) this.viewTypeLocal = val;
    },
    'content.selectedPhaseId'(val) {
      if (val !== undefined && val !== null) this.phaseFilterLocal = val === '' ? null : String(val);
    },
    'content.selectedGewerkIds'(val) {
      if (Array.isArray(val)) this.selectedGewerkIdsLocal = null;
    },
    'content.selectedMitarbeiterId'(val) {
      if (val !== undefined && val !== null) this.selectedMitarbeiterIdLocal = val === '' ? null : String(val);
    },
    'content.selectedProjektIds'(val) {
      if (Array.isArray(val)) this.selectedProjektIdsLocal = null;
    },
  },
  computed: {
    visibleViewTypesList() {
      const show = this.content;
      const allowed = [];
      if (show.showProjekteView !== false) allowed.push('projekte');
      if (show.showProjektebeneView !== false) allowed.push('projektebene');
      if (show.showGewerkeView !== false) allowed.push('gewerke');
      if (show.showMitarbeiterGewerkeView !== false) allowed.push('mitarbeiter_gewerke');
      if (allowed.length === 0) return this.viewTypes;
      return this.viewTypes.filter((v) => allowed.includes(v.value));
    },
    currentViewType() {
      const preferred = this.viewTypeLocal || this.content.viewType || 'projekte';
      const visible = this.visibleViewTypesList;
      if (visible.length === 0) return preferred;
      if (visible.some((v) => v.value === preferred)) return preferred;
      return visible[0].value;
    },
    visualizacaoAtual() {
      return this.modoAtual || this.content.visualizacao || 'semana';
    },
    ganttRows() {
      let raw = this.content.ganttData;
      if (Array.isArray(raw)) {
        raw = raw;
      } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        raw = [raw];
      } else {
        raw = [];
      }
      return raw.map(normalizeRow).filter(Boolean);
    },
    // Normalized list from projekte table (id, projekt_name, created_at, deadline) for "Projekte" view
    projekteList() {
      let raw = this.content.projekteData;
      if (Array.isArray(raw)) {
        raw = raw;
      } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        raw = [raw];
      } else {
        raw = [];
      }
      return raw
        .filter((p) => p && (p.id != null || p.projekt_name != null))
        .map((p) => {
          const id = p.id != null ? String(p.id) : null;
          const created = p.created_at != null ? new Date(p.created_at) : null;
          const end = p.deadline != null ? new Date(p.deadline) : created;
          return {
            id: id || `proj-${p.projekt_name}`,
            projekt_id: id,
            projekt_name: (p.projekt_name != null && String(p.projekt_name).trim() !== '') ? String(p.projekt_name).trim() : '–',
            created_at: p.created_at,
            deadline: p.deadline,
            startdatum: p.created_at,
            startDate: created,
            endDate: end || created,
            _isProjectBar: true,
          };
        });
    },
    gewerkeList() {
      const raw = this.content.gewerke;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') return [raw];
      return [];
    },
    mitarbeiterList() {
      const raw = this.content.mitarbeiter;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') return [raw];
      return [];
    },
    mitarbeiterGewerkeList() {
      const raw = this.content.mitarbeiterGewerke;
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === 'object') return [raw];
      return [];
    },
    selectedGewerkIds() {
      const arr = this.content.selectedGewerkIds;
      if (!Array.isArray(arr)) return [];
      return arr.map((id) => String(id));
    },
    effectiveSelectedGewerkIds() {
      if (this.selectedGewerkIdsLocal !== null) return this.selectedGewerkIdsLocal;
      return this.selectedGewerkIds;
    },
    selectedProjektIds() {
      const arr = this.content.selectedProjektIds;
      if (!Array.isArray(arr)) return [];
      return arr.map((id) => String(id));
    },
    effectiveSelectedProjektIds() {
      if (this.selectedProjektIdsLocal !== null) return this.selectedProjektIdsLocal;
      return this.selectedProjektIds;
    },
    projectOptions() {
      if (this.projekteList.length > 0) {
        return this.projekteList.map((p) => ({
          id: p.projekt_id || p.id,
          name: p.projekt_name || '–',
        }));
      }
      const seen = new Map();
      this.ganttRows.forEach((r) => {
        if (r.projekt_id != null && r.projekt_name != null) {
          const key = String(r.projekt_id);
          if (!seen.has(key)) seen.set(key, { id: key, name: r.projekt_name });
        }
      });
      return Array.from(seen.values());
    },
    filteredProjectOptions() {
      const q = (this.projektSearchQuery || '').trim().toLowerCase();
      if (!q) return this.projectOptions;
      return this.projectOptions.filter((p) => (p.name || '').toLowerCase().includes(q));
    },
    projektDropdownLabel() {
      const ids = this.effectiveSelectedProjektIds;
      const n = ids.length;
      if (n === 0) return 'Alle Projekte';
      if (n === 1) {
        const p = this.projectOptions.find((x) => String(x.id) === ids[0]);
        return p ? (p.name || p.id) : '1 Projekt';
      }
      return `${n} Projekte`;
    },
    popupStyles() {
      return {
        backgroundColor: this.content.corFundo || '#FFFFFF',
        borderColor: this.content.corBorda || '#E5E7EB',
        color: this.content.corTexto || '#374151',
      };
    },
    showZumProjektButtonInPopup() {
      return this.content.showZumProjektButton !== false;
    },
    zumProjektButtonStyles() {
      return {
        backgroundColor: this.content.corHeader || '#F0F4F8',
        borderColor: this.content.corBorda || '#E5E7EB',
        color: this.content.corTexto || '#374151',
      };
    },
    effectiveSelectedMitarbeiterId() {
      if (this.selectedMitarbeiterIdLocal !== null && this.selectedMitarbeiterIdLocal !== undefined) {
        return this.selectedMitarbeiterIdLocal;
      }
      return this.content.selectedMitarbeiterId != null && this.content.selectedMitarbeiterId !== ''
        ? String(this.content.selectedMitarbeiterId)
        : '';
    },
    // For view 4: gewerk_ids allowed for selected mitarbeiter
    mitarbeiterGewerkIdsSet() {
      const mid = this.effectiveSelectedMitarbeiterId;
      if (!mid) return null;
      const set = new Set();
      this.mitarbeiterGewerkeList.forEach((mg) => {
        if (mg.mitarbeiter_id === mid || mg.mitarbeiterId === mid) {
          set.add(String(mg.gewerk_id != null ? mg.gewerk_id : mg.gewerkId));
        }
      });
      return set;
    },
    showGewerkeFilter() {
      return this.currentViewType === 'gewerke' || this.currentViewType === 'mitarbeiter_gewerke';
    },
    showMitarbeiterFilter() {
      return this.currentViewType === 'mitarbeiter_gewerke';
    },
    effectivePhaseId() {
      return this.phaseFilterLocal !== null && this.phaseFilterLocal !== undefined
        ? this.phaseFilterLocal
        : (this.content.selectedPhaseId != null && this.content.selectedPhaseId !== ''
          ? String(this.content.selectedPhaseId)
          : '');
    },
    phaseOptions() {
      const seen = new Map();
      this.ganttRows.forEach((r) => {
        if (r.phase_id != null && r.phase_name != null) {
          const key = String(r.phase_id);
          if (!seen.has(key)) seen.set(key, { id: key, name: r.phase_name });
        }
      });
      return Array.from(seen.values());
    },
    selectedMitarbeiterName() {
      const id = this.effectiveSelectedMitarbeiterId;
      if (!id) return '';
      const m = this.mitarbeiterList.find((x) => String(x.id) === String(id));
      return m ? this.mitarbeiterLabel(m) : '';
    },
    phaseDropdownLabel() {
      if (!this.effectivePhaseId) return 'Alle Phasen';
      const p = this.phaseOptions.find((x) => String(x.id) === this.effectivePhaseId);
      return p ? p.name : 'Alle Phasen';
    },
    mitarbeiterDropdownLabel() {
      if (!this.effectiveSelectedMitarbeiterId) return '– auswählen –';
      return this.selectedMitarbeiterName || this.effectiveSelectedMitarbeiterId;
    },
    filteredPhaseOptions() {
      const q = (this.phaseSearchQuery || '').trim().toLowerCase();
      if (!q) return this.phaseOptions;
      return this.phaseOptions.filter((p) => (p.name || '').toLowerCase().includes(q));
    },
    filteredMitarbeiterList() {
      const q = (this.mitarbeiterSearchQuery || '').trim().toLowerCase();
      if (!q) return this.mitarbeiterList;
      return this.mitarbeiterList.filter((m) => this.mitarbeiterLabel(m).toLowerCase().includes(q));
    },
    filteredGewerkeList() {
      const q = (this.gewerkeSearchQuery || '').trim().toLowerCase();
      if (!q) return this.gewerkeList;
      return this.gewerkeList.filter((g) => ((g.name ?? g.label) || g.id || '').toString().toLowerCase().includes(q));
    },
    showOhneGewerkInFilter() {
      const q = (this.gewerkeSearchQuery || '').trim().toLowerCase();
      if (!q) return true;
      return 'ohne gewerk'.includes(q);
    },
    dropdownSearchStyles() {
      return {
        color: this.content.corTexto || '#374151',
        borderColor: this.content.corBorda || '#E5E7EB',
        backgroundColor: this.content.corFundo || '#FFFFFF',
      };
    },
    gewerkeDropdownLabel() {
      const ids = this.effectiveSelectedGewerkIds;
      const n = ids.length;
      if (n === 0) return 'Alle Gewerke';
      if (n === 1) {
        if (ids[0] === '__null__') return 'Ohne Gewerk';
        const g = this.gewerkeList.find((x) => String(x.id) === ids[0]);
        return g ? ((g.name ?? g.label) || g.id) : ids[0];
      }
      return `${n} Gewerke`;
    },
    dropdownTriggerStyles() {
      return {
        color: this.content.corTexto || '#374151',
        borderColor: this.content.corBorda || '#E5E7EB',
        backgroundColor: this.content.corFundo || '#FFFFFF',
      };
    },
    dropdownPanelStyles() {
      return {
        borderColor: this.content.corBorda || '#E5E7EB',
        backgroundColor: this.content.corFundo || '#FFFFFF',
      };
    },
    groupColumnLabel() {
      if (this.currentViewType === 'projekte') return 'Projekt';
      if (this.currentViewType === 'projektebene') return 'Phase';
      return 'Gewerk';
    },
    containerStyles() {
      return {
        height: this.content.altura,
        backgroundColor: this.content.corFundo || '#FFFFFF',
        borderColor: this.content.corBorda || '#E5E7EB',
        color: this.content.corTexto || '#374151',
      };
    },
    navButtonStyles() {
      return {
        color: this.content.corTexto || '#374151',
        borderColor: this.content.corBorda || '#E5E7EB',
      };
    },
    selectStyles() {
      return {
        color: this.content.corTexto || '#374151',
        borderColor: this.content.corBorda || '#E5E7EB',
        backgroundColor: this.content.corFundo || '#FFFFFF',
      };
    },
    periodoAtual() {
      const modo = this.visualizacaoAtual;
      if (modo === 'dia') {
        return this.currentDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
      }
      if (modo === 'semana') {
        const m1 = this.currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        const next = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        const m2 = next.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        return `${m1} – ${m2}`;
      }
      return this.currentDate.getFullYear().toString();
    },
    timelineWidth() {
      const modo = this.visualizacaoAtual;
      const range = this.timelineRange;
      if (modo === 'dia') {
        const totalDias = Math.ceil((range.fim - range.inicio) / (1000 * 60 * 60 * 24)) + 1;
        return totalDias * 50;
      }
      if (modo === 'semana') {
        const totalDias = Math.ceil((range.fim - range.inicio) / (1000 * 60 * 60 * 24)) + 1;
        return totalDias * 15;
      }
      return 13 * 150;
    },
    timelineRange() {
      const modo = this.visualizacaoAtual;
      if (modo === 'dia') {
        const ano = this.currentDate.getFullYear();
        const mes = this.currentDate.getMonth();
        const inicio = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0).getDate();
        const fim = new Date(ano, mes, ultimoDia, 23, 59, 59);
        return { inicio, fim };
      }
      if (modo === 'semana') {
        const ano = this.currentDate.getFullYear();
        const mes = this.currentDate.getMonth();
        const inicio = new Date(ano, mes, 1);
        const fim = new Date(ano, mes + 2, 0, 23, 59, 59);
        return { inicio, fim };
      }
      const ano = this.currentDate.getFullYear();
      const inicio = new Date(ano, 0, 1);
      const fim = new Date(ano, 11, 31, 23, 59, 59);
      return { inicio, fim };
    },
    scrollPosition() {
      const heute = new Date();
      const range = this.timelineRange;
      const modo = this.visualizacaoAtual;
      if (modo === 'mes') {
        if (heute.getFullYear() !== this.currentDate.getFullYear()) return 0;
        const mesAtual = heute.getMonth();
        const back = Math.max(0, mesAtual - 2);
        return back * 150;
      }
      if (heute < range.inicio || heute > range.fim) return 0;
      const totalDias = Math.ceil((range.fim - range.inicio) / (1000 * 60 * 60 * 24)) + 1;
      const diasDoInicio = Math.ceil((heute - range.inicio) / (1000 * 60 * 60 * 24));
      let diasParaTras = 0;
      if (modo === 'dia') {
        const diasDoHoje = Math.ceil((heute - range.inicio) / (1000 * 60 * 60 * 24));
        diasParaTras = Math.max(0, diasDoHoje - 3);
      } else if (modo === 'semana') {
        diasParaTras = Math.max(0, diasDoInicio - 7);
      }
      return (diasParaTras / totalDias) * this.timelineWidth;
    },
    processedGroups() {
      const view = this.currentViewType;

      // Projekte view: one bar per project from projekte table (created_at → deadline)
      if (view === 'projekte' && this.projekteList.length > 0) {
        let projects = [...this.projekteList];
        const effectiveProjektIds = this.effectiveSelectedProjektIds;
        if (effectiveProjektIds.length > 0) {
          const set = new Set(effectiveProjektIds);
          projects = projects.filter((p) => p.projekt_id != null && set.has(String(p.projekt_id)));
        }
        return projects.map((p) => {
          const item = { ...p, _rowKey: `projekt-${p.id}` };
          return {
            id: p.projekt_id || p.id,
            label: p.projekt_name || 'Ohne Projekt',
            items: [item],
            linhas: [[item]],
          };
        });
      }

      let rows = [...this.ganttRows];

      // View 4: restrict to gewerke of selected mitarbeiter
      if (view === 'mitarbeiter_gewerke' && this.mitarbeiterGewerkIdsSet) {
        rows = rows.filter((r) => {
          const gid = r.gewerk_id != null ? String(r.gewerk_id) : null;
          if (gid === null) return false;
          return this.mitarbeiterGewerkIdsSet.has(gid);
        });
      }

      // Dedupe for Projekte and Projektebene (only when not using projekteList)
      if (view === 'projekte' || view === 'projektebene') {
        rows = dedupeById(rows);
      }

      // Projekt filter: when one or more projects selected, restrict rows
      const effectiveProjektIds = this.effectiveSelectedProjektIds;
      if ((view === 'projekte' || view === 'projektebene') && effectiveProjektIds.length > 0) {
        const projektSet = new Set(effectiveProjektIds);
        rows = rows.filter((r) => r.projekt_id != null && projektSet.has(String(r.projekt_id)));
      }

      // Projektebene: filter by selected phase if set
      if (view === 'projektebene' && this.effectivePhaseId) {
        const pid = this.effectivePhaseId;
        rows = rows.filter((r) => r.phase_id != null && String(r.phase_id) === pid);
      }

      // Gewerke / Mitarbeiter-Gewerke: filter by selected Gewerke (including "Ohne Gewerk")
      const effectiveGewerkIds = this.effectiveSelectedGewerkIds;
      if ((view === 'gewerke' || view === 'mitarbeiter_gewerke') && effectiveGewerkIds.length > 0) {
        const set = new Set(effectiveGewerkIds);
        rows = rows.filter((r) => {
          const gid = r.gewerk_id != null ? String(r.gewerk_id) : null;
          if (gid === null) return set.has('__null__');
          return set.has(gid);
        });
      }

      // Group
      const groupMap = {};
      const nullKey = '__null__';
      rows.forEach((row, index) => {
        let groupId, label;
        if (view === 'projekte') {
          groupId = row.projekt_id != null ? String(row.projekt_id) : nullKey;
          label = row.projekt_name || 'Ohne Projekt';
        } else if (view === 'projektebene') {
          groupId = row.phase_id != null ? String(row.phase_id) : nullKey;
          label = (row.phase_name != null && row.phase_name !== '') ? row.phase_name : 'Ohne Phase';
        } else {
          groupId = row.gewerk_id != null ? String(row.gewerk_id) : nullKey;
          label = row.gewerk_name != null ? row.gewerk_name : 'Ohne Gewerk';
        }
        if (!groupMap[groupId]) {
          groupMap[groupId] = { id: groupId, label, items: [], linhas: [] };
        }
        groupMap[groupId].items.push({ ...row, _rowKey: `${row.id}-${row.gewerk_id}-${index}` });
      });

      const result = Object.values(groupMap);
      result.forEach((g) => {
        g.linhas = this.organizeRows(g.items);
      });
      return result;
    },
    timeMarkers() {
      const range = this.timelineRange;
      const modo = this.visualizacaoAtual;
      const markers = [];
      const heute = new Date();
      heute.setHours(0, 0, 0, 0);
      if (modo === 'mes') {
        for (let mes = 0; mes <= 12; mes++) {
          const dataAtual = new Date(this.currentDate.getFullYear(), mes, 1);
          const position = `${mes * 150}px`;
          const label = dataAtual.toLocaleDateString('de-DE', { month: 'short' });
          markers.push({
            date: dataAtual.toISOString(),
            position,
            label,
            isToday: heute.getMonth() === mes && heute.getFullYear() === this.currentDate.getFullYear(),
            isWeekend: false,
            showLine: true,
          });
        }
      } else {
        const inicio = new Date(range.inicio);
        const fim = new Date(range.fim);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        const totalDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        const dataAtual = new Date(inicio);
        for (let diaIndex = 0; diaIndex < totalDias; diaIndex++) {
          const position = `${(diaIndex / Math.max(1, totalDias - 1)) * this.timelineWidth}px`;
          let shouldShow = false;
          let label = '';
          if (modo === 'dia') {
            shouldShow = true;
            label = dataAtual.getDate().toString();
          } else if (modo === 'semana' && (dataAtual.getDay() === 1 || diaIndex === 0)) {
            shouldShow = true;
            label = `${dataAtual.getDate()}/${dataAtual.getMonth() + 1}`;
          }
          if (shouldShow) {
            markers.push({
              date: dataAtual.toISOString(),
              position,
              label,
              isToday: dataAtual.getTime() === heute.getTime(),
              isWeekend: dataAtual.getDay() === 0 || dataAtual.getDay() === 6,
              showLine: true,
            });
          }
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }
      return markers;
    },
    dayLines() {
      const range = this.timelineRange;
      const modo = this.visualizacaoAtual;
      const lines = [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (modo === 'mes') {
        for (let mes = 0; mes <= 12; mes++) {
          const dataAtual = new Date(this.currentDate.getFullYear(), mes, 1);
          const position = `${mes * 150}px`;
          lines.push({
            date: dataAtual.toISOString(),
            position,
            isToday: hoje.getMonth() === mes && hoje.getFullYear() === this.currentDate.getFullYear(),
            isWeekend: false,
          });
        }
      } else {
        const inicio = new Date(range.inicio);
        const fim = new Date(range.fim);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        const totalDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        const dataAtual = new Date(inicio);
        for (let i = 0; i < totalDias; i++) {
          const position = `${(i / Math.max(1, totalDias - 1)) * this.timelineWidth}px`;
          lines.push({
            date: dataAtual.toISOString(),
            position,
            isToday: dataAtual.getTime() === hoje.getTime(),
            isWeekend: dataAtual.getDay() === 0 || dataAtual.getDay() === 6,
          });
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }
      return lines;
    },
  },
  methods: {
    getViewTypeButtonStyles(value) {
      const isActive = this.currentViewType === value;
      return {
        backgroundColor: isActive ? (this.content.corTexto || '#374151') : 'transparent',
        color: isActive ? (this.content.corFundo || '#FFFFFF') : (this.content.corTexto || '#374151'),
        borderColor: this.content.corBorda || '#E5E7EB',
      };
    },
    getButtonStyles(modo) {
      const isActive = this.visualizacaoAtual === modo;
      return {
        backgroundColor: isActive ? (this.content.corTexto || '#374151') : 'transparent',
        color: isActive ? (this.content.corFundo || '#FFFFFF') : (this.content.corTexto || '#374151'),
        borderColor: this.content.corBorda || '#E5E7EB',
      };
    },
    setViewType(value) {
      this.viewTypeLocal = value;
      this.$emit('update:content', { ...this.content, viewType: value });
      this.$nextTick(() => this.$forceUpdate());
    },
    mitarbeiterLabel(m) {
      if (!m) return '–';
      if (m.name != null && String(m.name).trim() !== '') return String(m.name).trim();
      if (m.label != null && String(m.label).trim() !== '') return String(m.label).trim();
      const v = (m.vorname ?? m.first_name ?? m.firstName) != null ? String(m.vorname ?? m.first_name ?? m.firstName).trim() : '';
      const n = (m.nachname ?? m.last_name ?? m.lastName) != null ? String(m.nachname ?? m.last_name ?? m.lastName).trim() : '';
      const full = [v, n].filter(Boolean).join(' ');
      if (full) return full;
      if (m.email != null && String(m.email).trim() !== '') return String(m.email).trim();
      return m.id != null ? String(m.id) : '–';
    },
    onPhaseChange(e) {
      const value = e.target.value || '';
      this.phaseFilterLocal = value || null;
      this.$emit('update:content', { ...this.content, selectedPhaseId: value });
      this.$nextTick(() => this.$forceUpdate());
    },
    selectPhase(phaseId) {
      const value = phaseId === '' || phaseId == null ? '' : String(phaseId);
      this.phaseFilterLocal = value || null;
      this.phaseDropdownOpen = false;
      this.$emit('update:content', { ...this.content, selectedPhaseId: value });
      this.$nextTick(() => this.$forceUpdate());
    },
    selectMitarbeiter(id) {
      const value = id === '' || id == null ? '' : String(id);
      this.selectedMitarbeiterIdLocal = value || null;
      this.mitarbeiterDropdownOpen = false;
      this.$emit('update:content', { ...this.content, selectedMitarbeiterId: value });
      this.$nextTick(() => this.$forceUpdate());
    },
    onMitarbeiterChange(e) {
      const value = e.target.value || '';
      this.$emit('update:content', { ...this.content, selectedMitarbeiterId: value });
    },
    onGewerkeChange(e) {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      this.$emit('update:content', { ...this.content, selectedGewerkIds: selected });
    },
    toggleGewerk(id) {
      const sid = String(id);
      const current = this.effectiveSelectedGewerkIds;
      const next = current.includes(sid) ? current.filter((x) => x !== sid) : [...current, sid];
      this.selectedGewerkIdsLocal = next;
      this.$emit('update:content', { ...this.content, selectedGewerkIds: next });
      this.$nextTick(() => this.$forceUpdate());
    },
    toggleProjekt(id) {
      const sid = String(id);
      const current = this.effectiveSelectedProjektIds;
      const next = current.includes(sid) ? current.filter((x) => x !== sid) : [...current, sid];
      this.selectedProjektIdsLocal = next;
      this.$emit('update:content', { ...this.content, selectedProjektIds: next });
      this.$nextTick(() => this.$forceUpdate());
    },
    barLabel(task) {
      if (task._isProjectBar) return task.projekt_name || '–';
      const u = task.einheit ? String(task.einheit).trim() : '';
      const f = task.frage ? String(task.frage).trim() : '';
      if (u && f) return `${f} – ${u}`;
      return u || f || '–';
    },
    barColor() {
      return this.content.corEmDesenvolvimento || '#3B82F6';
    },
    taskTooltip(task) {
      const start = task.startdatum ? new Date(task.startdatum).toLocaleDateString('de-DE') : '–';
      const end = task.deadline ? new Date(task.deadline).toLocaleDateString('de-DE') : '–';
      const parts = [
        `${task.projekt_name || '–'}`,
        `Phase: ${task.phase_name || '–'}`,
        `Gewerk: ${task.gewerk_name != null ? task.gewerk_name : 'Ohne Gewerk'}`,
        `Zeitraum: ${start} – ${end}`,
      ];
      if (task.antwort_text) parts.push(`Antwort: ${task.antwort_text}`);
      if (task.notizen) parts.push(`Notizen: ${task.notizen}`);
      return parts.join('\n');
    },
    calcularPosicao(task) {
      const range = this.timelineRange;
      const modo = this.visualizacaoAtual;
      const dataInicio = task.startDate || (task.startdatum ? new Date(task.startdatum) : null);
      const dataFim = task.endDate || (task.deadline ? new Date(task.deadline) : null);

      if (!dataInicio || isNaN(dataInicio.getTime())) {
        return { left: '0px', width: '8px', semDatas: true };
      }
      if (dataInicio > range.fim || (dataFim && dataFim < range.inicio)) {
        return { left: '-100px', width: '0px', semDatas: true };
      }

      if (modo === 'mes') {
        const mesInicio = dataInicio.getMonth();
        const anoInicio = dataInicio.getFullYear();
        if (anoInicio !== this.currentDate.getFullYear()) {
          return { left: '-100px', width: '0px', semDatas: true };
        }
        const left = mesInicio * 150;
        let width = 20;
        if (dataFim && !isNaN(dataFim.getTime()) && dataFim > dataInicio) {
          const mesFim = dataFim.getMonth();
          const anoFim = dataFim.getFullYear();
          if (anoFim === this.currentDate.getFullYear()) {
            const duracaoMeses = Math.max(1, mesFim - mesInicio + 1);
            width = Math.max(20, (duracaoMeses / 11) * this.timelineWidth);
          }
        }
        return { left: `${left}px`, width: `${width}px`, semDatas: false };
      }

      const inicio = new Date(range.inicio);
      const fim = new Date(range.fim);
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      const totalDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
      const diasDoInicio = Math.max(0, Math.floor((dataInicio - inicio) / (1000 * 60 * 60 * 24)));
      const left = (diasDoInicio / Math.max(1, totalDias - 1)) * this.timelineWidth;
      let width = 20;
      if (dataFim && !isNaN(dataFim.getTime()) && dataFim > dataInicio) {
        const diasDoFim = Math.floor((dataFim - inicio) / (1000 * 60 * 60 * 24));
        const duracaoDias = Math.max(1, diasDoFim - diasDoInicio + 1);
        width = Math.max(20, (duracaoDias / Math.max(1, totalDias - 1)) * this.timelineWidth);
      }
      return { left: `${left}px`, width: `${width}px`, semDatas: false };
    },
    organizeRows(items) {
      if (!items || items.length === 0) return [];
      const sorted = [...items].sort((a, b) => {
        const da = a.startDate || (a.startdatum ? new Date(a.startdatum) : new Date(0));
        const db = b.startDate || (b.startdatum ? new Date(b.startdatum) : new Date(0));
        return da - db;
      });
      const linhas = [];
      sorted.forEach((task) => {
        let placed = false;
        for (let i = 0; i < linhas.length; i++) {
          if (this.canPlaceInRow(task, linhas[i])) {
            linhas[i].push(task);
            placed = true;
            break;
          }
        }
        if (!placed) linhas.push([task]);
      });
      return linhas;
    },
    canPlaceInRow(task, row) {
      const start = task.startDate || (task.startdatum ? new Date(task.startdatum) : null);
      const end = task.endDate || (task.deadline ? new Date(task.deadline) : null);
      if (!start) return true;
      return !row.some((t) => {
        const s = t.startDate || (t.startdatum ? new Date(t.startdatum) : null);
        const e = t.endDate || (t.deadline ? new Date(t.deadline) : null);
        if (!s) return false;
        const e2 = e || s;
        const end2 = end || start;
        return !(end2 < s || start > e2);
      });
    },
    onTaskClick(task, group) {
      this.taskPopupTask = task;
      this.taskPopupGroup = group;
      this.taskPopupOpen = true;
      this.$emit('trigger-event', {
        name: 'onTaskClick',
        event: {
          task: {
            id: task.id,
            projekt_id: task.projekt_id,
            projekt_name: task.projekt_name,
            frage_id: task.frage_id,
            frage: task.frage,
            phase_id: task.phase_id,
            phase_name: task.phase_name,
            gewerk_id: task.gewerk_id,
            gewerk_name: task.gewerk_name,
            startdatum: task.startdatum,
            deadline: task.deadline,
            umsetzungsdauer: task.umsetzungsdauer + ' Stunden',
            einheit: task.einheit,
            antwort_text: task.antwort_text,
            notizen: task.notizen,
          },
          groupLabel: group.label,
          groupKey: group.id,
        },
      });
    },
    alterarVisualizacao(modo) {
      this.$emit('update:content', { ...this.content, visualizacao: modo });
      this.modoAtual = modo;
      this.$nextTick(() => {
        this.$forceUpdate();
        setTimeout(() => this.scrollToCurrentDay(), 50);
      });
    },
    navegarMes(direcao) {
      const modo = this.visualizacaoAtual;
      const novaData = new Date(this.currentDate);
      if (modo === 'dia' || modo === 'semana') {
        novaData.setMonth(novaData.getMonth() + direcao);
      } else {
        novaData.setFullYear(novaData.getFullYear() + direcao);
      }
      this.currentDate = novaData;
      this.$nextTick(() => this.scrollToCurrentDay());
    },
    scrollToCurrentDay() {
      if (this.$refs.ganttBody) this.$refs.ganttBody.scrollLeft = this.scrollPosition;
    },
    syncScroll() {
      if (this.$refs.ganttBody && this.$refs.timelineHeader) {
        this.$refs.timelineHeader.scrollLeft = this.$refs.ganttBody.scrollLeft;
      }
    },
    closeTaskPopup() {
      this.taskPopupOpen = false;
      this.taskPopupTask = null;
      this.taskPopupGroup = null;
    },
    onZumProjektClick() {
      const task = this.taskPopupTask;
      if (!task || task.projekt_id == null) return;
      this.$emit('trigger-event', {
        name: 'onZumProjekt',
        event: {
          projekt_id: task.projekt_id,
          id: task.id,
          projekt_name: task.projekt_name || '',
        },
      });
    },
    popupFrage(task) {
      if (!task) return '–';
      const f = task.frage;
      if (f == null || f === '') return '–';
      const s = String(f).trim();
      return s || '–';
    },
    popupUmsetzungsdauerNumber(task) {
      if (!task || task.umsetzungsdauer == null) return null;
      const v = task.umsetzungsdauer;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      const num = parseFloat(String(v), 10);
      return Number.isNaN(num) ? null : num;
    },
    formatPopupDate(val) {
      if (val == null) return '–';
      const d = typeof val === 'string' ? new Date(val) : val;
      return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    handleClickOutsideDropdowns(e) {
      const inPhase = this.$refs.phaseDropdownRef && this.$refs.phaseDropdownRef.contains(e.target);
      const inMitarbeiter = this.$refs.mitarbeiterDropdownRef && this.$refs.mitarbeiterDropdownRef.contains(e.target);
      const inGewerke = this.$refs.gewerkeDropdownRef && this.$refs.gewerkeDropdownRef.contains(e.target);
      const inProjekt = this.$refs.projektDropdownRef && this.$refs.projektDropdownRef.contains(e.target);
      if (!inPhase && this.phaseDropdownOpen) this.phaseDropdownOpen = false;
      if (!inMitarbeiter && this.mitarbeiterDropdownOpen) this.mitarbeiterDropdownOpen = false;
      if (!inGewerke && this.gewerkeDropdownOpen) this.gewerkeDropdownOpen = false;
      if (!inProjekt && this.projektDropdownOpen) this.projektDropdownOpen = false;
    },
  },
  mounted() {
    this.modoAtual = this.content.visualizacao || 'semana';
    this.$nextTick(() => this.scrollToCurrentDay());
    document.addEventListener('click', this.handleClickOutsideDropdowns);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutsideDropdowns);
  },
};
</script>

<style lang="scss" scoped>
.gantt-container {
  display: flex;
  flex-direction: column;
  border: 1px solid;
  border-radius: 8px;
  overflow: hidden;
}

.gantt-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid;
}

.gantt-controls-row1 {
  justify-content: flex-start;
}

.gantt-controls-row2 {
  justify-content: flex-start;
  padding-top: 12px;
  padding-bottom: 14px;
  gap: 28px;
}

.control-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-right: 4px;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-btn,
.scale-btn {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.view-btn:hover,
.scale-btn:hover {
  opacity: 0.85;
}

.time-scale-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-right: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.filter-group-gewerke,
.filter-group-dropdown {
  position: relative;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.95;
  letter-spacing: 0.01em;
}

.filter-select {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  min-width: 160px;
  max-width: 220px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.filter-select:hover {
  border-color: #9ca3af;
}

.filter-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

/* Custom Gewerke dropdown */
.dropdown-trigger-wrap {
  position: relative;
  min-width: 160px;
  max-width: 240px;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.dropdown-trigger:hover {
  border-color: #9ca3af;
}

.dropdown-trigger:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.dropdown-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-chevron {
  flex-shrink: 0;
  margin-left: 8px;
  font-size: 10px;
  opacity: 0.8;
  transform: rotate(0deg);
  transition: transform 0.2s;
}

.dropdown-chevron.open {
  transform: rotate(180deg);
}

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  min-width: 100%;
  max-width: 280px;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-search-wrap {
  flex-shrink: 0;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.dropdown-search {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 13px;
  box-sizing: border-box;
}

.dropdown-search::placeholder {
  opacity: 0.7;
}

.dropdown-search:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.dropdown-panel-inner {
  overflow-y: auto;
  padding: 6px 0;
  max-height: 220px;
}

.dropdown-option.single-option {
  display: block;
  width: 100%;
  padding: 8px 14px;
  font-size: 13px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color 0.1s;
}

.dropdown-option.single-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dropdown-option.single-option.selected {
  background-color: rgba(59, 130, 246, 0.12);
  font-weight: 500;
}

.dropdown-empty {
  padding: 12px 14px;
  font-size: 13px;
  opacity: 0.8;
}

.dropdown-option.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.1s;
}

.dropdown-option.checkbox-option:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.dropdown-option.checkbox-option input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.dropdown-panel-footer {
  border-top: 1px solid;
  padding: 8px 10px;
}

.dropdown-close-btn {
  width: 100%;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.dropdown-close-btn:hover {
  opacity: 0.9;
}

.filter-hint {
  font-size: 10px;
  opacity: 0.75;
}

.selected-name {
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  padding: 4px 8px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover {
  opacity: 0.8;
}

.current-period {
  font-size: 14px;
  font-weight: 500;
  min-width: 180px;
  text-align: center;
}

.gantt-header {
  display: flex;
  border-bottom: 2px solid;
}

.group-column {
  width: 220px;
  flex-shrink: 0;
  padding: 12px 16px;
  font-weight: 600;
  border-right: 1px solid;
  position: sticky;
  left: 0;
  z-index: 20;
  background-color: inherit;
}

.timeline-header-wrapper {
  flex: 1;
  overflow: hidden;
}

.timeline-header {
  padding: 12px 16px;
  font-weight: 600;
  position: relative;
  overflow-x: hidden;
  background-color: inherit !important;
}

.time-markers {
  position: relative;
  height: 20px;
}

.time-marker {
  position: absolute;
  font-size: 12px;
  white-space: nowrap;
  transform: translateX(-50%);
  padding-left: 8px;
}

.time-marker.today {
  font-weight: 700;
}

.time-marker.weekend {
  opacity: 0.6;
}

.gantt-body {
  overflow-y: auto;
  overflow-x: auto;
  max-height: calc(100% - 120px);
}

.gantt-group-section {
  display: flex;
  border-bottom: 1px solid;
  min-height: 50px;
}

.group-info {
  width: 220px;
  flex-shrink: 0;
  padding: 8px 16px;
  border-right: 1px solid;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: inherit;
}

.group-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.task-count {
  font-size: 12px;
  opacity: 0.7;
}

.group-timeline {
  position: relative;
  min-height: 50px;
  flex: 1;
  background-color: inherit !important;
}

.day-lines {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  pointer-events: none;
  width: 100%;
  min-width: 100%;
  background-color: inherit;
}

.day-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px solid;
}

.day-line.today-line {
  border-left-width: 2px;
  z-index: 2;
}

.day-line.weekend-line {
  background-color: rgba(0, 0, 0, 0.05);
  width: 2px;
}

.timeline-row {
  position: absolute;
  left: 0;
  right: 0;
  height: 36px;
  padding: 2px 8px;
}

.activity-bar {
  position: absolute;
  min-height: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.activity-bar:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.activity-bar:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.activity-bar.sem-datas {
  border-radius: 50%;
  padding: 0;
  justify-content: center;
  align-items: center;
}

.project-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}

.activity-name {
  font-size: 11px;
  color: white;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  margin-top: 2px;
}

.activity-bar.sem-datas .project-name,
.activity-bar.sem-datas .activity-name {
  display: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.empty-state small {
  font-size: 14px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .gantt-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .group-column,
  .group-info {
    width: 160px;
  }
}

.gantt-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.gantt-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* Task detail popup */
.task-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.task-popup {
  min-width: 320px;
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 8px;
  border: 1px solid;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.task-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid;
}
.task-popup-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.task-popup-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  opacity: 0.8;
}
.task-popup-close:hover {
  opacity: 1;
}
.task-popup-body {
  padding: 16px;
  overflow-y: auto;
  border-top: none;
}
.task-popup-dl {
  margin: 0;
  font-size: 14px;
}
.task-popup-dl dt {
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 2px;
  color: inherit;
}
.task-popup-dl dt:first-child {
  margin-top: 0;
}
.task-popup-dl dd {
  margin: 0 0 0 0;
  color: inherit;
  opacity: 0.95;
}

.task-popup-footer {
  padding: 12px 16px;
  border-top: 1px solid;
}
.task-popup-zum-projekt {
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.task-popup-zum-projekt:hover {
  opacity: 0.9;
}
</style>

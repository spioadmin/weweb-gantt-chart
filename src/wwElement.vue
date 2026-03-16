<template>
  <div
    class="gantt-container"
    :style="containerStyles"
    role="application"
    aria-label="Gantt – Anstehende Punkte"
  >
    <!-- View type tabs + time scale + filters -->
    <div class="gantt-controls" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
      <div class="view-controls">
        <button
          v-for="v in viewTypes"
          :key="v.value"
          :class="['view-btn', { active: currentViewType === v.value }]"
          :style="getViewTypeButtonStyles(v.value)"
          @click="setViewType(v.value)"
        >
          {{ v.label }}
        </button>
      </div>
      <div class="time-scale-controls">
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
      <div class="filter-controls" v-if="showGewerkeFilter || showMitarbeiterFilter">
        <select
          v-if="showMitarbeiterFilter"
          :value="content.selectedMitarbeiterId"
          :style="selectStyles"
          @change="onMitarbeiterChange($event)"
        >
          <option value="">– Mitarbeiter –</option>
          <option v-for="m in mitarbeiterList" :key="m.id" :value="m.id">{{ (m.name ?? m.label) || m.id || '–' }}</option>
        </select>
        <select
          v-if="showGewerkeFilter"
          multiple
          :style="selectStyles"
          class="gewerke-multi"
          @change="onGewerkeChange($event)"
        >
          <option
            v-for="g in gewerkeList"
            :key="g.id"
            :value="g.id"
            :selected="selectedGewerkIds.includes(String(g.id))"
          >
            {{ (g.name ?? g.label) || g.id || '–' }}
          </option>
        </select>
        <small v-if="showGewerkeFilter" class="filter-hint">Ctrl+click for multiple</small>
      </div>
      <div class="navigation-controls">
        <button class="nav-btn" :style="navButtonStyles" @click="navegarMes(-1)">‹</button>
        <span class="current-period" :style="{ color: content.corTexto }">{{ periodoAtual }}</span>
        <button class="nav-btn" :style="navButtonStyles" @click="navegarMes(1)">›</button>
      </div>
    </div>

    <!-- Phase filter for Projektebene -->
    <div v-if="currentViewType === 'projektebene'" class="phase-filter-row" :style="{ backgroundColor: content.corHeader, borderColor: content.corBorda }">
      <label :style="{ color: content.corTexto }">Phase:</label>
      <select :value="content.selectedPhaseId" :style="selectStyles" @change="onPhaseChange($event)">
        <option value="">Alle Phasen</option>
        <option v-for="p in phaseOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
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
            minHeight: `${Math.max(50, group.linhas.length * 30 + 10)}px`,
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
              minHeight: `${Math.max(50, group.linhas.length * 30 + 10)}px`,
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
              :style="{ top: `${linhaIndex * 30 + 5}px` }"
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
      viewTypeLocal: null, // so tab clicks work even when WeWeb doesn't persist View Type
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
  },
  computed: {
    currentViewType() {
      return this.viewTypeLocal || this.content.viewType || 'projekte';
    },
    visualizacaoAtual() {
      return this.modoAtual || this.content.visualizacao || 'semana';
    },
    ganttRows() {
      const raw = Array.isArray(this.content.ganttData) ? this.content.ganttData : [];
      return raw.map(normalizeRow).filter(Boolean);
    },
    gewerkeList() {
      return Array.isArray(this.content.gewerke) ? this.content.gewerke : [];
    },
    mitarbeiterList() {
      return Array.isArray(this.content.mitarbeiter) ? this.content.mitarbeiter : [];
    },
    mitarbeiterGewerkeList() {
      return Array.isArray(this.content.mitarbeiterGewerke) ? this.content.mitarbeiterGewerke : [];
    },
    selectedGewerkIds() {
      const arr = this.content.selectedGewerkIds;
      if (!Array.isArray(arr)) return [];
      return arr.map((id) => String(id));
    },
    // For view 4: gewerk_ids allowed for selected mitarbeiter
    mitarbeiterGewerkIdsSet() {
      const mid = this.content.selectedMitarbeiterId;
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
    phaseOptions() {
      const seen = new Map();
      this.ganttRows.forEach((r) => {
        if (r.phase_id != null && r.phase_name != null && !seen.has(r.phase_id)) {
          seen.set(r.phase_id, { id: r.phase_id, name: r.phase_name });
        }
      });
      return Array.from(seen.values());
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
      let rows = [...this.ganttRows];

      // View 4: restrict to gewerke of selected mitarbeiter
      if (view === 'mitarbeiter_gewerke' && this.mitarbeiterGewerkIdsSet) {
        rows = rows.filter((r) => {
          const gid = r.gewerk_id != null ? String(r.gewerk_id) : null;
          if (gid === null) return false;
          return this.mitarbeiterGewerkIdsSet.has(gid);
        });
      }

      // Dedupe for Projekte and Projektebene
      if (view === 'projekte' || view === 'projektebene') {
        rows = dedupeById(rows);
      }

      // Projektebene: filter by selected phase if set
      if (view === 'projektebene' && this.content.selectedPhaseId) {
        const pid = String(this.content.selectedPhaseId);
        rows = rows.filter((r) => r.phase_id != null && String(r.phase_id) === pid);
      }

      // Gewerke / Mitarbeiter-Gewerke: filter by selectedGewerkIds if any
      if ((view === 'gewerke' || view === 'mitarbeiter_gewerke') && this.selectedGewerkIds.length > 0) {
        const set = new Set(this.selectedGewerkIds);
        rows = rows.filter((r) => {
          const gid = r.gewerk_id != null ? String(r.gewerk_id) : null;
          if (gid === null) return set.has('null') || set.has(''); // optional: "Ohne Gewerk" id
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
          label = row.phase_name || 'Ohne Phase';
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
    onPhaseChange(e) {
      const value = e.target.value || '';
      this.$emit('update:content', { ...this.content, selectedPhaseId: value });
    },
    onMitarbeiterChange(e) {
      const value = e.target.value || '';
      this.$emit('update:content', { ...this.content, selectedMitarbeiterId: value });
    },
    onGewerkeChange(e) {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      this.$emit('update:content', { ...this.content, selectedGewerkIds: selected });
    },
    barLabel(task) {
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
            umsetzungsdauer: task.umsetzungsdauer,
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
  },
  mounted() {
    this.modoAtual = this.content.visualizacao || 'semana';
    this.$nextTick(() => this.scrollToCurrentDay());
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
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid;
}

.view-controls {
  display: flex;
  gap: 4px;
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
  opacity: 0.8;
}

.time-scale-controls {
  display: flex;
  gap: 4px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-controls select {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 120px;
}

.gewerke-multi {
  min-height: 60px;
}

.filter-hint {
  font-size: 10px;
  opacity: 0.8;
}

.phase-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-bottom: 1px solid;
}

.phase-filter-row label {
  font-size: 12px;
}

.phase-filter-row select {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 160px;
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
  max-height: calc(100% - 80px);
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
  height: 28px;
  padding: 2px 8px;
}

.activity-bar {
  position: absolute;
  height: 24px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2px 8px;
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
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

.activity-name {
  font-size: 11px;
  color: white;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1;
  margin-top: 1px;
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
</style>

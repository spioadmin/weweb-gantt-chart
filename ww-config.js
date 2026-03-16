export default {
  editor: {
    label: {
      en: "Gantt – Anstehende Punkte",
      de: "Gantt – Anstehende Punkte",
    },
  },
  properties: {
    // Main data: bind to aufgaben_gantt view
    ganttData: {
      label: { en: "Gantt Data", de: "Gantt-Daten" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // Projects list for "Projekte" view: one bar per project (created_at → deadline). Bind to public.projekte.
    projekteData: {
      label: { en: "Projects (Projekte)", de: "Projekte (Tabelle)" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // For Gewerke filter dropdown (views 3 & 4)
    gewerke: {
      label: { en: "Gewerke List", de: "Gewerke-Liste" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // For Mitarbeiter filter (view 4 only)
    mitarbeiter: {
      label: { en: "Mitarbeiter List", de: "Mitarbeiter-Liste" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // { mitarbeiter_id, gewerk_id } – for view 4 filter
    mitarbeiterGewerke: {
      label: { en: "Mitarbeiter–Gewerke", de: "Mitarbeiter–Gewerke" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // Which view tabs to show (each appears as a checkbox in the sidebar)
    showProjekteView: {
      label: { en: "Show Projekte view", de: "Projekte anzeigen" },
      type: "Boolean",
      defaultValue: true,
    },
    showProjektebeneView: {
      label: { en: "Show Projektebene view", de: "Projektebene anzeigen" },
      type: "Boolean",
      defaultValue: true,
    },
    showGewerkeView: {
      label: { en: "Show Gewerke view", de: "Gewerke anzeigen" },
      type: "Boolean",
      defaultValue: true,
    },
    showMitarbeiterGewerkeView: {
      label: { en: "Show Mitarbeiter-Gewerke view", de: "Mitarbeiter-Gewerke anzeigen" },
      type: "Boolean",
      defaultValue: true,
    },
    // Active view: projekte | projektebene | gewerke | mitarbeiter_gewerke
    viewType: {
      label: { en: "View Type", de: "Ansicht" },
      type: "TextSelect",
      options: {
        choices: [
          { value: "projekte", label: { en: "Projekte", de: "Projekte" } },
          { value: "projektebene", label: { en: "Projektebene", de: "Projektebene" } },
          { value: "gewerke", label: { en: "Gewerke", de: "Gewerke" } },
          { value: "mitarbeiter_gewerke", label: { en: "Mitarbeiter-Gewerke", de: "Mitarbeiter-Gewerke" } },
        ],
      },
      defaultValue: "projekte",
    },
    // Multi-select Gewerke filter (views 3 & 4). Array of gewerk_id. Empty = show all.
    selectedGewerkIds: {
      label: { en: "Selected Gewerke IDs", de: "Ausgewählte Gewerke-IDs" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // Single Mitarbeiter filter (view 4 only)
    selectedMitarbeiterId: {
      label: { en: "Selected Mitarbeiter ID", de: "Ausgewählter Mitarbeiter" },
      type: "Text",
      bindable: true,
      defaultValue: "",
    },
    // Phase filter for Projektebene view (optional). Empty = show all phases.
    selectedPhaseId: {
      label: { en: "Selected Phase ID", de: "Ausgewählte Phase" },
      type: "Text",
      bindable: true,
      defaultValue: "",
    },
    // Multi-select project filter (Projekte / Projektebene). Array of projekt_id. Empty = show all.
    selectedProjektIds: {
      label: { en: "Selected Project IDs", de: "Ausgewählte Projekt-IDs" },
      type: "Array",
      bindable: true,
      defaultValue: [],
    },
    // Time scale: day | week | month
    visualizacao: {
      label: { en: "Time Scale", de: "Zeitskala" },
      type: "TextSelect",
      options: {
        choices: [
          { value: "dia", label: { en: "Day", de: "Tag" } },
          { value: "semana", label: { en: "Week", de: "Woche" } },
          { value: "mes", label: { en: "Month", de: "Monat" } },
        ],
      },
      defaultValue: "semana",
    },
    altura: {
      label: { en: "Height", de: "Höhe" },
      type: "Length",
      defaultValue: "500px",
    },
    corFundo: {
      label: { en: "Background Color", de: "Hintergrundfarbe" },
      type: "Color",
      defaultValue: "#FFFFFF",
    },
    corBorda: {
      label: { en: "Border Color", de: "Rahmenfarbe" },
      type: "Color",
      defaultValue: "#E5E7EB",
    },
    corTexto: {
      label: { en: "Text Color", de: "Textfarbe" },
      type: "Color",
      defaultValue: "#374151",
    },
    corHeader: {
      label: { en: "Header Color", de: "Kopfzeilenfarbe" },
      type: "Color",
      defaultValue: "#F9FAFB",
    },
    corDiaAtual: {
      label: { en: "Current Day Color", de: "Heutiger Tag" },
      type: "Color",
      defaultValue: "#3B82F6",
    },
    corEmDesenvolvimento: {
      label: { en: "Bar Color", de: "Balkenfarbe" },
      type: "Color",
      defaultValue: "#3B82F6",
    },
  },
  triggerEvents: [
    {
      name: "onTaskClick",
      label: { en: "Task Clicked", de: "Aufgabe angeklickt" },
      event: {
        task: {},
        groupLabel: "",
        groupKey: "",
      },
      default: true,
    },
  ],
};

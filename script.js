const PROFESIONES = [
  { id: "dev", label: "Desarrollador/a de software", rates: { entry: 35, mid: 75, senior: 120, expert: 175 } },
  { id: "design", label: "Diseñador/a UI/UX", rates: { entry: 30, mid: 60, senior: 95, expert: 140 } },
  { id: "writer", label: "Redactor/a de contenidos", rates: { entry: 25, mid: 50, senior: 80, expert: 110 } },
  { id: "marketing", label: "Especialista en marketing digital", rates: { entry: 28, mid: 55, senior: 85, expert: 120 } },
  { id: "photo", label: "Fotógrafo/a o Videógrafo/a", rates: { entry: 30, mid: 58, senior: 90, expert: 130 } },
  { id: "consultant", label: "Consultor/a o Gestor/a de proyectos", rates: { entry: 40, mid: 85, senior: 130, expert: 190 } },
  { id: "accountant", label: "Contable / Tenedor/a de libros", rates: { entry: 28, mid: 55, senior: 88, expert: 125 } },
  { id: "va", label: "Asistente virtual", rates: { entry: 15, mid: 28, senior: 42, expert: 60 } },
];

const EXPERIENCIAS = [
  { id: "entry", label: "Junior (0–2 años)" },
  { id: "mid", label: "Intermedio (3–5 años)" },
  { id: "senior", label: "Senior (6–10 años)" },
  { id: "expert", label: "Experto/a especialista (10+ años)" },
];

const MONEDAS = [
  { id: "USD", symbol: "$", label: "USD – Dólar estadounidense" },
  { id: "EUR", symbol: "€", label: "EUR – Euro" },
  { id: "MXN", symbol: "$", label: "MXN – Peso mexicano" },
  { id: "ARS", symbol: "$", label: "ARS – Peso argentino" },
  { id: "COP", symbol: "$", label: "COP – Peso colombiano" },
  { id: "CLP", symbol: "$", label: "CLP – Peso chileno" },
];

const HORAS_POR_SEMANA = 40;
const numeroFmt = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });

function poblarSelect(select, opciones, getValue, getLabel) {
  select.innerHTML = "";
  opciones.forEach((op) => {
    const option = document.createElement("option");
    option.value = getValue(op);
    option.textContent = getLabel(op);
    select.appendChild(option);
  });
}

function monedaActualSimbolo() {
  const id = document.getElementById("moneda").value;
  return MONEDAS.find((m) => m.id === id)?.symbol || "$";
}

function formatoMoneda(valor) {
  const simbolo = monedaActualSimbolo();
  return `${simbolo}${numeroFmt.format(Math.round(valor))}`;
}

function calcular() {
  const ingresoObjetivo = parseFloat(document.getElementById("ingreso-objetivo").value) || 0;
  const ratioFacturable = parseFloat(document.getElementById("ratio-facturable").value) / 100;
  const gastos = parseFloat(document.getElementById("gastos").value) || 0;
  const impuesto = parseFloat(document.getElementById("impuesto").value) / 100;
  const semanas = parseFloat(document.getElementById("semanas").value) || 0;

  const horasTotales = semanas * HORAS_POR_SEMANA;
  const horasFacturables = horasTotales * ratioFacturable;

  const impuestoMonto = impuesto < 1 ? ingresoObjetivo * (impuesto / (1 - impuesto)) : 0;
  const brutoNecesario = ingresoObjetivo + impuestoMonto + gastos;

  const tarifaMinima = horasFacturables > 0 ? brutoNecesario / horasFacturables : 0;
  const tarifaRecomendada = tarifaMinima * 1.2;
  const brutoConRecomendada = tarifaRecomendada * horasFacturables;

  return {
    ingresoObjetivo,
    impuestoMonto,
    gastos,
    brutoNecesario,
    horasFacturables,
    tarifaMinima,
    tarifaRecomendada,
    brutoConRecomendada,
  };
}

let tarifaMinimaAnterior = null;

function pulse(el) {
  if (!el || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 500);
}

function renderResultados() {
  const r = calcular();
  const tarifaMinimaRedondeada = Math.round(r.tarifaMinima);

  if (tarifaMinimaAnterior !== null && tarifaMinimaRedondeada !== tarifaMinimaAnterior) {
    pulse(document.getElementById("tarifa-minima").closest(".result-card"));
    pulse(document.getElementById("tarifa-recomendada").closest(".result-card"));
  }
  tarifaMinimaAnterior = tarifaMinimaRedondeada;

  document.getElementById("tarifa-minima").textContent = `${formatoMoneda(r.tarifaMinima)}/h`;
  document.getElementById("tarifa-recomendada").textContent = `${formatoMoneda(r.tarifaRecomendada)}/h`;
  document.getElementById("horas-facturables").textContent = numeroFmt.format(Math.round(r.horasFacturables));
  document.getElementById("bruto-necesario").textContent = formatoMoneda(r.brutoConRecomendada);

  document.getElementById("bd-neto").textContent = formatoMoneda(r.ingresoObjetivo);
  document.getElementById("bd-impuestos").textContent = `+ ${formatoMoneda(r.impuestoMonto)}`;
  document.getElementById("bd-gastos").textContent = `+ ${formatoMoneda(r.gastos)}`;
  document.getElementById("bd-bruto").textContent = formatoMoneda(r.brutoNecesario);
  document.getElementById("bd-horas").textContent = numeroFmt.format(Math.round(r.horasFacturables));
  document.getElementById("bd-tarifa").textContent = `${formatoMoneda(r.tarifaMinima)}/h`;

  renderInsight(r.tarifaMinima);
  renderChart(r.tarifaMinima);

  return r;
}

function profesionActual() {
  const id = document.getElementById("profesion").value;
  return PROFESIONES.find((p) => p.id === id) || PROFESIONES[0];
}

function experienciaActual() {
  return document.getElementById("experiencia").value;
}

function renderInsight(tarifaMinima) {
  const profesion = profesionActual();
  const experiencia = experienciaActual();
  const tarifaTipica = profesion.rates[experiencia];
  const el = document.getElementById("market-insight");

  if (!tarifaTipica) {
    el.textContent = "";
    return;
  }

  const diffPct = Math.round(((tarifaMinima - tarifaTipica) / tarifaTipica) * 100);

  let mensaje;
  if (diffPct > 15) {
    mensaje = `Tu tarifa mínima es un ${diffPct}% más alta que la tarifa típica del mercado para tu nivel. Considera aumentar tu ratio de horas facturables o revisar primero tu objetivo de ingresos.`;
  } else if (diffPct < -15) {
    mensaje = `Tu tarifa mínima queda un ${Math.abs(diffPct)}% por debajo de la tarifa típica del mercado para tu nivel. Probablemente puedas cobrar más sin salirte del rango habitual.`;
  } else {
    mensaje = `Tu tarifa mínima está en línea con el rango típico del mercado para tu nivel (${formatoMoneda(tarifaTipica)}/h aprox.).`;
  }

  el.textContent = mensaje;
}

function renderChart(tarifaMinima) {
  const profesion = profesionActual();
  document.getElementById("profesion-actual").textContent = profesion.label.toLowerCase();

  const chart = document.getElementById("chart");
  chart.innerHTML = "";

  const valores = EXPERIENCIAS.map((e) => profesion.rates[e.id]);
  const maxValor = Math.max(...valores, tarifaMinima) * 1.15;

  EXPERIENCIAS.forEach((exp) => {
    const valor = profesion.rates[exp.id];
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";

    const valueLabel = document.createElement("span");
    valueLabel.className = "chart-bar-value";
    valueLabel.textContent = `${formatoMoneda(valor)}`;

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${(valor / maxValor) * 100}%`;

    const label = document.createElement("span");
    label.className = "chart-bar-label";
    label.textContent = exp.label.split(" (")[0];

    wrap.appendChild(valueLabel);
    wrap.appendChild(bar);
    wrap.appendChild(label);
    chart.appendChild(wrap);
  });

  const markerPct = Math.min((tarifaMinima / maxValor) * 100, 100);
  const markerLine = document.createElement("div");
  markerLine.className = "chart-marker-line";
  markerLine.style.bottom = `${markerPct}%`;

  const markerLabel = document.createElement("span");
  markerLabel.className = "chart-marker-label";
  markerLabel.textContent = `Tu tarifa: ${formatoMoneda(tarifaMinima)}/h`;
  markerLine.appendChild(markerLabel);

  chart.appendChild(markerLine);
}

function renderRatesGrid() {
  const grid = document.getElementById("rates-grid");
  const footerList = document.getElementById("footer-profesiones");
  grid.innerHTML = "";
  footerList.innerHTML = "";

  PROFESIONES.forEach((p) => {
    const card = document.createElement("div");
    card.className = "rate-card";
    card.innerHTML = `<h4>${p.label}</h4><span class="range">${monedaActualSimbolo()}${p.rates.entry}–${monedaActualSimbolo()}${p.rates.expert}/h</span>`;
    grid.appendChild(card);

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#calculadora";
    a.textContent = p.label;
    a.addEventListener("click", () => {
      document.getElementById("profesion").value = p.id;
      actualizarTodo();
    });
    li.appendChild(a);
    footerList.appendChild(li);
  });
}

function actualizarTodo() {
  renderResultados();
  renderRatesGrid();
}

function inicializar() {
  poblarSelect(document.getElementById("profesion"), PROFESIONES, (p) => p.id, (p) => p.label);
  poblarSelect(document.getElementById("experiencia"), EXPERIENCIAS, (e) => e.id, (e) => e.label);
  poblarSelect(document.getElementById("moneda"), MONEDAS, (m) => m.id, (m) => m.label);

  document.getElementById("experiencia").value = "mid";

  const form = document.getElementById("calc-form");
  form.addEventListener("input", () => {
    document.getElementById("ratio-value").textContent = `${document.getElementById("ratio-facturable").value}%`;
    document.getElementById("impuesto-value").textContent = `${document.getElementById("impuesto").value}%`;
    document.getElementById("semanas-value").textContent = document.getElementById("semanas").value;
    actualizarTodo();
  });

  actualizarTodo();
}

document.addEventListener("DOMContentLoaded", inicializar);

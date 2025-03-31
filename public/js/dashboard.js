document.addEventListener('DOMContentLoaded', () => {
  // Initialize dark mode toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  // Initialize charts
  initGenomicChart();
  initBiomarkersChart();
});

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  
  // Update charts for dark mode
  updateChartsTheme();
}

/**
 * Initialize genomic variants chart
 */
function initGenomicChart() {
  const ctx = document.getElementById('genomicChart').getContext('2d');
  window.genomicChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Benignas', 'Patogénicas', 'Significado incierto', 'Protectoras'],
      datasets: [{
        data: [85, 12, 8, 5],
        backgroundColor: [
          '#10B981', // green
          '#EF4444', // red
          '#F59E0B', // yellow
          '#3B82F6'  // blue
        ],
        borderWidth: 0
      }]
    },
    options: getChartOptions('Distribución de Variantes Genéticas')
  });
}

/**
 * Initialize biomarkers chart
 */
function initBiomarkersChart() {
  const ctx = document.getElementById('biomarkersChart').getContext('2d');
  window.biomarkersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Glucosa', 'HDL', 'LDL', 'Triglicéridos', 'CRP', 'Vitamina D'],
      datasets: [{
        label: 'Tus Valores',
        data: [92, 45, 110, 150, 2.8, 42],
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1
      }, {
        label: 'Rango Ideal',
        data: [90, 60, 100, 150, 1, 50],
        backgroundColor: '#E5E7EB',
        borderColor: '#9CA3AF',
        borderWidth: 1,
        type: 'line',
        pointRadius: 0,
        borderDash: [5, 5]
      }]
    },
    options: getChartOptions('Biomarcadores Metabólicos', true)
  });
}

/**
 * Get common chart options
 */
function getChartOptions(title, isBarChart = false) {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#F3F4F6' : '#111827';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: title,
        color: textColor,
        font: {
          size: 16,
          family: 'Inter, sans-serif'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: true,
        intersect: false,
        mode: 'index'
      }
    },
    scales: isBarChart ? {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor
        }
      },
      y: {
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor
        }
      }
    } : undefined
  };
}

/**
 * Update charts theme when toggling dark mode
 */
function updateChartsTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#F3F4F6' : '#111827';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Update genomic chart
  if (window.genomicChart) {
    window.genomicChart.options.plugins.legend.labels.color = textColor;
    window.genomicChart.options.plugins.title.color = textColor;
    window.genomicChart.options.plugins.tooltip.backgroundColor = isDark ? '#1F2937' : '#FFFFFF';
    window.genomicChart.options.plugins.tooltip.titleColor = textColor;
    window.genomicChart.options.plugins.tooltip.bodyColor = textColor;
    window.genomicChart.update();
  }

  // Update biomarkers chart
  if (window.biomarkersChart) {
    window.biomarkersChart.options.plugins.legend.labels.color = textColor;
    window.biomarkersChart.options.plugins.title.color = textColor;
    window.biomarkersChart.options.plugins.tooltip.backgroundColor = isDark ? '#1F2937' : '#FFFFFF';
    window.biomarkersChart.options.plugins.tooltip.titleColor = textColor;
    window.biomarkersChart.options.plugins.tooltip.bodyColor = textColor;
    window.biomarkersChart.options.scales.x.grid.color = gridColor;
    window.biomarkersChart.options.scales.x.ticks.color = textColor;
    window.biomarkersChart.options.scales.y.grid.color = gridColor;
    window.biomarkersChart.options.scales.y.ticks.color = textColor;
    window.biomarkersChart.update();
  }
}

// Initialize any stored preferences
function initPreferences() {
  // Dark mode preference
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
  }
}

// Initialize the app
initPreferences();
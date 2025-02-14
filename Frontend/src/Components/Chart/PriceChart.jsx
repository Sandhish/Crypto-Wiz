import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const formatDate = (timestamp, timeframe) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (timeframe === '15m' || timeframe === '30m' || timeframe === '1h') {
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  if (timeframe === '4h') {
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.getHours()}:00`;
  }

  if (timeframe === '1d') {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  if (timeframe === '1w' || timeframe === '1M') {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  }

  if (timeframe === '3M' || timeframe === '1Y' || timeframe === 'ALL') {
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return date.toLocaleDateString();
};

const PriceChart = ({ priceHistory = [], timeframe, symbol }) => {
  const chartRef = useRef(null);
  const animationRef = useRef(null);

  const sortedHistory = [...priceHistory].sort((a, b) => a.date - b.date);

  const getTimeRange = () => {
    switch (timeframe) {
      case '15m': return 15 * 60 * 1000;
      case '30m': return 30 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      case '4h': return 4 * 60 * 60 * 1000;
      case '1d': return 24 * 60 * 60 * 1000;
      default: return null;
    }
  };

  const addFutureSpace = (data) => {
    const timeRange = getTimeRange();
    if (!timeRange || data.length === 0) return data;

    const lastPoint = data[data.length - 1];
    const futurePoint = {
      ...lastPoint,
      date: lastPoint.date + (timeRange * 0.1),
      price: null
    };
    return [...data, futurePoint];
  };

  const extendedData = addFutureSpace(sortedHistory);

  const chartData = {
    labels: extendedData.map(entry => formatDate(entry.date, timeframe)),
    datasets: [
      {
        label: `${symbol} Price`,
        data: extendedData.map(entry => entry.price),
        borderColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#3182ce';

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const prices = sortedHistory.map(entry => entry.price);
          const priceChange = prices[prices.length - 1] - prices[0];

          if (priceChange >= 0) {
            gradient.addColorStop(0, '#48bb78');
            gradient.addColorStop(1, '#38a169');
          } else {
            gradient.addColorStop(0, '#f56565');
            gradient.addColorStop(1, '#e53e3e');
          }
          return gradient;
        },
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(49, 130, 206, 0.1)';

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          const prices = sortedHistory.map(entry => entry.price);
          const priceChange = prices[prices.length - 1] - prices[0];

          if (priceChange >= 0) {
            gradient.addColorStop(0, 'rgba(72, 187, 120, 0.2)');
            gradient.addColorStop(1, 'rgba(56, 161, 105, 0)');
          } else {
            gradient.addColorStop(0, 'rgba(245, 101, 101, 0.2)');
            gradient.addColorStop(1, 'rgba(229, 62, 62, 0)');
          }
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 8,
          color: '#a0aec0',
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a0aec0',
          callback: (value) => `$${value.toFixed(2)}`,
          font: {
            size: 11
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false,
        external: (context) => {
          const { chart, tooltip } = context;
          let tooltipEl = chart.canvas.parentNode.querySelector('div');

          if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.style.background = 'rgba(45, 55, 72, 0.9)';
            tooltipEl.style.borderRadius = '4px';
            tooltipEl.style.color = '#e2e8f0';
            tooltipEl.style.opacity = 1;
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.transform = 'translate(-50%, 0)';
            tooltipEl.style.transition = 'all .1s ease';
            tooltipEl.style.zIndex = 100;

            const table = document.createElement('table');
            table.style.margin = '0px';

            tooltipEl.appendChild(table);
            chart.canvas.parentNode.appendChild(tooltipEl);
          }

          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
          }

          if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map(b => b.lines);

            const tableHead = document.createElement('thead');

            titleLines.forEach(title => {
              const tr = document.createElement('tr');
              tr.style.borderWidth = 0;

              const th = document.createElement('th');
              th.style.borderWidth = 0;
              const text = document.createTextNode(title);

              th.appendChild(text);
              tr.appendChild(th);
              tableHead.appendChild(tr);
            });

            const tableBody = document.createElement('tbody');
            bodyLines.forEach((body, i) => {
              const colors = tooltip.labelColors[i];

              const span = document.createElement('span');
              span.style.background = colors.backgroundColor;
              span.style.borderColor = colors.borderColor;
              span.style.borderWidth = '2px';
              span.style.marginRight = '10px';
              span.style.height = '10px';
              span.style.width = '10px';
              span.style.display = 'inline-block';

              const tr = document.createElement('tr');
              tr.style.backgroundColor = 'inherit';
              tr.style.borderWidth = 0;

              const td = document.createElement('td');
              td.style.borderWidth = 0;

              const text = document.createTextNode(body);

              td.appendChild(span);
              td.appendChild(text);
              tr.appendChild(td);
              tableBody.appendChild(tr);
            });

            const tableRoot = tooltipEl.querySelector('table');

            while (tableRoot.firstChild) {
              tableRoot.firstChild.remove();
            }

            tableRoot.appendChild(tableHead);
            tableRoot.appendChild(tableBody);
          }

          const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

          tooltipEl.style.opacity = 1;
          tooltipEl.style.left = positionX + tooltip.caretX + 'px';
          tooltipEl.style.top = positionY + tooltip.caretY + 'px';
          tooltipEl.style.font = tooltip.options.bodyFont.string;
          tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
        },
      }
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const animate = () => {
      const chart = chartRef.current;
      if (chart) {
        chart.update('active');
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sortedHistory]);

  return (
    <div style={{ width: '100%', height: '460px', padding: '20px 0' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default PriceChart;


/**
 * FENG SHUI ANALYZER - Phân tích phong thủy
 * Hiển thị kết quả phân tích và gợi ý cải thiện
 */

import { layCungMenh, layHuongTotXau, tinhCanChi, HUONG } from '../utils/bagua-calculator.js';
import { analyzeFloorPlan, generateReport } from '../utils/fengshui-rules.js';

export class FengShuiAnalyzer {
  constructor(options = {}) {
    // State
    this.birthYear = null;
    this.gender = 'male';
    this.cungMenh = null;
    this.huongInfo = null;
    this.floorPlan = null;
    this.direction = null;
    this.analysis = null;

    // Callbacks
    this.onAnalysisComplete = options.onAnalysisComplete || (() => {});

    // DOM elements
    this.elements = {
      birthYear: document.getElementById('birth-year'),
      gender: document.getElementById('gender'),
      btnCalculate: document.getElementById('btn-calculate'),
      destinyInfo: document.getElementById('destiny-info'),
      destinySymbol: document.getElementById('destiny-symbol'),
      destinyName: document.getElementById('destiny-name'),
      destinyElement: document.getElementById('destiny-element'),
      goodDirections: document.getElementById('good-directions'),
      badDirections: document.getElementById('bad-directions'),
      analysisResults: document.getElementById('analysis-results'),
      scoreNumber: document.getElementById('score-number'),
      scoreProgress: document.getElementById('score-progress'),
      scoreText: document.getElementById('score-text'),
      suggestions: document.getElementById('suggestions'),
      btnExport: document.getElementById('btn-export'),
      exportModal: document.getElementById('export-modal'),
      reportContent: document.getElementById('report-content'),
      btnPrint: document.getElementById('btn-print'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      modalClose: document.querySelector('.modal-close')
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Calculate destiny button
    if (this.elements.btnCalculate) {
      this.elements.btnCalculate.addEventListener('click', () => this.calculateDestiny());
    }

    // Auto calculate on Enter key
    if (this.elements.birthYear) {
      this.elements.birthYear.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.calculateDestiny();
        }
      });
    }

    // Export button
    if (this.elements.btnExport) {
      this.elements.btnExport.addEventListener('click', () => this.showExportModal());
    }

    // Print button
    if (this.elements.btnPrint) {
      this.elements.btnPrint.addEventListener('click', () => this.printReport());
    }

    // Close modal buttons
    if (this.elements.btnCloseModal) {
      this.elements.btnCloseModal.addEventListener('click', () => this.hideExportModal());
    }
    if (this.elements.modalClose) {
      this.elements.modalClose.addEventListener('click', () => this.hideExportModal());
    }

    // Close modal on outside click
    if (this.elements.exportModal) {
      this.elements.exportModal.addEventListener('click', (e) => {
        if (e.target === this.elements.exportModal) {
          this.hideExportModal();
        }
      });
    }
  }

  calculateDestiny() {
    const yearInput = this.elements.birthYear?.value;
    const genderInput = this.elements.gender?.value;

    if (!yearInput) {
      this.showError('Vui lòng nhập năm sinh');
      return;
    }

    const year = parseInt(yearInput);
    if (isNaN(year) || year < 1900 || year > 2100) {
      this.showError('Năm sinh không hợp lệ (1900-2100)');
      return;
    }

    this.birthYear = year;
    this.gender = genderInput || 'male';

    // Calculate cung mệnh
    this.cungMenh = layCungMenh(this.birthYear, this.gender);
    this.huongInfo = layHuongTotXau(this.cungMenh);

    // Update UI
    this.displayDestinyInfo();
    this.runAnalysis();

    // Notify
    this.onAnalysisComplete({
      cungMenh: this.cungMenh,
      huongInfo: this.huongInfo
    });
  }

  displayDestinyInfo() {
    if (!this.cungMenh) return;

    // Show destiny info section
    this.elements.destinyInfo?.classList.remove('hidden');

    // Update symbol
    if (this.elements.destinySymbol) {
      this.elements.destinySymbol.textContent = this.cungMenh.symbol;
    }

    // Update name
    if (this.elements.destinyName) {
      const canChi = tinhCanChi(this.birthYear);
      this.elements.destinyName.textContent = `Cung ${this.cungMenh.name} (${canChi.full})`;
    }

    // Update element
    if (this.elements.destinyElement) {
      this.elements.destinyElement.innerHTML = `
        Mệnh <span style="color: ${this.cungMenh.nguHanh.color}">${this.cungMenh.nguHanh.name}</span>
        - ${this.huongInfo.nhomMenh}
      `;
    }

    // Update good directions
    if (this.elements.goodDirections) {
      this.elements.goodDirections.innerHTML = this.huongInfo.tot
        .map(h => `<li>${h.ten} <small>(${h.yNghia})</small></li>`)
        .join('');
    }

    // Update bad directions
    if (this.elements.badDirections) {
      this.elements.badDirections.innerHTML = this.huongInfo.xau
        .map(h => `<li>${h.ten} <small>(${h.yNghia})</small></li>`)
        .join('');
    }
  }

  updateFloorPlan(floorPlan, direction) {
    this.floorPlan = floorPlan;
    this.direction = direction;
    this.runAnalysis();
  }

  runAnalysis() {
    if (!this.floorPlan) return;

    this.analysis = analyzeFloorPlan(this.floorPlan, this.direction, this.cungMenh);
    this.displayAnalysisResults();
    this.displayScore();
    this.displaySuggestions();
  }

  displayAnalysisResults() {
    if (!this.analysis || !this.elements.analysisResults) return;

    const resultsHTML = this.analysis.results.map(result => {
      let statusClass = 'pending';
      let icon = '⏳';

      if (result.pass === true) {
        statusClass = 'good';
        icon = '✅';
      } else if (result.pass === false) {
        statusClass = 'bad';
        icon = '❌';
      }

      return `
        <div class="analysis-item ${statusClass}" title="${result.description}">
          <span class="analysis-icon">${icon}</span>
          <span>${result.message}</span>
        </div>
      `;
    }).join('');

    this.elements.analysisResults.innerHTML = resultsHTML || `
      <div class="analysis-item pending">
        <span class="analysis-icon">⏳</span>
        <span>Vẽ sơ đồ và nhập năm sinh để phân tích</span>
      </div>
    `;
  }

  displayScore() {
    if (!this.analysis) {
      if (this.elements.scoreNumber) {
        this.elements.scoreNumber.textContent = '--';
      }
      if (this.elements.scoreProgress) {
        this.elements.scoreProgress.style.strokeDashoffset = 283;
      }
      if (this.elements.scoreText) {
        this.elements.scoreText.textContent = 'Chưa có dữ liệu';
      }
      return;
    }

    const score = this.analysis.score;
    const rating = this.analysis.rating;

    // Update score number with animation
    if (this.elements.scoreNumber) {
      this.animateNumber(this.elements.scoreNumber, 0, score, 1000);
    }

    // Update progress circle
    if (this.elements.scoreProgress) {
      const circumference = 283; // 2 * PI * 45
      const offset = circumference - (score / 100) * circumference;

      // Animate the stroke
      this.elements.scoreProgress.style.transition = 'stroke-dashoffset 1s ease-out';
      this.elements.scoreProgress.style.strokeDashoffset = offset;

      // Update color based on score
      this.elements.scoreProgress.style.stroke = rating.color;
    }

    // Update score text
    if (this.elements.scoreText) {
      this.elements.scoreText.textContent = rating.text;
      this.elements.scoreText.style.color = rating.color;
    }
  }

  animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  displaySuggestions() {
    if (!this.elements.suggestions) return;

    if (!this.analysis || this.analysis.suggestions.length === 0) {
      this.elements.suggestions.innerHTML = `
        <p class="placeholder">
          ${this.analysis ? 'Không có gợi ý cải thiện - Phong thủy đã tốt!' : 'Hoàn thành phân tích để nhận gợi ý'}
        </p>
      `;
      return;
    }

    const suggestionsHTML = this.analysis.suggestions.map(s => `
      <div class="suggestion-item">
        <span class="suggestion-icon">💡</span>
        <div>
          <strong>${s.rule}:</strong><br>
          ${s.suggestion}
        </div>
      </div>
    `).join('');

    this.elements.suggestions.innerHTML = suggestionsHTML;
  }

  showExportModal() {
    if (!this.elements.exportModal || !this.elements.reportContent) return;

    // Generate report
    const reportHTML = generateReport(
      this.analysis || { results: [], score: 0, rating: { text: 'Chưa phân tích', color: '#888' }, suggestions: [] },
      this.cungMenh,
      this.direction,
      this.birthYear
    );

    this.elements.reportContent.innerHTML = reportHTML;
    this.elements.exportModal.classList.remove('hidden');
  }

  hideExportModal() {
    if (this.elements.exportModal) {
      this.elements.exportModal.classList.add('hidden');
    }
  }

  printReport() {
    window.print();
  }

  showError(message) {
    // Simple alert for now - could be replaced with toast notification
    alert(message);
  }

  // Get current state for saving
  getState() {
    return {
      birthYear: this.birthYear,
      gender: this.gender,
      cungMenh: this.cungMenh,
      huongInfo: this.huongInfo,
      analysis: this.analysis
    };
  }

  // Load state
  loadState(state) {
    if (state.birthYear) {
      this.birthYear = state.birthYear;
      if (this.elements.birthYear) {
        this.elements.birthYear.value = state.birthYear;
      }
    }
    if (state.gender) {
      this.gender = state.gender;
      if (this.elements.gender) {
        this.elements.gender.value = state.gender;
      }
    }
    if (state.cungMenh) {
      this.cungMenh = state.cungMenh;
      this.huongInfo = layHuongTotXau(this.cungMenh);
      this.displayDestinyInfo();
    }
  }

  // Reset analyzer
  reset() {
    this.birthYear = null;
    this.gender = 'male';
    this.cungMenh = null;
    this.huongInfo = null;
    this.analysis = null;

    if (this.elements.birthYear) {
      this.elements.birthYear.value = '';
    }
    if (this.elements.gender) {
      this.elements.gender.value = 'male';
    }
    if (this.elements.destinyInfo) {
      this.elements.destinyInfo.classList.add('hidden');
    }

    this.displayAnalysisResults();
    this.displayScore();
    this.displaySuggestions();
  }
}

export default FengShuiAnalyzer;

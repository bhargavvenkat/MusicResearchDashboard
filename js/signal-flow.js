document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const svgContainer = document.querySelector('#cable-container svg');
  const infoTitle = document.getElementById('info-title');
  const infoDescription = document.getElementById('info-description');
  const infoModules = document.getElementById('info-modules');
  const resetButton = document.getElementById('reset-button');
  const scenarioButtons = document.querySelectorAll('#controls button[data-scenario]');
  const allJacks = document.querySelectorAll('.jack');
  const tooltipPopup = document.getElementById('tooltip-popup');

  // --- Data Objects ---
  const moduleDetails = {
    micIn: { name: "Microphone", description: "Converts sound waves (acoustic energy) into an electrical signal, the starting point for most recordings." },
    instrumentIn: { name: "Instrument Input (DI)", description: "Prepares a high-impedance signal, like from an electric guitar, for a preamp by converting it to a balanced, low-impedance signal." },
    dawIn: { name: "DAW Output", description: "Plays back audio from your Digital Audio Workstation software for processing or monitoring." },
    preamp: { name: "Preamp", description: "Amplifies a weak signal (from a microphone or instrument) to a stronger, standard 'line level' signal for processing." },
    eq: { name: "EQ (Equalizer)", description: "Adjusts the volume of different frequency bands (e.g., bass, mids, treble) to shape the tone of a sound." },
    compressor: { name: "Compressor", description: "Reduces the dynamic range of a signal, making the quietest and loudest parts closer in volume for a more controlled sound." },
    reverb: { name: "Reverb", description: "Adds artificial spatial ambience to a sound, simulating the reflections of a room or hall." },
    speakersOut: { name: "Speakers", description: "Converts the final electrical signal back into sound waves for you to hear in the room." },
    recorderOut: { name: "Recorder/Interface", description: "Receives the final, processed signal to be captured digitally by an audio interface or recorded to tape." },
    headphonesOut: { name: "Headphones", description: "Provides a private, isolated monitoring output, which is an essential alternative to speakers for recording." }
  };

  const scenarios = {
    basicRecording: { name: "Basic Recording", path: ["micIn", "preamp", "recorderOut"], description: "A microphone signal is preamped and sent to a recorder." },
    mixingVocals: { name: "Mixing Vocals", path: ["dawIn", "eq", "compressor", "reverb", "speakersOut"], description: "Audio from a DAW is processed with EQ, compression, and reverb, then sent to speakers for monitoring." },
    directInstrument: { name: "Direct Instrument", path: ["instrumentIn", "preamp", "compressor", "recorderOut"], description: "An instrument is plugged in directly, preamped, compressed, and then recorded." }
  };

  // --- Patch Bay & Scenario Functions ---
  function clearCables() {
    svgContainer.innerHTML = '';
    allJacks.forEach(j => j.classList.remove('active'));
    scenarioButtons.forEach(b => b.classList.remove('active'));
  }

  function drawCable(fromId, toId, colorClass) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!from || !to) return;

    const svgRect = svgContainer.getBoundingClientRect();
    const p1 = from.getBoundingClientRect();
    const p2 = to.getBoundingClientRect();

    const x1 = p1.left + p1.width / 2 - svgRect.left;
    const y1 = p1.top + p1.height / 2 - svgRect.top;
    const x2 = p2.left + p2.width / 2 - svgRect.left;
    const y2 = p2.top + p2.height / 2 - svgRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.classList.add('cable', colorClass);
    svgContainer.appendChild(line);
  }

  function activateScenario(key) {
    const scenario = scenarios[key];
    if (!scenario) return;

    clearCables();
    scenarioButtons.forEach(btn => {
      if (btn.dataset.scenario === key) btn.classList.add('active');
    });

    infoTitle.textContent = scenario.name;
    infoDescription.textContent = scenario.description;
    
    infoModules.innerHTML = '';
    const flowList = document.createElement('ul');
    flowList.className = 'flow-steps';
    scenario.path.forEach((id, index) => {
      const details = moduleDetails[id];
      if (details) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${index + 1}. ${details.name}:</strong> ${details.description}`;
        flowList.appendChild(listItem);
      }
    });
    infoModules.appendChild(flowList);

    const colors = ['cable-color-1', 'cable-color-2', 'cable-color-3'];
    scenario.path.forEach((id, idx) => {
      const jack = document.getElementById(id);
      if (jack) jack.classList.add('active');
      if (idx < scenario.path.length - 1) {
        drawCable(scenario.path[idx], scenario.path[idx + 1], colors[idx % colors.length]);
      }
    });
  }

  function resetAll() {
    clearCables();
    infoTitle.textContent = "Select a Scenario";
    infoDescription.textContent = "Click a button above to visualize a signal path, or click any module to learn about it.";
    infoModules.innerHTML = '';
  }

  // --- Tooltip Logic ---
  allJacks.forEach(jack => {
    jack.addEventListener('click', (e) => {
      e.stopPropagation();
      const details = moduleDetails[jack.id];
      if (!details) return;

      const isVisible = tooltipPopup.classList.contains('visible');
      const isSameSource = tooltipPopup.dataset.sourceId === jack.id;
      if (isVisible && isSameSource) {
        tooltipPopup.classList.remove('visible');
        return;
      }
      
      tooltipPopup.innerHTML = `<strong>${details.name}</strong><p>${details.description}</p>`;
      tooltipPopup.dataset.sourceId = jack.id;
      
      const rect = jack.getBoundingClientRect();
      tooltipPopup.style.left = `${rect.left + rect.width / 2}px`;
      tooltipPopup.style.top = `${rect.bottom + 10}px`;
      
      tooltipPopup.classList.add('visible');
    });
  });

  document.addEventListener('click', (e) => {
    if (tooltipPopup.classList.contains('visible') && !tooltipPopup.contains(e.target)) {
      tooltipPopup.classList.remove('visible');
    }
  });

  // --- Event Listeners for Top Section ---
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => activateScenario(btn.dataset.scenario));
  });

  resetButton.addEventListener('click', resetAll);

  // Initialize the top section on load
  resetAll();

  // === CHANNEL STRIP EQ INTERACTION ===
  const explanationBlocks = document.querySelectorAll('.explanation-block');
  const highlightTargets = document.querySelectorAll('[data-highlight-target]');
  const visualScroller = document.querySelector('.strip-visual-wrapper');

  if (explanationBlocks.length > 0 && visualScroller && 'IntersectionObserver' in window) {
    let activeHighlightTarget = null;

    function removeAllHighlights() {
      highlightTargets.forEach(target => {
        target.classList.remove('is-highlighted');
      });
    }

    const observerOptions = {
      root: null,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
        if (entry.isIntersecting) {
          removeAllHighlights();
          const triggerId = entry.target.dataset.highlightTrigger;
          if (triggerId) {
            const targetElement = document.querySelector(`[data-highlight-target="${triggerId}"]`);
            if (targetElement) {
              targetElement.classList.add('is-highlighted');
              activeHighlightTarget = targetElement;
            }
          }
        }
      });
    }, observerOptions);

    explanationBlocks.forEach(block => {
      observer.observe(block);
    });

    let scrollTimeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (activeHighlightTarget) {
          const scrollerHeight = visualScroller.clientHeight;
          const targetHeight = activeHighlightTarget.clientHeight;
          const targetOffsetTop = activeHighlightTarget.offsetTop;
          const desiredScrollTop = targetOffsetTop - (scrollerHeight / 2) + (targetHeight / 2);
          visualScroller.scrollTo({
            top: desiredScrollTop,
            behavior: 'smooth'
          });
        }
      }, 100);
    };

    // ✅ Use window scroll instead of internal container
    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
  }
});

document.addEventListener('DOMContentLoaded', () => {

    // Helper function to detect if we're on the physics page
    const isPhysicsPage = document.getElementById('waveform-canvas');
    if (!isPhysicsPage) return;

    // --- Web Audio API Setup ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        console.warn('Web Audio API is not supported in this browser.');
        // Optionally disable interactive elements
        return;
    }
    const audioCtx = new AudioContext();
    
    // Create the main oscillator and gain node
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Initial state
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    // Connect the nodes and start the oscillator
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    // Start with gain at 0, fade in smoothly to avoid clicks
    gainNode.gain.value = 0;
    let isAudioPlaying = false;


    // --- Canvas & Drawing Setup ---
    const canvas = document.getElementById('waveform-canvas');
    const canvasCtx = canvas.getContext('2d');
    
    // State variables for drawing
    let frequency = 220;
    let amplitude = 0.5;
    let waveType = 'sine';

    function resizeCanvas() {
        const visualContainer = document.querySelector('.interactive-visual');
        canvas.width = visualContainer.clientWidth;
        canvas.height = visualContainer.clientHeight;
    }

    function draw() {
        requestAnimationFrame(draw);
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        const lightMode = document.body.classList.contains('light-mode');
        canvasCtx.strokeStyle = lightMode ? '#1F2937' : '#E6EDF3';
        canvasCtx.lineWidth = 3;

        canvasCtx.beginPath();
        
        const sliceWidth = canvas.width * 1.0 / canvas.width;
        let x = 0;
        
        for (let i = 0; i < canvas.width; i++) {
            const y = (canvas.height / 2) + (getWaveValue(i, canvas.width) * amplitude * canvas.height / 2.2);
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    function getWaveValue(index, totalWidth) {
        const angle = (index / totalWidth) * frequency * Math.PI / 44.1; // Magic number for scaling
        switch (waveType) {
            case 'square':
                return Math.sin(angle) >= 0 ? 1 : -1;
            case 'sawtooth':
                return 2 * (angle / (2 * Math.PI) - Math.floor(0.5 + angle / (2 * Math.PI)));
            case 'triangle':
                return Math.abs(2 * (angle / (2*Math.PI) - Math.floor(0.5 + angle / (2*Math.PI)))*2 - 1) * 2 -1;
            case 'sine':
            default:
                return Math.sin(angle);
        }
    }


    // --- Controls & Event Listeners ---
    const freqSlider = document.getElementById('freq-slider');
    const ampSlider = document.getElementById('amp-slider');
    const freqLabel = document.getElementById('freq-label');
    const ampLabel = document.getElementById('amp-label');
    const waveformSelector = document.getElementById('waveform-selector');

    function startAudioIfNeeded() {
        if (!isAudioPlaying) {
             // Resume AudioContext if it was suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            gainNode.gain.setTargetAtTime(amplitude, audioCtx.currentTime, 0.015);
            isAudioPlaying = true;
        }
    }

    freqSlider.addEventListener('input', (e) => {
        startAudioIfNeeded();
        frequency = parseFloat(e.target.value);
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        freqLabel.textContent = frequency.toFixed(0);
    });

    ampSlider.addEventListener('input', (e) => {
        startAudioIfNeeded();
        amplitude = parseFloat(e.target.value) / 100;
        gainNode.gain.setTargetAtTime(amplitude, audioCtx.currentTime, 0.015);
        ampLabel.textContent = (amplitude * 100).toFixed(0);
    });

    waveformSelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            startAudioIfNeeded();
            waveformSelector.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            waveType = e.target.dataset.wave;
            oscillator.type = waveType;
        }
    });

    // Initialize everything
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();


    // =========================================================
    // --- SECTION 3: INTERFERENCE & PHASE LOGIC ---
    // =========================================================
    const waveACanvas = document.getElementById('wave-a-canvas');
    const waveBCanvas = document.getElementById('wave-b-canvas');
    const resultantCanvas = document.getElementById('resultant-canvas');
    const allCanvases = [waveACanvas, waveBCanvas, resultantCanvas];
    const allContexts = allCanvases.map(c => c.getContext('2d'));

    const phaseSlider = document.getElementById('phase-slider');
    const phaseLabel = document.getElementById('phase-label');

    let phaseShift = 0; // in degrees

    function resizeInterferenceCanvases() {
        const containerWidth = document.querySelector('.interference-module').clientWidth;
        allCanvases.forEach(c => {
            c.width = containerWidth;
            c.height = 100; // Fixed height for these
        });
    }

    function drawInterference() {
        requestAnimationFrame(drawInterference);
        const lightMode = document.body.classList.contains('light-mode');
        const colors = [
            '#A78BFA', // Purple for Wave A
            '#7DD3FC', // Cyan for Wave B
            lightMode ? '#1F2937' : '#E6EDF3' // Main text color for Resultant
        ];
        
        allContexts.forEach((ctx, index) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.strokeStyle = colors[index];
            ctx.lineWidth = 3;
            ctx.beginPath();
        });

        const fixedFreq = 2; // Keep frequency low for clear visualization
        const phaseShiftRad = phaseShift * (Math.PI / 180);

        for (let i = 0; i < waveACanvas.width; i++) {
            const angle = (i / waveACanvas.width) * fixedFreq * Math.PI * 2;
            
            const yA = Math.sin(angle);
            const yB = Math.sin(angle + phaseShiftRad);
            const yResult = yA + yB;
            
            // Draw Wave A
            allContexts[0].lineTo(i, 50 - yA * 40);
            // Draw Wave B
            allContexts[1].lineTo(i, 50 - yB * 40);
            // Draw Resultant Wave
            allContexts[2].lineTo(i, 50 - yResult * 20); // Scaled down
        }

        allContexts.forEach(ctx => ctx.stroke());
    }

    phaseSlider.addEventListener('input', (e) => {
        phaseShift = parseFloat(e.target.value);
        phaseLabel.textContent = phaseShift.toFixed(0);
    });

    window.addEventListener('resize', resizeInterferenceCanvases);
    resizeInterferenceCanvases();
    drawInterference();
});